import {Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';



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

}
