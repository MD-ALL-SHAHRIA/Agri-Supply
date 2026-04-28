// src/users/users.service.ts
import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterDto } from '../auth/dto/register.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  
  async createUser(registerDto: RegisterDto): Promise<Omit<User, 'password_hash'>> {
    const { full_name, phone, password, role } = registerDto;

    const existingUser = await this.userRepository.findOne({ where: { phone } });
    if (existingUser) {
      throw new ConflictException('এই ফোন নাম্বার দিয়ে ইতিমধ্যে একটি একাউন্ট খোলা হয়েছে!');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = this.userRepository.create({
      full_name,
      phone,
      password_hash,
      role,
    });

    const savedUser = await this.userRepository.save(newUser);
    const { password_hash: _, ...result } = savedUser;
    return result;
  }

  
  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { phone } });
  }

  
  async saveUser(user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  
  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('ইউজার পাওয়া যায়নি!');
    const { password_hash, ...result } = user; 
    return result;
  }

  
  async updateProfile(userId: string, updateDto: any) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('ইউজার পাওয়া যায়নি!');

    Object.assign(user, updateDto);
    await this.userRepository.save(user);

    const { password_hash, ...result } = user;
    return { message: 'প্রোফাইল সফলভাবে আপডেট হয়েছে!', user: result };
  }


  async changePassword(userId: string, oldPass: string, newPass: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('ইউজার পাওয়া যায়নি!');

    const isMatch = await bcrypt.compare(oldPass, user.password_hash);
    if (!isMatch) throw new BadRequestException('পুরনো পাসওয়ার্ডটি সঠিক নয়!');

    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(newPass, salt);
    await this.userRepository.save(user);

    return { message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!' };
  }

  
  async getAgentProfile(agentId: string) {
    const agent = await this.userRepository.findOne({ 
        where: { id: agentId, role: Role.AGENT } 
    });
    if (!agent) throw new NotFoundException('এজেন্ট পাওয়া যায়নি!');
    
    const { password_hash, phone, ...publicData } = agent; 
    return publicData;
  }
}