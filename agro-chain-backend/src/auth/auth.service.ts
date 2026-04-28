// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    return this.usersService.createUser(registerDto);
  }


  async login(phone: string, pass: string) {
    const user = await this.usersService.findByPhone(phone);
    
    if (!user) {
      throw new UnauthorizedException('ভুল ফোন নাম্বার অথবা পাসওয়ার্ড!');
    }

    const isMatch = await bcrypt.compare(pass, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('ভুল ফোন নাম্বার অথবা পাসওয়ার্ড!');
    }

    const payload = { sub: user.id, phone: user.phone, role: user.role };
    
    return {
      message: 'লগইন সফল হয়েছে!',
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        full_name: user.full_name,
        role: user.role,
        is_verified: user.is_verified,
      },
    };
  }

  
  async forgotPassword(phone: string) {
    const user = await this.usersService.findByPhone(phone);
    if (!user) throw new NotFoundException('এই ফোন নাম্বারের কোনো অ্যাকাউন্ট নেই!');

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.reset_password_token = resetToken;
    user.reset_password_expires = new Date(Date.now() + 15 * 60 * 1000); 
    await this.usersService.saveUser(user);

    return { 
      message: 'পাসওয়ার্ড রিসেট করার জন্য আপনার ফোনে একটি OTP পাঠানো হয়েছে!',
      test_otp: resetToken 
    };
  }

 
  async resetPassword(phone: string, otp: string, newPass: string) {
    const user = await this.usersService.findByPhone(phone);

    
    if (!user || user.reset_password_token !== otp) {
      throw new BadRequestException('OTP ভুল অথবা ফোন নাম্বার সঠিক নয়!');
    }
    
    
    if (!user.reset_password_expires || user.reset_password_expires < new Date()) {
      throw new BadRequestException('OTP এর মেয়াদ শেষ হয়ে গেছে!');
    }

    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(newPass, salt);
    
    
    user.reset_password_token = null;
    user.reset_password_expires = null;
    await this.usersService.saveUser(user);

    return { message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!' };
  }
}