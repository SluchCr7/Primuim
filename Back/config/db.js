const mongoose = require('mongoose');

let connectionPromise = null;

mongoose.connection.on('disconnected', () => {
    connectionPromise = null;
});

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is required to connect to MongoDB');
    }

    if (!connectionPromise) {
        connectionPromise = mongoose.connect(process.env.MONGO_URI, {
            maxPoolSize: 20,
            serverSelectionTimeoutMS: 5000
        }).then(() => {
            console.log('MongoDB connected successfully');
            return mongoose.connection;
        }).catch((error) => {
            connectionPromise = null;
            throw error;
        });
    }

    return connectionPromise;
};

module.exports = connectDB;