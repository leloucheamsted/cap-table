# Cap Table Management System

A comprehensive cap table management application built with React TypeScript frontend and FastAPI Python backend, featuring dynamic shareholder tracking, certificate generation, and real-time analytics.

## Technical Overview & Architecture

### Backend Architecture
- **Framework**: FastAPI with Python 3.8+
- **Database**: SQLite with SQLAlchemy ORM and Alembic migrations
- **Authentication**: JWT token-based authentication with role-based access control
- **PDF Generation**: ReportLab for share certificate generation
- **Architecture Pattern**: Layered architecture with separation of concerns
  - **API Routes** (`/api/routes/`): FastAPI endpoints for admin, auth, shareholders, certificates
  - **Services** (`/services/`): Business logic layer (AuthService, CertificateService, AuditService)
  - **CRUD** (`/crud/`): Data access layer for database operations
  - **Models** (`/models/`): SQLAlchemy ORM models (User, Share, AuditEvent, Certificate)
  - **Schemas** (`/schemas/`): Pydantic models for request/response validation
  - **Core** (`/core/`): Configuration and security utilities
  - **Utils** (`/utils/`): Helper functions for PDF generation and authentication

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **State Management**: Local useState with useCallback optimization (converted from Zustand for better performance)
- **UI Framework**: Ant Design with Tailwind CSS for custom styling
- **Architecture Pattern**: Clean Architecture with clear separation of concerns
  - **Presentation Layer** (`/presentation/`): Components, Pages, Hooks, Layouts
  - **Domain Layer** (`/domain/`): Models, Use Cases, Repositories (interfaces), Services
  - **Infrastructure Layer** (`/infrastructure/`): API endpoints, Persistence, External integrations
  - **Core Layer** (`/core/`): Data interfaces, Entities, Common types
  - **Shared Layer** (`/shared/`): Reusable components, utilities, constants
- **Authentication**: Token-based with automatic refresh and persistent sessions

### Key Architectural Decisions
- **No external design tools**: All UI/UX design and architecture were developed organically during development
- **Clean Architecture**: Ensures maintainability and testability
- **Local State over Global**: Better performance for this use case
- **Certificate System**: Automated PDF generation with fallback mechanisms
- **Real-time Analytics**: Dynamic charts and financial calculations

## Prerequisites

Before running the application, ensure you have the following installed:

- **Python 3.8+**
- **Node.js 16+** and **npm**
- **Git**

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd cap-table
```

### 2. Backend Setup

Navigate to the backend directory:
```bash
cd backend
```

Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Initialize the database:
```bash
alembic upgrade head
```

Create initial admin user (optional):
```bash
python recreate_users.py
```

Start the backend server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at: `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

### 3. Frontend Setup

Open a new terminal and navigate to the frontend directory:
```bash
cd shareholder-dashboard
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm start
```

The frontend will be available at: `http://localhost:3000`

### 4. Access the Application

- **Admin Dashboard**: `http://localhost:3000/admin`
- **Shareholder Dashboard**: `http://localhost:3000/shares`
- **Login Page**: `http://localhost:3000/login`

Default admin credentials (if using recreate_users.py):
- Email: `admin@example.com`
- Password: `admin123`

## Features

- **Dynamic Cap Table Management**: Real-time shareholder composition with visual charts
- **Share Certificate Generation**: Automated PDF certificate creation and download
- **Financial Analytics**: Total cash raised, share distribution, ownership percentages
- **Role-based Access**: Separate dashboards for admins and shareholders
- **Audit Trail**: Complete event tracking and analytics
- **Responsive Design**: Mobile-friendly interface with modern UI

## AI Tools Used

- **GitHub Copilot**: Primary AI assistant for code generation, debugging, and architectural guidance

## Key Prompts That Accelerated Development

The following prompts significantly accelerated the development process using GitHub Copilot:

### State Management Optimization


### Certificate Generation System
- "Implement PDF certificate generation with ReportLab and download functionality"
- "Create use cases for certificate generation and download with proper error handling"
- "Fix certificate download URL handling and backend endpoint response"


### Backend Integration
- "Create admin hook functions for certificate generation and download"
- "Fix admin.py certificate endpoints with proper FileResponse handling"
- "Integrate share assignment functionality with email notification system"



**Note**: No AI prompts were used for UI/UX design or overall system architecture. The design and architectural decisions were made organically during development, focusing on clean code principles and user experience.

## Database Schema

The application uses the following main entities:
- **Users**: Authentication and user management
- **ShareIssuances**: Share allocation records
- **AuditEvents**: System activity tracking

## Testing

Run backend tests:
```bash
cd backend
pytest
```

Run frontend tests:
```bash
cd shareholder-dashboard
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

This project is licensed under the MIT License.
