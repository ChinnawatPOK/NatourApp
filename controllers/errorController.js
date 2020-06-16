const AppError = require('../utils/appError');

const handleJWTExpiredError = () =>
  new AppError('Your tokens has Expire ! Pleaase log in again', 401);
const handleJWTError = () => new AppError('Invalid token plase again!', 401);
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};
const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);

  const message = `Duplcate field value ${value} :  Please use another value!`;
  // ไปเปลี่ยนให้เป็น Operational = true
  return new AppError(message, 400);
};
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path} : ${err.value}`;
  //console.log(message);
  return new AppError(message, 400);
};
// const sendErrorDev = (err, req, res) => {
//   //  A) API
//   if (req.originalUrl.startsWith('/api')) {
//     return res.status(err.statusCode).json({
//       status: err.status,
//       error: err,
//       message: err.message,
//       stack: err.stack,
//     });
//   }
//   // B) RENDERED WEBSITE
//   console.log('ERROR !!', err);
//   return res.status(err.statusCode).render('error', {
//     title: 'Something went wrong',
//     msg: err.message,
//   });
// };
const sendErrorDev = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // B) RENDERED WEBSITE
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    // A) Operational, trusted error : send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // B) Programming or other unknown error : don't leak error details
    // 1) Log error
    console.error('ERROR !!', err);
    // 2) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }

  // B) RENDERED WEBSITE
  // A) Operational, trusted error : send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    });
  }
  // B) Programming or other unknown error : don't leak error details
  // 1) Log error
  console.log('ERROR !!', err);

  // 2) Send generic message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: 'Please try again later.',
  });
};

module.exports = (err, req, res, next) => {
  // console.log(err.stack);
  //console.log(err);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    // CASE : ไม่พบ id นั้น : แปลง error ให้เป้น operational เพื่อให้้แสดดง error ที่สวยๆ
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    // CASE : Duplicate fields
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);

    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);

    if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
    if (error.name === 'TokenExpiredError')
      error = handleJWTExpiredError(error);

    // console.log(err.message);
    // console.log(error.message);
    sendErrorProd(error, req, res);
  }
};
