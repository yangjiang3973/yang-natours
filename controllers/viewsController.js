const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

module.exports.getOverview = catchAsync(async (req, res, next) => {
    const tours = await Tour.find();

    res.status(200).render('overview', {
        title: 'All tours',
        tours,
    });
});

module.exports.getTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path: 'reviews',
        fields: 'review rating user',
    });

    if (!tour) {
        return next(new AppError('There is not tour with this name', 404));
    }

    res.status(200).render('tour', {
        title: `${tour.name} tour`,
        tour,
    });
});

module.exports.getLoginForm = (req, res) => {
    res.status(200).render('login', {
        title: 'Log into your account',
    });
};

module.exports.getAccount = (req, res) => {
    res.status(200).render('account', {
        title: 'Your account',
    });
};

module.exports.getMyTours = catchAsync(async (req, res, next) => {
    const bookings = await Booking.find({ user: req.user.id });

    const tourIDs = bookings.map((el) => {
        return el.tour;
    });

    const tours = await Tour.find({ _id: { $in: tourIDs } });

    res.status(200).render('overview', {
        title: 'My Tours',
        tours,
    });
});
