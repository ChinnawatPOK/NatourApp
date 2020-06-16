/* eslint-disable */
// es6 module syntax not js module ที่ใช้ใน node
import axios from 'axios';
import { showAlert } from './alerts';

// Type is 'password'  or  'data'
export const updateSettings = async (data, type) => {
  try {
    const currentUrl =
      type === 'password'
        ? 'http://127.0.0.1:3000/api/v1/users/updateMyPassword'
        : 'http://127.0.0.1:3000/api/v1/users/updateMe';
    const res = await axios({
      method: 'PATCH',
      url: currentUrl,
      // data : data
      data,
    });

    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
