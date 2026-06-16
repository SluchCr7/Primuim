const mongoose = require('mongoose');

let cachedConnection = null;

const connectDB = async () => {
    if (cachedConnection) {
        return cachedConnection;
    }

    try {
        cachedConnection = await mongoose.connect(process.env.MONGO_URI, {
            maxPoolSize: 20,
            serverSelectionTimeoutMS: 5000
        });
        console.log('MongoDB connected successfully');
        return cachedConnection;
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

module.exports = connectDB;