// ใช้ส่งไฟล์ไปยัง server
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// ทีี่เก็บภาพ
// const multerStorage = multer.diskStorage({
//   // cb = call back
//   destination: (req, file, cb) => {
//     // (error,destination)
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     // user-7663523dsf-3344398283.jpeg [user-user id-timestamp.file pic
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });
const multerStorage = multer.memoryStorage();

// กรองภาพ
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

//const upload = multer({ dest: 'public/img/users' });

// middleware update photo
// photo คือ  Name of field
exports.uploadUserPhoto = upload.single('photo');

// Middleware ทำงานทันทีหลัง uploadUserPhoto
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  // ใส่ await เพราะให้มันรอทำเบื้องหลังให้เสร็จ ก่อนไปทำ next
  await sharp(req.file.buffer)
    // ตั้งภาพให้มี ขนาดแค่นี้ จัตุรัส
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  // Object.keys(obj) >>>  ARRAY
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// Middleware ที่ทำให้ /Me ไม่ต้องใช้ id จาก URL ใช้จาก current user ใน protect
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

/*exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find();
  res.status(200).json({
    status: 'success',
    requestLength: users.length,
    data: {
      // ES6 ถ้าชื่อเหมือนกันไม่ต้องใส่ได้ api resource name : function
      //users : users
      users,
    },
  });
});*/
exports.getAllUsers = factory.getAll(User);

exports.updateMe = catchAsync(async (req, res, next) => {
  // about photo
  console.log(req.file);
  console.log(req.body);
  // 1) Create error if user POST password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password update.Please use /updateMyPassword.',
        400
      )
    );
  }

  // 2) Filtered out unmanted fields names that are not allowed to be update
  const filteredBody = filterObj(req.body, 'name', 'email');
  // เพิ่ม photo เข้า DB
  if (req.file) filteredBody.photo = req.file.filename;

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    date: null,
  });
});
// exports.getUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined.',
//   });
// };
exports.getUser = factory.getOne(User);

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined Please use signup instead.',
  });
};

// ******* Do not update password with this !!!!
// exports.updateUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined.',
//   });
// };
exports.updateUser = factory.updateOne(User);
// exports.deleteUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined.',
//   });
// };
exports.deleteUser = factory.deleteOne(User);
