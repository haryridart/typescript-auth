import { Request, Response, NextFunction } from "express";
import { OK } from "../constant/http";
import { RegisterUserRequest } from "../dto/user-dto";
import { UserService } from "../service/auth-service";


export class UserController{
    static async register(req: Request, res: Response, next: NextFunction){
        try{
            const request: RegisterUserRequest = req.body as RegisterUserRequest;
            const response = await UserService.register(request);
            res.status(OK).json(response);
        }catch(err){
            next(err);
        }
    }
}