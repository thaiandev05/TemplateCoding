import { Body, Controller, Post, Res } from "@nestjs/common";
import { Response } from 'express';
import { Cookies } from "src/common/decorator/cookie.decorator";
import { Public } from "src/common/decorator/public.decorator";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/loginWithPhone.dto";

@Controller('auth')
export class AuthController {

    constructor(
        private readonly authService: AuthService,

    ) { }

    @Public()
    @Post('login')
    async login(@Res() res: Response, @Body() data: LoginDto) {
        const result = await this.authService.login(data, res)
        return res.json(result)
    }

    @Post('logout')
    async logout(@Res({ passthrough: true }) res: Response, @Cookies('session_id') sessionId?: string) {
        return this.authService.logout(res, sessionId)
    }

}