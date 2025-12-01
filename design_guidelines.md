# Design Guidelines: Christmas Wish List Application

## Design Approach
**System-Based with Festive Touches**: Drawing from Material Design and Notion's clean aesthetic, enhanced with subtle seasonal elements. This utility-focused application prioritizes clarity, efficiency, and role-based navigation while maintaining family-friendly warmth.

## Typography
- **Primary Font**: 'Inter' or 'DM Sans' (Google Fonts) - clean, modern sans-serif
- **Heading Hierarchy**: 
  - H1: text-4xl font-bold (page titles)
  - H2: text-2xl font-semibold (section headers)
  - H3: text-lg font-medium (card titles)
  - Body: text-base (forms, lists, content)
  - Small: text-sm (labels, meta information)

## Layout System
**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, and 12 consistently
- Component padding: p-4 to p-6
- Section spacing: py-8 to py-12
- Card gaps: gap-4 to gap-6
- Container max-width: max-w-7xl with px-4 margins

## Core Components

### Authentication Pages
- Centered card layout (max-w-md mx-auto)
- Elevated card with subtle shadow
- Role-specific header with icon (🎄 User / 👪 Parent / 🛠️ Developer)
- Single-column form with clear labels above inputs
- Large, prominent login button
- Minimal background with subtle festive pattern or gradient

### Navigation
**Role-Based Headers**:
- **User Space**: Warm, welcoming navbar with "My Christmas List" branding
- **Parent Space**: Organized, gallery-style navigation with "Family Lists" focus
- **Developer Space**: Technical, dashboard-style with sidebar navigation

Common elements: Logo/icon left, user info/logout right, role indicator badge

### User Space - Wish List Builder
**Layout**: Single-column form with card-based item display
- Add Item Form: Stacked inputs in elevated card
  - Text inputs: Full-width with border-b-2 focus states
  - Image upload: Drag-drop zone or URL input toggle
  - Quantity: Compact number input with +/- buttons
- Item Cards Grid: 2-3 columns (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
  - Each card: Image thumbnail top, title, quantity badge, edit/delete icons
  - Hover state: Subtle lift with shadow increase
- Send Button: Large, prominent CTA at bottom (sticky or fixed position)

### Parent Space - List Viewer
**Layout**: Dashboard with list cards
- List Grid: 2-3 columns of list preview cards
  - Card shows: Username, date, item count, preview thumbnails
  - Click to expand full list in modal or dedicated page
- Detail View: 
  - Header with list metadata
  - Items displayed in clean list/grid format
  - Download JSON button (secondary button style)
  - Images displayed at medium size with lightbox capability

### Developer Space - Admin Dashboard
**Layout**: Sidebar navigation + main content area
- Sidebar (w-64): 
  - Section links (Users, Lists, Announcements, Stats, Settings)
  - Active state with background highlight
- Main Area:
  - **Users Tab**: Table with columns (username, email, actions) + Add User button
  - **Lists Tab**: Searchable table with view/delete actions
  - **Announcements Tab**: CRUD interface with form and list
  - **Stats Tab**: 4-column metric cards (total lists, users, etc.)
  - **Settings Tab**: Form for password changes, reset buttons with confirmation

## Form Elements
- Input fields: border rounded-md with focus ring
- Labels: text-sm font-medium above inputs
- Buttons:
  - Primary: Bold background, white text, rounded-md
  - Secondary: Border variant
  - Danger: Red variant for delete actions
- Dropdowns/Selects: Match input styling
- File Upload: Dashed border zone with upload icon and "Click or drag" text

## Data Display
- Tables: Clean borders, alternating row backgrounds, hover highlighting
- Cards: Elevated with shadow, rounded-lg corners, p-6 padding
- Badges: Rounded-full for counts/status, small text
- Empty States: Centered icon + message for no data scenarios

## Christmas Festive Elements (Subtle)
- Accent touches: Small snowflake icons in headers
- Background: Very subtle gradient or pattern (not distracting)
- Success states: Green with gift icon
- Seasonal color accents in badges/highlights (keep minimal)
- Hero illustration: Simple Christmas tree or gift icon in authentication pages

## Images
- **Authentication Pages**: Small decorative Christmas icon/illustration centered above login form
- **Empty States**: Friendly illustrations (gift box, Christmas tree outline) when no lists exist
- **Wish List Items**: User-uploaded product images at 300x300px display size
- No large hero images - keep interface focused on functionality

## Responsive Behavior
- Mobile (base): Single column, stacked navigation, full-width cards
- Tablet (md:): 2-column grids, compact sidebar
- Desktop (lg:): Full multi-column layouts, expanded sidebar for developer space

## Interactions
- Minimal animations: Smooth transitions on hover/focus (duration-200)
- Form validation: Inline error messages below inputs
- Loading states: Spinner for data fetching
- Confirmation modals: For delete/reset actions
- Toast notifications: Top-right for success/error feedback