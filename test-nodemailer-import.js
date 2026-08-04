import nodemailer from 'nodemailer';

console.log('nodemailer:', typeof nodemailer);
console.log('nodemailer.createTransport:', typeof nodemailer.createTransport);
console.log('nodemailer.default:', typeof nodemailer.default);
console.log('Keys:', Object.keys(nodemailer));
