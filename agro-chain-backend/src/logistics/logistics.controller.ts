// src/logistics/logistics.controller.ts
import { Controller, Post, Body, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { LogisticsService } from './logistics.service';
import { UpdateLogisticDto } from './dto/update-logistic.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('logistics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  
  @Post('shipment')
  @Roles(Role.AGENT)
  async createShipment(@Body('order_id') orderId: string) {
    return this.logisticsService.createShipment(orderId);
  }

  
  @Get('track/:orderId')
  @Roles(Role.BUYER)
  async trackOrder(@Param('orderId') orderId: string) {
    return this.logisticsService.trackOrder(orderId);
  }

  
  @Patch(':id')
  @Roles(Role.AGENT)
  async updateTracking(
    @Param('id') id: string,
    @Body() updateLogisticDto: UpdateLogisticDto,
  ) {
    return this.logisticsService.updateTracking(id, updateLogisticDto);
  }
}