const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');

module.exports.getAllReviews = factory.getAll(Review);

// middleware to add tour and user id if req comes from tour
module.exports.setTourUserIds = (req, res, next) => {
    // Allow nested routes(review under tour)
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user._id;
    next();
};

module.exports.getReview = factory.getOne(Review);

module.exports.createReview = factory.createOne(Review);

module.exports.deleteReview = factory.deleteOne(Review);

module.exports.updateReview = factory.updateOne(Review);
