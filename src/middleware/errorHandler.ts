import { ErrorRequestHandler } from "express";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "../constant/http";
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ResponseError } from "../error/response-error";
import { ResponseObject } from "../dto/general-response";
import { logger } from "../config/logger";


export const zodErrorHandler = async (error: Error, req: Request, res: Response, next: NextFunction) => {
    if(error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => {
            return `${err.message}`;
          }).join(', ');
        const resp:ResponseObject = {
            message: `Validation Error: ${errorMessages}`,
            status: BAD_REQUEST,
            success: false
        }
        res.status(BAD_REQUEST).json(resp);
    }else if (error instanceof ResponseError) {
        const resp:ResponseObject = {
            message: `${error.message}`,
            status: error.status,
            success: false
        }
        res.status(error.status).json(resp);
    }else{
        const resp:ResponseObject = {
            message: `${error.message}`,
            status: INTERNAL_SERVER_ERROR,
            success: false
        }
        res.status(INTERNAL_SERVER_ERROR).json(resp);
    }
}