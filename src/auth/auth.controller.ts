import { Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './guard/jwt.guard';



const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};





@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService) { }


    @Get('google')
    @UseGuards(AuthGuard('google'))
    @ApiOperation({ summary: 'Redirect to Google OAuth' })
    googleLogin() {

    }


    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    @ApiOperation({ summary: 'Google OAuth callback' })
    async googleCallback(@Req() req, @Res() res) {
        const { user, accessToken, refreshToken } = await this.authService.googleLogin(
            req.user as any,
        );

        res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);


        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/auth/callback?accessToken=${accessToken}`);

    }


    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Logout' })
    async logout(@Req() req, @Res({ passthrough: true }) res) {
        console.log('run')
        const user = req.user
        console.log(user)
        await this.authService.logout(user.id);
        res.clearCookie('refreshToken');
        return { message: 'Logged out successfully' };
    }




    @Post('refresh')
    async refresh(@Req() req) {
        const token = req.cookies?.['refreshToken'] || req.headers['x-refresh-token'] as string;;
        console.log(token)
        if (!token) throw new UnauthorizedException('No refresh token');
        const { accessToken } = await this.authService.refreshByToken(token);
        return { accessToken };
    }

}
