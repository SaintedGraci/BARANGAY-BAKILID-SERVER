# Barangay Bakilid Management System API

A comprehensive backend system for managing barangay (community) operations, including resident management, document requests, complaints, announcements, and notifications.

## 🌟 Features

- **Authentication & Authorization**: Secure JWT-based authentication with role-based access control (Admin, Staff, Resident)
- **Resident Management**: Complete CRUD operations for resident profiles with image uploads
- **Document Requests**: Handle barangay clearance, certificates, and ID requests with approval workflow
- **Complaint Management**: Track and manage community complaints with status updates
- **Announcements**: Broadcast important community announcements
- **Real-time Notifications**: Socket.IO integration for instant updates
- **Security**: Helmet.js, rate limiting, CORS protection, and security logging
- **API Documentation**: Swagger/OpenAPI documentation available at `/api-docs`
- **Comprehensive Logging**: Winston logger with separate error and security logs

## 🛠️ Tech Stack

- **Runtime**: Node.js with ES6 modules
- **Framework**: Express.js v5
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT with refresh tokens
- **Real-time**: Socket.IO for notifications
- **Security**: Helmet, express-rate-limit, bcrypt
- **File Upload**: Multer for image handling
- **Documentation**: Swagger UI
- **Logging**: Winston with Morgan

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd barangay_server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env` and update with your settings:
   ```bash
   cp .env.example .env
   ```
   
   **Important**: Update these values in `.env`:
   - `DB_PASSWORD`: Your MySQL password
   - `JWT_SECRET`: Generate a secure secret (see below)
   
   Generate a strong JWT secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

4. **Setup database**
   ```bash
   npm run setup
   ```

5. **Seed initial data** (optional)
   ```bash
   npm run seed
   ```

## 🎯 Running the Application

### Development mode (with auto-reload)
```bash
npm run dev
```

### Production mode
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

Once the server is running, access the interactive API documentation at:
```
http://localhost:5000/api-docs
```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### Residents
- `GET /api/residents` - Get all residents (paginated)
- `GET /api/residents/:id` - Get resident by ID
- `POST /api/residents` - Create new resident
- `PUT /api/residents/:id` - Update resident
- `DELETE /api/residents/:id` - Delete resident

### Requests (Document Requests)
- `GET /api/requests` - Get all requests
- `GET /api/requests/:id` - Get request by ID
- `POST /api/requests` - Create new request
- `PUT /api/requests/:id` - Update request
- `PUT /api/requests/:id/approve` - Approve request
- `PUT /api/requests/:id/reject` - Reject request

### Complaints
- `GET /api/complaints` - Get all complaints
- `GET /api/complaints/:id` - Get complaint by ID
- `POST /api/complaints` - Submit complaint
- `PUT /api/complaints/:id` - Update complaint status

### Announcements
- `GET /api/announcements` - Get all announcements
- `GET /api/announcements/:id` - Get announcement by ID
- `POST /api/announcements` - Create announcement
- `PUT /api/announcements/:id` - Update announcement
- `DELETE /api/announcements/:id` - Delete announcement

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

### System
- `GET /api/health` - Health check endpoint
- `GET /api/logs` - View system logs (admin only)

## 🔐 Security Features

- JWT authentication with access and refresh tokens
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Rate limiting to prevent abuse
- Helmet.js for HTTP headers security
- CORS configuration
- Token revocation mechanism
- Security event logging
- Input validation with express-validator

## 📁 Project Structure

```
barangay_server/
├── config/           # Configuration files (DB, JWT, Logger, Swagger)
├── controllers/      # Request handlers
├── middleware/       # Custom middleware (auth, logging, security)
├── models/          # Sequelize models
├── routes/          # API route definitions
├── services/        # Business logic layer
├── utils/           # Utility functions
├── validators/      # Input validation schemas
├── uploads/         # File upload directory
├── logs/            # Application logs
├── server.js        # Application entry point
└── .env             # Environment variables (not in git)
```

## 🧪 Testing

Test files are included for various endpoints:
- `test-login.js` - Authentication tests
- `test-announcements.js` - Announcement endpoint tests
- `test-complaint.js` - Complaint handling tests
- `test-request.js` - Document request tests
- `test-role-restriction.js` - RBAC tests

## 🔄 Database Migrations

Additional migration scripts:
- `add-image-column.js` - Add image support to residents
- `add-verification-columns.js` - Add verification fields

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_NAME` | MySQL database name | barangay_system |
| `DB_USER` | MySQL username | root |
| `DB_PASSWORD` | MySQL password | - |
| `DB_HOST` | MySQL host | localhost |
| `PORT` | Server port | 5000 |
| `JWT_SECRET` | JWT signing secret | - |
| `NODE_ENV` | Environment | development |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:5173 |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## ⚠️ Important Notes

- **Never commit the `.env` file** - It contains sensitive credentials
- Always use strong, unique JWT secrets in production
- Regularly update dependencies for security patches
- Review logs regularly for security events
- Backup the database before running migrations

## 📄 License

ISC

## 👤 Author

Your Name

---

**Made with ❤️ for Barangay Bakilid Community**
