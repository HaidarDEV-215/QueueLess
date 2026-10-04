class AppError extends Error{
    constructor(message, statusCode, statusText, details){
        super();
        this.message = message;
        this.statusCode = statusCode;
        this.statusText = statusText;
        this.details = details;
    }
}

module.exports = AppError