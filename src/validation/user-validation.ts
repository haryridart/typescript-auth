import { z,ZodType } from "zod";

export class UserValidation{
    static readonly REGISTER: ZodType = z.object({
        name: z.string().min(1).max(255),
        email: z.string().email().min(1).max(255),
        password: z.string().min(6).max(255),
        userAgent: z.string().optional(),
        confirmPassword: z.string().min(6).max(255)
    })
    .refine(data => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"]
    });
    static readonly LOGIN: ZodType = z.object({
        email: z.string().email().min(1).max(255),
        password: z.string().min(6).max(255)
    });
    static readonly RESET_PASSWORD: ZodType = z.object({
        password: z.string().min(6).max(255),
        verificationCode: z.string().min(1).max(24)
    })
    static readonly EMAIL_VERIFICATION: ZodType = z.string().min(1).max(24);
    static readonly EMAIL: ZodType = z.string().email().min(1).max(255);
}