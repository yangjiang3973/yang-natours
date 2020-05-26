const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const mongoose = require('mongoose');
const app = require('./app');

const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
);

mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log('DB connected');
    });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`App runing on port ${port}...`);
});

// globally handle unhandled rejection
process.on('unhandledRejection', err => {
    console.log('unhandled rejection! shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

// should move it to the top
process.on('uncaughtException', err => {
    console.log('uncaught exception! shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});
