
import { Controller, Post, Body, Get, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateLotDto } from './dto/create-lot.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Roles(Role.AGENT)
  async createLot(@Body() createLotDto: CreateLotDto, @CurrentUser() user: any) {
    const agentId = user.userId || user.sub; 
    return this.inventoryService.createLot(agentId, createLotDto);
  }

  @Get('live-market')
  async getLiveMarket() {
    return this.inventoryService.getLiveMarketLots();
  }

  @Get('my-lots')
  @Roles(Role.AGENT)
  async getMyLots(@CurrentUser() user: any) {
    const agentId = user.userId || user.sub; 
    return this.inventoryService.getAgentLots(agentId);
  }

  @Get(':id')
  async getLotById(@Param('id') id: string) {
    return this.inventoryService.getLotById(id);
  }

  @Patch(':id')
  @Roles(Role.AGENT)
  async updateLot(
    @Param('id') id: string, 
    @Body() updateData: { base_price_per_kg?: number; quantity_in_kg?: number; image_url?: string },
    @CurrentUser() user: any
  ) {
    const agentId = user.userId || user.sub; 
    return this.inventoryService.updateLot(agentId, id, updateData);
  }

  @Delete(':id')
  @Roles(Role.AGENT)
  async deleteLot(@Param('id') id: string, @CurrentUser() user: any) {
    const agentId = user.userId || user.sub; 
    return this.inventoryService.deleteLot(agentId, id);
  }
}