import nodemailer, { Transporter } from 'nodemailer';
import hbs from 'nodemailer-express-handlebars';
import path from 'path';
import { SENDGRID_API_KEY } from './env';

const transporter: Transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 2525,
    secure: false,
    auth: {
        user: "apikey",
        pass: SENDGRID_API_KEY,
    },
});

const handleBarsOptions = {
    viewEngine: {
        partialsDir: path.resolve(__dirname, '../templates'),
        layoutsDir: path.resolve(__dirname, '../templates/layouts'),
        defaultLayout: 'main',
        extname: '.handlebars',
    },
    viewPath: path.resolve(__dirname, '../templates'),
    extName: '.handlebars',
};

transporter.use('compile', hbs(handleBarsOptions));

export { transporter };
