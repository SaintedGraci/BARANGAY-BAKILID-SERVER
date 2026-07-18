# Services Layer Documentation

This folder contains the business logic layer for the Barangay Bakilid system. Services handle data processing, validation, and database operations.

## Services Overview

### 1. authServices.js
Handles user authentication and authorization.

**Functions:**
- `registerUser(username, email, password, role)` - Register a new user
- `loginUser(email, password)` - Authenticate user and return JWT token
- `verifyToken(token)` - Verify JWT token and return user data

**Returns:** All functions return an object with:
```javascript
{
  success: boolean,
  message: string,
  token?: string,
  user?: object
}
```

### 2. requestServices.js
Manages document requests (clearances, certificates, permits).

**Functions:**
- `getAllRequests(filters)` - Get all requests with optional filters
- `getRequestById(id)` - Get single request by ID
- `createRequest(documentType, purpose, remarks, releaseDate, residentId)` - Create new request
- `updateRequest(id, documentType, purpose, remarks, releaseDate)` - Update request details
- `updateRequestStatus(id, status, remarks)` - Update request status
- `deleteRequest(id)` - Delete a request

**Returns:** All functions return an object with:
```javascript
{
  success: boolean,
  message: string,
  data?: object | array
}
```

### 3. notificationServices.js
Manages announcements and notifications.

**Functions:**
- `getAllAnnouncements(filters)` - Get all announcements with optional filters
- `getAnnouncementById(id)` - Get single announcement by ID
- `createAnnouncement(title, description, status)` - Create new announcement
- `updateAnnouncement(id, title, description, status)` - Update announcement
- `deleteAnnouncement(id)` - Delete an announcement

**Returns:** All functions return an object with:
```javascript
{
  success: boolean,
  message: string,
  data?: object | array
}
```

## Usage Example

```javascript
// In a controller
import { loginUser } from '../services/authServices.js';

export const login = async (req, res) => {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    
    if (result.success) {
        return res.status(200).json(result);
    } else {
        return res.status(401).json(result);
    }
};
```

## Best Practices

1. **Always use try-catch** - Services handle errors internally
2. **Check success flag** - Always check `result.success` before proceeding
3. **Consistent returns** - All services return standardized response objects
4. **Validation** - Services validate input before database operations
5. **Error logging** - All errors are logged to console for debugging

## Error Handling

Services return error objects instead of throwing errors:
```javascript
{
  success: false,
  message: "Error description"
}
```

This allows controllers to handle errors gracefully and return appropriate HTTP responses.
