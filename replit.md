# Christmas Wish List Application

## Overview

A festive web application for managing Christmas wish lists with three distinct user roles: User (for creating wish lists), Parent (for viewing family lists), and Developer (for system administration). The application features a clean, modern design with subtle seasonal touches, built with React and Express, using a file-based JSON storage system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query for server state management and caching
- React Hook Form with Zod for form validation

**UI Framework:**
- Shadcn/ui component library (New York style variant)
- Radix UI primitives for accessible, unstyled components
- Tailwind CSS for utility-first styling with custom design tokens
- CSS variables for theming (light/dark mode support)

**Design System:**
- Typography: DM Sans/Inter as primary fonts with Architects Daughter and Fira Code as specialty fonts
- Color scheme: Festive palette with primary red (355°, 78%, 45%), neutral grays, and semantic colors
- Spacing: Consistent Tailwind unit scale (2, 4, 6, 8, 12)
- Layout: Responsive grid system with max-width containers (max-w-7xl)

**State Management:**
- Authentication context for role-based access control
- Local storage for session persistence (role and username)
- Query client for API data caching with disabled refetching

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript
- HTTP server for standard request/response handling
- Custom logging middleware for request tracking

**API Design:**
- RESTful endpoints organized by feature area:
  - `/api/auth/login` - Password-based authentication
  - `/api/lists` - Wish list CRUD operations
  - `/api/announcements` - Developer announcements management
  - `/api/stats` - System statistics and analytics
  - `/api/config` - Password configuration management

**Authentication:**
- Password-based role verification (no JWT/sessions)
- Three distinct access levels with separate passwords stored in config.json
- Client-side role storage in localStorage
- No traditional session management

### Data Storage

**File-Based JSON Storage:**
- `data/lists.json` - All wish lists with items
- `data/users.json` - User metadata
- `data/annonces.json` - System announcements
- `config.json` - Role passwords (userPassword, parentPassword, devPassword)

**Schema Design (Zod-based):**
- Wish list items include: id, title, description, quantity, image (base64), imageUrl
- Wish lists contain: id, username, createdAt, items array
- All schemas use Zod for runtime validation
- Insert schemas omit auto-generated fields (id, createdAt)

**Data Access Pattern:**
- Synchronous file system operations for read/write
- In-memory data manipulation with atomic file writes
- UUID generation for unique identifiers

### Routing Architecture

**Client-Side Routes:**
- `/` - Login page with role selection
- `/user` - User space for wish list creation
- `/parent` - Parent space for viewing all lists
- `/developer` - Admin dashboard for system management

**Protected Routes:**
- Route guards check authentication state and role permissions
- Redirects to login if unauthenticated or unauthorized
- Role-specific access control enforced at component level

## External Dependencies

### Core Framework Dependencies

**Frontend:**
- `react` and `react-dom` - UI library
- `@vitejs/plugin-react` - Vite React integration
- `wouter` - Lightweight routing (< 2KB)
- `@tanstack/react-query` - Server state management

**Backend:**
- `express` - Web server framework
- `tsx` - TypeScript execution for development

### UI Component Libraries

**Radix UI Primitives (v1.x):**
- Complete suite of 25+ accessible, unstyled components
- Dialog, Dropdown Menu, Popover, Select, Tabs, Toast, etc.
- All components prefixed with `@radix-ui/react-*`

**Supporting UI Libraries:**
- `class-variance-authority` - Component variant management
- `tailwindcss` and `autoprefixer` - Styling
- `lucide-react` - Icon library
- `embla-carousel-react` - Carousel functionality
- `cmdk` - Command palette component
- `vaul` - Drawer component

### Form and Validation

- `react-hook-form` - Form state management
- `@hookform/resolvers` - Validation resolver integration
- `zod` - Schema validation and type inference
- `zod-validation-error` - Human-readable error messages

### Development Tools

**Replit Integration:**
- `@replit/vite-plugin-runtime-error-modal` - Error overlays
- `@replit/vite-plugin-cartographer` - Development tooling
- `@replit/vite-plugin-dev-banner` - Development banner

**Build Tools:**
- `vite` - Build tool and dev server
- `esbuild` - Server bundling
- `typescript` - Type checking
- `drizzle-kit` - Database migrations (configured but not actively used)

### Database Tooling

**Note:** The application is configured with Drizzle ORM and PostgreSQL support but currently uses JSON file storage:
- `drizzle-orm` - ORM framework
- `drizzle-zod` - Zod schema integration
- `@neondatabase/serverless` - PostgreSQL driver
- Database can be added later without major refactoring

### Utility Libraries

- `date-fns` - Date manipulation
- `nanoid` - Unique ID generation
- `clsx` and `tailwind-merge` - Conditional class names