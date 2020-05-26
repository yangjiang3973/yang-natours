const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router(); // mount a new router

// not RESTful
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// middleware run in sequence, so after this line, all router will get protected!
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);

router.get('/me', userController.getMe, userController.getUser);
router.patch(
    '/updateMe',
    userController.uploadUserPhoto,
    // userController.resizeUserPhoto,
    userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);

// RESTful
router.use(authController.restrictTo('admin'));

router.route('/').get(userController.getAllUsers);
router
    .route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

module.exports = router;
