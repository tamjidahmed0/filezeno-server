import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TokenService } from 'src/helpers/token.service';

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
        private tokenService: TokenService

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



}
