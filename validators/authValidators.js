import { body, validationResult } from 'express-validator';
import APIResponse from '../utils/apiResponse.js';

/**
 * Validation rules for user registration
 */
export const registerValidation = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores')
        .escape(),
    
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail()
        .isLength({ max: 100 }).withMessage('Email is too long'),
    
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8, max: 100 }).withMessage('Password must be at least 8 characters long')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number')
        .matches(/[@$!%*?&#]/).withMessage('Password must contain at least one special character (@$!%*?&#)'),
    
    body('firstName')
        .trim()
        .notEmpty().withMessage('First name is required')
        .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s-]+$/).withMessage('First name can only contain letters, spaces, and hyphens')
        .escape(),
    
    body('middleName')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isLength({ max: 50 }).withMessage('Middle name is too long')
        .matches(/^[a-zA-Z\s-]+$/).withMessage('Middle name can only contain letters, spaces, and hyphens')
        .escape(),
    
    body('lastName')
        .trim()
        .notEmpty().withMessage('Last name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s-]+$/).withMessage('Last name can only contain letters, spaces, and hyphens')
        .escape(),
    
    body('gender')
        .trim()
        .notEmpty().withMessage('Gender is required')
        .isIn(['Male', 'Female']).withMessage('Gender must be either Male or Female'),
    
    body('birthDate')
        .notEmpty().withMessage('Birth date is required')
        .isISO8601().withMessage('Invalid date format')
        .custom((value) => {
            const birthDate = new Date(value);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            
            if (age < 18) {
                throw new Error('You must be at least 18 years old to register');
            }
            if (age > 120) {
                throw new Error('Invalid birth date');
            }
            return true;
        }),
    
    body('contactNumber')
        .trim()
        .notEmpty().withMessage('Contact number is required')
        .matches(/^(09|\+639)\d{9}$/).withMessage('Invalid Philippine mobile number format (e.g., 09123456789)')
        .escape(),
    
    body('gmail')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isEmail().withMessage('Invalid email format')
        .matches(/^[a-zA-Z0-9._%+-]+@gmail\.com$/).withMessage('Gmail must be a @gmail.com address')
        .normalizeEmail(),
    
    body('address')
        .trim()
        .notEmpty().withMessage('Address is required')
        .isLength({ min: 5, max: 200 }).withMessage('Address must be between 5 and 200 characters')
        .escape(),
    
    body('purok')
        .trim()
        .notEmpty().withMessage('Purok is required')
        .isLength({ min: 1, max: 50 }).withMessage('Purok is too long')
        .escape(),
];

/**
 * Validation rules for user login
 */
export const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('Password is required')
];

/**
 * Validation rules for refresh token
 */
export const refreshTokenValidation = [
    body('refreshToken')
        .notEmpty().withMessage('Refresh token is required')
        .isString().withMessage('Invalid refresh token format')
];

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        // Format errors for consistent response
        const formattedErrors = errors.array().map(error => ({
            field: error.path,
            message: error.msg,
            value: error.value
        }));
        
        return APIResponse.validationError(res, formattedErrors);
    }
    
    next();
};
