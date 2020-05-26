const multer = require('multer');
// const sharp = require('sharp');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'public/img/users');
//     },
//     filename: (req, file, cb) => {
//         const ext = file.mimetype.split('/')[1];
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//     },
// });

const multerStorage = multer.memoryStorage(); // save into memory before resizing, then also use sharp to save

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(
            new AppError('Not an image! Please upload image files only', 400),
            false
        );
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

module.exports.uploadUserPhoto = upload.single('photo');

// module.exports.resizeUserPhoto = (req, res, next) => {
//     if (!req.file) return next();

//     req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

//     sharp(req.file.buffer)
//         .resize(500, 500)
//         .toFormat('jepg')
//         .jpeg({ quality: 90 })
//         .toFile(`public/img/users/${req.file.filename}`);

//     next();
// };

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

module.exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

module.exports.updateMe = catchAsync(async (req, res, next) => {
    // create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                'this route is not for updating password. please use /updateMyPassword',
                400
            )
        );
    }
    // update the user doc with allowed fields
    const filteredBody = filterObj(req.body, 'name', 'email');
    if (req.file) filteredBody.photo = req.file.filename;

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        filteredBody,
        {
            new: true,
            runValidators: true,
        }
    );

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser,
        },
    });
});

module.exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user._id, { active: false });

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

module.exports.getAllUsers = factory.getAll(User);
module.exports.getUser = factory.getOne(User);
module.exports.updateUser = factory.updateOne(User);
module.exports.deleteUser = factory.deleteOne(User);
