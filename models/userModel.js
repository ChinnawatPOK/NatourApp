const crypto = require('crypto');
const mongoose = require('mongoose');

const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
  },
  email: {
    type: String,
    required: [true, 'A user must have a email'],
    unique: true,
    validate: [validator.isEmail, 'Please provide your email'],
  },
  photo: { type: String, default: 'default.jpg' },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'A user must have a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'A user must have a passwordConfirm'],
    validate: {
      // This only works on CREATE and SAVE !!!!!!
      validator: function (el) {
        return el === this.password;
      },
      message: 'Password are not same!',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});
// ให้มีการเข้ารหัส ก่อนมีการ save
userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm fieeld
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  // ลบไป 1 second. เพราะมันถือว่าเปลี่ยนไปแล้วหน่อยนึง
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// แสดงเฉพาะ all user ที่่ active เป็น true only!!
userSchema.pre(/^find/, function (next) {
  // this points to the current
  this.find({ active: { $ne: false } });
  next();
});

// instance methods
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  //Compare เองไม่ได้เพราะ candidate ไม่ได้ hash แต่ usser hash
  // ใช้ this.password ไม่ได้เพราะ password >> select : false ไว้ [แต่ลองใช้ดุก็ได้ 555]
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    //console.log(changedTimestamp, JWTTimestamp);
    return JWTTimestamp < changedTimestamp; // 100 < 200
  }

  // False means NOT CHANGED
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // เลขที่ rand เป็น Hex
  const resetToken = crypto.randomBytes(32).toString('hex');

  //  bring resetToken to encrtp
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  //console.log({ resetToken }, this.passwordResetToken);
  // 10 mins. | 10*60 = ssecond. >>>> *1000 >>> millisecond
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
