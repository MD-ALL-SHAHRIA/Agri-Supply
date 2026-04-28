import { Controller, Get, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any) {
    
    return this.usersService.getProfile(user.userId || user.sub);
  }

  
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: any, 
    @Body() updateDto: any
  ) {
    return this.usersService.updateProfile(user.userId || user.sub, updateDto);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: any, 
    @Body('oldPassword') oldPass: string, 
    @Body('newPassword') newPass: string
  ) {
    return this.usersService.changePassword(user.userId || user.sub, oldPass, newPass);
  }

  
  @Get('agent/:id')
  async getAgentProfile(@Param('id') id: string) {
    
    return this.usersService.getAgentProfile(id);
  }
}