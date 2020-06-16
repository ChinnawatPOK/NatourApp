const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');

exports.setTouruserIds = (req, res, next) => {
  // Allow nested routes
  // ดึง req.params มาจาก url tourId
  if (!req.body.tour) req.body.tour = req.params.tourId;
  // req.user มาจาก middleware Protect
  //._id ก็ได้
  if (!req.body.user) req.body.user = req.user.id;
  //console.log(req.body);
  next();
};

/*exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId };

  const reviews = await Review.find(filter);

  res.status(200).json({
    status: 'success',
    resultlrength: reviews.length,
    data: {
      reviews,
    },
  });
});*/
exports.getAllReviews = factory.getAll(Review);

/*exports.createReview = catchAsync(async (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  const newReview = await Review.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      review: newReview,
    },
  });
});*/
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);

exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
