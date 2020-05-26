import axios from 'axios';
import { showAlert } from './alert';

export const bookTour = async (tourId) => {
    const stripe = Stripe('pk_test_oUMbcJauH7Igf8wM4rfmy4S800jLDIZJug');
    try {
        // 1) get checkout session from the server
        const session = await axios(
            `/api/v1/bookings/checkout-session/${tourId}`
        );
        // 2) create the checkout form + charge credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id,
        });
    } catch (err) {
        console.log(err);
        showAlert('Error', err.response.data.message);
    }
};
