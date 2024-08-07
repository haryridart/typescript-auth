import mongoose from "mongoose";
import { oneMonthFromNow } from "../utils/date";

export interface SessionDocument extends mongoose.Document {
    userId: mongoose.Schema.Types.ObjectId;
    expiresAt: Date;
    createdAt: Date;
    userAgent?: string;
}
const sessionSchema = new mongoose.Schema<SessionDocument>({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref:"User", index:true },
    expiresAt: { type: Date, required: true, default: oneMonthFromNow()},
    createdAt: { type: Date, required: true, default: Date.now },
    userAgent: { type: String, required: false },
});
export const SessionModel = mongoose.model<SessionDocument>("Session", sessionSchema);