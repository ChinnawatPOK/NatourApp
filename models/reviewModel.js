const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      require: [true, 'Review can not be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    // เมื่อมีการแสดง JSON ให้ ให้ virtual เป็นจริง
    // เป็น field ที่ไม่ได้เก็บไว้ใน DB แต่เอามาแสดงใน output
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ไม่ให้ user คนนั้นสามารถ เพิ่ม reviewได้อีก[user นั้น รีวิว ทัว นั้นได้แค่ครั้งเดียว]
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// Query Middleware
reviewSchema.pre(/^find/, function (next) {
  // this คือ ชี้ไปที่ current query
  /* this.populate({
    path: 'tour',
    // สิ่งที่ไม่ต้องการใให้มันแสดง
    select: 'name',
  })*/
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

reviewSchema.statics.calAverageRatings = async function (tourId) {
  // this : call this model
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  //console.log(stats);

  // กันไม่มี review
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// After new review was created
reviewSchema.post('save', function () {
  // this points to current review
  // ใช้ this.constructor เพราะ มันมองไม่เหน Review
  // Constrctor คือ modelที่สร้างcurrent document นี้
  this.constructor.calAverageRatings(this.tour);
});

//findByIdAndUpdate เหมือน findOneAnd
//findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // เก็บใน this.r เพืื่อให้ post เรียกใช้ได้
  // เราต้องหาร tourId เื่อส่วไปให้ post
  this.r = await this.findOne();
  //console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne() : does NOT work here, quuery has already executed
  await this.r.constructor.calAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
