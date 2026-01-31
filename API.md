# OneX Signature API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "user"
  }
}
```

### POST /auth/login
Login with existing credentials.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "user"
  }
}
```

### GET /auth/profile
Get current user profile. **[Authenticated]**

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "user",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Document Endpoints

### POST /documents
Upload a PDF document. **[Authenticated]**

**Request:**
- Content-Type: `multipart/form-data`
- Fields:
  - `document`: PDF file
  - `name`: Document name

**Response (201):**
```json
{
  "message": "Document uploaded successfully",
  "document": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Contract Agreement",
    "original_filename": "contract.pdf",
    "file_path": "uploads/documents/...",
    "file_size": 102400,
    "page_count": 5,
    "status": "pending",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /documents
List user's documents. **[Authenticated]**

**Response (200):**
```json
{
  "documents": [
    {
      "id": "uuid",
      "name": "Contract Agreement",
      "original_filename": "contract.pdf",
      "file_size": 102400,
      "page_count": 5,
      "status": "pending",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### GET /documents/:id
Get document details. **[Authenticated]**

**Response (200):**
```json
{
  "document": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Contract Agreement",
    "original_filename": "contract.pdf",
    "file_path": "uploads/documents/...",
    "file_size": 102400,
    "page_count": 5,
    "status": "pending",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### DELETE /documents/:id
Delete a document. **[Authenticated]**

**Response (200):**
```json
{
  "message": "Document deleted successfully"
}
```

### GET /documents/:id/download
Download original document. **[Authenticated]**

Returns the PDF file as a download.

---

## Signature Endpoints

### POST /signatures
Upload a signature or seal image (with background removal). **[Authenticated]**

**Request:**
- Content-Type: `multipart/form-data`
- Fields:
  - `signature`: Image file (PNG, JPG, GIF)
  - `name`: Signature name
  - `is_seal`: Boolean (true for seal, false for signature)

**Response (201):**
```json
{
  "message": "Signature uploaded successfully",
  "signature": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "My Signature",
    "original_filename": "signature.png",
    "processed_filename": "processed_12345.png",
    "file_path": "uploads/signatures/...",
    "file_size": 51200,
    "is_seal": false,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /signatures
List user's signatures. **[Authenticated]**

**Response (200):**
```json
{
  "signatures": [
    {
      "id": "uuid",
      "name": "My Signature",
      "original_filename": "signature.png",
      "file_path": "uploads/signatures/...",
      "file_size": 51200,
      "is_seal": false,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### DELETE /signatures/:id
Delete a signature. **[Authenticated]**

**Response (200):**
```json
{
  "message": "Signature deleted successfully"
}
```

---

## Signing Endpoints

### POST /signing
Sign a document with signature placements. **[Authenticated]**

**Request Body:**
```json
{
  "document_id": "uuid",
  "placements": [
    {
      "signature_id": "uuid",
      "page_number": 1,
      "x_position": 100.0,
      "y_position": 200.0,
      "width": 150.0,
      "height": 50.0,
      "rotation": 0.0
    }
  ]
}
```

**Response (201):**
```json
{
  "message": "Document signed successfully",
  "signed_document": {
    "id": "uuid",
    "document_id": "uuid",
    "user_id": "uuid",
    "file_path": "uploads/signed/...",
    "file_size": 105000,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /signing
List signed documents. **[Authenticated]**

**Response (200):**
```json
{
  "signed_documents": [
    {
      "id": "uuid",
      "document_id": "uuid",
      "user_id": "uuid",
      "file_path": "uploads/signed/...",
      "file_size": 105000,
      "document_name": "Contract Agreement",
      "original_filename": "contract.pdf",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### GET /signing/:id/download
Download signed document. **[Authenticated]**

Returns the signed PDF file as a download.

### DELETE /signing/:id
Delete a signed document. **[Authenticated]**

**Response (200):**
```json
{
  "message": "Signed document deleted successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "error": "No token provided"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden: Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. This should be added in production.

## CORS

CORS is enabled for all origins in development. Configure appropriately for production.

## File Size Limits

- Signatures/Seals: 5 MB
- PDF Documents: 10 MB

These limits can be configured in the backend `.env` file.
