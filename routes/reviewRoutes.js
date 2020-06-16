const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });
// mergeParams >> เอาไว้ให้เข้าถึง parameter นอก routh ได้ มันจึงเรียกใช้ tourID ได้

// POST /tour/2343jk/reviews
// POST .reviews
// ทั้งหมดด้านบนจะถูก handler ที่ router.route('/)

router.use(authController.protect);

router.route('/').get(reviewController.getAllReviews).post(
  //authController.protect,
  authController.restrictTo('user'),
  reviewController.setTouruserIds,
  reviewController.createReview
);

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;
