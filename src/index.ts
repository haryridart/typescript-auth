import "dotenv/config";
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db';
import { APP_ORIGIN, NODE_ENV, PORT } from "./constant/env";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errorHandler";
import { OK } from "./constant/http";
import { authRouter } from "./route/auth-route";


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: APP_ORIGIN,
    credentials: true
}));
app.use(cookieParser());

app.listen(PORT, async() => {
    console.log(`Server is running on port ${PORT} in ${NODE_ENV} mode`);
    await connectDB();
});

app.get('/', (req, res, next) => {
    return res.status(OK).json({
        status: "healthy"
    })
});
app.use("/auth", authRouter);
app.use(errorHandler);