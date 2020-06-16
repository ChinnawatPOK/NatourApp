const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

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

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

// upload.single('image');
// upload.array('image', 5);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  console.log(req.files);

  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Cover image
  // ชื่อไฟล์
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    // ตั้งภาพให้มี ขนาดแค่นี้ จัตุรัส
    // 3 : 2
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Images
  req.body.images = [];
  // ใช้ promise All เพราะให้มันทำให้เสร็จทีเดียวแล้วค่อยทำ next ถ้าไม่ใช้ promise.all มันจะมีปัญหาพราะ ในแต่ลูปมันจะไม่รอ ทำให้มันว่าง
  // [Clip 204 >> 12.00]
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        // ตั้งภาพให้มี ขนาดแค่นี้ จัตุรัส
        // 3 : 2
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// Code เดิมไปอยู่ใน factory แล้ว
exports.getAllTours = factory.getAll(Tour);

// exports.getTour = catchAsync(async (req, res, next) => {
//   // แสดง variable ทั้วหมดใน URL ท่เป็น parameter ให้ค่าเป็น Obj ถ้ามี / ไปอีก
//   //console.log(req.params);
//   const tours = await Tour.findById(req.params.id).populate('reviews');

//   // Tour.findOne({_id : req.params.id})

//   if (!tours) {
//     return next(new AppError('No tour fond with that ID', 404));
//   }
//   res.status(200).json({
//     status: 'success',
//     requestedAt: tours.length,
//     data: {
//       tours,
//     },
//   });
//   /*try {
//     // ---------------------
//   } catch (err) {
//     res.status(404).json({
//       status: 'Fail',
//       message: err,
//     });
//   }*/
// });
exports.getTour = factory.getOne(Tour, { path: 'reviews' });

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);
// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(new AppError('No tour fond with that ID', 404));
//   }
//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// });

// Pipe >>> ทำเป็น stageๆ
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      // 1 = Accending
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);
  res.status(200).json({
    status: 'success',
    Laength: stats.length,
    data: {
      stats,
    },
  });
  /* try {
   //------------------
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }*/
});
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021

  const plan = await Tour.aggregate([
    {
      // unwind >> เป็นการแยกชิ้นส่วนของ Array field โดย Outpuut จะแสดงเป็น doc นึงต่อข้อในมูลในแต่ละ array
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        // pust data to array
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { smonth: '$_id' },
    },
    {
      $project: {
        // don't show _id
        _id: 0,
      },
    },
    {
      $sort: {
        numTourStarts: -1,
      },
    },
    // {
    //   $limit: 6,
    // },
  ]);
  res.status(200).json({
    status: 'success',
    reqLength: plan.length,
    data: {
      plan,
    },
  });
  /* try {
    //------------------
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }*/
});

// หา tour ที่อยู๋ภายใน รัศมีี ... จาก LA
// '/tours-within/:distance/center/:latlng/unit/:unit',
// /tour-within/233/center=-40,45/unit/mi
exports.getTourWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latiitude and longitude in the format lat,lng',
        400
      )
    );
  }
  //console.log(distance, lat, lng, unit);

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: tours,
  });
});

// หาระยะทางระหว่าง LA กับ สถานที่ต่างๆ
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latiitude and longitude in the format lat,lng',
        400
      )
    );
  }
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier, // เหมือนหาร 1000 จาก เมตร>>> กิโลเมตร
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: distances,
  });
});
