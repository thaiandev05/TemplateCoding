import { Body, Controller, Get, Patch, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { hash } from 'argon2';
import { Request, Response } from 'express';
import { Cookies } from "src/common/decorator/cookie.decorator";
import { Public } from "src/common/decorator/public.decorator";
import { PrismaService } from "src/prisma/prisma.service";
import { CartService } from "../cart/cart.service";
import { AuthService } from "./auth.service";
import { ChangePasswordDto } from "./dto/changePassword.dto";
import { LoginWithPhone } from "./dto/loginWithPhone.dto";
import { RegisterSellerDto } from "./dto/registerSeller.dto";
import { TokenService } from "./token.service";

@Controller('auth')
export class AuthController {

    constructor(
        private readonly authService: AuthService,
        private readonly prismaService: PrismaService,
        private readonly cartService: CartService,
        private readonly tokenService: TokenService

    ) { }

    @Public()
    @Get('facebook')
    @UseGuards(AuthGuard('facebook'))
    async facebookLogin() { }

    @Public()
    @Get('facebook/callback')
    @UseGuards(AuthGuard('facebook'))
    async facebookCallback(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        return this.authService.oauthTwoFacebook(req.user as any, res)
    }

    @Public()
    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleLogin() { }

    @Public()
    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleCallback(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        return this.authService.oauthTwoGoogle(req.user as any, res)
    }

    @Post('change-password')
    async ChangePassword(@Body() data: ChangePasswordDto, @Req() req: Request) {
        return this.authService.changePassword(data, req)
    }

    @Public()
    @Post('verify-account')
    async verifyAccount(@Query('token') token: string, @Query('userId') userId: string) {
        await this.authService.verifyAccount(token, userId)
        return true
    }

    @Public()
    @Post('send-code-register-sms')
    async sendCodeRegisterSms(@Body('phoneNumber') phoneNumber: string) {
        return this.authService.sendCodeRegisterSms(phoneNumber)
    }

    @Public()
    @Post('verifyAccountSms')
    async verifyAccountSms(@Body('phoneNumber') phoneNumber: string, @Query('tokenVerify') tokenVerify: string) {
        return this.authService.verifyAccountSms(phoneNumber, tokenVerify)
    }

    @Patch('delete-account')
    async deleteAccount(@Req() req: Request) {
        return this.authService.deleteAccount(req)
    }

    @Public()
    @Post('login')
    async login(@Res() res: Response, @Body() data: LoginWithPhone) {
        const result = await this.authService.login(data, res)
        return res.json(result)
    }

    @Post('logout')
    async logout(@Res({ passthrough: true }) res: Response, @Cookies('session_id') sessionId?: string) {
        return this.authService.logout(res, sessionId)
    }

    @Post('register-seller')
    async registerSeller(@Body() data: RegisterSellerDto, @Req() req: Request) {
        return this.authService.registerSeller(data, req)
    }

    // test
    @Get('get-list-user')
    async getListUser() {
        return await this.prismaService.user.findMany({
            select: { id: true, displayName: true, role: true, shop: { include: { invoiceOrders: true, products: { include: { comments: { include: { replies: true } } } } } }, cart: { include: { cartItem: true } } }
        })
        // return await this.prismaService.user.deleteMany({})
    }

    @Public()
    @Post('create-test')
    async createTestUser(@Body() data: any) {
        return await this.prismaService.user.create({
            data: {
                phoneNumber: this.tokenService.toE164(data.phoneNumber),
                displayName: data.displayName,
                hashPassword: await hash(data.password),
                statusAccount: "ACTIVE"
            }
        })
    }
}