import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "src/prisma/prisma.service";
import { JwtPayload } from "./auth.interface";

@Injectable()
export class TokenService {

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly prismaService: PrismaService,
    ) { }
    
    // generate token with accesstoken and refreshtoken
    async generateTokens(userId: string, email: string) {
        const payload: JwtPayload = { sub: userId, email: email } // create type payload 

        // generate token 
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.getOrThrow<string>("JWT_SECRET"),
                expiresIn: this.configService.getOrThrow<string>("ACCESS_TOKEN_TIME_LIFE")
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.getOrThrow<string>("JWT_SECRET"),
                expiresIn: this.configService.getOrThrow<string>("REFRESH_TOKEN_TIME_LIFE")
            })
        ])

        return { accessToken, refreshToken }
    }

    // store tokens
    async storeTokens(userId: string, refreshToken: string, sessionId: string) {
        const session = await this.prismaService.session.upsert({
            where: { id: sessionId },
            update: {
                hashedToken: refreshToken // update with hashed token if user have sessionid
            },
            // create new session if user have session yet
            create: {
                id: sessionId,
                userId: userId,
                hashedToken: refreshToken
            }
        })
        return session
    }

    // generate code with 6 random tokens
    generateVerificationCode(length = 6): string {
        const digits = '0123456789';
        let code = '';
        for (let i = 0; i < length; i++) {
            code += digits[Math.floor(Math.random() * digits.length)];
        }
        return code
    }

    // transform phone number to code national
    toE164(phone: string): string {
        phone = phone.replace(/\D/g, '');
        if (phone.startsWith('0')) {
            return '+84' + phone.substring(1);
        }
        if (phone.startsWith('84')) {
            return '+84' + phone.substring(2);
        }
        if (phone.startsWith('+84')) {
            return phone;
        }
        return phone;
    }
}