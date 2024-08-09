import { now } from "mongoose";
import { logger } from "../config/logger";
import { APP_ORIGIN, JWT_REFRESH_SECRET, JWT_SECRET } from "../constant/env";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND, TOO_MANY_REQUESTS, UNAUTHORIZED } from "../constant/http";
import { VerificationCodeType } from "../constant/verification-code-type";
import { LoginUserRequest, RegisterUserRequest, ResetPasswordRequest, toUserResponse, UserResponse } from "../dto/user-dto";
import { ResponseError } from "../error/response-error";
import { SessionModel } from "../model/session-model";
import { UserModel } from "../model/user-model";
import { VerificationCodeModel } from "../model/verification-code-model";
import { fiveMinutesAgo, ONE_DAY_MS, oneHourFromNow, oneYearFromNow, thirtyDaysFromNow } from "../utils/date";
import { RefreshTokenPayload, refreshTokenSignOptions, signToken, verifyToken } from "../utils/jwt";
import { Validation } from "../validation/parser";
import { UserValidation } from "../validation/user-validation";
import jwt from "jsonwebtoken";
import { sendMail } from "../utils/sendMail";
import { getPasswordResetTemplate, getVerifyEmailTemplate } from "../utils/emailTemplates";
import { loggers } from "winston";

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
        const url = `${APP_ORIGIN}/email/verify/${verificationCode._id}`;
        const {error} = await sendMail({
            to: user.email,
            ...getVerifyEmailTemplate(url),
          });
        if(error){
            logger.debug(error);
        }
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
    static async refresh(refreshToken: string){
        const {payload} = verifyToken<RefreshTokenPayload>(
            refreshToken, {
                secret: refreshTokenSignOptions.secret
            }
        );
        if (!payload){
            throw new ResponseError(UNAUTHORIZED, "Invalid refresh token");
        }
        const now = Date.now();
        const session = await SessionModel.findById(payload.sessionId);
        if (session){
            if(session.expiresAt.getTime() < now){
                throw new ResponseError(UNAUTHORIZED, "Session expired");
            }
            // refresh the session if it is expired in the next 24 hours
            const sessionNeedRefresh = session.expiresAt.getTime() - now <= ONE_DAY_MS;
            if(sessionNeedRefresh){
                session.expiresAt = thirtyDaysFromNow();
                await session.save();
            }   
            const newRefreshToken = sessionNeedRefresh ? signToken(
                {sessionId: session._id}, 
                refreshTokenSignOptions) : undefined;
            const accessToken = signToken(
                {
                    userId: session.userId,
                    sessionId: session._id
                }
            );
            return {
                accessToken,
                newRefreshToken
            };

        }else{
            throw new ResponseError(UNAUTHORIZED, "Invalid refresh token");
        }  
    }
    static async verifyEmail(code: string){
        // validate request
        const verificationCode =Validation.validate(UserValidation.EMAIL_VERIFICATION, code);
        // get the verification code
        const validCode = await VerificationCodeModel.findOne({
            _id: verificationCode,
            type: VerificationCodeType.EMAIL_VERIFICATION,
            expiresAt: {$gt: Date.now()}
        });
        if(!validCode){
            throw new ResponseError(BAD_REQUEST, "Invalid or expired verification code");
        }else{
            // get user by id
            const updatedUser = await UserModel.findById(validCode.userId);
            if(!updatedUser){
                throw new ResponseError(BAD_REQUEST, "Failed to verify email");
            }
            updatedUser.verified = true;
            await updatedUser.save();
            // delete verification code
            await validCode.deleteOne();
        }
    }
    static async forgotPassword(emailRequest: string){
        // validate request
        const email = Validation.validate(UserValidation.EMAIL, emailRequest);
        // get user by email
        const user = await UserModel.findOne({email: email});
        if(!user){
            throw new ResponseError(NOT_FOUND, "User not found");
        }else{
            // check email rate limit
            const fiveMinAgo = fiveMinutesAgo();
            const count = await VerificationCodeModel.countDocuments({
                userId: user._id,
                type: VerificationCodeType.PASSWORD_RESET,
                createdAt: {$gt: fiveMinAgo}
            });
            if(count >= 1){
                throw new ResponseError(TOO_MANY_REQUESTS, "Too many password reset requests, please try again later");
            }
            // create verification code
            const expiresAt = oneHourFromNow();
            const verificationCode = await VerificationCodeModel.create({
                userId: user._id,
                type: VerificationCodeType.PASSWORD_RESET,
                expiresAt
            });
            // send verification email
            const url = `${APP_ORIGIN}/password/reset?code=${
                verificationCode._id
              }&exp=${expiresAt.getTime()}`;
            const {data, error} = await sendMail({
                to: user.email,
                ...getPasswordResetTemplate(url),
              });
            if(!data?.id){
                throw new ResponseError(INTERNAL_SERVER_ERROR, `${error?.name} - ${error?.message}`);
            }

            // return success
            return {
                url,
                emailId: data.id
            }

        }

    }
    static async resetPassword(request: ResetPasswordRequest){
        // validate request
        const resetPasswordRequest = Validation.validate(UserValidation.RESET_PASSWORD, request);
        // get verification code
        const validCode = await VerificationCodeModel.findOne({
            _id: resetPasswordRequest.verificationCode,
            type: VerificationCodeType.PASSWORD_RESET,
            expiresAt: {$gt: Date.now()}
        });
        if(!validCode){
            throw new ResponseError(BAD_REQUEST, "Invalid or expired verification code");
        }else{
            // get user by id
            const updatedUser = await UserModel.findById(validCode.userId);
            if(!updatedUser){
                throw new ResponseError(BAD_REQUEST, "Failed to reset password");
            }
            updatedUser.password = request.password;
            await updatedUser.save();
            // delete verification code
            await validCode.deleteOne();
        }
    }
}