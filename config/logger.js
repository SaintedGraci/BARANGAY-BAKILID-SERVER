import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};

// Tell winston to use our colors
winston.addColors(colors);

// Define format for logs
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
);

// Define which transports the logger must use
const transports = [
    // Console transport
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }),
    // Error log file
    new winston.transports.File({
        filename: path.join(__dirname, '../logs/error.log'),
        level: 'error',
        format: winston.format.combine(
            winston.format.uncolorize(),
            winston.format.json()
        )
    }),
    // Combined log file
    new winston.transports.File({
        filename: path.join(__dirname, '../logs/combined.log'),
        format: winston.format.combine(
            winston.format.uncolorize(),
            winston.format.json()
        )
    }),
    // Security events log file
    new winston.transports.File({
        filename: path.join(__dirname, '../logs/security.log'),
        level: 'warn',
        format: winston.format.combine(
            winston.format.uncolorize(),
            winston.format.json()
        )
    }),
];

// Create the logger
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    levels,
    format,
    transports,
    // Don't exit on handled exceptions
    exitOnError: false,
});

// Create a stream object for Morgan HTTP logger
logger.stream = {
    write: (message) => logger.http(message.trim()),
};

export default logger;
