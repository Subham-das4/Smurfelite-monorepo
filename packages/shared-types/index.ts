export * from './src/generated/prisma/index';

export interface EnquiryPayload {
    name: string;
    email: string;
    phone: string;
    message: string;
}