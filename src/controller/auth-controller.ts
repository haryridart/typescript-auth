import { Request, Response, NextFunction } from "express";
import { CREATED, OK, UNAUTHORIZED } from "../constant/http";
import { LoginUserRequest, RegisterUserRequest } from "../dto/user-dto";
import { UserService } from "../service/auth-service";
import { clearAuthCookies, getAccessTokenCookieOptions, getRefreshTokenCookieOptions, setAuthCookies } from "../utils/cookies";
import { logger } from "../config/logger";
import { toResponseObject } from "../dto/general-response";
import { verify } from "jsonwebtoken";
import { verifyToken } from "../utils/jwt";
import { SessionModel } from "../model/session-model";
import { ResponseError } from "../error/response-error";


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
            next(err);
        }
    }
    static async login(req: Request, res: Response, next: NextFunction){
        try{
            const loginRequest = req.body as LoginUserRequest;
            const responseDto = await UserService.login(loginRequest);
            const accessToken = responseDto.accessToken;
            const refreshToken = responseDto.refreshToken;
            const responseObject = toResponseObject("User logged in successfully", OK, true);
            setAuthCookies({res, accessToken, refreshToken})
            .status(OK)
            .json(responseObject);
        }catch(err){
            next(err);
        }
    }
    static async logout(req: Request, res: Response, next: NextFunction){
        try{
            const accessToken = req.cookies.accessToken as string || "";
            const {payload} = verifyToken(accessToken);
            if(payload){
                await SessionModel.findByIdAndDelete(payload.sessionId);
            }
            const responseObject = toResponseObject("Logout successfull", OK, true);
            return clearAuthCookies(res).
            status(OK).json(responseObject);
        }catch(err){
            next(err);
        }
    }
    static async refresh(req: Request, res: Response, next: NextFunction){
        try{
            const refreshToken = req.cookies.refreshToken as string || undefined;
            if(!refreshToken){
                throw new ResponseError(UNAUTHORIZED, "Refresh token is missing");
            }
            const {accessToken, newRefreshToken} = await UserService.refresh(refreshToken);
            if(newRefreshToken){
                res.cookie("refreshToken", newRefreshToken, getRefreshTokenCookieOptions());    
            }
            const responseObject = toResponseObject("Access token refreshed", OK, true);
            return res.status(OK).
            cookie("accessToken", accessToken, getAccessTokenCookieOptions())
            .json(responseObject)
        }catch(err){
            next(err);
        }
    }
    static async verifyEmail(req: Request, res: Response, next: NextFunction){
        try{
            const code = req.params.code as string;
            await UserService.verifyEmail(code);
            const responseObject = toResponseObject("Email verified successfully", OK, true);
            return res.status(OK).json(responseObject);
        }  catch(err){
            next(err);
        }
    }
}