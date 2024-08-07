import { ErrorRequestHandler } from "express";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "../constant/http";
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ResponseError } from "../error/response-error";


export const zodErrorHandler = async (error: Error, req: Request, res: Response, next: NextFunction) => {
    if(error instanceof ZodError) {
        res.status(BAD_REQUEST).json(
            {
                errors: `Validation Error: ${JSON.stringify(error)}`
            }
        );
    }else if (error instanceof ResponseError) {
        res.status(error.status).json(
            {
                errors: error.message
            }
        );
    }else{
        res.status(INTERNAL_SERVER_ERROR).json(
            {
                errors: error
            }
        );
    }
}