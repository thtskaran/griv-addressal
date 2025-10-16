# Design Guidelines: Role-Based Grievance Management System

## Design Approach
**Reference-Based Approach** drawing inspiration from modern dashboard applications with a focus on **Glassmorphism + Resilient Design** aesthetic. The system emphasizes clarity, accessibility, and smooth user interactions across two distinct user roles.

## Core Design Elements

### A. Color Palette

**Primary Colors:**
- Primary: `#3B82F6` (blue-500) - Main actions, active states, primary buttons
- Secondary: `#1E3A8A` (blue-900) - Headers, important text, dark accents
- Accent: `#E0F2FE` (blue-100) - Subtle backgrounds, hover states, highlights

**Glassmorphism Effects:**
- Backdrop blur with `backdrop-blur-md` to `backdrop-blur-lg`
- Soft gradients using primary color family
- Subtle shadows with `shadow-lg` and `shadow-2xl`
- Semi-transparent backgrounds (`bg-white/10` to `bg-white/30`)

**Dark Mode:** Maintain consistent implementation across all components including form inputs and text fields

### B. Typography

**Primary Font Family:** Manrope (Google Fonts via CDN)

**Type Scale:**
- Hero Headlines: text-4xl to text-6xl, font-bold
- Section Headers: text-2xl to text-3xl, font-semibold
- Card Titles: text-lg to text-xl, font-medium
- Body Text: text-base, font-normal
- Captions/Metadata: text-sm, font-normal
- Badges/Labels: text-xs, font-medium

### C. Layout System

**Spacing Units:** Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24 for consistent rhythm
- Compact spacing: p-2, m-4, gap-2
- Standard spacing: p-4, p-6, gap-4
- Generous spacing: p-8, p-12, gap-8
- Section spacing: py-16, py-20, py-24

**Container Widths:**
- Main content: max-w-7xl mx-auto
- Cards/Forms: max-w-2xl to max-w-4xl
- Modals: max-w-lg to max-w-2xl

**Grid Systems:**
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Table layouts: Full-width responsive tables
- Sidebar + Content: Flex layout with fixed sidebar (w-64) and flex-1 content area

### D. Component Library

**Navigation & Layout:**
- **Header:** Fixed top, glassmorphism effect, logo left, profile/notification icons right, backdrop-blur
- **Sidebar:** Smooth hover gradients, active state highlight with primary color, rounded-2xl corners
- **Profile Dropdown:** Card-style with avatar, user info, logout option

**Core UI Elements:**
- **Buttons:** Rounded-xl, multiple variants (primary solid blue-500, outline with blur on images, ghost for secondary actions)
- **Cards:** Rounded-2xl, glassmorphism effects, hover:shadow-2xl transitions
- **Tables:** Striped rows, hover states, sticky headers, responsive horizontal scroll
- **Badges:** Rounded-full, color-coded by status (blue=pending, green=resolved, gray=rejected)

**Form Components:**
- **Input Fields:** Rounded-lg, border focus:ring-2 ring-blue-500
- **Select Dropdowns:** Custom styled with chevron icons
- **Textarea:** Min-height, resize-vertical
- **File Upload:** Drag-drop zone with preview

**Modals & Overlays:**
- **Dialog/Modal:** Centered, max-w-2xl, backdrop-blur background, slide-up animation
- **Drawers:** Right-side slide-in for chatbot and admin actions
- **Tooltips:** Dark background, white text, arrow pointer

**Data Display:**
- **Grievance Cards:** Title, category badge, status indicator, timestamp, action buttons
- **Notification Cards:** Icon left, message center, timestamp right, unread dot indicator
- **Rating Component:** 1-5 star display using Lucide star icons (filled/outline)
- **Progress Bars:** Rounded-full, animated fill with primary color

**Feedback & States:**
- **Loading States:** Skeleton components with pulse animation
- **Empty States:** Centered illustrations with descriptive text
- **Success/Error Messages:** Toast notifications with icons
- **Anonymous Mode Indicator:** Badge in header ("Anonymous Mode Active")

### E. Interactive Elements

**Floating Chatbot (Admin Only):**
- Bottom-right fixed position (bottom-6 right-6)
- Circular icon button with primary blue background
- Click opens slide-in panel (w-96, h-[600px])
- Chat UI with header, scrollable messages, input footer
- Smooth transitions using Framer Motion

**Transitions & Animations (Framer Motion):**
- Page transitions: Fade + slide (duration: 0.3s)
- Card hover: Scale to 1.02, lift shadow
- Modal entrance: Slide-up from bottom, fade-in backdrop
- Notifications: Slide-in from right
- Loading states: Pulse animation on skeletons
- Button interactions: Scale on click (whileTap={{ scale: 0.95 }})

**Minimal Animation Philosophy:** Use sparingly for micro-interactions and state changes only. Avoid distracting continuous animations.

## Role-Specific Designs

### User Dashboard
- Grievance table with search/filter bar at top
- Anonymous mode toggle in top-right (Switch component with badge indicator)
- View modal shows full grievance details with admin reply section
- Rating component appears for resolved grievances (star selection with submit button)

### Admin Dashboard  
- Comprehensive grievance table with inline actions (status change, assign, notes, reply)
- Reply modal with textarea and send button
- Feedback summary cards showing average rating, total resolved, pending count
- Filter options for rating ranges and status

### Admin Analytics
- Recharts visualizations with glassmorphism card containers
- Pie chart: Grievances by category (responsive sizing)
- Bar chart: Average resolution time metrics
- Color scheme matches primary palette

## Icons & Assets

**Icon Library:** Lucide React (via CDN)
- Navigation: Home, Users, FileText, BarChart, Bell, Settings
- Actions: Plus, Edit, Trash, Eye, Send, Download
- Status: Check, X, Clock, AlertTriangle
- Social: Star (for ratings), MessageSquare (chat)

**Images:** Not applicable for this dashboard-focused application. Use icon illustrations for empty states.

## Responsive Behavior

**Breakpoints:**
- Mobile: Base styles, stacked layouts, bottom navigation
- Tablet (md:): 2-column grids, visible sidebar with toggle
- Desktop (lg:+): 3-column grids, persistent sidebar, expanded cards

**Mobile Adaptations:**
- Hamburger menu for navigation
- Bottom sheet modals instead of centered dialogs
- Simplified table views with expandable rows
- Touch-friendly button sizes (min-h-12)

## Accessibility Standards

- Consistent dark mode across all inputs and text fields
- Keyboard navigation support for all interactive elements
- ARIA labels for icon-only buttons
- Focus visible states with ring-2 ring-offset-2
- Color contrast ratios meet WCAG AA standards
- Screen reader friendly status announcements