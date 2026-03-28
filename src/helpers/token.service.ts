import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TokenService {
    constructor(
        private jwtService: JwtService,
        private prisma: PrismaService
    ) { }

    async generateTokens(id: string) {

        const accessExpiry = (process.env.JWT_EXPIRES_IN || '15m') as any;
        const refreshExpiry = (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any;
        const accessSecret = process.env.JWT_SECRET || 'access-secret';
        const refreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh-secret';

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync({ id }, { secret: accessSecret, expiresIn: accessExpiry }),
            this.jwtService.signAsync({ id }, { secret: refreshSecret, expiresIn: refreshExpiry }),
        ]);
        return { accessToken, refreshToken };
    }



    async generateAccessTokens(id: string) {
        const accessExpiry = (process.env.JWT_EXPIRES_IN || '15m') as any;
        const accessSecret = process.env.JWT_SECRET || 'access-secret';
        const accessToken = this.jwtService.signAsync({ id }, { secret: accessSecret, expiresIn: accessExpiry })
        return accessToken;
    }




    async saveRefreshToken(userId: string, token: string) {
        const hashed = await bcrypt.hash(token, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: hashed },
        });
    }



}