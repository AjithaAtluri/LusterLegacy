# Luster Legacy - Architecture Documentation

## Overview

Luster Legacy is a full-stack e-commerce application specializing in luxury jewelry. The application provides functionality for browsing and purchasing products, requesting custom designs, managing a shopping cart, processing payments, and administering the store's inventory. The system integrates real-time pricing for precious metals and gems, AI-generated content for product descriptions, and various payment processing options.

## System Architecture

The application follows a modern client-server architecture:

- **Frontend**: React-based single-page application (SPA) using Vite as the build tool
- **Backend**: Node.js Express server with a RESTful API
- **Database**: PostgreSQL database managed via Drizzle ORM
- **Authentication**: Custom authentication using Passport.js with session-based auth
- **State Management**: React Query for server-state management
- **UI Framework**: Custom UI components built with Tailwind CSS and Radix UI primitives

### Architectural Patterns

- **Component-Based Architecture**: The frontend is structured around reusable React components
- **MVC-like Pattern**: Though not strictly MVC, the application separates data models (schema), controllers (routes), and views (React components)
- **Repository Pattern**: The server uses a storage layer that abstracts database operations
- **RESTful API**: Communication between client and server follows REST principles

## Key Components

### Frontend

- **Client Application (`/client/src/`)**: 
  - React application with TypeScript
  - Organized into pages, components, hooks, and utilities
  - Uses Wouter for routing (lightweight alternative to React Router)
  - Uses React Query for data fetching and caching
  - Implements lazy loading for code splitting (improves initial load performance)

- **UI Components**:
  - Component library built on Radix UI primitives 
  - Styled with Tailwind CSS
  - Design system follows a "New York" style as configured in components.json
  - Dark mode support via ThemeProvider

- **Pages**:
  - Home, Collections, Product Detail, Custom Design
  - Checkout flow with payment integration
  - Customer Account pages 
  - Admin dashboard for store management

### Backend

- **Express Server (`/server/`)**: 
  - Handles API requests, authentication, and business logic
  - Implements RESTful endpoints for all application functionality
  - Uses middleware for authentication, error handling, and request processing

- **Storage Layer (`/server/storage.ts`)**: 
  - Abstracts database operations
  - Provides CRUD operations for all entities
  - Isolates SQL queries from business logic

- **Price Calculator (`/server/utils/price-calculator.ts`)**:
  - Calculates jewelry prices based on materials, gems, and market rates
  - Fetches real-time gold and gem prices

- **AI Service Integration**:
  - Product descriptions generation (`/server/ai-service.ts`)
  - Jewelry content generation (`/server/openai-content-generator.ts`)
  - Vision API for jewelry image analysis (`/server/direct-vision-api.ts`)

- **Payment Processing**:
  - PayPal integration (`/server/paypal.ts`)
  - Stripe integration (referenced in package.json)

### Database

- **Schema (`/shared/schema.ts`)**:
  - Defines database tables using Drizzle ORM
  - Shared between frontend and backend
  - Includes validation schemas using Zod

- **Key Entities**:
  - Users (customers and admins)
  - Products (jewelry items)
  - Design Requests (custom jewelry orders)
  - Orders and Order Items
  - Cart Items
  - Metal Types and Stone Types
  - Testimonials

- **Migrations**:
  - Migration scripts in `/scripts/` directory
  - Drizzle configuration in `drizzle.config.ts`

## Data Flow

### Authentication Flow

1. User submits login credentials
2. Server validates credentials using Passport.js
3. Server creates a session and returns a session cookie
4. Client stores session information and includes the session cookie in subsequent requests
5. Protected routes check for valid session

### Product Browsing Flow

1. Client requests product listing
2. Server queries database for products
3. Client renders product cards with basic information
4. When user selects a product, detailed information is fetched
5. Real-time price calculation based on current metal and gem prices

### Custom Design Flow

1. User submits custom design request form
2. Server validates and stores the request
3. Admin reviews and provides pricing estimate
4. User can provide feedback and request modifications
5. Final design is approved and order is placed

### Checkout Flow

1. User adds items to cart (stored server-side)
2. At checkout, payment options are presented
3. Payment is processed through PayPal or Stripe
4. Order is created in the database
5. Confirmation is sent to user

### Admin Flow

1. Admin logs in with admin credentials
2. Admin can manage products, view orders, and handle design requests
3. Admin can use AI tools to generate product descriptions and content
4. Admin can update pricing, inventory, and process orders

## External Dependencies

### Third-Party Integrations

- **Payment Gateways**:
  - PayPal: For processing payments
  - Stripe: Alternative payment method

- **AI Services**:
  - OpenAI: For content generation and image analysis
  - Anthropic: For AI content generation (Claude model)

- **External Data Services**:
  - Gold price API: Real-time gold prices
  - Exchange rate services: For currency conversion

### NPM Packages

- **Frontend**:
  - React and React DOM
  - Tailwind CSS for styling
  - Radix UI components
  - React Query for data fetching
  - Wouter for routing
  - React Hook Form with Zod for form validation

- **Backend**:
  - Express for the web server
  - Drizzle ORM for database access
  - Passport.js for authentication
  - Multer for file uploads
  - Neon Database serverless client

## Deployment Strategy

The application is configured for deployment on Replit, with additional configuration for other environments if needed.

### Build Process

1. Frontend is built using Vite (`npm run build`)
2. Backend is bundled using esbuild
3. Combined build output is placed in the `dist` directory
4. For Replit deployment, additional build steps prepare the application structure in the `build` directory

### Deployment Configuration

- **Replit Deployment**:
  - Configuration in `.replit` and `.replit.deploy`
  - Custom build script in `build-for-deploy.js`
  - Environment variables set for production

- **Server Start**:
  - Production server runs from compiled JavaScript
  - Environment variables control behavior (NODE_ENV=production)

### Strategies for Persistence

- **Database**: Uses Neon Database (PostgreSQL) for data persistence
- **File Storage**: 
  - Uses both `/uploads` and `/attached_assets` directories
  - Implementation ensures files persist between deployments
  - Images and other assets are properly served and accessible

## Future Architectural Considerations

- **Scalability**: The current architecture can scale vertically with more resources, but horizontal scaling would require session sharing and load balancing
- **Caching**: Additional caching mechanisms could be implemented for product data and pricing information
- **Microservices**: The monolithic architecture could be broken down into microservices for specific functions (e.g., pricing service, authentication service)
- **CDN Integration**: Image and static asset delivery could be optimized with a CDN