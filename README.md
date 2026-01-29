# Student Grievance Management System

A comprehensive, AI-powered platform for managing student grievances in educational institutions. This system streamlines the process of submitting, tracking, and resolving student complaints with intelligent automation, knowledge base integration, and real-time communication.

## 🌟 Overview

The Student Grievance Management System is designed to modernize how educational institutions handle student concerns. By combining traditional grievance tracking with cutting-edge AI capabilities, this platform helps institutions:

- **Reduce response times** through automated categorization and routing
- **Improve resolution quality** with AI-powered suggestions from institutional knowledge bases
- **Identify systemic issues** through clustering and analytics
- **Enhance transparency** with real-time status updates and chat functionality
- **Scale efficiently** by automatically organizing and prioritizing grievances

### Why This System?

Traditional grievance systems often suffer from:
- Manual categorization leading to delays
- Lost institutional knowledge when staff changes
- Difficulty identifying recurring issues
- Poor visibility into grievance status for students
- Inefficient communication between students and administrators

This system addresses these challenges through intelligent automation while maintaining human oversight for all final decisions.

## ✨ Key Features

### For Students
- **Easy Submission**: Submit grievances with a user-friendly interface
- **Document Upload**: Attach supporting documents (images, PDFs) stored securely on S3
- **AI-Powered Suggestions**: Receive instant guidance from institutional rulebooks and policies during submission
- **Real-time Tracking**: Monitor grievance status with live updates
- **Direct Communication**: Chat with administrators for clarifications
- **Preview Mode**: See AI-generated tags and suggestions before final submission
- **Related Grievances**: View how similar issues were resolved previously

### For Administrators
- **Centralized Dashboard**: View and manage all grievances in one place
- **Smart Filtering**: Filter by status, department, tags, or clusters
- **Automated Categorization**: AI automatically tags and categorizes new grievances
- **Department Routing**: Assign grievances to appropriate departments
- **Knowledge Base Integration**: Connect Google Drive folders containing policies, rulebooks, and notices
- **Analytics & Insights**: 
  - Cluster analysis to identify recurring issues
  - Trend visualization with charts
  - AI-generated summaries of grievance patterns
  - Department workload distribution
- **Intelligent Suggestions**: Get AI-powered resolution recommendations based on historical data and knowledge base
- **Chat Interface**: Communicate directly with students for additional information
- **Automated Clustering**: Background engine groups similar grievances for pattern detection

## 🏗️ Architecture

### Technology Stack

#### Backend (`/be`)
- **Framework**: Flask (Python)
- **Relational Database**: PostgreSQL with SQLAlchemy ORM
- **Vector Store**: MongoDB (for embeddings and chat history)
- **File Storage**: Amazon S3
- **AI Services**: OpenAI API
  - GPT models for tagging, summarization, and suggestions
  - Text embeddings for semantic search
- **External Integration**: Google Drive API (via GCP Service Account)
- **Background Processing**: In-process threading for clustering and Drive polling

#### Frontend (`/fe`)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Server**: Express.js
- **State Management**: Recoil
- **UI Components**: Radix UI primitives
- **Styling**: Tailwind CSS
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: Wouter
- **Charts**: Recharts
- **Forms**: React Hook Form with Zod validation

### Data Flow

```
Student Submission → Backend API → AI Processing
                                  ↓
                      [Embedding Generation]
                      [Tag Generation]
                      [KB Similarity Search]
                                  ↓
                      PostgreSQL (structured data)
                      MongoDB (embeddings + chat)
                      S3 (documents)
                                  ↓
                      Admin Dashboard ← Analytics Engine
```

### System Components

1. **Grievance Submission Pipeline**
   - Receives grievance details and documents
   - Generates embeddings using OpenAI
   - Auto-tags using AI (issue tags + cluster tags)
   - Queries knowledge base for relevant policies
   - Stores in PostgreSQL and MongoDB
   - Uploads documents to S3

2. **Knowledge Base Engine**
   - Monitors Google Drive folder for changes
   - Extracts and chunks documents (PDFs, docs)
   - Generates embeddings for semantic search
   - Updates every 5 minutes via background poller
   - Provides context for AI suggestions

3. **Clustering Engine**
   - Background service analyzing all grievances
   - Groups similar issues automatically
   - Updates cluster analytics in MongoDB
   - Helps identify systemic problems

4. **Chat System**
   - Real-time messaging between students and admins
   - Stored in MongoDB with timestamps
   - Supports role-based messages

5. **Analytics Dashboard**
   - Pre-computed cluster statistics
   - Real-time status distribution
   - Department workload analysis
   - AI-powered trend summaries

## 🚀 Getting Started

### Prerequisites

#### Backend Requirements
- Python 3.9 or higher
- PostgreSQL 12 or higher
- MongoDB 4.4 or higher
- AWS Account (for S3)
- OpenAI API Key
- Google Cloud Platform Account (optional, for Drive integration)

#### Frontend Requirements
- Node.js 18 or higher
- npm or pnpm package manager

### Environment Setup

#### Backend Configuration

1. Navigate to the backend directory:
```bash
cd be
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the `be` directory:
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/grievance_db
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DB=grievance_mongo

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=student-grievances
AWS_REGION=us-east-1

# Google Drive Configuration (Optional)
GDRIVE_CREDENTIALS_JSON=path/to/service-account.json
GDRIVE_POLL_INTERVAL=300  # seconds

# CORS Configuration
ALLOW_CORS_ORIGINS=http://localhost:5000,http://localhost:5173

# Flask Configuration
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
```

5. Initialize the database:
```bash
python -c "from db import init_db; init_db()"
```

6. Run the backend server:
```bash
python app.py
```

The backend will start on `http://localhost:8000`

#### Frontend Configuration

1. Navigate to the frontend directory:
```bash
cd fe
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Create a `.env` file in the `fe` directory (if needed):
```env
VITE_API_URL=http://localhost:8000
```

4. Run the development server:
```bash
npm run dev
# or
pnpm dev
```

The frontend will start on `http://localhost:5173`

### Database Setup

#### PostgreSQL

```sql
-- Create database
CREATE DATABASE grievance_db;

-- Grant permissions to your user
GRANT ALL PRIVILEGES ON DATABASE grievance_db TO your_username;
```

The SQLAlchemy models will automatically create tables on first run.

#### MongoDB

MongoDB collections are created automatically when data is first inserted. No manual setup required.

## 📚 API Documentation

The backend exposes a comprehensive REST API. Detailed documentation is available in:
- `/be/API.md` - Complete API reference with examples
- `/be/architechture.md` - Detailed technical architecture

### Key Endpoints

**Student Endpoints**
- `POST /grievances` - Submit new grievance
- `GET /grievances` - List user's grievances
- `GET /grievances/<id>` - View grievance details with chat
- `POST /grievances/<id>/chat` - Send message

**Admin Endpoints**
- `GET /admin/grievances` - List all grievances (with filters)
- `PATCH /admin/grievances/<id>` - Update status/assignment
- `POST /admin/grievances/<id>/chat` - Reply to student
- `POST /admin/gdrive` - Register Google Drive folder
- `GET /admin/gdrive/reindex` - Force knowledge base refresh
- `GET /admin/analytics/clusters` - View cluster analytics
- `GET /admin/grievances/ai-summarize` - AI trend summary

**AI Endpoints**
- `POST /ai/suggestions/preview` - Get AI suggestions for grievance
- `POST /ai/suggestions/confirm` - Accept/reject AI suggestion

## 🔧 Configuration Guide

### Google Drive Integration

To enable knowledge base integration:

1. Create a Google Cloud Platform project
2. Enable the Google Drive API
3. Create a Service Account
4. Download the service account JSON credentials
5. Share your Google Drive folder with the service account email
6. Use the Admin panel to register the folder ID

### S3 Document Storage

1. Create an S3 bucket in your AWS account
2. Configure bucket permissions for your IAM user
3. Set appropriate CORS rules if accessing from browser
4. Update the `.env` file with your credentials

### OpenAI Configuration

1. Sign up for OpenAI API access
2. Generate an API key
3. Add to `.env` file
4. Monitor usage in OpenAI dashboard

## 📊 Data Models

### PostgreSQL Schema

**Student**
- id (Primary Key)
- name
- email
- created_at

**Grievance**
- id (Primary Key)
- student_id (Foreign Key)
- title
- description
- status (enum: NEW, IN_PROGRESS, SOLVED, DROPPED)
- assigned_to (enum: HOSTEL, MESS, FACULTY, ACADEMICS, LIBRARY, OTHERS)
- tags (array) - Issue categorization tags
- cluster (string) - Primary cluster label
- cluster_tags (array) - Thematic grouping tags
- s3_doc_urls (array) - Document URLs
- drop_reason (text)
- created_at
- updated_at

### MongoDB Collections

**grievance_embeddings**
- grievance_id
- embedding (vector)
- metadata (tags, cluster info)

**chat_conversations**
- grievance_id
- conversations (array of {role, message, timestamp})

**cluster_analytics**
- cluster name
- count
- top_tags
- last_updated

**knowledge_base_chunks**
- doc_id
- chunk_id
- content
- embedding (vector)
- metadata (doc_name, page, etc.)

## 🔐 Security Considerations

- **Authentication**: Currently uses single-user mode; extend for multi-user with proper auth
- **API Keys**: Never commit credentials to version control
- **S3 Permissions**: Use IAM roles with least privilege
- **CORS**: Configure allowed origins appropriately
- **Input Validation**: All inputs validated on backend
- **SQL Injection**: Protected via SQLAlchemy ORM
- **XSS Protection**: React handles escaping automatically

## 🎯 Use Cases

### 1. Academic Institution
- Students report issues with courses, faculty, or facilities
- Department heads review and respond to relevant grievances
- Admin identifies recurring problems through clustering
- Policy documents automatically suggest solutions

### 2. Hostel Management
- Students submit maintenance requests
- Auto-tagged by location and issue type
- Historical data shows patterns (e.g., AC issues in summer)
- Knowledge base contains maintenance schedules and policies

### 3. Library Services
- Book requests, catalog issues, facility problems
- Clustering identifies popular requests
- Auto-suggestions from library rules and catalog

## 🐛 Troubleshooting

### Common Issues

**Backend won't start**
- Check PostgreSQL is running: `pg_isready`
- Check MongoDB is running: `mongosh --eval "db.adminCommand('ping')"`
- Verify environment variables are set correctly
- Check logs for detailed error messages

**Frontend can't connect to backend**
- Verify backend is running on port 8000
- Check CORS configuration in backend
- Ensure VITE_API_URL is correct in frontend .env

**OpenAI API errors**
- Verify API key is valid
- Check API quota and billing
- Monitor rate limits

**Google Drive sync not working**
- Verify service account has access to folder
- Check folder ID is correct
- Review GCP API quotas
- Check polling interval settings

**Documents not uploading**
- Verify S3 bucket exists and is accessible
- Check AWS credentials
- Review bucket permissions
- Check file size limits

## 📈 Monitoring & Maintenance

### Database Maintenance
- Regularly backup PostgreSQL and MongoDB
- Monitor database size and performance
- Index optimization for frequently queried fields

### Cost Management
- Monitor OpenAI API usage
- Track S3 storage costs
- Optimize embedding generation (cache where possible)

### Performance Tuning
- Adjust clustering engine frequency as needed
- Optimize Drive polling interval
- Scale PostgreSQL/MongoDB as data grows

## 🤝 Contributing

This system is designed to be extensible:

1. **Adding Departments**: Update Department enum in `db.py`
2. **New Tag Types**: Extend tagging logic in `utils.py`
3. **Custom Analytics**: Add new aggregation queries to analytics endpoint
4. **UI Components**: Add new React components in `fe/client/src`

## 📝 License

MIT License - See LICENSE file for details

## 🆘 Support

For issues and questions:
- Check existing documentation in `/be` directory
- Review API documentation
- Check application logs for errors
- Verify environment configuration

## 🗺️ Roadmap

Potential future enhancements:
- Multi-tenant support for multiple institutions
- Mobile app for students
- Email notifications for status changes
- Advanced reporting and export features
- Integration with institutional SSO
- Webhook support for external systems
- Voice-based grievance submission
- Sentiment analysis of grievances
- Automated escalation workflows
- SLA tracking and reporting

## 📞 Technical Details

### Backend Data Flow
1. Grievance submitted → Flask endpoint receives request
2. OpenAI generates embeddings for description
3. AI generates issue_tags and cluster_tags
4. Grievance saved to PostgreSQL
5. Embedding saved to MongoDB with metadata
6. Documents uploaded to S3 (if provided)
7. Knowledge base queried for relevant policies
8. Response returned with suggestions

### Frontend Architecture
- Component-based React structure
- Type-safe with TypeScript
- Centralized API calls with axios
- Global state with Recoil
- Server-side data fetching with React Query
- Responsive design with Tailwind CSS

### Performance Characteristics
- Grievance submission: ~2-3 seconds (including AI)
- Knowledge base query: <500ms
- Clustering update: Background, no user impact
- Drive sync: Every 5 minutes (configurable)

---

**Built with ❤️ for educational institutions**
