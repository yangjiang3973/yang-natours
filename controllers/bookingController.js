const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

module.exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    // get the current booked tour
    const tour = await Tour.findById(req.params.tourId);
    // create checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        // not secure now
        success_url: `${req.protocol}://${req.get('host')}/?tour=${
            req.params.tourId
        }&user=${req.user.id}&price=${tour.price}`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        line_items: [
            {
                name: `${tour.name} Tour`,
                description: tour.summary,
                // images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
                amount: tour.price * 100,
                currency: 'usd',
                quantity: 1,
            },
        ],
    });

    // create session as response
    res.status(200).json({
        status: 'success',
        session,
    });
});

module.exports.createBookingCheckout = catchAsync(async (req, res, next) => {
    const { tour, user, price } = req.query;

    if (!tour || !user || !price) return next();

    await Booking.create({ tour, user, price });

    res.redirect(req.originalUrl.split('?')[0]);
});

module.exports.createBooking = factory.createOne(Booking);
module.exports.getBooking = factory.getOne(Booking);
module.exports.getAllBookings = factory.getAll(Booking);
module.exports.updateBooking = factory.updateOne(Booking);
module.exports.deleteBooking = factory.deleteOne(Booking);
