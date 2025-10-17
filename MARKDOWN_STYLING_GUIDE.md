# React Markdown Custom Styling Reference

## Implementation in GrievancePreview.tsx

The AI suggestion uses custom-styled ReactMarkdown components for consistent, accessible formatting.

## Component Mapping

```tsx
<ReactMarkdown
  components={{
    // Paragraphs - with proper spacing
    p: ({ children }) => (
      <p className="text-sm text-foreground leading-relaxed mb-2 last:mb-0">
        {children}
      </p>
    ),
    
    // Bold text - semibold weight
    strong: ({ children }) => (
      <strong className="font-semibold text-foreground">
        {children}
      </strong>
    ),
    
    // Italic text
    em: ({ children }) => (
      <em className="italic">
        {children}
      </em>
    ),
    
    // Unordered lists - disc bullets
    ul: ({ children }) => (
      <ul className="list-disc list-inside text-sm space-y-1 my-2">
        {children}
      </ul>
    ),
    
    // Ordered lists - decimal numbers
    ol: ({ children }) => (
      <ol className="list-decimal list-inside text-sm space-y-1 my-2">
        {children}
      </ol>
    ),
    
    // List items
    li: ({ children }) => (
      <li className="text-foreground">
        {children}
      </li>
    ),
  }}
>
  {previewData.ai_summary}
</ReactMarkdown>
```

## Markdown Examples & Rendered Output

### 1. Basic Text with Bold
**Markdown:**
```markdown
Contact the **Facilities Department** for immediate assistance.
```

**Renders as:**
Contact the <strong>Facilities Department</strong> for immediate assistance.

### 2. Text with Italic
**Markdown:**
```markdown
This typically takes *2-3 business days* to resolve.
```

**Renders as:**
This typically takes <em>2-3 business days</em> to resolve.

### 3. Bulleted List
**Markdown:**
```markdown
Follow these steps:
- Submit the form online
- Wait for confirmation email
- Track status on dashboard
```

**Renders as:**
<ul>
  <li>Submit the form online</li>
  <li>Wait for confirmation email</li>
  <li>Track status on dashboard</li>
</ul>

### 4. Numbered List
**Markdown:**
```markdown
Process:
1. File the complaint
2. Get reference number
3. Check status after 48 hours
```

**Renders as:**
<ol>
  <li>File the complaint</li>
  <li>Get reference number</li>
  <li>Check status after 48 hours</li>
</ol>

### 5. Combined Formatting
**Markdown:**
```markdown
Submit to **Library Desk** immediately. Expected timeline:
- Initial review: *24 hours*
- Resolution: *2-3 days*

Use **Computer Lab** as alternative.
```

**Renders as:**
Submit to <strong>Library Desk</strong> immediately. Expected timeline:
<ul>
  <li>Initial review: <em>24 hours</em></li>
  <li>Resolution: <em>2-3 days</em></li>
</ul>
Use <strong>Computer Lab</strong> as alternative.

## Styling Classes Explained

### Tailwind Classes Used

| Class | Purpose | Effect |
|-------|---------|--------|
| `text-sm` | Font size | 14px (0.875rem) |
| `text-foreground` | Color | Adapts to theme (dark/light) |
| `leading-relaxed` | Line height | 1.625 (better readability) |
| `mb-2` | Margin bottom | 0.5rem spacing between paragraphs |
| `last:mb-0` | Last element | Removes bottom margin on last paragraph |
| `font-semibold` | Bold weight | 600 font weight |
| `italic` | Italic style | Slanted text |
| `list-disc` | List style | Bullet points (•) |
| `list-decimal` | List style | Numbers (1, 2, 3) |
| `list-inside` | List position | Bullets/numbers inside text flow |
| `space-y-1` | Vertical spacing | 0.25rem between list items |
| `my-2` | Vertical margin | 0.5rem top and bottom |

## Container Styling

The markdown is wrapped in a prose container:

```tsx
<div className="prose prose-sm max-w-none dark:prose-invert">
  <ReactMarkdown components={{...}}>
    {content}
  </ReactMarkdown>
</div>
```

| Class | Purpose |
|-------|---------|
| `prose` | Typography plugin styles |
| `prose-sm` | Small size variant |
| `max-w-none` | Remove max-width restriction |
| `dark:prose-invert` | Invert colors in dark mode |

## Outer Card Styling

```tsx
<div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
  {/* ReactMarkdown here */}
</div>
```

| Class | Purpose |
|-------|---------|
| `p-4` | 1rem padding all sides |
| `bg-primary/5` | 5% opacity primary color background |
| `rounded-lg` | 0.5rem border radius |
| `border` | 1px border |
| `border-primary/20` | 20% opacity primary color border |

## Best Practices for AI Prompts

To ensure the AI generates markdown that renders well:

### ✅ Good Prompt Guidance
```
Use markdown formatting:
- Use **bold** for important terms (departments, actions)
- Use *italic* for timelines and durations
- Keep lists short (2-4 items max)
- Use bullet points for steps
```

### ❌ Avoid
```
- Headers (# ## ###) - not styled
- Links [text](url) - not interactive in preview
- Code blocks ``` - not needed for suggestions
- Tables - too complex for 30-40 words
- Blockquotes > - not styled
```

### Recommended Markdown for 30-40 Word Suggestions

**Template:**
```markdown
[Action] the **[Department/Location]**. [Reasoning]. [Timeline/Alternative].
```

**Example:**
```markdown
Contact the **Library Help Desk** immediately. According to policy, AC repairs are prioritized and completed within *2-3 business days*. Use the **Computer Lab** meanwhile.
```

## Accessibility Considerations

1. **Color Contrast**: `text-foreground` ensures readable contrast in both themes
2. **Font Size**: `text-sm` (14px) is readable but compact
3. **Line Height**: `leading-relaxed` (1.625) improves readability
4. **Semantic HTML**: Lists use proper `<ul>`, `<ol>`, `<li>` tags
5. **Spacing**: Consistent spacing between elements

## Dark Mode Support

The styling automatically adapts to dark mode:

```tsx
className="text-foreground"  // Adjusts based on theme
dark:prose-invert           // Inverts prose colors in dark mode
```

## Performance Notes

- ReactMarkdown is lightweight (~80KB)
- Renders on client side (no SSR needed)
- Custom components prevent unnecessary re-renders
- Memoization not needed for short content (30-40 words)

## Testing Markdown Rendering

### Test Cases

1. **Plain text**: "Your grievance will be reviewed."
2. **With bold**: "Contact **Facilities** immediately."
3. **With italic**: "Expected timeline: *24-48 hours*."
4. **With list**: "Steps:\n- File complaint\n- Wait for email"
5. **Combined**: "**Submit** to Library. Timeline:\n- Review: *24h*\n- Resolution: *3 days*"

All test cases should render cleanly within the card container.
