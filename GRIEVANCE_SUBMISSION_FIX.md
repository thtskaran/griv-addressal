# Grievance Submission Flow Fix

## Problem
The frontend grievance submission form was getting stuck with a processing spinner and never navigating to the preview page to show AI suggestions and KB chunks.

## Root Causes Identified

### 1. Navigation State Handling Issue
**Problem**: The code was using `wouter` router's `setLocation()` with a state parameter:
```tsx
setLocation('/user/preview', { state: { previewData: response } })
```

However, `wouter` doesn't handle state passing the same way as React Router. The preview page was trying to read from `window.history.state` but couldn't find the data.

**Solution**: Changed to use `sessionStorage` exclusively for passing preview data between pages.

### 2. Missing Description Validation
**Problem**: The backend requires `description` as a mandatory field and returns a 400 error if it's missing:
```python
if not description:
    return error_response("Description is required", 400)
```

But the frontend marked description as "Optional" and allowed users to submit without it, causing silent failures.

**Solution**: Made description a required field on the frontend form.

## Changes Made

### File: `/fe/client/src/pages/user/SubmitGrievance.tsx`

#### Change 1: Fixed Navigation
**Before:**
```tsx
setLocation('/user/preview', { state: { previewData: response } });
```

**After:**
```tsx
// Store preview data in sessionStorage for the preview page
if (typeof window !== 'undefined') {
  try {
    sessionStorage.setItem('grievancePreview', JSON.stringify(response));
    console.log('Stored preview data in sessionStorage');
  } catch (err) {
    console.warn('Failed to persist grievance preview payload:', err);
  }
}

setIsSubmitting(false);
// Navigate to preview page - data will be loaded from sessionStorage
console.log('Navigating to preview page');
setLocation('/user/preview');
```

#### Change 2: Made Description Required
**Before:**
```tsx
<Label htmlFor="description">Description (Optional)</Label>
<Textarea
  id="description"
  // ... no required attribute
/>
```

**After:**
```tsx
<Label htmlFor="description">Description *</Label>
<Textarea
  id="description"
  required
  // ...
/>
```

#### Change 3: Ensure Description is Sent
**Before:**
```tsx
description: formData.description || undefined,
```

**After:**
```tsx
description: formData.description, // Required field
```

#### Change 4: Added Debug Logging
Added console.log statements to help debug the flow:
- When submitting grievance
- When receiving response
- When storing in sessionStorage
- When navigating to preview

### File: `/fe/client/src/pages/user/GrievancePreview.tsx`

#### Change 1: Simplified State Loading
**Before:**
```tsx
const [previewData, setPreviewData] = useState<PreviewData | null>(() => {
  if (typeof window === 'undefined') {
    return null;
  }
  const historyState = window.history.state as { previewData?: PreviewData } | null;
  if (historyState?.previewData) {
    return historyState.previewData;
  }
  return readCachedPreview();
});

useEffect(() => {
  if (typeof window === 'undefined') {
    return;
  }
  const historyState = window.history.state as { previewData?: PreviewData } | null;
  if (historyState?.previewData) {
    setPreviewData(historyState.previewData);
    persistPreviewCache(historyState.previewData);
    return;
  }
  const cached = readCachedPreview();
  if (cached) {
    setPreviewData(cached);
    return;
  }
  setPreviewData(null);
}, [pathname]);
```

**After:**
```tsx
const [previewData, setPreviewData] = useState<PreviewData | null>(() => {
  // On initial render, try to load from sessionStorage
  return readCachedPreview();
});

useEffect(() => {
  // Load preview data from sessionStorage on mount
  console.log('GrievancePreview: Loading preview data from sessionStorage');
  const cached = readCachedPreview();
  console.log('GrievancePreview: Cached data:', cached);
  if (cached) {
    setPreviewData(cached);
  } else {
    // If no cached data, redirect to submit form
    console.log('GrievancePreview: No cached data, redirecting to submit form');
    setLocation('/user/submit-grievance');
  }
}, [setLocation]);
```

#### Change 2: Fixed TypeScript Error in Final Submission
**Before:**
```tsx
const finalData = {
  ...previewData.grievance,
  issue_tags: previewData.ai_generated_tags,
  documents: previewData.documents,
  preview: false,
};
```

**After:**
```tsx
const finalData = {
  title: previewData.grievance.title,
  description: previewData.grievance.description,
  issue_tags: previewData.ai_generated_tags, // Use AI-generated tags
  cluster: previewData.grievance.cluster,
  cluster_tags: previewData.grievance.cluster_tags,
  documents: previewData.documents,
  status: previewData.grievance.status as 'NEW' | 'IN_PROGRESS' | 'SOLVED' | 'REJECTED' | 'DROPPED',
  assigned_to: previewData.grievance.assigned_to,
  preview: false, // Disable preview mode for final submission
};
```

## Testing Steps

1. **Start Backend**:
   ```bash
   cd be
   source myenv/bin/activate
   python app.py
   ```

2. **Start Frontend**:
   ```bash
   cd fe
   pnpm dev
   ```

3. **Test Submission Flow**:
   - Navigate to `/user/submit-grievance`
   - Fill in Title: "Test Grievance"
   - Fill in Description: "This is a test description" (now required)
   - Click "Submit Grievance"
   - Should see processing toast message
   - Should navigate to `/user/preview` page
   - Should see:
     - Grievance title and description
     - AI-generated tags
     - KB suggestions (if available)
     - "Back to Edit" and "Confirm & Submit" buttons

4. **Test Preview Actions**:
   - Click "Back to Edit" - should return to form with data intact
   - Click "Confirm & Submit" - should submit final grievance and show thank you page
   - After 2 seconds, should redirect to dashboard

## Expected Behavior

### Submit Form → Preview Flow
1. User fills required fields (title and description)
2. User clicks "Submit Grievance"
3. Button shows loading spinner with "Submitting..." text
4. Backend generates AI tags and KB suggestions in preview mode
5. Response is stored in sessionStorage
6. User is navigated to preview page
7. Preview page loads data from sessionStorage
8. User sees AI-generated tags and KB suggestions

### Preview → Final Submission Flow
1. User reviews AI suggestions on preview page
2. User clicks "Confirm & Submit"
3. Backend saves grievance to database with AI-generated tags
4. User sees "Thank You" message
5. After 2 seconds, redirects to dashboard
6. sessionStorage is cleared

## Debug Information

If issues persist, check browser console for:
- "Submitting grievance in preview mode:" - shows request data
- "Received preview response:" - shows backend response
- "Stored preview data in sessionStorage" - confirms storage
- "Navigating to preview page" - confirms navigation attempt
- "GrievancePreview: Loading preview data from sessionStorage" - preview page loading
- "GrievancePreview: Cached data:" - shows loaded data

Check backend logs for:
- "create_grievance: received submission preview=True" - confirms preview mode
- "create_grievance: AI tag generation completed" - shows generated tags
- "create_grievance: preview completed" - shows number of KB suggestions

## Potential Future Improvements

1. Add better error handling with specific error messages
2. Add a retry mechanism if AI tag generation fails
3. Add loading states for individual sections (tags, KB suggestions)
4. Allow users to edit AI-generated tags before final submission
5. Add validation for minimum description length
6. Show preview of uploaded documents on preview page
7. Add ability to mark issue as resolved if KB suggestion helps
