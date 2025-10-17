# AI Suggestions Flow - Before and After

## Before (Broken)

```
User submits grievance with preview=true
         ↓
Backend: POST /grievances?preview=true
         ↓
get_kb_suggestions_for_grievance()
         ↓
Vector search in MongoDB
         ↓
Return raw chunks (often "Unknown Document")
         ↓
Frontend: Display incomplete KB data
         ❌ No AI analysis
         ❌ Generic document names
```

## After (Fixed)

```
User submits grievance with preview=true
         ↓
Backend: POST /grievances?preview=true
         ↓
Step 1: get_kb_suggestions_for_grievance()
         ↓
Vector search in MongoDB (top 5 chunks)
         ↓
Step 2: generate_ai_suggestions()
         ↓
OpenAI analyzes grievance + KB context
         ↓
Generate AI summary
         ↓
Return enriched response:
  - ai_generated_tags
  - kb_suggestions (with real doc names)
  - ai_suggestions
  - ai_summary ✅
  - related_grievances
         ↓
Frontend: Display comprehensive preview
         ✅ AI Analysis section
         ✅ Real KB document names
         ✅ Similarity scores
         ✅ AI-powered insights
```

## Data Flow

### Request
```json
POST /grievances
{
  "title": "Library AC not working",
  "description": "The AC has been off for a week...",
  "preview": true
}
```

### Response (Before)
```json
{
  "preview": true,
  "grievance": {...},
  "ai_generated_tags": ["library", "ac_issue"],
  "kb_suggestions": [
    {
      "doc_name": "Unknown Document",  ❌
      "excerpt": "...",
      "similarity_score": 0.0,
      "chunk_id": ""
    }
  ]
}
```

### Response (After)
```json
{
  "preview": true,
  "grievance": {...},
  "ai_generated_tags": ["library", "ac_issue"],
  "kb_suggestions": [
    {
      "doc_name": "Facilities_Maintenance_Guide.pdf",  ✅
      "excerpt": "For HVAC issues in library...",
      "similarity_score": 0.87,
      "chunk_id": "abc123"
    }
  ],
  "ai_suggestions": [
    {
      "confidence": 0.72,
      "source": {...},
      "summary": "Based on the grievance and knowledge base..."  ✅
    }
  ],
  "ai_summary": "This appears to be an infrastructure issue...",  ✅
  "related_grievances": [...]
}
```

## Key Functions

### Backend (`be/utils.py`)

1. **get_kb_suggestions_for_grievance(description, top_k=5)**
   - Embeds the description text
   - Searches MongoDB for similar chunks
   - Returns raw KB chunks with metadata

2. **generate_ai_suggestions(grievance, related_grievances)**
   - Uses OpenAIClientFacade
   - Calls summarize_grievances()
   - Returns AI-powered analysis with suggestions

### Backend (`be/app.py`)

**create_grievance() - Preview Mode**
```python
# Get KB chunks
kb_chunks = get_kb_suggestions_for_grievance(description, top_k=5)

# Generate AI analysis
temp_grievance = {
    "id": 0,
    "title": title,
    "description": description,
    ...
}
ai_suggestions = generate_ai_suggestions(temp_grievance, [])

# Return combined response
return jsonify({
    "kb_suggestions": kb_chunks,
    "ai_summary": ai_suggestions["suggestions"][0]["summary"],
    ...
})
```

## Benefits

1. **Better User Experience**
   - See AI analysis before submitting
   - Understand how grievance will be categorized
   - View relevant KB documentation

2. **Reduced Duplicate Submissions**
   - Users can see if similar issues exist
   - AI suggests relevant solutions
   - Self-service resolution possible

3. **Improved Accuracy**
   - Real document names from KB
   - Similarity scores for relevance
   - AI-powered categorization

4. **Transparency**
   - Users see AI reasoning
   - KB sources are visible
   - Tags are explained
