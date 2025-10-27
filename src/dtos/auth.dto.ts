import { z } from 'zod';

export const CreateEmailSchema = z.object({
    email: z.string().email(),
});
export type CreateEmailDTO = z.infer<typeof CreateEmailSchema>;

export const BasicAuthTokenSchema = z.object({
    authToken: z.string()
});
export type BasicAuthTokenDTO = z.infer<typeof BasicAuthTokenSchema>;

export const CreateUserSchema = z.object({
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    password: z.string().min(8),
});
export type CreateUserDTO = z.infer<typeof CreateUserSchema>;

export const UpdateNameSchema = z.object({
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
});
export type UpdateNameDTO = z.infer<typeof UpdateNameSchema>;

export const LoginUserSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});
export type LoginUserDTO = z.infer<typeof LoginUserSchema>;

export const ResetPasswordSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    rePassword: z.string().min(8),
});
export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;

export const VerifyEmailSchema = z.object({
    email: z.string().email(),
    token: z.string().min(6).max(6),
});
export type VerifyEmailDTO = z.infer<typeof VerifyEmailSchema>;

//Responses
export const UserDataSchema = z.object({
    id: z.number(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.string().email(),
});
export type UserData = z.infer<typeof UserDataSchema>;

export const LoginUserDataSchema = z.object({
    token: z.string(),
    userData: UserDataSchema,
});
export type LoginUserData = z.infer<typeof LoginUserDataSchema>;
