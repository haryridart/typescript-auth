import { RegisterUserRequest, toUserResponse, UserResponse } from "../dto/user-dto";
import { Validation } from "../validation/parser";
import { UserValidation } from "../validation/user-validation";

export class UserService {

    static async register(request: RegisterUserRequest): Promise<UserResponse> {
        const registerRequest = Validation.validate(UserValidation.REGISTER, request);
        return toUserResponse(registerRequest);
    }
}