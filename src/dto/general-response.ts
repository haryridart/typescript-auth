export type ResponseObject = {
    message: string,
    status: number,
    data?: any,
    success: boolean
}
export const toResponseObject = (message: string, status: number, success: boolean, data?: any): ResponseObject => {
    return {
        message: message,
        status:status,
        success: success,
        data
    }
}