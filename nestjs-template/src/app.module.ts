import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, Reflector } from '@nestjs/core';
import * as redisStore from 'cache-manager-ioredis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './common/config/configuration';
import { AuthModule } from './modules/auth/auth.module';
import { CustomCacheModule } from './modules/cache/cache.module';
import { TicketModule } from './modules/ticket/ticket.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthCookieGuard } from './common/guard/auth.cookie.guard';

const CACHE_TIME_LIFE = 5 * 24 * 60 * 60

@Module({
  imports: [
    PrismaModule, AuthModule,  CustomCacheModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration]
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: redisStore,
        host: 'localhost',
        port: 6379,
        ttl: CACHE_TIME_LIFE
      }),
    }),
    TicketModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      inject: [Reflector],
      useFactory: (reflector: Reflector) => new AuthCookieGuard(reflector),
    },
  ],
})
export class AppModule { }
