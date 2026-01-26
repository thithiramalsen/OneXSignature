# OneX Signature - PDF Signature & Seal System

A full-stack web application for signing PDF documents with digital signatures and seals, featuring automatic background removal using AI.

## 🚀 Features

### MVP Features (Phase 1) - Implemented ✅

#### Backend
- **Authentication & Authorization**
  - JWT-based authentication
  - User registration and login
  - Role-based access control (Admin/User)
  - Secure password hashing with bcrypt

- **Document Management**
  - Upload PDF documents
  - List and view documents
  - Delete documents
  - Track document status (pending, signed, archived)
  - Automatic page count detection

- **Signature/Seal Management**
  - Upload signature and seal images
  - Automatic background removal using `rembg` AI
  - Support for multiple image formats (PNG, JPG, GIF)
  - Delete signatures
  - Distinguish between signatures and seals

- **PDF Signing**
  - Manual placement of signatures on PDF pages
  - Multiple signatures per document
  - Customizable position, size, and rotation
  - Generate signed PDFs
  - Download signed documents
  - Track signature placements

#### Frontend
- **Modern UI with React + TypeScript + Tailwind CSS**
  - Responsive design for all screen sizes
  - Clean and intuitive interface
  - Toast notifications for user feedback

- **Authentication Pages**
  - Login page
  - Registration page
  - Protected routes

- **Dashboard**
  - Quick access to all features
  - Overview of system capabilities

- **Document Management**
  - Upload documents
  - View document list
  - Delete documents
  - Navigate to signing interface

- **Signature Management**
  - Upload signatures/seals
  - View signature gallery
  - Delete signatures
  - Preview signatures

- **PDF Signing Interface**
  - Select documents to sign
  - Choose signatures
  - Add multiple signature placements
  - Configure placement properties
  - Generate and download signed PDFs

- **Signed Documents**
  - View signed document history
  - Download signed PDFs
  - Delete signed documents

#### Database
- PostgreSQL with proper schema
- User management
- Document tracking
- Signature storage
- Signed document records
- Signature placement history

#### DevOps
- Docker Compose setup
- Multi-container architecture
- PostgreSQL container
- Backend container
- Frontend container
- Volume management
- Health checks

### Phase 2 Features - Modular Structure Ready 🔧

The following features are scaffolded with modular code structure for future implementation:

1. **Auto-Placement Module** (`backend/src/services/pdfService.ts`)
   - AI-powered signature position detection
   - Computer vision for signature areas
   - Smart placement based on document type
   - Template-based placement rules

2. **Canvas Drawing Module** (`backend/src/services/pdfService.ts`)
   - Browser-based signature drawing
   - Canvas to image conversion
   - Save drawn signatures
   - Signature pad integration

3. **Advanced Features**
   - Batch document signing
   - Document templates
   - Signature templates
   - Audit trails
   - Email notifications
   - API webhooks
   - Document versioning
   - Collaborative signing
   - Digital certificates

## 🏗️ Tech Stack

### Backend
- **Runtime**: Node.js 18
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer
- **PDF Processing**: pdf-lib
- **Image Processing**: Sharp, rembg (Python-based AI)
- **Security**: bcrypt, CORS

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Notifications**: React Toastify
- **PDF Viewing**: React-PDF

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Database**: PostgreSQL with persistent volumes

## 📋 Prerequisites

- Docker Desktop or Docker Engine + Docker Compose
- Git

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/thithiramalsen/OneXSignature.git
cd OneXSignature
```

### 2. Start with Docker Compose

```bash
docker-compose up --build
```

This will:
- Build and start the PostgreSQL database
- Build and start the backend API server
- Build and start the frontend React app
- Initialize the database with the schema
- Create a default admin user

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432

### 4. Default Login Credentials

- **Admin Account**:
  - Email: `admin@onexsignature.com`
  - Password: `admin123`

> **Note**: The default admin password is a placeholder hash in the database initialization script. When running in production, you should either:
> 1. Change the password immediately after first login
> 2. Update the database init script with a secure password hash
> 3. Remove the default admin and create a new one through the registration flow

## 📁 Project Structure

```
OneXSignature/
├── backend/                    # Node.js + TypeScript backend
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   │   ├── index.ts       # App configuration
│   │   │   └── database.ts    # Database connection
│   │   ├── controllers/       # Route controllers
│   │   │   ├── authController.ts
│   │   │   ├── documentController.ts
│   │   │   ├── signatureController.ts
│   │   │   └── signingController.ts
│   │   ├── middleware/        # Express middleware
│   │   │   ├── auth.ts        # JWT authentication
│   │   │   ├── errorHandler.ts
│   │   │   └── upload.ts      # File upload handling
│   │   ├── models/            # Database models (future ORM)
│   │   ├── routes/            # API routes
│   │   │   ├── authRoutes.ts
│   │   │   ├── documentRoutes.ts
│   │   │   ├── signatureRoutes.ts
│   │   │   └── signingRoutes.ts
│   │   ├── services/          # Business logic
│   │   │   ├── pdfService.ts  # PDF processing + future modules
│   │   │   └── rembgService.ts # Background removal
│   │   ├── types/             # TypeScript types
│   │   │   └── index.ts
│   │   └── server.ts          # Main server file
│   ├── uploads/               # File storage (gitignored)
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # React + TypeScript frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── context/           # React context
│   │   │   └── AuthContext.tsx
│   │   ├── pages/             # Page components
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Documents.tsx
│   │   │   ├── UploadDocument.tsx
│   │   │   ├── Signatures.tsx
│   │   │   ├── UploadSignature.tsx
│   │   │   ├── SignDocument.tsx
│   │   │   └── SignedDocuments.tsx
│   │   ├── services/          # API services
│   │   │   ├── api.ts
│   │   │   ├── authService.ts
│   │   │   ├── documentService.ts
│   │   │   ├── signatureService.ts
│   │   │   └── signingService.ts
│   │   ├── types/             # TypeScript types
│   │   │   └── index.ts
│   │   ├── App.tsx            # Main app component
│   │   ├── index.tsx          # Entry point
│   │   └── index.css          # Global styles
│   ├── Dockerfile
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
├── database/
│   └── init.sql               # Database schema
├── docker-compose.yml
├── .gitignore
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (authenticated)

### Documents
- `POST /api/documents` - Upload PDF document
- `GET /api/documents` - List user's documents
- `GET /api/documents/:id` - Get document details
- `DELETE /api/documents/:id` - Delete document
- `GET /api/documents/:id/download` - Download document

### Signatures
- `POST /api/signatures` - Upload signature/seal (with background removal)
- `GET /api/signatures` - List user's signatures
- `DELETE /api/signatures/:id` - Delete signature

### Signing
- `POST /api/signing` - Sign document with placements
- `GET /api/signing` - List signed documents
- `GET /api/signing/:id/download` - Download signed document
- `DELETE /api/signing/:id` - Delete signed document

## 🗄️ Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `password` (VARCHAR, Hashed)
- `full_name` (VARCHAR)
- `role` (VARCHAR: 'admin' | 'user')
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Signatures Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `name` (VARCHAR)
- `original_filename` (VARCHAR)
- `processed_filename` (VARCHAR)
- `file_path` (VARCHAR)
- `file_size` (INTEGER)
- `is_seal` (BOOLEAN)
- `created_at` (TIMESTAMP)

### Documents Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `name` (VARCHAR)
- `original_filename` (VARCHAR)
- `file_path` (VARCHAR)
- `file_size` (INTEGER)
- `page_count` (INTEGER)
- `status` (VARCHAR: 'pending' | 'signed' | 'archived')
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Signed Documents Table
- `id` (UUID, Primary Key)
- `document_id` (UUID, Foreign Key)
- `user_id` (UUID, Foreign Key)
- `file_path` (VARCHAR)
- `file_size` (INTEGER)
- `created_at` (TIMESTAMP)

### Signature Placements Table
- `id` (UUID, Primary Key)
- `signed_document_id` (UUID, Foreign Key)
- `signature_id` (UUID, Foreign Key)
- `page_number` (INTEGER)
- `x_position` (DECIMAL)
- `y_position` (DECIMAL)
- `width` (DECIMAL)
- `height` (DECIMAL)
- `rotation` (DECIMAL)
- `created_at` (TIMESTAMP)

## 🛠️ Development

### Running Backend Locally

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your settings
npm run dev
```

### Running Frontend Locally

```bash
cd frontend
npm install
npm start
```

### Database Setup

```bash
# Connect to PostgreSQL
psql -U postgres -h localhost -p 5432

# Run the schema
\i database/init.sql
```

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcrypt (10 rounds)
- Role-based authorization (admin/user)
- SQL injection prevention with parameterized queries
- CORS configuration
- File type validation
- File size limits
- Secure file storage

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📦 Deployment

### Production Build

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
# Serve the build folder with a static server
```

### Docker Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Authors

- Development Team

## 🙏 Acknowledgments

- **rembg** - AI-powered background removal
- **pdf-lib** - PDF manipulation library
- **React** - UI framework
- **Tailwind CSS** - Utility-first CSS framework

## 📧 Support

For support, email support@onexsignature.com or open an issue in the repository.

---

**OneX Signature** - Making digital document signing simple and secure 🔒✍️