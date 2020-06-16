/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  //console.log('555');
  console.log(`${email} : ${password}`);
  try {
    // เป็นหนึ่งในการส่ง data from HTML To NODE.
    ///console.log(` ${email} : ${password}`);
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: {
        // email ชื่อใน body >> email : email [ES6]
        email,
        password,
      },
    });

    // After logged success >>> LOAD page /
    if (res.data.status === 'success') {
      showAlert('success', 'logged in success');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v1/users/logout',
    });
    if (res.data.status === 'success') location.reload(true);
  } catch (error) {
    // กรณี intternet หลุดบ้าง
    showAlert('error', 'Error logging out! Try again');
  }
};
