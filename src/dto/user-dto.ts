
export type RegisterUserRequest = {
    name: string,
    email: string,
    password: string,
    confirmPassword: string
};
export type UserResponse = {
    name: string,
    email: string,
    token?: string
}
export function toUserResponse(user: RegisterUserRequest): UserResponse {
    return {
        name: user.name,
        email: user.email
    }
}