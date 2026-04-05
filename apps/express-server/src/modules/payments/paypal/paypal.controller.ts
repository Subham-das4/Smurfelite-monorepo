import { Request, Response } from 'express';
import { getPaypalAccessToken } from './paypal.service.js';

export const paypalwebhookController = async (req: Request, res: Response) => {
    const headers = req.headers;
    const body = req.body;

    const accessToken = await getPaypalAccessToken();
    console.log({
        accessToken,

    })
    res.status(200).json({
        message: `Webhook Verified! Event Type: ${body.event_type}`,
    })
};