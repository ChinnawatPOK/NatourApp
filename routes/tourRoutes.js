const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// Nested route
// POST /tour/2343jk/reviews  : สร้าง review ที่ tourID : 2343jk
// GET /tour/2343jk/reviews : แสดง review ที่ tourID : 2343jk
// GET /tour/2343jk/reviews/98d98 : แสดง review ที่ tourID : 2343jk ของ reviwId  98d98
// Problem : เหมือนเปป็นการ create บน tour route
/*router
  .route('/:tourId/reviews')
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.createReview
  );*/
router.use('/:tourId/reviews', reviewRouter);

// Middleware นี้ทำเฉพาะ Tour และเป็น tour ที่มี id เท่านัั้นถ้าไม่มีมันจะข้ามไปไม่ทำไปทำ Middleware ถัดไปคือ Rout ข้างล่าง
//router.param('id', tourController.checkID);
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);
// เรียกใช้ middleware ตัว alias ก่อนเพื่อจัดการกับ req.query แล้วค่อยไทำ allTorr  ต่อ
router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getTourWithin);
// /tour-within?distance=233&center=-40,45&unit=mi
// /tour-within/233/center=-40,45/unit/mi

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
