import { AuthService } from "src/modules/auth/auth.service";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import type { Request } from "express";
import { Strategy } from "passport-custom";

@Injectable()
export class AuthCookieStrategy extends PassportStrategy(Strategy, "auth-cookie") {
	constructor(private readonly authService: AuthService) {
		super();
	}

	async validate(req: Request): Promise<any> {

		const accessToken = req.cookies?.access_token;
		
		if (!accessToken) {
			throw new UnauthorizedException("Access token not found");
		}

		return this.authService.validate(accessToken);
	}
}
