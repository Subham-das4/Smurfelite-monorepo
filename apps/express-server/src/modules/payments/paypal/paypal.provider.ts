// import {
//     Client,
//     Environment,
//     LogLevel
// } from '@paypal/paypal-server-sdk';

// const clientId = process.env.PAYPAL_CLIENT_ID!;
// const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;

// export const paypalClient = new Client({
//     clientCredentialsAuthCredentials: {
//         oAuthClientId: clientId,
//         oAuthClientSecret: clientSecret,
//     },
//     environment: Environment.Sandbox, // Change to Environment.Production when live
//     logging: {
//         logLevel: LogLevel.Info,
//         logRequest: {
//             includeQueryInPath: true,
//             logBody: true,
//             logHeaders: true,
//         },
//         logResponse: {
//             logBody: true,
//             logHeaders: true,
//         },
//     },
// });
