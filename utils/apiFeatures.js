class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // กรองพวก EX. duration =5 , { difficult: 'easy', duration : {gte : 5} }, duration[gte]=1
    // ลองดูแล้ว filter ไม่ได้ใช้
    // 1A ) Filtering
    const queryObj = { ...this.queryString };

    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    // ใช้ [el] เพราะค่าใน Obj ทีี่จะวนไม่คงที่ควรใช้ [] เพราะมันเปลี่ยนตามการเรียกใชเ้ไม่คงที่่ แต่ถ้าควที่ใช้ . ได้
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1B ) Advance Filtering
    let queryStr = JSON.stringify(queryObj);
    //console.log(this.queryString);
    // console.log(queryStr);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    //console.log(queryStr);
    // { difficult: 'easy', duration : {$gte : 5} }
    // { difficult: 'easy', duration : {gte : 5} }

    this.query = this.query.find(JSON.parse(queryStr));

    // SOL 1 : วิธี mongoDB ปกติ
    // const tours = await Tour.find({
    //   duration: '5',
    // });
    // SOL 2 : ใช้ method ของ mongoose
    // const tours = await Tour.find()
    //   .where('duration')
    //   .equals(5)
    //   .where('difficulty')
    //   .equals('easy');

    return this;
    // this ช่วยให้ return obj ที่สามารถเข้าถึงได้
  }

  sorting() {
    if (this.queryString.sort) {
      //console.log(this.queryString.sort);
      // {sort: '-ratingsAverage,price', limit: '5'} >>> -ratingsAverage price
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
      // sort('price ratingsAverage')
      // ถ้า price เท่ากันให้sort ตาม ratingsAverage
    } else {
      this.query = this.query.sort('-createAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      // select('name duration ddifficulty')
      this.query = this.query.select(fields);
    } else {
      // ไม่เลือก __v แสดงให้ Client
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    // page=3&limit=10, 1-10 page1, 11-20 page2, 21-30 page3 ...
    // Assume : want page 3
    //query = query.skip(3).limit(10);
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}
module.exports = APIFeatures;
