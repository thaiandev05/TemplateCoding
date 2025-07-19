import "express";
import { UserWithoutPassword } from "./prisma";

declare module "express" {
	export interface Request {
		user?: UserWithoutPassword;
	}
}
