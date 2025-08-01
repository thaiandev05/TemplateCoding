import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { hash, verify } from 'argon2';
import { randomInt, randomUUID } from "crypto";
import { Request, Response } from "express";
import { Provider, User } from "prisma/generated/prisma";
import { findOrThrow } from "src/common/helper/prisma.helper";
import { EmailService } from "src/email/email.service";
import { PrismaService } from "src/prisma/prisma.service";
import * as twilio from 'twilio';
import { CartService } from "../cart/cart.service";
import { ChangePasswordDto } from "./dto/changePassword.dto";
import { LoginWithPhone } from "./dto/loginWithPhone.dto";
import { RegisterSellerDto } from "./dto/registerSeller.dto";
import { TokenService } from "./token.service";
import { TicketService } from "../ticket/ticket.service";

const MAX_AGE_SESSION_FILE = 10 * 365 * 24 * 60 * 60 * 1000// 10years
const MAX_AGE_REFRESH_TOKEN = 7 * 24 * 60 * 60 * 1000 // 7 days
const MAX_AGE_ACCESS_TOKEN = 60 * 60 * 1000

@Injectable()
export class AuthService {

    private client: twilio.Twilio

    constructor(
        private readonly tokenService: TokenService,
        private readonly prismaService: PrismaService,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly emailService: EmailService,
        private readonly cartService: CartService,
        private readonly ticketService: TicketService
    ) {
        this.client = twilio(
            configService.getOrThrow<string>("TWILIO_ACCOUNT_SID"),
            configService.getOrThrow<string>("TWILIO_AUTH_TOKEN")
        )
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

    // sign in with facebook
    async oauthTwoFacebook(user: User, res: Response) {
        const provider: Provider = "FACEBOOK"

        const { idOauth2: providerId, email, familyName: displayName } = user;

        if (!providerId || !email) {
            throw new Error('Missing required OAuth2 user details: providerId or email');
        }

        // validate user
        const validatedUser = await this.validateOAuthLogin({ providerId, email, displayName, provider });

        // create cart user
        await this.cartService.createCart(user.id)

        // create session
        await this.createSession(validatedUser, res)

        // set status online for user
        await this.ticketService.setUserOnline(user.id)

        const { hashPassword, ...userWithoutPassword } = validatedUser;

        return userWithoutPassword
    }

    // validate userGoogle
    async validateOAuthLogin({ providerId, email, displayName, provider }) {
        let user = await this.prismaService.user.findFirst({
            where: { email: email }
        })

        if (!user) {
            user = await this.prismaService.user.create({
                data: {
                    email: email,
                    familyName: displayName || '',
                    facebookId: providerId,
                    provider: provider,
                    updateAt: new Date(),
                    idOauth2: providerId,
                    statusAccount: "ACTIVE"
                }
            })
        }
        return user
    }

    // sign in with google
    async oauthTwoGoogle(user: User, res: Response) {
        const provider: Provider = "GMAIL"
        const { idOauth2: providerId, email, familyName: displayName } = user;

        if (!providerId || !email) {
            throw new Error('Missing required OAuth2 user details: providerId or email');
        }

        // validate google user
        const validatedUser = await this.validateOAuthLogin({ providerId, email, displayName, provider });

        // create cart
        await this.cartService.createCart(user.id)

        // create session
        await this.createSession(validatedUser, res)

        // set status online for user
        await this.ticketService.setUserOnline(user.id)

        const { hashPassword, ...userWithoutPassword } = validatedUser;

        return userWithoutPassword
    }

    // handle with phone number
    async handleCodeRegisterSms(phoneNumber: string, code: string) {
        await this.client.messages.create({
            body: `Đây là mã để xác minh ${code}`,
            from: this.configService.getOrThrow<string>("TWILIO_PHONE_NUMBER"),
            to: phoneNumber
        })
    }

    // send code register sms
    async sendCodeRegisterSms(phoneNumber: string) {
        const formatPhone = this.tokenService.toE164(phoneNumber) // formart phone number

        const token = this.tokenService.generateVerificationCode()// generate code

        let exitedUser = await findOrThrow(
            this.prismaService.user.findFirst({ where: { phoneNumber: phoneNumber } })
        )

        // create cart
        await this.cartService.createCart(exitedUser.id)

        // if user not found , create new user
        if (!exitedUser) {
            exitedUser = await this.prismaService.user.create({
                data: {
                    id: randomUUID(),
                    phoneNumber: formatPhone,
                    provider: "PHONE",
                    statusAccount: "DEACTIVATED"
                }
            })
        }

        // create token code
        await this.prismaService.code.create({
            data: {
                token: token,
                authorId: exitedUser.id
            }
        });

        await this.handleCodeRegisterSms(formatPhone, token)

        return token
    }

    // verify code when register sms
    async verifyAccountSms(phoneNumber: string, tokenVerify: string) {

        // send code verify account
        const token = await this.sendCodeRegisterSms(phoneNumber)

        if (tokenVerify != token) {
            throw new BadRequestException('Token is not matched')
        }

        // find user with phone number
        const user = await this.prismaService.user.findFirst({
            where: { phoneNumber: phoneNumber },
            select: { id: true }
        })

        // update status account 
        await this.prismaService.user.update({
            where: { id: user.id },
            data: {
                codes: null,
                statusAccount: "ACTIVE"
            }
        })
    }

    // change password
    async changePassword(data: ChangePasswordDto, req: Request) {

        const user = await findOrThrow(
            this.prismaService.user.findUnique({
                where: { id: req.user.id },
                omit: { hashPassword: false }
            })
            , "You are not author")

        // create code  verify account to change password 
        const code = await this.prismaService.code.create({
            data: {
                token: String(randomInt(6)),
                authorId: user.id
            }
        })

        // send e-mail have verify link
        const isOk = await this.emailService.sendEmailVerifyAccount(user.email, user.displayName, `http://localhost:4000/auth/verify-account?token=${code.token}&&${user.id}`)

        // handle change password
        if (isOk) {
            const isMatch = await verify(user.hashPassword, data.oldPassword)
            const newHashPassword = await hash(data.newPassword)
            if (isMatch) {
                await this.prismaService.user.update({
                    where: { id: user.id },
                    data: { hashPassword: newHashPassword } // save hashed password
                })
            }
        }
    }

    // verify account 
    async verifyAccount(token: string, userId: string) {
        const tokens = await this.prismaService.code.findFirst({
            where: { token: token, authorId: userId },
            select: { token: true, id: true }
        })

        if (tokens.token != token) {
            throw new BadRequestException('Token is not match')
        }

        // deletecode
        await this.prismaService.code.update({
            where: { id: tokens.id },
            data: {
                token: null
            }
        })
    }

    // delete account
    async deleteAccount(req: Request) {
        const user = await findOrThrow(
            this.prismaService.user.findUnique({
                where: { id: req.user.id },
                select: { id: true }
            })
            , "You are not author")

        // update status account , if not login in 15days , account will be delete by schedule cron
        await this.prismaService.user.update({
            where: { id: user.id },
            data: {
                isDeleted: true,
                deleteAt: new Date()
            }
        })
    }

    // login with phone number
    async login(data: LoginWithPhone, res: Response) {

        const exitedUser = await findOrThrow(
            this.prismaService.user.findFirst({
                where: { phoneNumber: this.tokenService.toE164(data.phoneNumber) },
                omit: { hashPassword: false } // user without hashedPassword
            })
            , "Account is not available")

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

    // register role seller , user -> sellser
    async registerSeller(data: RegisterSellerDto, req: Request) {
        // format phone number
        const formatPhone = this.tokenService.toE164(data.phoneNumber)

        const exitedUser = await findOrThrow(
            this.prismaService.user.findFirst({
                where: { id: req.user.id },
                select: { id: true, role: true }
            }), "User is not found")

        if (exitedUser.role === "SELLER") {
            throw new BadRequestException('Account is a seller')
        }

        const { phoneNumber, ...dataWithoutPhoneNumber } = data

        // update new role 
        const newUser = await this.prismaService.user.update({
            where: { id: exitedUser.id },
            data: {
                ...dataWithoutPhoneNumber,
                role: "SELLER",
                phoneNumber: formatPhone
            }
        })

        // send notification register seller
        await this.emailService.sendEmailNotificationRegisterSeller(newUser.email, newUser.displayName)
    }
}