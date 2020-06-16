const mongoose = require('mongoose');
const slugify = require('slugify');
//const User = require('./userModel');
//const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [
        40,
        'A tour name must have lless or eual than 40 Characters.',
      ],
      //validate: [validator.isAlpha, 'Tour muust only contain character.'],
      // ตรวจสอบว่ามีแค้ char ใช่หรือไม่ [numberr,space .. ไม่ไได้]
      minlength: [10, 'A tour name must have more or eual than 10 Characters.'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have aa duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must haave a price'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either : easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating musst be above 1.0'],
      max: [5, 'Rating musst be below 5.0'],
      set: (val) => Math.round(val * 10) / 10, // 4.666 > 46.66 > 46 > 4.6
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VAL}) should be below regular price.',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: true,
    },
    description: {
      type: String,
      trim: [true, 'A tour must have a description'],
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON : ระบุข้อมูลเชิงพื้นที่
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        day: Number,
        description: String,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        // ไม่จำเป็นต้อง import User มันก็สามารถใช้งานได้
        ref: 'User',
      },
    ],
  },

  {
    // เมื่อมีการแสดง JSON ให้ ให้ virtual เป็นจริง
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// 1 = Accending
//tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// ไม่ใช้ arrow function แต่ใช้ regulr function ปกติแแทนเพราะเราตต้องการใช้ this [ใน mongoose มักใช้ regular function]
//virtual ไม่ใช่ข้อมูลใน DB จะเอาไปใช้ query ต่างๆม่ได้เพรราะมันแค่ show เฉยๆ
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  // อ้าง tour ใน reviewModel
  foreignField: 'tour',
  // _id ใน review field : tour
  localField: '_id',
});

// DOCUMENT MIDDLEWWARE : runs before .save()  and .create() [Not for update]
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
  //console.log(this);
});

// ไม่ใช้ Embedd เพราะถ้า user มีการเปลี่ยนข้อมูลต้องมาเปลี่ยนใน tour ด้วย
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   // ใช้ promiseAll เพราะ await ด้านบน return ppromise มาก ทำให้ guidesPromises เป๋นArray promise
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// tourSchema.pre('save', function (next) {
//   console.log('Will save document ...');
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
  // เอาที่ขึ้นต้นด้วย find ทั้งหมด Ex. findOne, findAndUpdate ...
  // tourSchema.pre('find', function (next) {
  this.find({ secretTour: { $ne: true } });
  // ประกาศไว้ให้ post เรียกใช้ this.start
  this.satrt = Date.now();
  next();
});
tourSchema.pre(/^find/, function (next) {
  // ะthis คือ ชี้ไปที่ current query
  this.populate({
    path: 'guides',
    // สิ่งที่ไม่ต้องการใให้มันแสดง
    select: '-__v -passwordChangedAt',
  });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  //console.log(`Query took ${Date.now() - this.satrt}`);
  //console.log(docs);
  next();
});

// AGGERATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   // เพิ่ม stage of aggregate ให้มัน match เฉพาะ ที่ secretTour : False
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
// const testTour = new Tour({
//   name: 'The Park Camper',
//   price: 967,
// });
// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.log('ERROR !!', err);
//   });
