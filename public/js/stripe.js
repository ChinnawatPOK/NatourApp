/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe(
  'pk_test_51GuCzQBK4Yygkx9LTI1h2vfloCu1hRxVWGc3t1BTDn0qYSPlvArRQ1spfCTPNiczUGBFmgXDgOazJOLvl7Txw4Jx00DV3jf6ux'
);

export const bookTour = async (tourId) => {
  try {
    // touId มาจาก tour.pug mี่กำหนดไว่ใน html ล่างๆๆๆๆ
    // 1) get checkout session from API
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);

    // 2) Create checkput from + change credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
