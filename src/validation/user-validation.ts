import { z,ZodType } from "zod";

export class UserValidation{
    static readonly REGISTER: ZodType = z.object({
        name: z.string().min(1).max(255),
        email: z.string().email().min(1).max(255),
        password: z.string().min(6).max(255),
        confirmPassword: z.string().min(6).max(255)
    })
    .refine(data => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"]
    });
}