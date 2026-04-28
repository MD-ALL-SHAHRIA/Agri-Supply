// src/payments/payments.controller.ts
import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

 
  @Post('initiate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BUYER)
  async initiatePayment(
    @Body('order_id') orderId: string, 
    @CurrentUser() user: any
  ) {
    const buyerId = user.userId || user.sub;
    return this.paymentsService.initiatePayment(orderId, buyerId);
  }

  
  @Get('verify')
  async verifyPayment(@Query('txn_id') transactionId: string) {
    return this.paymentsService.verifyPayment(transactionId);
  }
}