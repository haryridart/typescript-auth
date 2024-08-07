import mongoose from "mongoose";
import { VerificationCodeType } from "../constant/verification-code-type";

export interface VerificationCodeDocument extends mongoose.Document {
    userId: mongoose.Schema.Types.ObjectId ;
    type: VerificationCodeType.EMAIL_VERIFICATION;
    createdAt: Date;
    expiresAt: Date;
}
const verificationCodeSchema = new mongoose.Schema<VerificationCodeDocument>(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref:"User", index:true },
        type: { type: String, required: true },
        createdAt: { type: Date, required: true, default: Date.now },
        expiresAt: { type: Date, required: true },
    }
);
export const VerificationCodeModel = mongoose.model<VerificationCodeDocument>("VerificationCode", verificationCodeSchema, "verification_code");