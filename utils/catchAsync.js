const AppError = require('../utils/appError');

module.exports = (fn) => {
    // wrap controller
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};
