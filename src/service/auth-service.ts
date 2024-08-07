import { logger } from "../config/logger";
import { JWT_REFRESH_SECRET, JWT_SECRET } from "../constant/env";
import { BAD_REQUEST } from "../constant/http";
import { VerificationCodeType } from "../constant/verification-code-type";
import { RegisterUserRequest, toUserResponse, UserResponse } from "../dto/user-dto";
import { ResponseError } from "../error/response-error";
import { SessionModel } from "../model/session-model";
import { UserModel } from "../model/user-model";
import { VerificationCodeModel } from "../model/verification-code-model";
import { oneYearFromNow } from "../utils/date";
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
        })
        // create verification code
        const verificationCode = await VerificationCodeModel.create({
            userId: user._id,
            type: VerificationCodeType.EMAIL_VERIFICATION,
            expiresAt: oneYearFromNow()
        })
        // send verification email
        // create session
        const session = await SessionModel.create({
            userId: user._id,
            userAgent: registerRequest.userAgent
        })
        // sign access token & refresh token
        const refreshToken = jwt.sign(
            {sessionId: session._id},
            JWT_REFRESH_SECRET,
            {
                audience:["user"],
                expiresIn:"30d"
            }
            
        )
        const accessToken = jwt.sign(
            {   userId: user._id,
                sessionId: session._id
            },
            JWT_SECRET,
            {
                audience:["user"],
                expiresIn:"30d"
            }
            
        )
        // return user & token
        return {
            user: toUserResponse(registerRequest),
            accessToken,
            refreshToken
        };
    }
}