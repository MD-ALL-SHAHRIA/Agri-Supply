// src/auth/auth.controller.ts
import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body('phone') phone: string, @Body('password') pass: string) {
    return this.authService.login(phone, pass);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: any) {
    return user;
  }

  @Post('forgot-password')
  async forgotPassword(@Body('phone') phone: string) {
    return this.authService.forgotPassword(phone);
  }

  @Post('reset-password')
  async resetPassword(
    @Body('phone') phone: string, 
    @Body('otp') otp: string, 
    @Body('newPassword') newPassword: string
  ) {
    return this.authService.resetPassword(phone, otp, newPassword);
  }
}