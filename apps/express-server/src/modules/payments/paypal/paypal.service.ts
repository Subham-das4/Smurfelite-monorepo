import { CheckoutPaymentIntent, Order, OrdersController } from '@paypal/paypal-server-sdk';
// import { paypalClient } from './paypal.provider.js';

// const ordersController = new OrdersController(paypalClient);

// export const createPayPalOrder = async (totalAmount: number, internalOrderId: string): Promise<Order> => {

//     try {
//         const { result } = await ordersController.createOrder({
//             body: {
//                 intent: CheckoutPaymentIntent.Capture,
//                 purchaseUnits: [
//                     {
//                         referenceId: internalOrderId, // Your Prisma Order ID
//                         amount: {
//                             currencyCode: 'USD',
//                             value: totalAmount.toFixed(2), // PayPal requires exactly 2 decimal places as a string
//                         },
//                     },
//                 ],
//             },
//             prefer: 'return=representation',
//         });
//         return result; // This contains the 'id' you send to your frontend
//     } catch (error) {
//         console.error("PayPal Create Order Error:", error);
//         throw error;
//     }
// };


// Helper to get access token from the SDK's internal credentials
export const getPaypalAccessToken = async () => {
    const auth = Buffer.from(
        `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString('base64');

    const response = await fetch(`${process.env.PAYPAL_BASE_URL}/v1/oauth2/token`, {
        method: 'POST',
        body: 'grant_type=client_credentials',
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });

    const data = await response.json();
    return data.access_token;
}