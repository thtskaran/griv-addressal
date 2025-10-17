from typing import Any, Dict, Iterable, Optional

from flask import Flask, jsonify, request

from config import settings
from db import (
    Department,
    Grievance,
    GrievanceStatus,
    Student,
    get_or_create_default_student,
    init_db,
    session_scope,
)
from utils import (
    append_chat,
    embed_text,
    fetch_chat,
    fetch_cluster_analytics,
    generate_ai_suggestions,
    get_gdrive_poller,
    persist_embedding,
    reindex_gdrive_folder,
    schedule_gdrive_ingestion,
    summarize_for_admin,
    upload_documents_to_s3,
)


def first_present(payload: Dict[str, Any], keys: Iterable[str]):
    for key in keys:
        if key in payload and payload[key] is not None:
            return payload[key]
    return None


def ensure_list(value: Any):
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.update(settings.as_flask_config())
    app.json_sort_keys = False

    if settings.allow_cors_origins:
        allowed_origins = {origin.strip() for origin in settings.allow_cors_origins.split(",")}
    else:
        allowed_origins = set()

    def _cors_headers(response):
        if not allowed_origins:
            return response
        origin = request.headers.get("Origin")
        if origin and origin in allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Methods"] = "GET,POST,PATCH,OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Authorization,Content-Type"
        return response

    @app.after_request
    def apply_cors(response):
        return _cors_headers(response)

    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok"})

    @app.route("/grievances", methods=["POST"])
    def create_grievance():
        payload = request.get_json(force=True)
        title = payload.get("title") or "Untitled Grievance"
        description = payload.get("description") or payload.get("details") or ""
        if not description:
            description = "No description provided."

        status = parse_status(payload.get("status"), default=GrievanceStatus.NEW)
        if status is None:
            return error_response("Invalid status value", 400)

        assigned = parse_department(payload.get("assigned_to"), default=Department.OTHERS)
        if assigned is None:
            return error_response("Invalid assigned_to value", 400)

        issue_tags = ensure_list(first_present(payload, ("category_tags", "issue_tags", "tags")))
        cluster_label = payload.get("cluster")
        cluster_tags = ensure_list(first_present(payload, ("cluster_tags", "clusters")))
        if not cluster_tags and cluster_label:
            cluster_tags = [cluster_label]

        with session_scope() as session:
            student = get_or_create_default_student(session)
            grievance = Grievance(
                student_id=student.id,
                title=title,
                description=description,
                status=status,
                assigned_to=assigned,
                tags=issue_tags,
                cluster=cluster_label,
                cluster_tags=cluster_tags,
            )
            session.add(grievance)
            session.flush()

            documents = payload.get("documents", [])
            if documents:
                try:
                    urls = upload_documents_to_s3(grievance.id, documents)
                    grievance.s3_doc_urls = urls
                except RuntimeError as exc:
                    app.logger.warning("S3 upload failed: %s", exc)

            try:
                embedding = embed_text(grievance.description)
                persist_embedding(
                    grievance.id,
                    embedding,
                    {
                        "tags": grievance.tags,
                        "issue_tags": grievance.tags,
                        "cluster": grievance.cluster,
                        "cluster_tags": grievance.cluster_tags or [],
                        "student_id": grievance.student_id,
                    },
                )
            except RuntimeError as exc:
                app.logger.warning("Embedding persistence skipped: %s", exc)

            session.add(grievance)
            return jsonify({"grievance": serialize_grievance(grievance)})

    @app.route("/grievances", methods=["GET"])
    def list_grievances():
        requested_student_id = request.args.get("student_id", type=int)
        with session_scope() as session:
            default_student = get_or_create_default_student(session)
            target_student_id = default_student.id

            if requested_student_id is not None:
                student = session.query(Student).filter(Student.id == requested_student_id).first()
                if student:
                    target_student_id = student.id
                else:
                    target_student_id = default_student.id

            query = (
                session.query(Grievance)
                .filter(Grievance.student_id == target_student_id)
                .order_by(Grievance.created_at.desc())
            )
            items = query.all()

            if (
                requested_student_id is not None
                and not items
                and target_student_id != default_student.id
            ):
                items = (
                    session.query(Grievance)
                    .filter(Grievance.student_id == default_student.id)
                    .order_by(Grievance.created_at.desc())
                    .all()
                )

            return jsonify({"grievances": [serialize_grievance(item) for item in items]})

    @app.route("/grievances/<int:grievance_id>", methods=["GET"])
    def grievance_detail(grievance_id: int):
        with session_scope() as session:
            grievance = session.query(Grievance).filter(Grievance.id == grievance_id).first()
            if not grievance:
                return error_response("Grievance not found", 404)
            chat = safe_fetch_chat(grievance_id)
            return jsonify(
                {
                    "grievance": serialize_grievance(grievance),
                    "chat": chat["conversations"],
                }
            )

    @app.route("/grievances/<int:grievance_id>/chat", methods=["POST"])
    def add_student_chat(grievance_id: int):
        payload = request.get_json(force=True)
        if "message" not in payload:
            return error_response("message is required", 400)
        with session_scope() as session:
            grievance = session.query(Grievance).filter(Grievance.id == grievance_id).first()
            if not grievance:
                return error_response("Grievance not found", 404)
        chat = safe_append_chat(grievance_id, "student", payload["message"])
        return jsonify(chat)

    @app.route("/admin/grievances", methods=["GET"])
    def admin_list_grievances():
        status = parse_status(request.args.get("status"))
        assigned = parse_department(request.args.get("assigned_to"))
        with session_scope() as session:
            query = session.query(Grievance)
            if status:
                query = query.filter(Grievance.status == status)
            if assigned:
                query = query.filter(Grievance.assigned_to == assigned)
            items = query.order_by(Grievance.created_at.desc()).all()
            return jsonify({"grievances": [serialize_grievance(item) for item in items]})

    @app.route("/admin/grievances/<int:grievance_id>", methods=["PATCH"])
    def admin_update_grievance(grievance_id: int):
        payload = request.get_json(force=True)
        allowed_fields = {
            "status",
            "assigned_to",
            "tags",
            "issue_tags",
            "category_tags",
            "cluster",
            "cluster_tags",
            "clusters",
            "drop_reason",
        }
        if not any(key in payload for key in allowed_fields):
            return error_response("No updatable fields provided", 400)

        with session_scope() as session:
            grievance = session.query(Grievance).filter(Grievance.id == grievance_id).first()
            if not grievance:
                return error_response("Grievance not found", 404)

            if "status" in payload:
                status = parse_status(payload["status"])
                if status is None:
                    return error_response("Invalid status value", 400)
                grievance.status = status

            if "assigned_to" in payload:
                dept = parse_department(payload["assigned_to"])
                if dept is None:
                    return error_response("Invalid assigned_to value", 400)
                grievance.assigned_to = dept

            tags_value = first_present(payload, ("category_tags", "issue_tags", "tags"))
            if tags_value is not None:
                grievance.tags = ensure_list(tags_value)

            cluster_key_present = "cluster" in payload
            cluster_label_value = payload.get("cluster") if cluster_key_present else None
            cluster_tags_value = first_present(payload, ("cluster_tags", "clusters"))
            cluster_tags_list = None
            if cluster_tags_value is not None:
                cluster_tags_list = ensure_list(cluster_tags_value)
                grievance.cluster_tags = cluster_tags_list

            if cluster_key_present:
                grievance.cluster = cluster_label_value
                if cluster_label_value and cluster_tags_value is None:
                    grievance.cluster_tags = [cluster_label_value]
                if cluster_label_value is None and cluster_tags_value is None:
                    grievance.cluster_tags = []
            elif cluster_tags_list:
                grievance.cluster = cluster_tags_list[0]

            if "drop_reason" in payload:
                grievance.drop_reason = payload["drop_reason"]

            session.add(grievance)
            return jsonify({"grievance": serialize_grievance(grievance)})

    @app.route("/admin/grievances/<int:grievance_id>/chat", methods=["POST"])
    def admin_add_chat(grievance_id: int):
        payload = request.get_json(force=True)
        if "message" not in payload:
            return error_response("message is required", 400)
        with session_scope() as session:
            exists = session.query(Grievance.id).filter(Grievance.id == grievance_id).scalar()
            if not exists:
                return error_response("Grievance not found", 404)
        chat = safe_append_chat(grievance_id, "admin", payload["message"])
        return jsonify(chat)

    @app.route("/admin/gdrive", methods=["POST"])
    def admin_register_gdrive():
        payload = request.get_json(force=True)
        folder_id = payload.get("folder_id")
        if not folder_id:
            return error_response("folder_id is required", 400)
        try:
            response = schedule_gdrive_ingestion(folder_id)
            status = response.get("status")
            next_poll = response.get("next_poll_in_seconds")
            interval = response.get("polling_interval_seconds")
            if status == "POLLING" and (next_poll is None or next_poll <= 0):
                normalized_poll = interval or 300
                response["next_poll_in_seconds"] = normalized_poll
                response.setdefault(
                    "note",
                    f"next_poll_in_seconds normalized to {normalized_poll}.",
                )
            return jsonify(response)
        except ValueError as exc:
            return error_response(str(exc), 400)

    @app.route("/admin/gdrive/reindex", methods=["GET"])
    def admin_reindex_gdrive():
        poller = get_gdrive_poller()
        state = poller.snapshot_state()
        folder_id = state.get("folder_id")
        if not folder_id:
            return error_response("No Google Drive folder configured for ingestion", 400)

        previous_token = state.get("change_token")
        poller.stop()
        try:
            result = reindex_gdrive_folder(folder_id)
            next_token = result.get("next_change_token") or previous_token
        except ValueError as exc:
            poller.start(folder_id, change_token=previous_token)
            return error_response(str(exc), 400)
        except Exception as exc:
            poller.start(folder_id, change_token=previous_token)
            return error_response(str(exc), 500)

        poller.start(folder_id, change_token=next_token)
        return jsonify({"status": "REINDEXED", **result})

    @app.route("/admin/analytics/clusters", methods=["GET"])
    def admin_cluster_analytics():
        try:
            analytics = fetch_cluster_analytics()
            return jsonify({"analytics": analytics})
        except RuntimeError as exc:
            return error_response(str(exc), 500)

    @app.route("/admin/grievances/ai-summarize", methods=["GET"])
    def admin_ai_summarize():
        with session_scope() as session:
            grievances = session.query(Grievance).all()
            payload = [serialize_grievance(item) for item in grievances]
        summary = summarize_for_admin(payload)
        return jsonify({"summary": summary})

    @app.route("/ai/suggestions/preview", methods=["POST"])
    def preview_ai_suggestions():
        payload = request.get_json(force=True)
        if "grievance_id" not in payload:
            return error_response("grievance_id is required", 400)
        try:
            grievance_id = int(payload["grievance_id"])
        except (TypeError, ValueError):
            return error_response("grievance_id must be an integer", 400)

        with session_scope() as session:
            grievance = (
                session.query(Grievance).filter(Grievance.id == grievance_id).first()
            )
            if not grievance:
                return error_response("Grievance not found", 404)

            related_query = (
                session.query(Grievance)
                .filter(Grievance.id != grievance.id)
                .filter(Grievance.status == GrievanceStatus.SOLVED)
            )
            if grievance.cluster:
                related_query = related_query.filter(Grievance.cluster == grievance.cluster)

            related = (
                related_query.order_by(Grievance.updated_at.desc()).limit(5).all()
            )

        serialized_grievance = serialize_grievance(grievance)
        related_payload = [serialize_related_grievance(item) for item in related]
        suggestions = generate_ai_suggestions(serialized_grievance, related_payload)
        suggestions["grievance_id"] = grievance.id
        return jsonify(suggestions)

    @app.route("/ai/suggestions/confirm", methods=["POST"])
    def confirm_ai_suggestion():
        payload = request.get_json(force=True)
        required = {"grievance_id", "accepted"}
        if missing := required - payload.keys():
            return error_response(f"Missing fields: {', '.join(sorted(missing))}", 400)

        with session_scope() as session:
            grievance = session.query(Grievance).filter(Grievance.id == payload["grievance_id"]).first()
            if not grievance:
                return error_response("Grievance not found", 404)

            suggestion_id = payload.get("suggestion_id")
            accepted = bool(payload["accepted"])
            if accepted:
                grievance.status = GrievanceStatus.DROPPED
                if suggestion_id:
                    grievance.drop_reason = f"Resolved via suggestion {suggestion_id}"
            session.add(grievance)
            return jsonify({"grievance": serialize_grievance(grievance)})

    return app


def serialize_related_grievance(grievance: Grievance) -> Dict[str, Any]:
    return {
        "id": grievance.id,
        "title": grievance.title,
        "status": grievance.status.value if grievance.status else None,
        "cluster": grievance.cluster,
        "cluster_tags": grievance.cluster_tags or [],
    }



def parse_status(value: Optional[str], default: Optional[GrievanceStatus] = None) -> Optional[GrievanceStatus]:
    if value is None:
        return default
    try:
        return GrievanceStatus[value.upper()]
    except KeyError:
        return None


def parse_department(value: Optional[str], default: Optional[Department] = None) -> Optional[Department]:
    if value is None:
        return default
    try:
        return Department[value.upper()]
    except KeyError:
        return None


def serialize_grievance(grievance: Grievance) -> Dict[str, Any]:
    return {
        "id": grievance.id,
        "student_id": grievance.student_id,
        "title": grievance.title,
        "description": grievance.description,
        "status": grievance.status.value if grievance.status else None,
        "assigned_to": grievance.assigned_to.value if grievance.assigned_to else None,
        "tags": grievance.tags or [],
        "issue_tags": grievance.tags or [],
        "cluster_tags": grievance.cluster_tags or [],
        "s3_doc_urls": grievance.s3_doc_urls or [],
        "cluster": grievance.cluster,
        "drop_reason": grievance.drop_reason,
        "created_at": grievance.created_at.isoformat() if grievance.created_at else None,
        "updated_at": grievance.updated_at.isoformat() if grievance.updated_at else None,
        "tag_groups": {
            "issue": grievance.tags or [],
            "cluster": grievance.cluster_tags or [],
        },
    }


def safe_fetch_chat(grievance_id: int) -> Dict[str, Any]:
    try:
        return fetch_chat(grievance_id)
    except RuntimeError as exc:
        return {"grievance_id": grievance_id, "conversations": [], "error": str(exc)}


def safe_append_chat(grievance_id: int, role: str, message: str) -> Dict[str, Any]:
    try:
        return append_chat(grievance_id, role, message)
    except RuntimeError as exc:
        return {"grievance_id": grievance_id, "conversations": [], "error": str(exc)}


def error_response(message: str, status_code: int):
    response = jsonify({"error": message})
    response.status_code = status_code
    return response


app = create_app()

if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=8000)
