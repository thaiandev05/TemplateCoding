import { User } from "prisma/generated";

export interface UserWithoutPassword extends Omit<User, "hashedPassword"> {}
