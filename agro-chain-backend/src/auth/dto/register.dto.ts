// src/auth/dto/register.dto.ts
import { IsString, IsNotEmpty, MinLength, IsEnum, IsOptional } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'পুরো নাম দেওয়া আবশ্যক' })
  full_name: string;

  @IsString()
  @IsNotEmpty({ message: 'ফোন নাম্বার দেওয়া আবশ্যক' })
  phone: string;

  @IsString()
  @MinLength(6, { message: 'পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে' })
  password: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role; 
}