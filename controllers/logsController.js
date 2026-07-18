import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import APIResponse from '../utils/apiResponse.js';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGS_DIR = path.join(__dirname, '../logs');

/**
 * Get list of available log files
 */
export const getLogFiles = async (req, res) => {
    try {
        const files = fs.readdirSync(LOGS_DIR);
        const logFiles = files
            .filter(file => file.endsWith('.log'))
            .map(file => {
                const stats = fs.statSync(path.join(LOGS_DIR, file));
                return {
                    name: file,
                    size: stats.size,
                    modified: stats.mtime,
                    sizeFormatted: formatFileSize(stats.size)
                };
            })
            .sort((a, b) => b.modified - a.modified);

        return APIResponse.success(res, { files: logFiles }, 'Log files retrieved successfully');
    } catch (error) {
        logger.error('Error reading log files:', error);
        return APIResponse.serverError(res, 'Failed to retrieve log files', error);
    }
};

/**
 * Get log content with optional filtering
 */
export const getLogContent = async (req, res) => {
    try {
        const { filename } = req.params;
        const { lines = 100, level, search } = req.query;

        // Security: Prevent path traversal
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return APIResponse.error(res, 'Invalid filename', 400, 'INVALID_FILENAME');
        }

        const logPath = path.join(LOGS_DIR, filename);

        // Check if file exists
        if (!fs.existsSync(logPath)) {
            return APIResponse.notFound(res, 'Log file not found');
        }

        // Read file content
        const content = fs.readFileSync(logPath, 'utf-8');
        let logLines = content.split('\n').filter(line => line.trim());

        // Filter by log level if specified
        if (level) {
            logLines = logLines.filter(line => {
                try {
                    const logEntry = JSON.parse(line);
                    return logEntry.level === level;
                } catch {
                    return line.toLowerCase().includes(level.toLowerCase());
                }
            });
        }

        // Search filter
        if (search) {
            logLines = logLines.filter(line => 
                line.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Get last N lines
        const parsedLines = parseInt(lines, 10);
        const limitedLines = logLines.slice(-parsedLines);

        // Parse JSON logs
        const parsedLogs = limitedLines.map(line => {
            try {
                return JSON.parse(line);
            } catch {
                return { raw: line, timestamp: null, level: 'unknown', message: line };
            }
        }).reverse(); // Show newest first

        return APIResponse.success(res, {
            filename,
            totalLines: logLines.length,
            displayedLines: parsedLogs.length,
            logs: parsedLogs
        }, 'Log content retrieved successfully');
    } catch (error) {
        logger.error('Error reading log content:', error);
        return APIResponse.serverError(res, 'Failed to read log file', error);
    }
};

/**
 * Get log statistics
 */
export const getLogStats = async (req, res) => {
    try {
        const stats = {
            totalErrors: 0,
            totalWarnings: 0,
            totalInfo: 0,
            recentErrors: [],
            securityEvents: [],
            authEvents: []
        };

        // Read error log
        const errorLogPath = path.join(LOGS_DIR, 'error.log');
        if (fs.existsSync(errorLogPath)) {
            const errorContent = fs.readFileSync(errorLogPath, 'utf-8');
            const errorLines = errorContent.split('\n').filter(line => line.trim());
            stats.totalErrors = errorLines.length;
            
            // Get recent errors (last 5)
            stats.recentErrors = errorLines.slice(-5).map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return { message: line, timestamp: null };
                }
            }).reverse();
        }

        // Read security log
        const securityLogPath = path.join(LOGS_DIR, 'security.log');
        if (fs.existsSync(securityLogPath)) {
            const securityContent = fs.readFileSync(securityLogPath, 'utf-8');
            const securityLines = securityContent.split('\n').filter(line => line.trim());
            
            // Count warnings (security events)
            stats.totalWarnings = securityLines.filter(line => {
                try {
                    const log = JSON.parse(line);
                    return log.level === 'warn';
                } catch {
                    return false;
                }
            }).length;

            // Get recent security events (last 10)
            stats.securityEvents = securityLines.slice(-10).map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return null;
                }
            }).filter(Boolean).reverse();

            // Filter auth events
            stats.authEvents = stats.securityEvents
                .filter(event => event.message && (
                    event.message.includes('AUTH:') || 
                    event.message.includes('LOGIN') ||
                    event.message.includes('REGISTRATION')
                ))
                .slice(0, 10);
        }

        // Read combined log for info count
        const combinedLogPath = path.join(LOGS_DIR, 'combined.log');
        if (fs.existsSync(combinedLogPath)) {
            const combinedContent = fs.readFileSync(combinedLogPath, 'utf-8');
            const combinedLines = combinedContent.split('\n').filter(line => line.trim());
            
            stats.totalInfo = combinedLines.filter(line => {
                try {
                    const log = JSON.parse(line);
                    return log.level === 'info';
                } catch {
                    return false;
                }
            }).length;
        }

        return APIResponse.success(res, stats, 'Log statistics retrieved successfully');
    } catch (error) {
        logger.error('Error reading log stats:', error);
        return APIResponse.serverError(res, 'Failed to retrieve log statistics', error);
    }
};

/**
 * Clear/rotate log files (admin only)
 */
export const clearLogs = async (req, res) => {
    try {
        const { filename } = req.params;

        // Security: Prevent path traversal
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return APIResponse.error(res, 'Invalid filename', 400, 'INVALID_FILENAME');
        }

        const logPath = path.join(LOGS_DIR, filename);

        // Check if file exists
        if (!fs.existsSync(logPath)) {
            return APIResponse.notFound(res, 'Log file not found');
        }

        // Archive the log (rename with timestamp)
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const archivePath = path.join(LOGS_DIR, `${filename}.${timestamp}.archive`);
        fs.renameSync(logPath, archivePath);

        // Create new empty log file
        fs.writeFileSync(logPath, '');

        logger.info(`Log file cleared by admin: ${filename}`, {
            userId: req.user.id,
            archivedAs: `${filename}.${timestamp}.archive`
        });

        return APIResponse.success(res, {
            cleared: filename,
            archived: `${filename}.${timestamp}.archive`
        }, 'Log file cleared and archived successfully');
    } catch (error) {
        logger.error('Error clearing log file:', error);
        return APIResponse.serverError(res, 'Failed to clear log file', error);
    }
};

/**
 * Helper: Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
