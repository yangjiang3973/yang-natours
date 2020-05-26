const mongoose = require('mongoose');
const Tour = require('./tourModel');
const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, 'Review cannot be empty'],
            trim: true,
            maxlength: [1000, 'a review must have less or equal to 1000 char'],
            minlength: [10, 'a review must have more or equal to 10 char'],
        },
        rating: {
            type: Number,
            min: [1, 'Rating must be above 1.0'],
            max: [5, 'Rating must be below 5.0'],
        },
        createdAt: {
            type: Date,
            default: Date.now(),
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true, 'Review must belong to a tour'],
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to a user'],
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true }); // one user can only create one review on the same tour(no multiple reviews on the same tour from one user)

reviewSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'user',
        select: 'name photo',
    });
    next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
    // this points to the model, so we can use aggregate()
    const stats = await this.aggregate([
        {
            $match: { tour: tourId },
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' },
            },
        },
    ]);

    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating,
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5,
        });
    }
};

// use post, after docs are already in DB then use pipeline
reviewSchema.post('save', function () {
    // this points to current review, so contructor is the model
    this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
    // pass result(a doc) to the next stage
    this.r = await this.findOne();
    next();
});

reviewSchema.post(/^findOneAnd/, async function () {
    await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
