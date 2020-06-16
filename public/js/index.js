/* eslint-disable */
import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { alert } from './alerts';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

// DOM ELEMENT
const mapBox = document.getElementById('map');
//const loginForm = document.querySelector('.form');
const loginForm = document.querySelector('.form--login');
const logoutBtn = document.querySelector('.nav__el--logout');
const updateDataForm = document.querySelector('.form-user-data');
const updatePasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

//VALUE
//  DELEGATION

if (mapBox) {
  // console.log('Hello from client side !!');
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    // ไม่ให้ load หน้าอื่น
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    // console.log(email);
    login(email, password);
  });
}
if (logoutBtn) logoutBtn.addEventListener('click', logout);

if (updateDataForm) {
  updateDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    //  เพิ่มไปต่อหลัง
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    // const email = document.getElementById('email').value;
    // const email = document.getElementById('name').value;
    form.append('photo', document.getElementById('photo').files[0]);
    console.log(form);

    // updateSettings({ name, email }, 'data');
    updateSettings(form, 'data');
  });
}

if (updatePasswordForm) {
  updatePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Update...';

    const passwordCurrent = document.getElementById('password-current').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    const password = document.getElementById('password').value;

    // เราจะล้าง field เราเลยต้องรอให้ ด้านล่างมันทำเสร็จ เพราะด้านล่างเป็น async function เราเลยรอให้เสร็จก่อนแล้วค่อย ลบค่าใน field
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );

    document.querySelector('.btn--save-password').textContent = 'Save password';

    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

console.log(bookBtn);
if (bookBtn) {
  console.log('bookbth 555');
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Process...';
    // tourId มาจาก (data-tour-id).... มันจะแปลงเป็น camelCase ให้เอง
    //const tourId = e.target.dataset.tourId;
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });
}
