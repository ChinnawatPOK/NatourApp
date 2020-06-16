const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController ');

const router = express.Router();

// ให้ทุก routh ด้านล่างเรียกใช้ก่อนตลอด
//router.use(authController.isLoggedIn);
// ไม่ใช้แล้ว เพราะ ที่ /me มีprotect มันเหมือนกันเลย แยกไปใส่เอา

// .get ใช้แสดงผลบนหน้า bowser
router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewsController.getOverview
);
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);
router.get('/login', authController.isLoggedIn, viewsController.getLogin);
router.get('/me', authController.protect, viewsController.getAccount);
router.get('/my-tours', authController.protect, viewsController.getMyTours);

// Update แบบไม่ใช้ API
// router.post(
//   '/submit-user-data',
//   authController.protect,
//   viewsController.updateUserData
// );
module.exports = router;
