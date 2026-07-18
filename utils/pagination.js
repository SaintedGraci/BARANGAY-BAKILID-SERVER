/**
 * Pagination utility for consistent pagination across all endpoints
 */

/**
 * Calculate pagination parameters
 * @param {number} page - Current page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {object} - { offset, limit, page }
 */
export const getPaginationParams = (page = 1, limit = 20) => {
    // Parse and validate page
    const parsedPage = parseInt(page, 10);
    const validPage = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
    
    // Parse and validate limit
    const parsedLimit = parseInt(limit, 10);
    const validLimit = isNaN(parsedLimit) || parsedLimit < 1 ? 20 : Math.min(parsedLimit, 100); // Max 100 items per page
    
    // Calculate offset
    const offset = (validPage - 1) * validLimit;
    
    return {
        offset,
        limit: validLimit,
        page: validPage
    };
};

/**
 * Build pagination metadata for API response
 * @param {number} totalItems - Total number of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object} - Pagination metadata
 */
export const buildPaginationMeta = (totalItems, page, limit) => {
    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;
    
    return {
        currentPage: page,
        itemsPerPage: limit,
        totalItems,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        nextPage: hasNextPage ? page + 1 : null,
        previousPage: hasPreviousPage ? page - 1 : null,
    };
};

/**
 * Paginate Sequelize query results
 * @param {object} model - Sequelize model
 * @param {object} options - Query options
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Promise<object>} - { rows, pagination }
 */
export const paginateQuery = async (model, options = {}, page = 1, limit = 20) => {
    const { offset, limit: validLimit, page: validPage } = getPaginationParams(page, limit);
    
    // Execute query with pagination
    const { count, rows } = await model.findAndCountAll({
        ...options,
        limit: validLimit,
        offset,
        distinct: true, // For correct count with includes
    });
    
    // Build pagination metadata
    const pagination = buildPaginationMeta(count, validPage, validLimit);
    
    return {
        rows,
        pagination
    };
};

/**
 * Middleware to parse pagination parameters from query string
 */
export const paginationMiddleware = (req, res, next) => {
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    
    const { offset, limit: validLimit, page: validPage } = getPaginationParams(page, limit);
    
    // Attach pagination params to request
    req.pagination = {
        offset,
        limit: validLimit,
        page: validPage
    };
    
    next();
};

export default {
    getPaginationParams,
    buildPaginationMeta,
    paginateQuery,
    paginationMiddleware
};
