import { Request, Response, NextFunction } from "express";
import { CREATED, OK } from "../constant/http";
import { RegisterUserRequest } from "../dto/user-dto";
import { UserService } from "../service/auth-service";
import { setAuthCookies } from "../utils/cookies";
import { logger } from "../config/logger";
import { toResponseObject } from "../dto/general-response";


export class UserController{
    static async register(req: Request, res: Response, next: NextFunction){
        try{
            const request: RegisterUserRequest = req.body as RegisterUserRequest;
            
            const responseDto = await UserService.register(request);
            const accessToken = responseDto.accessToken;
            const refreshToken = responseDto.refreshToken;
            const responseObject = toResponseObject("User created successfully", CREATED, true, responseDto.user);
            setAuthCookies({res, accessToken, refreshToken})
            .status(CREATED)
            .json(responseObject);
        }catch(err){
            logger.debug("response: " + JSON.stringify(err));
            next(err);
        }
    }
}