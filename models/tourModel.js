const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'A tour must have a name'],
            unique: true,
            trim: true,
            maxlength: [40, 'A tour name must have less or equal 40 char'],
            minlength: [10, 'A tour name must have more or equal 10 char'],
            // validate: [validator.isAlpha, 'name should only contain char'],
        },
        slug: String,
        duration: {
            type: Number,
            required: [true, 'A tour must have a duration'],
        },
        maxGroupSize: {
            type: Number,
            required: [true, 'A tour must have a group size'],
        },
        difficulty: {
            type: String,
            required: [true, 'A tour must have a difficulty'],
            enum: {
                values: ['easy', 'medium', 'difficult'],
                message: 'Difficulty is either: easy, medium or difficult',
            },
        },
        ratingsAverage: {
            type: Number,
            default: 4.5,
            min: [1, 'Rating must be above 1.0'],
            max: [5, 'Rating must be below 5.0'],
            set: (val) => Math.round(val * 10) / 10,
        },
        ratingsQuantity: {
            type: Number,
            default: 0,
        },
        price: {
            type: Number,
            required: [true, 'A tour must have a price'],
        },
        priceDiscount: {
            type: Number,
            validate: {
                validator: function (val) {
                    // this keyword work on NEW doc creation, not update!
                    return val < this.price;
                },
                message:
                    'Discount price ({VALUE}) should be below regular price',
            },
        },
        summary: {
            type: String,
            trim: true, // remove white spaces at the head and tail
            require: [true, 'A tour must have a description'],
        },
        description: {
            type: String,
            trim: true,
        },
        imageCover: {
            type: String, // name(path) of img, not data
            required: [true, 'A tour must have a cover image'],
        },
        images: [String],
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false,
        },
        startDates: [Date],
        secretTour: {
            type: Boolean,
            default: false,
        },
        startLocation: {
            // GeoJSON
            type: {
                type: String,
                default: 'Point',
                enum: ['Point'],
            },
            coordinates: [Number], // longitude, latitude
            address: String,
            description: String,
        },
        locations: [
            {
                type: {
                    type: String,
                    default: 'Point',
                    enum: ['Point'],
                },
                coordinates: [Number],
                address: String,
                description: String,
                day: Number,
            },
        ],
        guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
// tourSchema.index({ price: 1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
});

tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id',
});

// document middleware, runs only before .save() and .create() but not insertMany()
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt',
    });
    next();
});

// this is an example to do embeded, but actually will use reference

// tourSchema.pre('save', async function (next) {
//     const guidePromises = this.guides.map(
//         async (id) => await User.findById(id)
//     );
//     this.guides = await Promise.all(guidePromises); // overwrite userIDs with user docs
//     next();
// });

// tourSchema.post('save', function(doc, next) {

//     next();
// })

const Tour = mongoose.model('Tour', tourSchema);

// const testTour = new Tour({
//     name: 'the park camper',
//     rating: 4.7,
//     price: 997,
// });

module.exports = Tour;
