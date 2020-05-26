const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

// new Email(user, url).sendWelcome();
// user is the receivers, url is a link included into email, so user can click
module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `Yang Jiang<${process.env.EMAIL_FROM}>`;
    }

    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            return nodemailer.createTestAccount({
                service: 'SendGrid',
                auth: {
                    user: process.env.SENDGRID_USER,
                    pass: process.env.SENDGRID_PASSWORD,
                },
            });
        }
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
            // Activate in gmail 'less secure app' option
        });
    }

    async send(template, subject) {
        // 1) render the html for the email based on pug template
        const html = pug.renderFile(
            `${__dirname}/../views/emails/${template}.pug`,
            {
                firstName: this.firstName,
                url: this.url,
                subject,
            }
        );

        // 2) define the email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject: subject,
            html,
            text: htmlToText.fromString(html),
        };

        // 3) create a transport and send email
        await this.newTransport().sendMail(mailOptions);
    }

    async sendWelcome() {
        await this.send('welcome', 'Welcome to the Natours Family');
    }
};
