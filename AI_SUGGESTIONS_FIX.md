# AI Suggestions Fix for Grievance Preview

## Problem
When previewing grievances in the user flow, the AI-powered suggestions were showing "Unknown Document" instead of relevant knowledge base documents and AI-generated summaries. The preview was using a simplified KB search that didn't include OpenAI analysis.

## Root Cause
The backend had two separate flows for AI suggestions:
1. **Preview mode during submission** (`POST /grievances` with `preview=true`): Used `get_kb_suggestions_for_grievance()` which only returned raw KB chunks without AI summarization
2. **AI Suggestions endpoint** (`POST /ai/suggestions/preview`): Used `generate_ai_suggestions()` which properly called OpenAI for analysis

The grievance preview page was using the first flow, which lacked the AI-powered analysis.

## Solution

### Backend Changes (`be/app.py`)
Enhanced the preview mode in the `create_grievance` endpoint to:
1. Retrieve relevant KB chunks using `get_kb_suggestions_for_grievance()`
2. Generate AI-powered suggestions using `generate_ai_suggestions()`
3. Return both the raw KB chunks AND the AI summary in the response

**New response structure:**
```json
{
  "preview": true,
  "grievance": {...},
  "ai_generated_tags": ["tag1", "tag2"],
  "kb_suggestions": [
    {
      "doc_name": "Actual Document Name",
      "excerpt": "Relevant excerpt...",
      "similarity_score": 0.85,
      "chunk_id": "abc123"
    }
  ],
  "ai_suggestions": [...],
  "ai_summary": "AI-generated analysis of the grievance",
  "related_grievances": [...]
}
```

### Frontend Changes (`fe/client/src/pages/user/GrievancePreview.tsx`)
1. **Updated TypeScript interfaces** to include:
   - `ai_suggestions?: AISuggestion[]`
   - `ai_summary?: string`
   - `related_grievances?: any[]`

2. **Enhanced UI** to display:
   - **AI Analysis section**: Shows the AI-generated summary prominently
   - **Relevant Knowledge Base Documents**: Lists actual KB documents with similarity scores
   - **Better fallback**: Shows appropriate message when no KB content is found

## Key Improvements
1. ✅ AI-powered analysis now runs during preview mode
2. ✅ Real document names from knowledge base instead of "Unknown Document"
3. ✅ AI summary provides context and suggestions
4. ✅ Proper integration with OpenAI for intelligent analysis
5. ✅ Better user experience with relevant information upfront

## How It Works
1. Student submits grievance with `preview=true`
2. Backend generates AI tags from title/description
3. Backend finds top 5 relevant KB chunks using vector similarity
4. Backend calls OpenAI's `generate_ai_suggestions()` to analyze the grievance
5. Response includes both KB chunks and AI summary
6. Frontend displays AI analysis prominently, followed by KB documents
7. Student can review and confirm submission

## Testing
To test the fix:
1. Navigate to `/user/submit-grievance`
2. Fill in a grievance (e.g., "Library AC not working")
3. Click "Submit Grievance"
4. Preview page should show:
   - AI-Generated Tags
   - AI Analysis section with OpenAI summary
   - Relevant Knowledge Base Documents (if available)
5. Verify document names are real (not "Unknown Document")
