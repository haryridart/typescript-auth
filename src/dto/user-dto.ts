export type UserResponse = {
    name: string;
    email: string;
}
export type RegisterUserRequest = {
    name: string,
    email: string,
    userAgent: string,
    password: string,
    confirmPassword: string
};
export function toUserResponse(user: RegisterUserRequest): UserResponse {
    return {
        name: user.name,
        email: user.email
    }
}