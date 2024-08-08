import { logger } from "../config/logger";
import { JWT_REFRESH_SECRET, JWT_SECRET } from "../constant/env";
import { BAD_REQUEST } from "../constant/http";
import { VerificationCodeType } from "../constant/verification-code-type";
import { LoginUserRequest, RegisterUserRequest, toUserResponse, UserResponse } from "../dto/user-dto";
import { ResponseError } from "../error/response-error";
import { SessionModel } from "../model/session-model";
import { UserModel } from "../model/user-model";
import { VerificationCodeModel } from "../model/verification-code-model";
import { oneYearFromNow } from "../utils/date";
import { refreshTokenSignOptions, signToken } from "../utils/jwt";
import { Validation } from "../validation/parser";
import { UserValidation } from "../validation/user-validation";
import jwt from "jsonwebtoken";

export class UserService {

    static async register(request: RegisterUserRequest){
        const registerRequest = Validation.validate(UserValidation.REGISTER, request);
        // verify existing user doesn't exist
        const existingUser = await UserModel.exists({ email: registerRequest.email });
        if(existingUser){
            throw new ResponseError(BAD_REQUEST, "User already exist!")
        }
        // create user
        const user = await UserModel.create({
            name: registerRequest.name,
            email: registerRequest.email,
            password: registerRequest.password
        });
        const userId = user._id;
        // create verification code
        const verificationCode = await VerificationCodeModel.create({
            userId: userId,
            type: VerificationCodeType.EMAIL_VERIFICATION,
            expiresAt: oneYearFromNow()
        });
        // send verification email
        // create session
        const session = await SessionModel.create({
            userId: userId,
            userAgent: registerRequest.userAgent
        });
        const sessionInfo = {
            sessionId: session._id
        };
        // sign access token & refresh token
        const refreshToken = signToken(sessionInfo, refreshTokenSignOptions);
        const accessToken = signToken(
            {   
                ...sessionInfo,
                userId: userId
            }
        );
        // return user & token
        return {
            user: toUserResponse(registerRequest),
            accessToken,
            refreshToken
        };
    }
    static async login(request: LoginUserRequest){
        // validate request
        const loginRequest = Validation.validate(UserValidation.LOGIN, request);
        // get the user by email
        const user = await UserModel.findOne({ email: request.email });
        if(!user){
            throw new ResponseError(BAD_REQUEST, "Email or password is incorrect!")
        }
        const userId = user._id;
        // validate password is correct
        const isPasswordCorrect = await user.comparePassword(loginRequest.password);
        if(!isPasswordCorrect){
            throw new ResponseError(BAD_REQUEST, "Email or password is incorrect!")
        }
        // create session
        const session = await SessionModel.create({
            userId: userId,
            userAgent: loginRequest.userAgent
        });
        const sessionInfo = {
            sessionId: session._id
        }
        // sign access token & refresh token
        const refreshToken = signToken(sessionInfo, refreshTokenSignOptions);
        const accessToken = signToken(
            {   
                ...sessionInfo,
                userId: userId
            }
        );
        // return user & token
        return {
            user: toUserResponse(loginRequest),
            accessToken,
            refreshToken
        };
    }
    static async logout(sessionId: string){
    }
}