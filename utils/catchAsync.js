module.exports = (fn) => {
  return (req, res, next) => {
    // fn(...) return promise เลยใชช้ catch มารับได้
    // .catch(err => next(err))
    fn(req, res, next).catch(next);
  };
};
