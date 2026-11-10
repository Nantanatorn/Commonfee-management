const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter;
const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });
    }
    return transporter;
};

// escape ค่าที่นำไปใส่ใน HTML ของอีเมล
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const sendMail = (options) => getTransporter().sendMail({ from: process.env.EMAIL_USER, ...options });

module.exports = { sendMail, esc };
