// src/orders/orders.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { Lot } from '../inventory/entities/lot.entity';
import { OrdersCronService } from './orders-cron.service';  

@Module({
  imports: [TypeOrmModule.forFeature([Order, Lot])],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersCronService], 
})
export class OrdersModule {}