export const errorMiddleware = (err, req, res, next) => {
    console.error("Error:", err);
    return res.status(err.status || 500).json({ 
        message: err.message || "Internal server error" 
    });
};