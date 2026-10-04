const nodeMailer = require('nodemailer');

module.exports = async (userEmail, subject, content) => {
    const transporter = nodeMailer.createTransport({
        auth: {
            user: process.env.APP_EMAIL,
            pass: process.env.APP_PASSWORD
        },
        host: "smtp.gmail.com",
        port: 587,
        secure: false
    })

    const mailOptions = {
        email: process.env.APP_EMAIL,
        to: userEmail,
        subject: subject,
        html: content
    }

    return transporter.sendMail(mailOptions);
}