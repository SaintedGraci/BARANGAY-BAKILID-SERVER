# Barangay Bakilid API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### 🔐 Authentication Routes (`/api/auth`)

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "resident"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "resident",
    "isVerified": true
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "resident",
    "isVerified": true
  }
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

---

### 👥 Resident Routes (`/api/residents`)

All routes require authentication. Some require specific roles.

#### Get All Residents
```http
GET /api/residents
Authorization: Bearer <token>
```
**Roles:** staff, admin, captain

#### Get Resident by ID
```http
GET /api/residents/:id
Authorization: Bearer <token>
```

#### Create Resident
```http
POST /api/residents
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Juan",
  "middleName": "Santos",
  "lastName": "Dela Cruz",
  "gender": "Male",
  "birthDate": "1990-01-01",
  "contactNumber": "09123456789",
  "purok": "Purok 1",
  "address": "123 Main St, Bakilid",
  "citizenship": "Filipino",
  "UserId": 1
}
```
**Roles:** staff, admin, captain

#### Update Resident
```http
PUT /api/residents/:id
Authorization: Bearer <token>
Content-Type: application/json
```
**Roles:** staff, admin, captain

#### Delete Resident
```http
DELETE /api/residents/:id
Authorization: Bearer <token>
```
**Roles:** admin

---

### 📄 Request Routes (`/api/requests`)

All routes require authentication.

#### Get All Requests
```http
GET /api/requests
Authorization: Bearer <token>
```
- Residents see only their requests
- Staff/Admin/Captain see all requests

#### Get Request by ID
```http
GET /api/requests/:id
Authorization: Bearer <token>
```

#### Create Request
```http
POST /api/requests
Authorization: Bearer <token>
Content-Type: application/json

{
  "documentType": "Barangay Clearance",
  "purpose": "Employment",
  "remarks": "Urgent",
  "releaseDate": "2026-05-30"
}
```

**Document Types:**
- Barangay Clearance
- Certificate of Residency
- Indigency Certificate
- Business Permit

#### Update Request
```http
PUT /api/requests/:id
Authorization: Bearer <token>
Content-Type: application/json
```
**Roles:** staff, admin, captain

#### Delete Request
```http
DELETE /api/requests/:id
Authorization: Bearer <token>
```
**Roles:** admin

---

### 📢 Announcement Routes (`/api/announcements`)

#### Get All Announcements (Public)
```http
GET /api/announcements
```

#### Get Announcement by ID (Public)
```http
GET /api/announcements/:id
```

#### Create Announcement
```http
POST /api/announcements
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Community Meeting",
  "description": "Monthly barangay meeting on Saturday",
  "status": "Active",
  "priority": "High"
}
```
**Roles:** staff, admin, captain

#### Update Announcement
```http
PUT /api/announcements/:id
Authorization: Bearer <token>
```
**Roles:** staff, admin, captain

#### Delete Announcement
```http
DELETE /api/announcements/:id
Authorization: Bearer <token>
```
**Roles:** admin, captain

---

### 📝 Complaint Routes (`/api/complaints`)

All routes require authentication.

#### Get All Complaints
```http
GET /api/complaints
Authorization: Bearer <token>
```
**Roles:** staff, admin, captain

#### Get Complaint by ID
```http
GET /api/complaints/:id
Authorization: Bearer <token>
```

#### Create Complaint
```http
POST /api/complaints
Authorization: Bearer <token>
Content-Type: application/json

{
  "subject": "Noise Complaint",
  "description": "Loud music at night",
  "status": "Pending"
}
```

**Status Options:**
- Pending
- Investigating
- Resolved

#### Update Complaint
```http
PUT /api/complaints/:id
Authorization: Bearer <token>
```
**Roles:** staff, admin, captain

#### Delete Complaint
```http
DELETE /api/complaints/:id
Authorization: Bearer <token>
```
**Roles:** admin

---

## User Roles

- **resident** - Regular barangay residents
- **staff** - Barangay staff members
- **captain** - Barangay captain
- **admin** - System administrator

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

## Error Response Format

```json
{
  "success": false,
  "message": "Error description"
}
```

## Testing Accounts

### Admin
- Email: `admin@bakilid.gov.ph`
- Password: `admin123`

### Captain
- Email: `captain@bakilid.gov.ph`
- Password: `captain123`

### Staff
- Email: `staff@bakilid.gov.ph`
- Password: `staff123`

### Resident
- Email: `maria.santos@email.com`
- Password: `resident123`
