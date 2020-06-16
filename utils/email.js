// const nodemailer = require('nodemailer');
// const pug = require('pug');
// const htmlToText = require('html-to-text');

// // new Email(user,url).sendWelcome();

// module.exports = class Email {
//   constructor(user, url) {
//     this.to = user.email;
//     this.firstName = user.name.split(' ')[0];
//     this.url = url;
//     this.form = `Chinnawat Kaewchim <${process.env.EMAIL_FROM}>`;
//   }

//   newTransport() {
//     if (process.env.NODE_ENV === 'production') {
//       // sendgrid
//       return nodemailer.createTransport({
//         service: 'SendGrid',
//         auth: {
//           user: process.env.SENDGRID_USERNAME,
//           pass: process.env.SENDGRID_PASSWORD,
//         },
//       });
//     }
//     return nodemailer.createTransport({
//       //service: 'Gmail',
//       host: process.env.EMAIL_HOST,
//       port: 2525,
//       auth: {
//         user: 'a4cdb4e0fa7e84',
//         pass: 'd863845678a3da',
//       },
//       // tls: { rejectUnauthorized: false },
//     });
//   }

//   // Send the actual email
//   async send(template, subject) {
//     // 1) Render HTML based on a pug template
//     // __dirname คือ  util folder
//     const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
//       // ตรงนี้ส่ง res พวกนี้ไปเพราะให้ใน template มันใช้ได้ด้วย
//       firstName: this.firstName,
//       url: this.url,
//       subject,
//     });

//     // 2) Define email options
//     const mailOptions = {
//       from: this.from,
//       to: this.to,
//       subject,
//       html,
//       // แปลงเป็น text เก็บใน html
//       text: htmlToText.fromString(html),
//     };

//     // 3) Create a transport and send email
//     await this.newTransport().sendMail(mailOptions);
//   }

//   async sendWelcome() {
//     await this.send('Welcome', 'Welcome to natour family.');
//   }

//   async sendPasswordReset() {
//     await this.send(
//       'passwordReset',
//       'Your password reset token (valid for only 10 minutes.)'
//     );
//   }
// };

// /*const sendEmail = async (options) => {
//   // 1) Create a transporter
//   const transporter = nodemailer.createTransport({
//     //service: 'Gmail',
//     host: 'smtp.mailtrap.io',
//     port: 2525,
//     auth: {
//       user: 'a4cdb4e0fa7e84',
//       pass: 'd863845678a3da',
//     },
//     // tls: { rejectUnauthorized: false },
//   });

//   // 2) Define the email options
//   const mailOptions = {
//     from: 'Chinnawat Kaewchim <hello@chinnawat.io>',
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//     // html
//   };

//   // 3) Actually send the email
//   await transporter.sendMail(mailOptions);
// };
// module.exports = sendEmail;*/

const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Jonas Schmedtmann <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Sendgrid
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Send the actual email
  async send(template, subject) {
    // 1) Render HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html),
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)'
    );
  }
};
