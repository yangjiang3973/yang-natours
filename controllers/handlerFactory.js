const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

module.exports.deleteOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndDelete(req.params.id);

        if (!doc) {
            return next(new AppError('No tour found with that ID', 404));
        }

        res.status(204).json({
            status: 'success',
            data: null,
        });
    });

module.exports.updateOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!doc) {
            return next(new AppError('No doc found with that ID', 404));
        }
        res.status(200).json({
            status: 'success',
            data: {
                data: doc,
            },
        });
    });

module.exports.createOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const newDoc = await Model.create(req.body);
        res.status(201).json({
            status: 'success',
            data: {
                tour: newDoc,
            },
        });
    });

module.exports.getOne = (Model, populateOpts) =>
    catchAsync(async (req, res, next) => {
        let query = Model.findById(req.params.id);
        if (populateOpts) query = query.populate(populateOpts);
        const doc = await query;

        if (!doc) {
            return next(new AppError('No doc found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                data: doc,
            },
        });
    });

module.exports.getAll = (Model) =>
    catchAsync(async (req, res, next) => {
        // this is a hack for reviews from tour url
        // TODO: better to make it as a middleware for getAllReview
        let filter = {};
        if (req.params.tourId) filter = { tour: req.params.tourId };

        // execute the query
        const features = new APIFeatures(Model.find(filter), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();
        const doc = await features.query;
        // const doc = await features.query.explain();

        // send res
        res.status(200).json({
            status: 'success',
            results: doc.length,
            data: {
                data: doc,
            },
        });
    });
