# API Reference: Student Grievance Management Backend

This document outlines the REST endpoints exposed by the Flask backend, including a short description, sample request payloads, and representative responses.

## Health

### `GET /health`
- **Brief:** Lightweight readiness probe.
- **Sample Response**
```json
{
  "status": "ok"
}
```
- `tags` is still accepted as an alias for `issue_tags` when interacting with older clients.

## Student Flows

### `POST /grievances`
- **Brief:** Submit a new grievance (auto-associates with the single registered student) and optional supporting documents. The description is optional and defaults when omitted.
- **Sample Request**
```json
{
  "title": "Library AC not working",
  "description": "The AC has been off for a week in the reading hall.",
  "issue_tags": ["library", "ac_issue"],
  "cluster": "library > ac_issue",
  "cluster_tags": ["library > ac_issue"],
  "documents": [
    {
      "filename": "incident.jpg",
      "content_base64": "iVBORw0KGgoAAAANSUhEUg...",
      "content_type": "image/jpeg"
    }
  ]
}
```
- **Sample Response**
```json
{
  "grievance": {
    "id": 123,
    "student_id": 1,
    "title": "Library AC not working",
    "description": "The AC has been off for a week in the reading hall.",
    "status": "NEW",
    "assigned_to": "OTHERS",
    "tags": ["library", "ac_issue"],
    "issue_tags": ["library", "ac_issue"],
    "cluster_tags": ["library > ac_issue"],
    "s3_doc_urls": ["s3://student-grievances/grievances/123/incident.jpg"],
    "cluster": "library > ac_issue",
    "drop_reason": null,
    "tag_groups": {
      "issue": ["library", "ac_issue"],
      "cluster": ["library > ac_issue"]
    },
    "created_at": "2025-04-01T12:33:11.202166",
    "updated_at": "2025-04-01T12:33:11.202166"
  }
}
```

### `GET /grievances?student_id=<id>`
- **Brief:** List grievances submitted by the default student (or by the provided `student_id`).
- **Query Params:** `student_id` (optional)
- **Sample Response**
```json
{
  "grievances": [
    {
      "id": 123,
      "student_id": 1,
      "title": "Library AC not working",
      "status": "IN_PROGRESS",
      "assigned_to": "LIBRARY",
      "tags": ["library", "ac_issue"],
      "issue_tags": ["library", "ac_issue"],
      "cluster_tags": ["infrastructure"],
      "s3_doc_urls": [],
      "cluster": "infrastructure",
      "drop_reason": null,
      "tag_groups": {
        "issue": ["library", "ac_issue"],
        "cluster": ["infrastructure"]
      },
      "created_at": "2025-04-01T12:33:11.202166",
      "updated_at": "2025-04-02T09:15:05.982310"
    }
  ]
}
```

### `GET /grievances/<grievance_id>`
- **Brief:** Retrieve grievance details along with chat history.
- **Sample Response**
```json
{
  "grievance": {
    "id": 123,
    "student_id": 1,
    "title": "Library AC not working",
    "description": "The AC has been off for a week in the reading hall.",
    "status": "IN_PROGRESS",
    "assigned_to": "LIBRARY",
    "tags": ["library", "ac_issue"],
    "issue_tags": ["library", "ac_issue"],
    "cluster_tags": ["infrastructure"],
    "s3_doc_urls": [],
    "cluster": "infrastructure",
    "drop_reason": null,
    "tag_groups": {
      "issue": ["library", "ac_issue"],
      "cluster": ["infrastructure"]
    },
    "created_at": "2025-04-01T12:33:11.202166",
    "updated_at": "2025-04-02T09:05:45.114901"
  },
  "chat": [
    {
      "role": "student",
      "message": "Any update on the AC maintenance?",
      "timestamp": "2025-04-02T08:50:00Z"
    }
  ]
}
```

### `POST /grievances/<grievance_id>/chat`
- **Brief:** Append a student message to the grievance conversation.
- **Sample Request**
```json
{
  "message": "Please check the AC today."
}
```
- **Sample Response**
```json
{
  "grievance_id": 123,
  "conversations": [
    {
      "role": "student",
      "message": "Please check the AC today.",
      "timestamp": "2025-04-02T12:00:22.571291"
    }
  ]
}
```

## Admin Flows

### `GET /admin/grievances`
- **Brief:** List all grievances with optional status/department filters.
- **Query Params:** `status`, `assigned_to`
- **Sample Response**
```json
{
  "grievances": [
    {
      "id": 123,
      "student_id": 1,
      "title": "Library AC not working",
      "status": "IN_PROGRESS",
      "assigned_to": "LIBRARY",
      "tags": ["library", "ac_issue"],
      "issue_tags": ["library", "ac_issue"],
      "cluster_tags": ["infrastructure"],
      "cluster": "infrastructure",
      "drop_reason": null,
      "tag_groups": {
        "issue": ["library", "ac_issue"],
        "cluster": ["infrastructure"]
      },
      "created_at": "2025-04-01T12:33:11.202166",
      "updated_at": "2025-04-02T09:05:45.114901"
    }
  ]
}
```

### `PATCH /admin/grievances/<grievance_id>`
- **Brief:** Update status, assignee, issue tags, cluster tags, cluster, or drop reason.
- **Sample Request**
```json
{
  "status": "IN_PROGRESS",
  "assigned_to": "LIBRARY",
  "issue_tags": ["library", "hvac"],
  "cluster": "infrastructure",
  "cluster_tags": ["infrastructure"]
}
```
- **Sample Response**
```json
{
  "grievance": {
    "id": 123,
    "student_id": 1,
    "title": "Library AC not working",
    "status": "IN_PROGRESS",
    "assigned_to": "LIBRARY",
    "tags": ["library", "hvac"],
    "issue_tags": ["library", "hvac"],
    "cluster_tags": ["infrastructure"],
    "cluster": "infrastructure",
    "drop_reason": null,
    "tag_groups": {
      "issue": ["library", "hvac"],
      "cluster": ["infrastructure"]
    },
    "created_at": "2025-04-01T12:33:11.202166",
    "updated_at": "2025-04-02T09:05:45.114901"
  }
}
```

### `POST /admin/grievances/<grievance_id>/chat`
- **Brief:** Add an administrative reply in the grievance chat.
- **Sample Request**
```json
{
  "message": "Technician scheduled for tomorrow."
}
```
- **Sample Response**
```json
{
  "grievance_id": 123,
  "conversations": [
    {
      "role": "admin",
      "message": "Technician scheduled for tomorrow.",
      "timestamp": "2025-04-02T13:45:19.677732"
    }
  ]
}
```

### `POST /admin/gdrive`
- **Brief:** Register a Google Drive folder for knowledge base ingestion and kick off a 5-minute background poller that syncs changes into MongoDB.
- **Sample Request**
```json
{
  "folder_id": "1AxVrJ2fd..."
}
```
- **Sample Response**
```json
{
  "folder_id": "1AxVrJ2fd...",
  "request_id": "c2ac5cead9b4a20b6b8fb7d2e056f5cf7fd2e7d822f10bfca319b7145f5f3bf4",
  "status": "POLLING",
  "start_page_token": "1706",
  "polling_interval_seconds": 300,
  "next_poll_in_seconds": 0
}
```

### `GET /admin/gdrive/reindex`
- **Brief:** Force a full rescan of the registered Google Drive folder, replace the stored knowledge-base chunks in MongoDB, and restart the poller with the latest change token. Returns `400` if no folder is registered.
- **Sample Response**
```json
{
  "status": "REINDEXED",
  "folder_id": "1AxVrJ2fd...",
  "chunks_discovered": 42,
  "chunks_upserted": 42,
  "chunks_deleted": 40,
  "next_change_token": "1708",
  "reindexed_at": "2025-04-02T14:10:31.919112"
}
```

### `GET /admin/analytics/clusters`
- **Brief:** Retrieve pre-computed cluster analytics from MongoDB.
- **Sample Response**
```json
{
  "analytics": [
    {
      "cluster": "infrastructure",
      "count": 18,
      "top_tags": ["hostel", "library"]
    }
  ]
}
```

### `GET /admin/grievances/ai-summarize`
- **Brief:** Generate an AI summary highlighting trends and actions.
- **Sample Response**
```json
{
  "summary": "Trending issues: HVAC in library and hostel. Suggested action: prioritize maintenance."
}
```

### `POST /ai/suggestions/preview`
- **Brief:** Fetch AI-driven resolution suggestions for a grievance.
- **Sample Request**
```json
{
  "grievance_id": 123
}
```
- **Sample Response**
```json
{
  "grievance_id": 123,
  "suggestions": [
    {
      "confidence": 0.72,
      "source": {
        "doc_id": "knowledge_base_virtual",
        "chunk_id": "31c65d609193"
      },
      "summary": "AI summarization unavailable (missing OpenAI credentials)."
    }
  ],
  "kb_context_window": [
    {
      "doc_name": "virtual_kb_entry.txt",
      "excerpt": "AI summarization unavailable (missing OpenAI credentials)."
    }
  ],
  "related_grievances": [
    {
      "id": 110,
      "title": "Library HVAC malfunction",
      "status": "SOLVED"
    }
  ]
}
```

### `POST /ai/suggestions/confirm`
- **Brief:** Accept or reject AI-driven resolution suggestions.
- **Sample Request**
```json
{
  "grievance_id": 123,
  "suggestion_id": "UGC_Rulebook.pdf#p3c2",
  "accepted": true
}
```
- **Sample Response**
```json
{
  "grievance": {
    "id": 123,
    "status": "DROPPED",
    "drop_reason": "Resolved via suggestion UGC_Rulebook.pdf#p3c2",
    "updated_at": "2025-04-02T15:24:05.871122"
  }
}
```
