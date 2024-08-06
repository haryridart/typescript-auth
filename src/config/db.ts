import mongoose from 'mongoose';
import { MONGO_URI } from '../constant/env';

export const connectDB = async () => {
    try {
        await mongoose.connect(
            MONGO_URI
        );
        console.log("Connected to database");
    }catch (err) {
        console.log("Could not connect to database: ", err);
        process.exit(1);
    }
}