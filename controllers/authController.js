const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/email");

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    // this is for heroku, it redirects or modifies incoming req, so req.secure is not good for heroku
    secure: req.secure || req.headers("x-forwarded-proto") === "https"
  };

  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user
    }
  });
};

module.exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);

  createSendToken(newUser, 201, req, res);
});

module.exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }
  // check if user exist and password is correct
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // if all correct, send token to client
  createSendToken(user, 200, req, res);
});

module.exports.logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    status: "success"
  });
};

module.exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // get the token and check existance
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please Login to get access", 401)
    );
  }
  // verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new AppError("The user belonging to this token does no longer exist", 401)
    );
  // check if user changed password after JWT token issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        "User recently changed the password! Please login again",
        401
      )
    );
  }

  req.user = currentUser;
  res.locals.user = currentUser; // copy from isLoggedIn
  next();
});

// do not use catchAsync to make error as global, this is for view layer.
// after logout, jwt.verify will throw an error and go to catch block to call next()
module.exports.isLoggedIn = async (req, res, next) => {
  if (!req.cookies.jwt) return next();

  try {
    // if jwt exists, verify it first
    const decoded = await promisify(jwt.verify)(
      req.cookies.jwt,
      process.env.JWT_SECRET
    );

    // check if user exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) return next();

    // check if user changed password after token issued
    if (currentUser.changedPasswordAfter(decoded.iat)) return next();

    // this is actually a logged in user
    res.locals.user = currentUser;
    next();
  } catch (err) {
    return next();
  }
};

module.exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // the previous middle called req.user = currentUser; to store user info into req
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  };
};

module.exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("there is no user with that email address", 404));
  }

  const resetToken = user.createPasswordRestToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token(within 10 min)",
      message
    });

    res.status(200).json({
      status: "success",
      message: "Token sent to your email"
    });
  } catch (error) {
    user.createPasswordRestToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.log(error);
    return next(
      new AppError("there is an error sending an email. try again later!", 500)
    );
  }
});

module.exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. get the user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2. if token is not expired, and there is user, set new password
  if (!user) {
    return next(new AppError("Token is invalid or expired", 400));
  }

  // validator will compare 2 passwords automatically
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3. update changePasswordAt property for the user

  // 4. log the userin, send JWT
  createSendToken(user, 200, req, res);
});

module.exports.updatePassword = catchAsync(async (req, res, next) => {
  // get the user from collection
  // protect() put user into req
  const user = await User.findOne(req.user._id).select("+password");

  // check if POSTed password is correct
  const currentPassword = req.body.currentPassword;

  if (!(await user.correctPassword(currentPassword, user.password))) {
    return next(new AppError("your current password is wrong", 401));
  }

  // if so, update password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  // change password timestamp will update by middleware in mongoose
  await user.save();

  // log user in, send JWT
  createSendToken(user, 200, req, res);
});
