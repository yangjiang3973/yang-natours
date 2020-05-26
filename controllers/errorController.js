const _ = require('lodash');
const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);

    const message = `Invalid input data. ${errors.join('. ')}`;

    return new AppError(message, 400);
};

const handleJWTError = () =>
    new AppError('Invalid token. Please login again', 401);

const handleJWTExpiredError = () =>
    new AppError('Your token has expired! Please login again!', 401);

const sendErrorDev = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
        });
    } else {
        console.error('ERROR:', err);
        res.status(err.statusCode).render('error', {
            title: 'Something went wrong',
            msg: err.message,
        });
    }
};

const sendErrorProd = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        // operational, trusted error: send message to clients
        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
        }
        // programming or unknown error: don't want to leak to clients
        else {
            // log error
            console.error('ERROR:', err);

            // send a generic message
            res.status(500).json({
                status: 'error',
                message: 'Something wrong',
            });
        }
    } else {
        if (err.isOperational) {
            res.status(err.statusCode).render('error', {
                title: 'Something went wrong',
                msg: err.message,
            });
        }
        // programming or unknown error: don't want to leak to clients
        else {
            // log error
            console.error('ERROR:', err);

            // send a generic message
            res.status(500).render('error', {
                title: 'Something went wrong',
                msg: 'Please try again later!',
            });
        }
    }
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500; // 500 internal server error
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        /* NOTE: I do not know why here he wants to copy err into error, and use error instead, shallow-copy drops message, but deep-copy is hard */
        // let error = { ...err }; // shallow copy only copys one level
        // let error = JSON.parse(JSON.stringify(err)); // hack way for deep-copy, but only for allowed data
        // let error = _.cloneDeep(err);  // does not work
        // handle operation err and mark it
        // if (error.name === 'CastError') error = handleCastErrorDB(error);
        // if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        // if (error.name === 'ValidationError')
        //     error = handleValidationErrorDB(error);
        // if (error.name === 'JsonWebTokenError') error = handleJWTError();
        // if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
        // sendErrorProd(error, req, res);

        if (err.name === 'CastError') err = handleCastErrorDB(err);
        if (err.code === 11000) err = handleDuplicateFieldsDB(err);
        if (err.name === 'ValidationError') err = handleValidationErrorDB(err);
        if (err.name === 'JsonWebTokenError') err = handleJWTError();
        if (err.name === 'TokenExpiredError') err = handleJWTExpiredError();

        sendErrorProd(err, req, res);
    }
};
