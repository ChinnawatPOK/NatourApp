const path = require('path');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

// set PUG
app.set('view engine', 'pug');
// app.set('views','./views') join เพราะช่วยดูเรื่อง / ว่ามีหรือไม่มมี
app.set('views', path.join(__dirname, 'views'));

// ******************** 1) GLOBLE MIDDLEWARES **************************
// Serving static files
//app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP header
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit request from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Body parser , reading datta from body into req.body
// express.json() is middleware [เป็น function ที่สามารถปรับเปลี่ยนได้เพราะมันอย฿่รระหว่างการ request และ response]
//app.use(express.json());
app.use(express.json({ limit: '10kb' }));
// เพื่อวิเคราะห์ข้อมูลที่มาจาก form URl ที่มีกรเข้ารหัส
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

/*Middleware ตัวนี้เป็น Global
app.use((req, res, next) => {
  console.log('Hello from the middle ware ^_^');
  next();
});*/

// Data sanitization against NOSQL query Injection
// ดูเนื้อหาคำขอ string และ req.params และ เครื่องหมาย $ . ออก
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// prevent parameter pollution
app.use(
  // อนุญาตให้ซ้ำ query sstring ได้
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// test Middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.cookies);
  next();
});

// ROUTES
app.use('/', viewRouter);
// เมือมี request เข้ามาแล้วเส้นทาง path ตรงเช่น tours แล้วจะเข้า midileware stack และไปดูว่า match url ไหนใน tour
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
// การ mounting router ต้องใช่หลังปรกาศ variable ตรงไหนก็ได้

// จับ error ที่่ไม่เจอ rout ด้านบนทั้งหมด [ถ้าย้ายไปอยู่ด้านบสุดมันจะ รับ all อันที่ถูกก็จะผิด]
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server !`,
  // });

  // const err = new Error(`Can't find ${req.originalUrl} on this server !`);
  // err.status = 'fail';
  // err.statusCode = 404;
  // if มีการส่ง err จะข้าม next ในmiddleware stack ทั้งหมด ไปที่ err middleware
  //next(err);
  // console.log(req.originalUrl);
  next(new AppError(`Can't find ${req.originalUrl} on this server !`), 404);
});
// Global middleware for  ERROR
app.use(globalErrorHandler);
// app.use((err, req, res, next) => {
//   console.log(err.stack);
//   err.statusCode = err.statusCode || 500;
//   err.status = err.status || 'error';

//   res.status(err.statusCode).json({
//     status: err.status,
//     message: err.message,
//   });
// });

/* ลองทำเล่นๆตอนแรก
app.get('/', (req, res) => {
  //res.status(200).send('Hello from the server side !');
  res
    .status(300)
    .json({ message: 'Hello from the server side !', app: 'Natours' });
});
app.post('/', (req, res) => {
  // status จะแสง 200 ให้เอง
  res.send('You can post to endpoint....');
});*/
module.exports = app;
