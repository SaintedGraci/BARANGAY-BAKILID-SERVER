# Routes Documentation

This folder contains all API route definitions for the Barangay Bakilid system.

## Route Structure

```
/api
├── /auth              - Authentication routes
├── /residents         - Resident management
├── /requests          - Document requests
├── /complaints        - Complaint management
├── /announcements     - Announcements
└── /health           - Health check
```

## Files

### index.js
Main router that combines all route modules. Import this in server.js.

### authRoutes.js
**Base:** `/api/auth`

- `POST /register` - Register new user
- `POST /login` - Login user
- `GET /me` - Get current user (protected)
- `POST /logout` - Logout user (protected)

### residentRoutes.js
**Base:** `/api/residents`

All routes require authentication.

- `GET /` - Get all residents (staff, admin, captain)
- `GET /:id` - Get resident by ID
- `POST /` - Create resident (staff, admin, captain)
- `PUT /:id` - Update resident (staff, admin, captain)
- `DELETE /:id` - Delete resident (admin)

### requestRoutes.js
**Base:** `/api/requests`

All routes require authentication.

- `GET /` - Get all requests (filtered by role)
- `GET /:id` - Get request by ID
- `POST /` - Create new request
- `PUT /:id` - Update request (staff, admin, captain)
- `DELETE /:id` - Delete request (admin)

### complaintRoutes.js
**Base:** `/api/complaints`

All routes require authentication.

- `GET /` - Get all complaints (staff, admin, captain)
- `GET /:id` - Get complaint by ID
- `POST /` - Create new complaint
- `PUT /:id` - Update complaint (staff, admin, captain)
- `DELETE /:id` - Delete complaint (admin)

### announcementRoutes.js
**Base:** `/api/announcements`

- `GET /` - Get all announcements (public)
- `GET /:id` - Get announcement by ID (public)
- `POST /` - Create announcement (staff, admin, captain)
- `PUT /:id` - Update announcement (staff, admin, captain)
- `DELETE /:id` - Delete announcement (admin, captain)

## Middleware Usage

### authMiddleware
Verifies JWT token and attaches user to request object.

```javascript
router.use(authMiddleware);
```

### roleMiddleware
Checks if user has required role(s).

```javascript
router.post("/", roleMiddleware(["admin", "staff"]), controller);
```

## Adding New Routes

1. Create new route file in `/routes` folder
2. Import controllers and middleware
3. Define routes with appropriate middleware
4. Export router
5. Import in `index.js` and add to main router

Example:
```javascript
// routes/newRoutes.js
import express from "express";
import { controller } from "../controllers/newController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);
router.get("/", controller);

export default router;
```

```javascript
// routes/index.js
import newRoutes from "./newRoutes.js";
router.use("/new", newRoutes);
```

## Testing Routes

Use tools like:
- Postman
- Thunder Client (VS Code extension)
- curl
- Insomnia

Example curl request:
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bakilid.gov.ph","password":"admin123"}'

# Get residents (with token)
curl -X GET http://localhost:5000/api/residents \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
