const path = require("path");
const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const bookingRouter = require("./routes/bookingRoutes");
const viewRouter = require("./routes/viewRoutes");

const app = express();

app.enable("trust proxy"); // for heroku

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// serving static files
app.use(express.static(path.join(__dirname, "public")));

// global middlewares
// set security http headers
app.use(helmet());
// dev logging
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));
// limit request
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // 1h
  message: "Too many request from this IP, please try again later"
});
app.use("/api", limiter);

// middleware to attach data to req.body(body parser)
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" })); // add url data to req.body
app.use(cookieParser()); // parse data from cookie(req.cookies)

// data sanitization against NoSQL injection and XSS
app.use(mongoSanitize()); // check req.body and req.params
app.use(xss()); // convert html or js code

// prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price"
    ]
  })
);
app.use(compression());
// test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Routers
app.use("/", viewRouter);
app.use("/api/v1/tours", tourRouter); // sub-app
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings", bookingRouter);

// unhandled route
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl}`, 404));
});

// 4 params mean this is a error handler
app.use(globalErrorHandler);

module.exports = app;
