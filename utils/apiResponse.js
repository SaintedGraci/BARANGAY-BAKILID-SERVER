/**
 * Standardized API Response Utility
 * Ensures consistent response format across all endpoints
 */

export class APIResponse {
    /**
     * Success response
     * @param {object} res - Express response object
     * @param {object} data - Response data
     * @param {string} message - Success message
     * @param {number} statusCode - HTTP status code (default: 200)
     */
    static success(res, data = null, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Error response
     * @param {object} res - Express response object
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code (default: 400)
     * @param {string} code - Error code for client-side handling
     * @param {object} errors - Validation errors (optional)
     */
    static error(res, message = 'An error occurred', statusCode = 400, code = null, errors = null) {
        const response = {
            success: false,
            message,
            timestamp: new Date().toISOString()
        };

        if (code) {
            response.code = code;
        }

        if (errors) {
            response.errors = errors;
        }

        return res.status(statusCode).json(response);
    }

    /**
     * Validation error response
     * @param {object} res - Express response object
     * @param {array|object} errors - Validation errors
     */
    static validationError(res, errors) {
        return APIResponse.error(
            res,
            'Validation failed',
            422,
            'VALIDATION_ERROR',
            errors
        );
    }

    /**
     * Unauthorized error response
     * @param {object} res - Express response object
     * @param {string} message - Error message
     * @param {string} code - Error code
     */
    static unauthorized(res, message = 'Unauthorized', code = 'UNAUTHORIZED') {
        return APIResponse.error(res, message, 401, code);
    }

    /**
     * Forbidden error response
     * @param {object} res - Express response object
     * @param {string} message - Error message
     */
    static forbidden(res, message = 'Access forbidden') {
        return APIResponse.error(res, message, 403, 'FORBIDDEN');
    }

    /**
     * Not found error response
     * @param {object} res - Express response object
     * @param {string} message - Error message
     */
    static notFound(res, message = 'Resource not found') {
        return APIResponse.error(res, message, 404, 'NOT_FOUND');
    }

    /**
     * Server error response
     * @param {object} res - Express response object
     * @param {string} message - Error message
     * @param {object} error - Error object (for logging)
     */
    static serverError(res, message = 'Internal server error', error = null) {
        // Log error for debugging (in production, use proper logging service)
        if (error && process.env.NODE_ENV !== 'production') {
            console.error('Server Error:', error);
        }

        return APIResponse.error(
            res,
            process.env.NODE_ENV === 'production' 
                ? 'An unexpected error occurred' 
                : message,
            500,
            'SERVER_ERROR'
        );
    }

    /**
     * Created response (for POST requests)
     * @param {object} res - Express response object
     * @param {object} data - Created resource data
     * @param {string} message - Success message
     */
    static created(res, data, message = 'Resource created successfully') {
        return APIResponse.success(res, data, message, 201);
    }

    /**
     * No content response (for DELETE requests)
     * @param {object} res - Express response object
     */
    static noContent(res) {
        return res.status(204).send();
    }
}

export default APIResponse;
