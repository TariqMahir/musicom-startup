import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, firestore, payments } from 'lib/firebase';
import { BILLING } from 'lib/routes';
import { Stripe } from '@stripe/stripe-js';

export async function CreateCheckout(user, referralCode) {
  // const session = await createCheckoutSession(payments, {
  //   price: "price_1OMVNxJwYkGBUeJ3zNKb6ASI",
  //   success_url: window.location.origin,
  //   cancel_url: window.location.origin,
  // });
  // console.log(session);
  // if (session) {
  //   window.location.assign(session.url);
  // } else {
  //   console.log("No session");
  // }

  // onCurrentUserSubscriptionUpdate(payments, (snapshot) => {
  //   for (const change in snapshot.changes) {
  //     if (change.type === "added") {
  //       console.log(
  //         `New subscription added with ID: ${change.subscription.id}`
  //       );
  //     }
  //   }
  // });
  try {
    const checkoutSessionRef = await addDoc(
      collection(
        firestore,
        user?.businessName ? 'businesses' : 'users',
        user?.id,
        'checkout_sessions'
      ),
      {
        price: 'price_1OMVNxJwYkGBUeJ3zNKb6ASI',
        allow_promotion_codes: true,
        success_url: window.location.origin + BILLING,
        cancel_url: window.location.origin + BILLING,
        allow_promotion_codes: true,
        discounts: {
          promotion_code: user?.referralCode ? user?.referralCode : 'test', // eg. 'promo_0123456789'
        },
      }
    );

    onSnapshot(checkoutSessionRef, async (snap) => {
      const { error, url } = snap.data();
      if (error) {
        // Show an error to your customer and
        // inspect your Cloud Function logs in the Firebase console.
        alert(`An error occured: ${error.message}`);
      }
      if (url) {
        // We have a Stripe Checkout URL, let's redirect.
        window.location.assign(url);
      }
    });
    // onSnapshot(checkoutSessionRef, async (snap) => {
    //   const { sessionId } = snap.data();

    //   console.log(snap, snap.data(), sessionId);
    //   if (sessionId) {
    //     const stripe = await getStripe();

    //     stripe.redirectToCheckout({ url });
    //   }
    // });
  } catch (error) {
    console.error('Error creating checkout session:', error.message);
  }
}

//export async function createCheckoutSession(user, promoCode?: string) {
// const session = await stripe.checkout.sessions.create({
// Your existing session configuration
// promotion_code: promoCode, // Add this line to include the promotion code
// Make sure to include error handling and other necessary logic
// });

//return session.url; // Or however you handle the session URL
//}
