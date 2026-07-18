import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Barangay Bakilid API',
      version: '1.0.0',
      description: 'Document Management System API for Barangay Bakilid',
      contact: {
        name: 'Barangay Bakilid',
        email: 'admin@barangaybakilid.gov.ph',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.barangaybakilid.gov.ph',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            username: { type: 'string', example: 'juan.delacruz' },
            email: { type: 'string', format: 'email', example: 'juan@example.com' },
            role: { type: 'string', enum: ['admin', 'resident'], example: 'resident' },
            isVerified: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Resident: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            firstName: { type: 'string', example: 'Juan' },
            middleName: { type: 'string', example: 'Santos' },
            lastName: { type: 'string', example: 'Dela Cruz' },
            birthDate: { type: 'string', format: 'date', example: '1990-01-15' },
            contactNumber: { type: 'string', example: '09123456789' },
            address: { type: 'string', example: '123 Main St' },
            purok: { type: 'string', example: 'Purok 1' },
            verificationStatus: { type: 'string', enum: ['pending', 'approved', 'rejected'], example: 'approved' },
          },
        },
        Request: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            documentType: { type: 'string', example: 'Barangay Clearance' },
            purpose: { type: 'string', example: 'Employment' },
            status: { type: 'string', enum: ['Pending', 'Processing', 'Ready for Release', 'Claimed', 'Rejected'], example: 'Pending' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Complaint: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            subject: { type: 'string', example: 'Noise complaint' },
            description: { type: 'string', example: 'Loud music at night' },
            location: { type: 'string', example: 'Purok 1' },
            status: { type: 'string', enum: ['Pending', 'Under Investigation', 'Resolved', 'Rejected'], example: 'Pending' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Announcement: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            title: { type: 'string', example: 'Community Meeting' },
            content: { type: 'string', example: 'Monthly community meeting on Saturday' },
            priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'], example: 'normal' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            userId: { type: 'integer', example: 1 },
            type: { type: 'string', example: 'request_update' },
            title: { type: 'string', example: 'Request Status Updated' },
            message: { type: 'string', example: 'Your request is now ready for release' },
            isRead: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', format: 'password', example: 'SecurePass123!' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Login successful' },
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            refreshToken: { type: 'string', example: 'a1b2c3d4e5f6...' },
            expiresIn: { type: 'string', example: '15m' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'An error occurred' },
            code: { type: 'string', example: 'ERROR_CODE' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation failed' },
            code: { type: 'string', example: 'VALIDATION_ERROR' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'Invalid email format' },
                },
              },
            },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js', './controllers/*.js'], // Path to API routes
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
