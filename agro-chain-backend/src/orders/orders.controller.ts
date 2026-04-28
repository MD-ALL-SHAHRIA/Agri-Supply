// src/orders/orders.controller.ts
import { Controller, Post, Body, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PlaceOrderDto } from './dto/place-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  
  @Post()
  @Roles(Role.BUYER)
  async placeOrder(@Body() placeOrderDto: PlaceOrderDto, @CurrentUser() user: any) {
    const buyerId = user.userId || user.sub;
    return this.ordersService.placeOrder(buyerId, placeOrderDto);
  }


  @Get('my-orders')
  @Roles(Role.BUYER)
  async getMyOrders(@CurrentUser() user: any) {
    const buyerId = user.userId || user.sub;
    return this.ordersService.getMyOrders(buyerId);
  }


  @Get('agent-orders')
  @Roles(Role.AGENT)
  async getAgentOrders(@CurrentUser() user: any) {
    const agentId = user.userId || user.sub;
    return this.ordersService.getAgentOrders(agentId);
  }

  
  @Get(':id')
  async getOrderById(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

 
  @Patch(':id/cancel')
  @Roles(Role.BUYER)
  async cancelOrder(@Param('id') id: string, @CurrentUser() user: any) {
    const buyerId = user.userId || user.sub;
    return this.ordersService.cancelOrder(buyerId, id);
  }
}