# Technical Documentation: Student Grievance Management Backend

## Overview

This backend system serves as the foundation for a **Student Grievance Management Platform**, providing CRUD APIs and integrated AI-powered features for efficient grievance tracking, knowledge base retrieval, and trend analytics. The backend is implemented using **Flask**, with **PostgreSQL** (via SQLAlchemy) as the primary relational database, **MongoDB** for vector embeddings and conversational data, and integrations with **OpenAI** for embedding and LLM-powered functionalities. **Amazon S3** is used for document/file storage, while **Google Drive** can be linked (via GCP Service Account) to ingest institutional documents as a data source for automated knowledge retrieval.

***

## 1. User Roles & Access

- **Student:**
  - Submit a new grievance (with document upload)
  - View status and history of their own grievances
  - Receive contextual AI suggestions (rulebook, notices) during submission

- **Admin:**
  - Link a Google Drive folder to index institutional documents
  - View all grievances, assign tags, update status (enum), assign to departments
  - View and participate in each ticket’s chat (chat history stored in MongoDB)
  - Access analytics/trends based on cluster tags
  - Add post-resolution comments and close tickets

***

## 2. High-Level Architecture

| Layer                 | Technology                                  | Purpose                                 |
|-----------------------|---------------------------------------------|-----------------------------------------|
| Web Framework         | Flask                                       | API server, extensibility               |
| Relational Database   | PostgreSQL (SQLAlchemy ORM)                 | Structured ticket and user management   |
| Vector Store          | MongoDB (pymongo + OpenAI embeddings)       | Grievance embeddings, chat history      |
| File Storage          | Amazon S3                                   | Uploaded documents by students          |
| AI Services           | OpenAI API (Embeddings, LLM)                | Generation, clustering, KB search       |
| Cloud Drive           | Google Drive (GCP Service Account)          | Rulebooks, notices corpus ingestion     |

***

## 3. Data Models

### PostgreSQL (SQLAlchemy)

**Student**
- `id`, `name`, `email`

**Grievance**
- `id`
- `student_id` (FK)
- `title`, `description`
- `status` (enum: NEW, IN_PROGRESS, SOLVED, DROPPED)
- `assigned_to` (enum: HOSTEL, MESS, FACULTY, ACADEMICS, LIBRARY, ETC)
- `tags` (array: ["hostel","ac_issue"])
- `s3_doc_urls` (array)
- `created_at`
- `updated_at`
- `cluster` (string, optional, for hierarchical tags)

**Admin**
- `id`, `name`, `email`, `gd_service_account_json` (for gdrive access)

### MongoDB

**Grievance Embedding**
- `_id` (matches SQL id)
- `embedding` (vector)
- `grievance_id` (reference)
- `tags`, `cluster`
- `meta_info`

**Chat Conversation**
- `grievance_id`
- `conversations` (array of `{role: admin/student, message, timestamp}`)

**Cluster Analytics**
- Precomputed cluster summaries, trending tags, etc.

***

## 4. API Endpoints

### Student Endpoints

| Endpoint                   | Description                                  |
|----------------------------|----------------------------------------------|
| `POST /grievances`         | Submit new grievance with docs (S3 upload)   |
| `GET /grievances`          | List grievances by student                   |
| `GET /grievances/{id}`     | View details and chat of a ticket            |
| `POST /grievances/{id}/chat` | Add message to ticket chat                 |

### Admin Endpoints

| Endpoint                            | Description                                 |
|--------------------------------------|---------------------------------------------|
| `GET /admin/grievances`              | View/filter all grievances                  |
| `PATCH /admin/grievances/{id}`       | Update status, assign tags/dept, close      |
| `POST /admin/grievances/{id}/chat`   | Add admin message                           |
| `POST /admin/gdrive`                 | Register GDrive folder via service account  |
| `GET /admin/analytics/clusters`      | View cluster & tagging analytics            |
| `GET /admin/grievances/ai-summarize` | Chatbot interface for exploring trends      |

***

## 5. Feature Implementation Details

### 5.1 Grievance Embedding & Tagging

- Upon submission, each grievance's **description** is converted to an embedding with OpenAI API and inserted into MongoDB.
- An AI-based tagging/clustering process (using OpenAI LLM APIs) analyzes the content, suggests hierarchical tags (e.g., "library" → "ac_issue"), and attaches them to both PostgreSQL and MongoDB records.

### 5.2 Knowledge Base Integration (GDrive)

- Admin links a Google Drive folder using their generated service account credentials.
- The backend fetches and indexes documents (rulebooks, notices) using OpenAI API, segmenting into search-friendly chunks as embeddings.
- During grievance submission, the system queries the knowledge base embeddings for relevant sections to suggest actionable info (e.g., policies or recent notices).
- Students can accept a KB-suggested resolution (and drop the grievance) or continue the submission.
- Each indexed document is split into semantic chunks (approx. 400–600 tokens) with deterministic chunk IDs so updates can be diffed without reprocessing the whole corpus.
- The admin’s service-account link stores the current `start_page_id` (Google Drive start page token). A scheduled worker calls `changes().list(pageToken=start_page_id)` to detect additions, updates, or deletions:
  1. **Add/Update:** fetch the file, regenerate affected chunks, update embeddings in MongoDB, and refresh the `start_page_id`.
  2. **Delete:** remove associated chunks and embeddings, marking suggestions referencing them as inactive.
- A background poller runs every 120 seconds using the stored `start_page_id`; it calls `changes().list(pageToken=start_page_id)` to detect additions, updates, or deletions, then upserts the affected chunks into MongoDB and refreshes the token.
- Chunk metadata (doc ID, chunk ID, checksum, last indexed at) is persisted so only modified segments are re-embedded.
- The polling cadence is configurable but defaults to two minutes; each cycle batches Drive deltas before dispatching chunk embedding jobs.
- Suggestion requests query the vector store with hybrid similarity + metadata filters (e.g., department) before ranking results for the LLM summarizer.

### 5.3 AI Chatbot (Admin)

- Admin can "chat" with the system about trends, common patterns, or specific tickets:
  - e.g., “Find all library grievances about AC issues last month”
- Backend fetches embedding matches and executes LLM-based semantic search over the indexed grievances and KB documents.

### 5.4 Ticket Chat

- Each ticket maintains a chat conversation log in a MongoDB document as an array of `{role, message, timestamp}` objects.
- Both admin and student can send messages, enabling clarifications and updates per ticket.

### 5.5 Analytics

- Aggregates grievance clusters (from AI-based tags) to visualize trends:
  - Frequency by category/subcategory, resolution times, department loads
  - Enables admins to spot patterns (e.g., surge in "mess hygiene" issues)

***

## 6. Sample API Flow

1. **Student submits ticket:**  
   - Description is embedded and tagged by AI.  
   - System checks KB and suggests a relevant policy.  
2. **Admin views ticket:**  
   - Sees cluster tag (e.g., "hostel > maintenance"), assigns ticket, can chat for more info.  
3. **Ticket is updated/resolved:**  
   - Status and cluster tags updated; analytics reflect changes in near real-time.
4. **Student drafts ticket:**  
   - The UI calls `POST /ai/suggestions/preview`; the backend retrieves relevant chunks, formats them with the LLM, and returns actionable guidance plus similar historical grievances.
   - If the student accepts a suggestion, the client calls `POST /ai/suggestions/confirm`, optionally auto-closing the grievance with a reference to the KB excerpt.
5. **Knowledge base upkeep:**  
   - An automated poller wakes every two minutes, iterates Drive changes with the current `start_page_id`, and upserts modified chunks into MongoDB so future suggestions reflect fresh content.

***

## 7. Security & Data Separation

- No multi-user auth needed: hardcoded single credentials.
- Sensitive credentials (GCP, S3) stored securely, not exposed via client.

***

## Backend Dependencies

- **Python packages**: Flask, Flask-RESTful, SQLAlchemy, psycopg2, pymongo, boto3, openai, google-api-python-client, python-dotenv
- **Databases/services**: PostgreSQL, MongoDB, AWS S3, Google Drive via GCP service account

***

# Expanded Technical Documentation: Student Grievance Management Backend

## Introduction

This section expands upon the initial technical documentation by providing **sample API request and response bodies** for all major endpoints. Special attention is given to the admin's ability to update enum fields such as `status` and `assigned_to`, ensuring clarity on how to structure these updates and the expected response formats.

***

## 1. API Endpoints: Sample Requests & Responses

### 1.1 Student APIs

#### Submit New Grievance

**POST /grievances**

Request (multipart for document upload):
```json
{
  "title": "Library AC not working",
  "description": "The air conditioning in the central library is broken since last week.",
  "docs": ["file1.pdf", "file2.jpg"]
}
```
Response:
```json
{
  "id": 123,
  "student_id": 52,
  "title": "Library AC not working",
  "description": "The air conditioning in the central library is broken since last week.",
  "status": "NEW",
  "assigned_to": null,
  "tags": ["library", "ac_issue"],
  "cluster": "library > ac_issue",
  "s3_doc_urls": [
    "https://s3.amazonaws.com/bucket/grievances/123/file1.pdf",
    "https://s3.amazonaws.com/bucket/grievances/123/file2.jpg"
  ],
  "created_at": "2025-10-16T21:54:32Z"
}
```

***

#### View Own Grievances

**GET /grievances**

Request:
```
GET /grievances
```
Response:
```json
[
  {
    "id": 123,
    "title": "Library AC not working",
    "status": "IN_PROGRESS",
    "assigned_to": "LIBRARY",
    "tags": ["library", "ac_issue"],
    "cluster": "library > ac_issue",
    "created_at": "2025-10-16T21:54:32Z"
  },
  {
    "id": 124,
    "title": "Mess food quality",
    "status": "SOLVED",
    "assigned_to": "MESS",
    "tags": ["mess", "hygiene"],
    "cluster": "mess > hygiene",
    "created_at": "2025-10-01T17:44:11Z"
  }
]
```

***

#### Get Grievance Details & Chat

**GET /grievances/{id}**

Request:
```
GET /grievances/123
```
Response:
```json
{
  "id": 123,
  "student_id": 52,
  "title": "Library AC not working",
  "description": "The air conditioning in the central library is broken since last week.",
  "status": "IN_PROGRESS",
  "assigned_to": "LIBRARY",
  "tags": ["library", "ac_issue"],
  "cluster": "library > ac_issue",
  "s3_doc_urls": [
    "https://s3.amazonaws.com/bucket/grievances/123/file1.pdf",
    "https://s3.amazonaws.com/bucket/grievances/123/file2.jpg"
  ],
  "chat": [
    {
      "role": "student",
      "message": "Any update?",
      "timestamp": "2025-10-17T09:23:15Z"
    },
    {
      "role": "admin",
      "message": "The AC maintenance team has been assigned.",
      "timestamp": "2025-10-17T10:01:00Z"
    }
  ]
}
```

***

#### Add Message to Ticket Chat

**POST /grievances/{id}/chat**

Request:
```json
{
  "role": "student",
  "message": "Any update on the AC?"
}
```
Response:
```json
{
  "success": true,
  "chat": [
    {
      "role": "student",
      "message": "Any update on the AC?",
      "timestamp": "2025-10-17T11:15:22Z"
    }
  ]
}
```

***

### 1.2 Admin APIs

#### View All Grievances

**GET /admin/grievances**

Request:
```
GET /admin/grievances?status=NEW&assigned_to=LIBRARY
```
Response:
```json
[
  {
    "id": 123,
    "title": "Library AC not working",
    "status": "NEW",
    "assigned_to": "LIBRARY",
    "tags": ["library", "ac_issue"],
    "created_at": "2025-10-16T21:54:32Z"
  }
]
```

***

#### Update Grievance Status or Assigned-To

**PATCH /admin/grievances/{id}**

Request (update enums only):
```json
{
  "status": "IN_PROGRESS",
  "assigned_to": "LIBRARY"
}
```
Response:
```json
{
  "id": 123,
  "status": "IN_PROGRESS",
  "assigned_to": "LIBRARY",
  "updated_at": "2025-10-17T12:05:02Z"
}
```

Alternate: Tagging & Cluster Update
```json
{
  "tags": ["library", "ac_issue"],
  "cluster": "library > ac_issue"
}
```
Response:
```json
{
  "id": 123,
  "tags": ["library", "ac_issue"],
  "cluster": "library > ac_issue",
  "updated_at": "2025-10-17T12:06:32Z"
}
```

***

#### Add Admin Message to Ticket Chat

**POST /admin/grievances/{id}/chat**

Request:
```json
{
  "role": "admin",
  "message": "The maintenance team will inspect the AC tomorrow."
}
```
Response:
```json
{
  "success": true,
  "chat": [
    {
      "role": "admin",
      "message": "The maintenance team will inspect the AC tomorrow.",
      "timestamp": "2025-10-17T12:10:44Z"
    }
  ]
}
```

***

#### Register Google Drive Folder

**POST /admin/gdrive**

Request:
```json
{
  "gd_service_account_json": "{...}",  // Service account credentials as JSON
  "folder_id": "1AxVrJ2fd..."
}
```
Response:
```json
{
  "success": true,
  "indexed_docs": [
    {
      "name": "UGC_Rulebook.pdf",
      "id": "1KDHGkd...",
      "indexed_at": "2025-10-17T12:12:31Z"
    }
  ]
}
```

***

#### View Cluster Analytics

**GET /admin/analytics/clusters**

Request:
```
GET /admin/analytics/clusters
```
Response:
```json
{
  "clusters": [
    {
      "name": "hostel > ac_issue",
      "count": 7,
      "grievances": [100, 102, 105, 110, 112, 120, 123]
    },
    {
      "name": "library > book_issue",
      "count": 4,
      "grievances": [125, 134, 137, 142]
    }
  ],
  "trending_tags": [
    {"tag": "ac_issue", "count": 12},
    {"tag": "mess_hygiene", "count": 9}
  ]
}
```

***

#### Chatbot Analytics: Query Grievance Trends

**GET /admin/grievances/ai-summarize?query={query}**

Example Request:
```
GET /admin/grievances/ai-summarize?query=library ac issues past month
```
Response:
```json
{
  "summary": "There have been 7 grievances submitted about AC issues in the library since September 15, 2025. Most tickets are assigned to the library department and two have been resolved.",
  "related_grievances": [
    {
      "id": 123,
      "title": "Library AC not working",
      "status": "IN_PROGRESS",
      "assigned_to": "LIBRARY"
    }
  ]
}
```

***

### 1.3 AI Suggestion & Knowledge Base APIs

#### Request AI Suggestions During Draft

**POST /ai/suggestions/preview**

Request:
```json
{
  "grievance_id": 123,
  "title": "Library AC not working",
  "description": "The air conditioning in the central library is broken since last week."
}
```
Response:
```json
{
  "suggestions": [
    {
      "confidence": 0.81,
      "source": {
        "doc_id": "1KDHGkd...",
        "chunk_id": "UGC_Rulebook.pdf#p3c2"
      },
      "summary": "AC maintenance issues must be reported to the library help desk within 48 hours."
    }
  ],
  "kb_context_window": [
    {
      "doc_name": "UGC_Rulebook.pdf",
      "excerpt": "For HVAC complaints, submit a ticket to the facility manager..."
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

#### Confirm Suggestion Adoption

**POST /ai/suggestions/confirm**

Request:
```json
{
  "grievance_id": 123,
  "suggestion_id": "UGC_Rulebook.pdf#p3c2",
  "accepted": true
}
```
Response:
```json
{
  "grievance_id": 123,
  "status": "DROPPED",
  "drop_reason": "Resolved via policy UGC_Rulebook.pdf#p3c2"
}
```

#### Knowledge Base Sync Status (Auto-Polling)

**GET /admin/knowledge-base/status**

Response:
```json
{
  "folder_id": "1AxVrJ2fd...",
  "polling_interval_seconds": 120,
  "last_poll_completed_at": "2025-10-17T12:30:11Z",
  "start_page_id": "gdrive_start_token_1706",
  "changes_processed": {
    "added_or_updated_chunks": 17,
    "deleted_chunks": 2
  }
}
```
***

## 2. Enum Fields

The following are updatable via the admin panel:
- **status:** NEW, IN_PROGRESS, SOLVED, DROPPED
- **assigned_to:** HOSTEL, MESS, FACULTY, ACADEMICS, LIBRARY, [etc]

Admins can use the update API (`PATCH /admin/grievances/{id}`) to change these fields, as illustrated above.

***

## 3. Error Response Examples

All endpoints return standard error objects:
```json
{
  "error": "Invalid status value"
}
```
or
```json
{
  "error": "Document upload failed",
  "details": "File size exceeds limit"
}
```

***

## 4. Notes on Data Flow

- **Grievance submission:** Automates embedding, tagging, and knowledge base lookup; all handled behind the scenes.
- **Enum & tag updating:** PATCH endpoint validates enum values before updating.
- **Document storage:** Returns URLs pointing to S3 upon success.
- **Chat operations:** Chat stored/retrieved from MongoDB, linked by `grievance_id`.
- **AI suggestion flow:** Involves previewing potential KB suggestions during grievance drafting, with an option to auto-resolve grievances based on accepted suggestions.
- **Knowledge base maintenance:** Automated syncing of Google Drive changes ensures the backend's knowledge base is up-to-date, leveraging Drive's incremental change detection.
}
```

***

## 4. Notes on Data Flow

- **Grievance submission:** Automates embedding, tagging, and knowledge base lookup; all handled behind the scenes.
- **Enum & tag updating:** PATCH endpoint validates enum values before updating.
- **Document storage:** Returns URLs pointing to S3 upon success.
- **Chat operations:** Chat stored/retrieved from MongoDB, linked by `grievance_id`.
- **AI suggestion flow:** Involves previewing potential KB suggestions during grievance drafting, with an option to auto-resolve grievances based on accepted suggestions.
- **Knowledge base maintenance:** Automated syncing of Google Drive changes ensures the backend's knowledge base is up-to-date, leveraging Drive's incremental change detection.

