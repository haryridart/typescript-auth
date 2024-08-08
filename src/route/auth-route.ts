import { Router } from "express";
import { UserController } from "../controller/auth-controller";
export const authRouter = Router();

authRouter.post("/register", UserController.register);
authRouter.post("/login", UserController.register);