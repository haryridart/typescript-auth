import { Router } from "express";
import { UserController } from "../controller/auth-controller";
export const authRouter = Router();

authRouter.post("/register", UserController.register);
authRouter.post("/login", UserController.login);
authRouter.get("/logout", UserController.logout);
authRouter.get("/refresh", UserController.refresh);
authRouter.get("/email/verify/:code", UserController.verifyEmail);
authRouter.post("/password/forgot", UserController.forgotPassword);
authRouter.post("/password/reset", UserController.forgotPassword)