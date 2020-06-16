const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

// => ให้มัน return Function ไป

exports.getOne = (Model, popOption) =>
  catchAsync(async (req, res, next) => {
    // แสดง variable ทั้วหมดใน URL ท่เป็น parameter ให้ค่าเป็น Obj ถ้ามี / ไปอีก
    //const doc = await Model.findById(req.params.id).populate('reviews');

    // ไม่ใช้ await แต่เก็บใน variable แทนเพื่อใช้ในชั้นต่อไป
    let query = Model.findById(req.params.id);
    if (popOption) query = query.populate(popOption);
    const doc = await query;

    // Tour.findOne({_id : req.params.id})

    if (!doc) {
      return next(new AppError('No document fond with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      requestedAt: doc.length,
      data: {
        doc,
      },
    });
    /*try {
      // ---------------------
    } catch (err) {
      res.status(404).json({
        status: 'Fail',
        message: err,
      });
    }*/
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // const newTour = new Tour({})
    // newTour.save()
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
    /*try {
          // -------------------------
        } catch (err) {
          res.status(400).json({
            status: 'fail',
            message: err,
          });
        }*/
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // ****** findByIdAndUpdate : save Middleware จะไม่่ทำงาน
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      // update handler จัดการการตรวจสอบ
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document fond with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
    /*try {
      // ----------------------------
    } catch (err) {
      res.status(400).json({
        status: 'fail',
        message: err,
      });
    }*/
  });

exports.deleteOne = (Model) =>
  // เป็น closure เรียกใช้ค่าข้างนอกได้หลังง return
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document fond with that ID', 404));
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
    /* try {
      //---------------------------
    } catch (err) {
      res.status(400).json({
        status: 'fail',
        message: err,
      });
    }*/
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on tour {hack}
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    // --------------- EXECUTE QUERY --------------------
    // เมื่อมีการรเรียกใช้ query find >>> มันนจะไปเรียก Query middleware ก่อนเพราะมัน pre {Mongoose middleware}
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .limitFields()
      .sorting()
      .paginate();
    const doc = await features.query;
    //const doc = await features.query.explain();

    // ----------------SEND RESPONSE --------------------
    res.status(200).json({
      status: 'success',
      requestLength: doc.length,
      data: {
        // ES6 ถ้าชื่อเหมือนกันไม่ต้องใส่ได้ api resource name : function
        //tours : tours
        data: doc,
      },
    });
    // console.log(req.query);
    // ------------ BUILD QUERY ----------------
    /* // 1A ) Filtering
      const queryObj = { ...req.query };
      const excludedFields = ['page', 'sort', 'limit', 'fields'];
      // ใช้ [el] เพราะค่าใน Obj ทีี่จะวนไม่คงที่ควรใช้ [] แต่ถ้าควที่ใช้ . ได้
      excludedFields.forEach((el) => delete queryObj[el]);
  
      // 1B ) Advance Filtering
      let queryStr = JSON.stringify(queryObj);
      queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
      // { difficult: 'easy', duration : {$gte : 5} }
      // { difficult: 'easy', duration : {gte : 5} }
  
      let query = Tour.find(JSON.parse(queryStr));
  
      // SOL 1 : วิธี mongoDB ปกติ
      // const tours = await Tour.find({
      //   duration: '5',
      // });
      // SOL 2 : ใช้ method ของ mongoose
      // const tours = await Tour.find()
      //   .where('duration')
      //   .equals(5)
      //   .where('difficulty')
      //   .equals('easy');*/

    // 2) SORT
    //127.0.0.1:3000/api/v1/tours?sort=price,ratingsAverage
    /*if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        //console.log(sortBy);
        query = query.sort(sortBy);
        // sort('price ratingsAverage')
        // ถ้า price เท่ากันให้sort ตาม ratingsAverage
      } else {
        query = query.sort('-createAt');
      }*/

    // 3) Field limitin
    /*if (req.query.fields) {
        const fields = req.query.fields.split(',').join(' ');
        // select('name duration ddifficulty')
        query = query.select(fields);
      } else {
        // ไม่เลือก __v แสดงให้ Client
        query = query.select('-__v');
      }*/

    // 4) Pagination
    /*const page = req.query.page * 1 || 1;
      const limit = req.query.limit * 1 || 100;
      const skip = (page - 1) * limit;
  
      // page=3&limit=10, 1-10 page1, 11-20 page2, 21-30 page3 ...
      // Assume : want page 3
      //query = query.skip(3).limit(10);
      query = query.skip(skip).limit(limit);
  
      if (req.query.page) {
        const numTours = await Tour.countDocuments();
        if (skip >= numTours) throw new Error('This page dos not exits');
      }*/
  });
