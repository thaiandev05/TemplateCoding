import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthCookieStrategy } from 'src/common/strategys/cookie.strategy';
import { FacebookStrategy } from 'src/common/strategys/facebook.strategy';
import { GoogleStrategy } from 'src/common/strategys/google.strategy';
import { EmailModule } from 'src/email/email.module';
import { CartModule } from '../cart/cart.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { TicketModule } from '../ticket/ticket.module';

@Module({
    controllers: [AuthController],
    providers: [AuthService, TokenService, FacebookStrategy, GoogleStrategy, AuthCookieStrategy],
    imports: [
        ConfigModule, EmailModule, CartModule, TicketModule,
        ScheduleModule.forRoot(),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '1d' },
            }),
        }),
    ],
    exports: [AuthService]
})
export class AuthModule { }
