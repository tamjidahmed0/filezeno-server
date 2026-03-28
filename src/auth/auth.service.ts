import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TokenService } from 'src/helpers/token.service';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';

interface GoogleUser {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string;
}



@Injectable()
export class AuthService {

    constructor(
        private prisma: PrismaService,
        private tokenService: TokenService,
        private jwt: JwtService

    ) { }


    // ─── Google login/register ───
    async googleLogin(googleUser: GoogleUser) {

        let user = await this.prisma.user.findUnique({
            where: { email: googleUser.email },
        });

        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email: googleUser.email,
                    name: googleUser.name,
                    avatarUrl: googleUser.avatarUrl,
                    googleId: googleUser.googleId,
                },
            });
        } else if (!user.googleId) {
            // Existing user googleId update
            user = await this.prisma.user.update({
                where: { id: user.id },
                data: { googleId: googleUser.googleId, avatarUrl: googleUser.avatarUrl },
            });
        }

        const tokens = await this.tokenService.generateTokens(user.id);
        await this.tokenService.saveRefreshToken(user.id, tokens.refreshToken);

        const { refreshToken, ...safeUser } = user;
        return { user: safeUser, ...tokens };
    }


    // ─── Logout ───
    async logout(userId: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });
        return { message: 'Logged out successfully' };
    }





    async refreshByToken(refreshToken: string) {
        let payload: any;
        try {
            payload = this.jwt.verify(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
            });
        } catch {
            throw new UnauthorizedException('Session expired, please login again');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: payload.id }
        });
        if (!user?.refreshToken) throw new UnauthorizedException('Session expired');


        const valid = await bcrypt.compare(refreshToken, user.refreshToken);
        if (!valid) throw new UnauthorizedException('Invalid refresh token');


        const accessToken = await this.tokenService.generateAccessTokens(user.id);
        return { accessToken };
    }



}
