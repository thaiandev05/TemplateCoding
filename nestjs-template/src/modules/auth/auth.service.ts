import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { verify } from 'argon2';
import { randomUUID } from "crypto";
import { Response } from "express";
import { User } from "prisma/generated/prisma";
import { PrismaService } from "src/prisma/prisma.service";
import { TicketService } from "../ticket/ticket.service";
import { LoginWithPhone } from "./dto/loginWithPhone.dto";
import { TokenService } from "./token.service";

const MAX_AGE_SESSION_FILE = 10 * 365 * 24 * 60 * 60 * 1000// 10years
const MAX_AGE_REFRESH_TOKEN = 7 * 24 * 60 * 60 * 1000 // 7 days
const MAX_AGE_ACCESS_TOKEN = 60 * 60 * 1000

@Injectable()
export class AuthService {


    constructor(
        private readonly tokenService: TokenService,
        private readonly prismaService: PrismaService,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly ticketService: TicketService
    ) {
    }

    // validate user with accesstoken
    async validate(accessToken: string) {
        try {
            const payload = await this.jwtService.verifyAsync(accessToken, {
                secret: this.configService.getOrThrow<string>("JWT_SECRET"),
            })

            const user = await this.prismaService.user.findUnique({
                where: { id: payload.sub }
            })

            if (!user) {
                throw new UnauthorizedException("User not found");
            }

            return user
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error
            }
            throw new UnauthorizedException("Invalid or expired access token");
        }
    }

    // create session when login 
    async createSession(user: User, res: Response) {
        const tokens = await this.tokenService.generateTokens(user.id, user.email)

        // check sesisonId 
        let sessionId = res.req.cookies?.session_id
        if (!sessionId) {
            sessionId = randomUUID() // generate sessionId if user have not sessonId
        }

        // store accesstoken and refreshtoken
        const session = await this.tokenService.storeTokens(
            user.id,
            tokens.refreshToken,
            sessionId ? sessionId : undefined
        )

        //set age sesison 
        res.cookie('session_id', session.id, {
            maxAge: MAX_AGE_SESSION_FILE
        })

        // setup tokens
        res
            .cookie('refresh_token', tokens.refreshToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                maxAge: MAX_AGE_REFRESH_TOKEN,
                path: '/',
            })
            .cookie('access_token', tokens.accessToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                maxAge: MAX_AGE_ACCESS_TOKEN,
                path: '/',
            })

        return { tokens, session }
    }


    // login with phone number
    async login(data: LoginWithPhone, res: Response) {

        const exitedUser = await
            this.prismaService.user.findFirst({
                where: { email: data.email },
                omit: { hashPassword: false } // user without hashedPassword
            })

        // verify password
        const isMatched = await verify(exitedUser.hashPassword, data.password)

        if (!isMatched) {
            throw new UnauthorizedException('Password is not matched')
        }

        // create session
        await this.createSession(exitedUser, res)

        // set status online for user
        await this.ticketService.setUserOnline(exitedUser.id)

        const { hashPassword, ...userWithoutPassword } = exitedUser

        return userWithoutPassword
    }

    // logut account
    async logout(res: Response, sessionId?: string) {
        // delete tokens cookie
        res.clearCookie("access_token").clearCookie("refresh_token")

        // find session
        const session = await this.prismaService.session.findFirst({
            where: { id: sessionId }
        })

        const sid = sessionId || res.req.cookies?.session_id;
        if (!sid) {
            throw new NotFoundException("Session ID is required for logout");
        }

        // delete hasedToken
        await this.prismaService.session.updateMany({
            where: { id: sid, userId: session?.userId },
            data: { hashedToken: null },
        })

        // set status offline
        await this.ticketService.setUserOffline(session?.userId)

        return {
            message: "Done"
        }
    }

}