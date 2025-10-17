# Quick Start: AI-Powered Submission Flow

## What Changed?

### Before
1. User submits form → Saved to DB immediately → Redirect to dashboard

### After
1. User submits form → AI generates tags + KB suggestions (preview mode)
2. User reviews preview → Confirms → Saved to DB → Dashboard

## Key Files Modified

### Backend (`be/`)
1. **`utils.py`**:
   - Added `generate_tags_with_ai()` - Generate tags with OpenAI
   - Added `get_kb_suggestions_for_grievance()` - Find similar KB chunks
   - Added `MongoRepository.search_similar_chunks()` - Cosine similarity search

2. **`app.py`**:
   - Modified `POST /grievances` endpoint
   - Added `preview` parameter (boolean)
   - preview=true → Returns AI data without saving
   - preview=false → Saves to database

### Frontend (`fe/client/src/pages/user/`)
1. **`SubmitGrievance.tsx`**:
   - Modified `handleSubmit()` to submit with `preview: true`
   - Navigate to `/user/preview` with response data

2. **`GrievancePreview.tsx`**:
   - Complete rewrite
   - Display AI-generated tags
   - Display KB suggestions with similarity scores
   - Two buttons: "Back to Edit" and "Confirm & Submit"

## API Changes

### POST /grievances

#### Request (Preview Mode)
```json
{
  "title": "Library AC Not Working",
  "description": "The AC has been broken for a week",
  "preview": true
}
```

#### Response (Preview Mode)
```json
{
  "preview": true,
  "grievance": { ... },
  "ai_generated_tags": ["library", "ac_issue", "urgent"],
  "kb_suggestions": [
    {
      "doc_name": "AC Guide.pdf",
      "excerpt": "For AC issues...",
      "similarity_score": 0.89,
      "chunk_id": "abc123"
    }
  ],
  "documents": []
}
```

#### Request (Final Submission)
```json
{
  "title": "Library AC Not Working",
  "description": "The AC has been broken for a week",
  "issue_tags": ["library", "ac_issue"],
  "preview": false
}
```

#### Response (Final Submission)
```json
{
  "grievance": {
    "id": 42,
    "title": "Library AC Not Working",
    "status": "NEW",
    "tags": ["library", "ac_issue"],
    ...
  }
}
```

## Testing Locally

### 1. Start Backend
```bash
cd be
source myenv/bin/activate
python app.py
```

### 2. Start Frontend
```bash
cd fe
pnpm install
pnpm dev
```

### 3. Test Flow
1. Go to http://localhost:5173/user/submit
2. Fill form:
   - Title: "Library AC Not Working"
   - Description: "The air conditioning in the library has been broken for a week"
3. Click "Submit Grievance"
4. Should see preview page with:
   - AI-generated tags (e.g., "library", "ac_issue", "maintenance")
   - KB suggestions (if any documents in knowledge base)
5. Click "Confirm & Submit"
6. Should redirect to dashboard with new grievance

## Environment Setup

### Required Variables (.env)
```bash
# OpenAI
OPENAI_API_KEY=sk-proj-...
OPENAI_EMBEDDING_MODEL=text-embedding-ada-002
OPENAI_CHAT_MODEL=gpt-3.5-turbo

# MongoDB
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=grievances_db
MONGO_KB_COLLECTION=kb_chunks
```

## Troubleshooting

### Issue: "OpenAI client not configured"
**Solution**: Set `OPENAI_API_KEY` in environment variables

### Issue: "No KB suggestions found"
**Solution**: 
1. Register a Google Drive folder (admin panel → Google Drive)
2. Upload documents to that folder
3. Wait for sync to complete

### Issue: Preview page shows blank
**Solution**: Check browser console for errors. Make sure location state is passed correctly.

### Issue: Tags are always ["general", "unclassified"]
**Solution**: OpenAI API key is missing or invalid. Check backend logs.

## Code Examples

### Generate Tags Manually (Python)
```python
from utils import generate_tags_with_ai

title = "Library AC Not Working"
description = "The air conditioning system has been broken"
tags = generate_tags_with_ai(title, description)
print(tags)  # ["library", "ac_issue", "maintenance"]
```

### Get KB Suggestions Manually (Python)
```python
from utils import get_kb_suggestions_for_grievance

description = "The air conditioning system has been broken"
suggestions = get_kb_suggestions_for_grievance(description, top_k=3)
for s in suggestions:
    print(f"{s['doc_name']}: {s['similarity_score']}")
```

### Call API from JavaScript
```typescript
import { submitGrievance } from '@/lib/grievancesApi';

// Preview mode
const previewData = await submitGrievance({
  title: "Library AC Not Working",
  description: "The AC has been broken",
  preview: true
});

console.log(previewData.ai_generated_tags);
console.log(previewData.kb_suggestions);

// Final submission
const finalData = await submitGrievance({
  ...previewData.grievance,
  issue_tags: previewData.ai_generated_tags,
  preview: false
});

console.log(finalData.grievance.id);
```

## Dependencies

### Backend
- `openai` - OpenAI API client
- `pymongo` - MongoDB driver
- `numpy` (optional) - For faster vector operations

### Frontend
- `wouter` - Routing (for location state)
- `framer-motion` - Animations
- `lucide-react` - Icons (Sparkles, Bot, etc.)

## Next Steps

1. **Populate Knowledge Base**:
   - Go to admin panel → Google Drive
   - Register a folder with help documents
   - Upload PDFs, docs about common issues
   - System will automatically chunk and embed them

2. **Test with Real Data**:
   - Submit various types of grievances
   - Check if tags are relevant
   - Verify KB suggestions are helpful

3. **Monitor Performance**:
   - Check OpenAI API usage (tokens)
   - Monitor response times
   - Track user behavior (do they edit AI tags?)

4. **Iterate**:
   - Adjust prompts in `generate_tags_with_ai()` if needed
   - Fine-tune top_k parameter for suggestions
   - Add more error handling if needed

## Support

- **Full Documentation**: See `AI_SUBMISSION_FLOW.md`
- **API Documentation**: See `be/API.md`
- **Architecture**: See `be/architecture.md`
