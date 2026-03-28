import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TokenService } from 'src/helpers/token.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [PrismaModule, PassportModule, JwtModule.register({ secret: process.env.JWT_SECRET || 'secret', global: true }),],
  providers: [AuthService, TokenService, GoogleStrategy, JwtStrategy],
  controllers: [AuthController]
})
export class AuthModule { }
