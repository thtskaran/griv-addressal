# Complete API Integration Guide

## 🎉 What Has Been Done

All React components in the frontend have been updated to use the actual API endpoints documented in `/be/API.md` instead of hardcoded mock data.

### ✅ Completed Integrations

#### Student/User Features
1. **Dashboard** (`/user/dashboard`)
   - Fetch and display all user's grievances
   - View grievance details with tags and status
   - Open chat for any grievance
   - Send messages in real-time
   - Rate resolved grievances

2. **Submit Grievance** (`/user/submit-grievance`)
   - Submit new grievances with all fields
   - Add issue tags, cluster tags
   - Upload multiple documents
   - Auto-redirect to dashboard on success

3. **Grievance Preview** (`/user/grievance-preview`)
   - View AI suggestions for similar grievances
   - See confidence scores and related cases
   - Accept/reject AI suggestions
   - View knowledge base context

#### Admin Features
1. **Admin Dashboard** (`/admin/dashboard`)
   - View all grievances with filters
   - Filter by status and department
   - Update grievance status
   - Assign to departments
   - Reply to students
   - View AI suggestions per grievance
   - Real-time statistics

2. **Analytics** (`/admin/analytics`)
   - Cluster analytics from backend
   - AI-generated summary
   - Status distribution charts
   - Department distribution charts
   - Interactive visualizations

3. **Google Drive** (`/admin/google-drive`)
   - Register Google Drive folder
   - Track polling status
   - View sync configuration

4. **Drive Dashboard** (`/admin/drive-dashboard`)
   - View registered folder details
   - Force reindex knowledge base
   - Track chunks statistics
   - Monitor sync status

5. **Chat History** (`/admin/chat-history/:id`)
   - View full conversation history
   - Send messages to students
   - See grievance metadata
   - Real-time updates

## 📋 API Endpoints Used

### Health Check
- `GET /health` - Check API status

### Student APIs
- `POST /grievances` - Submit new grievance
- `GET /grievances?student_id=<id>` - List student's grievances
- `GET /grievances/<id>` - Get grievance details with chat
- `POST /grievances/<id>/chat` - Send student message

### Admin APIs
- `GET /admin/grievances` - List all grievances (with filters)
- `PATCH /admin/grievances/<id>` - Update grievance
- `POST /admin/grievances/<id>/chat` - Send admin message
- `POST /admin/gdrive` - Register Google Drive folder
- `GET /admin/gdrive/reindex` - Force reindex drive folder
- `GET /admin/analytics/clusters` - Get cluster analytics
- `GET /admin/grievances/ai-summarize` - Get AI summary

### AI APIs
- `POST /ai/suggestions/preview` - Get AI suggestions
- `POST /ai/suggestions/confirm` - Accept/reject suggestion

## 🚀 How to Run

### 1. Start Backend
```bash
cd be
python -m venv myenv
source myenv/bin/activate  # On Windows: myenv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Backend will run on `http://localhost:5000`

### 2. Start Frontend
```bash
cd fe
npm install
npm run dev
```

Frontend will run on `http://localhost:5173` (or port shown in console)

### 3. Test the Integration

#### Test User Flow:
1. Navigate to `/login` and login as a user
2. Go to `/user/submit-grievance`
3. Fill in title, description, add tags
4. Upload documents (optional)
5. Submit grievance
6. View it in `/user/dashboard`
7. Open chat and send a message
8. View grievance details

#### Test Admin Flow:
1. Login as admin
2. Go to `/admin/dashboard`
3. View all grievances
4. Filter by status/department
5. Update a grievance status
6. Assign to a department
7. Send a reply to student
8. Click AI button to view suggestions
9. Go to `/admin/analytics`
10. Click "Generate Summary"
11. View cluster analytics

#### Test Google Drive:
1. Go to `/admin/google-drive`
2. Enter folder ID or URL
3. Click "Connect to Drive"
4. View `/admin/drive-dashboard`
5. Click "Force Reindex"
6. View statistics

## 🔧 Configuration

### Backend Requirements
Make sure your backend has these configured in `config.py`:

```python
# MongoDB
MONGO_URI = "mongodb://localhost:27017/grievances"

# AWS S3 (for document uploads)
AWS_ACCESS_KEY_ID = "your-key"
AWS_SECRET_ACCESS_KEY = "your-secret"
S3_BUCKET_NAME = "student-grievances"

# Google Drive API
GOOGLE_DRIVE_CREDENTIALS = "path/to/credentials.json"

# OpenAI (for AI features)
OPENAI_API_KEY = "your-openai-key"
```

### Frontend Configuration
API base URL is configured in `/fe/client/src/lib/apiClient.ts`:
```typescript
baseURL: 'http://localhost:5000'
```

Update this if your backend runs on a different port.

## 📊 Data Flow

### Submitting a Grievance
```
User fills form → Frontend validates → 
POST /grievances with:
  - title, description
  - issue_tags, cluster, cluster_tags
  - documents (base64 encoded) →
Backend creates grievance → 
Returns grievance object →
Frontend redirects to dashboard
```

### Admin Updates
```
Admin changes status dropdown → 
PATCH /admin/grievances/<id> with new status →
Backend updates MongoDB →
Frontend updates local state →
Toast notification shown
```

### Chat Messages
```
User/Admin types message →
POST /grievances/<id>/chat or POST /admin/grievances/<id>/chat →
Backend appends to chat array →
Returns updated conversations →
Frontend updates chat UI →
Auto-scrolls to latest message
```

### AI Suggestions
```
Grievance submitted →
Frontend calls POST /ai/suggestions/preview →
Backend:
  - Searches knowledge base
  - Finds similar grievances
  - Calculates confidence scores →
Returns suggestions with:
  - KB context
  - Related grievances
  - Confidence scores →
Frontend displays in accordions
```

## 🎨 UI Components Updated

### Common Patterns
All components now follow these patterns:

1. **Loading States**
```tsx
{isLoading ? (
  <Loader2 className="animate-spin" />
) : (
  // Content
)}
```

2. **Error Handling**
```tsx
try {
  const response = await apiFunction();
  // Success
  toast({ title: 'Success', description: '...' });
} catch (error) {
  toast({ 
    title: 'Error', 
    description: '...', 
    variant: 'destructive' 
  });
}
```

3. **Empty States**
```tsx
{items.length === 0 ? (
  <p>No data available</p>
) : (
  // Data display
)}
```

## 🐛 Troubleshooting

### API Connection Issues
- Check backend is running on port 5000
- Verify CORS is enabled in backend
- Check network tab in browser DevTools

### Data Not Showing
- Open browser console for errors
- Check API responses in Network tab
- Verify backend MongoDB connection
- Check authentication tokens

### File Upload Issues
- Verify file size limits (max 5MB)
- Check base64 encoding in browser
- Verify S3 credentials in backend

### AI Features Not Working
- Check OpenAI API key is configured
- Verify knowledge base has documents
- Check MongoDB collections exist

## 📝 TypeScript Types

All API responses are properly typed. Key interfaces:

```typescript
interface Grievance {
  id: number;
  student_id: number;
  title: string;
  description?: string;
  status: 'NEW' | 'IN_PROGRESS' | 'SOLVED' | 'REJECTED' | 'DROPPED';
  assigned_to: string;
  issue_tags: string[];
  cluster_tags: string[];
  cluster: string;
  s3_doc_urls: string[];
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  role: 'student' | 'admin';
  message: string;
  timestamp: string;
}
```

## 🔐 Authentication

The current implementation assumes authentication is handled. For production:

1. Add login API integration
2. Store JWT tokens
3. Add token to API requests
4. Handle token refresh
5. Implement logout

## 🚢 Deployment Checklist

Before deploying:

- [ ] Update API baseURL for production
- [ ] Configure environment variables
- [ ] Set up proper CORS policies
- [ ] Enable HTTPS
- [ ] Configure file upload limits
- [ ] Set up monitoring
- [ ] Test all API endpoints
- [ ] Verify error handling
- [ ] Check mobile responsiveness
- [ ] Run production build: `npm run build`

## 📚 Additional Resources

- Backend API Docs: `/be/API.md`
- Component Library: shadcn/ui
- State Management: Recoil
- Charts: Recharts
- HTTP Client: Axios

## 🎯 Next Steps

1. **Testing**: Thoroughly test all user journeys
2. **Error Boundaries**: Add React error boundaries
3. **Performance**: Implement pagination for large datasets
4. **Caching**: Add React Query for better caching
5. **Websockets**: Consider real-time updates for chat
6. **Notifications**: Add push notifications
7. **Analytics**: Integrate analytics tracking
8. **Documentation**: Document component props

## 👥 Support

If you encounter issues:
1. Check this guide
2. Review API.md in backend
3. Check browser console
4. Review network requests
5. Verify backend logs

---

**All components are now fully integrated with the backend APIs!** 🎉
