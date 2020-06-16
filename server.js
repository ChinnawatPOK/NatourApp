const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGTH EXCEPTION Shutting down .....');
  console.log(err.name, err.message);
  process.exit(1);
});

// ต้องdeclar ก่อนเพราะเดี๋ยว app มันจะไม่เห็น
dotenv.config({ path: './config.env' });
const app = require('./app');
// จะอ่าานตัวแปรจาก path แล้วเก็บตัวแปรใน env node

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB cconnect successful ^_^'));

// *********************************4) START SERVER *********************
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Running omn port ${port}...`);
});

// จับ Error นอกเหนือ express , mongo เช่นแบบ password DB ผิด เป็นต้น
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLER REJECT Shutting down .....');
  console.log(err.name, err.message);
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});
// console.log(x);
