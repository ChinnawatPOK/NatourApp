const express = require('express');
//const userController = require('./../controllers/userController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();
//const upload = multer({ dest: 'public/img/users' });

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Protect all routes after this middleware
// ด้านบนก็เป็น Middleware และ Middew. ทำงานเป็น sequence ทำให้หลังจาก
// บรรรทัดนี้มนจะทำ protect ก่อน ทททุกอันด้านล่าง ทำให้ไม่ต้องเสียเวลาไปเพิ่ม protect ทุกอันด้านล่าง
router.use(authController.protect);

router.patch(
  '/updateMyPassword',
  //authController.protect,
  authController.updatePassword
);

router.get(
  '/me',
  //authController.protect,
  userController.getMe,
  userController.getUser
);

router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
