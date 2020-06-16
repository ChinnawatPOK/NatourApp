const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECERT, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOption = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE_IN * 24 * 60 * 60 * 1000
    ),

    // คนอืนไม่สามารถเข้าถึงและแก้ไขได้ เช่น โจมตีข้้าม script
    // ไม่สามารถจัดการ cookies ใน browser ได้ [เราต้องการจัการ โดยตอนแรกไม่ต้องการจัดกาาร]
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOption.secure = true;
  res.cookie('jwt', token, cookieOption);

  // remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  //const newUser = await User.create(req.body);
  const newUser = await User.create(
    // name: req.body.name,
    // email: req.body.email,
    // password: req.body.password,
    // passwordConfirm: req.body.passwordConfirm,
    // passwordChangedAt: req.body.passwordChangedAt,
    // role: req.body.role,
    req.body
  );

  // http://127.0.0.1:3000/me   development not production
  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
  // const token = signToken(newUser._id);
  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   data: {
  //     user: newUser,
  //   },
  // });
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    // rturn เพื่อให้มั่นใจว่าหลังจากทำ next จะไม่่ทำอะไรต่อแล้ว
    return next(new AppError('Please provide email and password'));
  }

  // 2) Check if user exits && password is correct
  // email : email >>>> email  AND +password เป็นการใช้เพิ่ม field ที่ false เอาไว้
  const user = await User.findOne({ email }).select('+password');
  //{'pass1234'} == '$2a$12$43Vz95725zuP8vCJUdJqnea8AATNmZB7KcP7CAHsxKLISxTyIyMKG'
  //const correct = await user.correctPassword(password, user.password);
  // ในกรณีที่ user ไม่มีมันจะ error เลยไปใส่ไว้ใน if เพราะถ้า user มี มันถึงจะทำฝั่งขวา

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorect email or password '), 401);
  }

  // 3) If everything ok,send token to client
  createSendToken(user, 200, res);
  /*const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token,
  });*/
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there [check ว่ามี token?]
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get acccess.', 401)
    );
  }

  // 2) Veriication token
  // 131 >> 2:51
  // เหมือน decode ออกมาดูว่า id ถูกไหม
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECERT);

  // 131 >> 4:40
  // 3) Check if user still exits [กรณีที่แบบ token ถูกขโมย user จึงเปลี่ยนใหม่แสดงว่าอันเก่าควรใช้ไม่ไได้แล้ว]
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError(
        'the user belonging to this token does on longer exist.',
        401
      )
    );
  }

  // 4) Check if user changed password after the token was issued [มีการเปลี่ยน password หลังจาก token ออกมาแล้ว]
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password ! Please log in again!'),
      401
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTH
  req.user = currentUser;

  // ให้ /me มีค่า cuurent user บ้าง
  res.locals.user = currentUser;
  next();
});

// Middlware นี้มีไว้แสดงหน้าเว็บไซต์เท่านั้น
// Only for rendered pages, no error!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) Veriication token
      // 131 >> 2:51
      // เหมือน decode ออกมาดูว่า id ถูกไหม
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECERT
      );

      // 2) Check if user still exits [กรณีที่แบบ token ถูกขโมย user จึงเปลี่ยนใหม่แสดงว่าอันเก่าควรใช้ไม่ไได้แล้ว]
      const currentUser = await User.findById(decoded.id);

      if (!currentUser) {
        return next();
      }

      // 3 ) Check if user changed password after the token was issued [มีการเปลี่ยน password หลังจาก token ออกมาแล้ว]
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      // ให้ pug template  ตัวแปรชื่อ user
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }

  // ไม่มี cookies
  next();
};

exports.restrictTo = (...roles) => {
  // (...roles ) น่าจะเป็น rest กระจายเป็น array ให้
  // มันรับ paramter ไม่ได้เลยต้องใช้ closure
  return (req, res, next) => {
    // role ['admin','lead-guide'] role='user'
    // เพราะจาก req.user = currentUser; ทำให้ req.user เป็นuser ปัจจุบัน
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this acion', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 2) Generate the random resetToken
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send iit to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    //const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}. \nIf you didn't forget your password ignore this email.`;
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (valid for 10 min)',
    //   message,
    // });

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'Success',
      message: 'Token sent to email.',
    });
  } catch (err) {
    //console.log(err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
});
exports.resetPassword = async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expires and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  // ไม่ต้องปิดการ validator เพราะให้มันตรวจสอบ pass กับ passConf
  await user.save();

  // 3) Update changedPasswordAt property forr the user
  // 4) Log the user in, send JWT
  createSendToken(user, 201, res);
  /*const token = signToken(user._id);
  res.status(201).json({
    status: 'success',
    token,
  });*/
};

// Logging before update password
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Chck if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong !', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // ไม่ใช้ User.findByIdAndUpdate เพราะ Middleware pre.save จะไม่ทำงาน password not Encryp AND validator ที่ schema จะไม่ทำงาน

  // 4) Log user in,send token
  createSendToken(user, 200, res);
});
