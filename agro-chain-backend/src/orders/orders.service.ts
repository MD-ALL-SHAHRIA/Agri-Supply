// src/orders/orders.service.ts
import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { Lot } from '../inventory/entities/lot.entity';
import { PlaceOrderDto } from './dto/place-order.dto';
import { LotStatus } from '../common/enums/lot-status.enum';
import { OrderStatus } from '../common/enums/order-status.enum';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class OrdersService {
  private redisClient: Redis;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly dataSource: DataSource,
    private configService: ConfigService,
  ) {
    
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST'),
      port: this.configService.get<number>('REDIS_PORT'),
    });
  }

 
  async placeOrder(buyerId: string, placeOrderDto: PlaceOrderDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const lot = await queryRunner.manager.findOne(Lot, {
        where: { id: placeOrderDto.lot_id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!lot) throw new NotFoundException('লটটি পাওয়া যায়নি!');
      if (lot.status !== LotStatus.AVAILABLE) {
        throw new BadRequestException('দুঃখিত! লটটি ইতিমধ্যে বিক্রি বা হোল্ড হয়ে গেছে।');
      }

      const totalAmount = lot.quantity_in_kg * lot.base_price_per_kg;

      lot.status = LotStatus.ESCROW_HOLD;
      await queryRunner.manager.save(lot);

      const newOrder = queryRunner.manager.create(Order, {
        lot_id: lot.id,
        buyer_id: buyerId,
        total_amount: totalAmount,
        status: OrderStatus.PENDING,
      });

      const savedOrder = await queryRunner.manager.save(newOrder);
      
      await queryRunner.commitTransaction();

      
      await this.redisClient.del('live_market_lots');

      return { message: 'অর্ডার সফলভাবে প্লেস করা হয়েছে!', order: savedOrder };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('অর্ডার প্রসেস করতে সমস্যা হয়েছে!');
    } finally {
      await queryRunner.release();
    }
  }

 
  async getMyOrders(buyerId: string) {
    return this.orderRepository.find({
      where: { buyer_id: buyerId },
      order: { created_at: 'DESC' },
    });
  }

  
  async getOrderById(orderId: string) {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('অর্ডারটি পাওয়া যায়নি!');
    return order;
  }

  
  async getAgentOrders(agentId: string) {
    return this.dataSource.query(
      `SELECT o.*, l.crop_name, l.quantity_in_kg 
       FROM orders o 
       INNER JOIN inventory_lots l ON o.lot_id = l.id 
       WHERE l.agent_id = $1 
       ORDER BY o.created_at DESC`,
      [agentId]
    );
  }

  
  async cancelOrder(buyerId: string, orderId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(Order, { 
        where: { id: orderId, buyer_id: buyerId } 
      });

      if (!order) throw new NotFoundException('অর্ডারটি পাওয়া যায়নি!');
      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException('শুধুমাত্র পেমেন্ট হওয়ার আগের অর্ডার ক্যানসেল করা যাবে!');
      }

      order.status = OrderStatus.CANCELLED;
      await queryRunner.manager.save(order);

      const lot = await queryRunner.manager.findOne(Lot, { where: { id: order.lot_id } });
      if (lot) {
        lot.status = LotStatus.AVAILABLE;
        await queryRunner.manager.save(lot);
      }

      await queryRunner.commitTransaction();
      
      
      await this.redisClient.del('live_market_lots');

      return { message: 'অর্ডারটি সফলভাবে ক্যানসেল করা হয়েছে এবং লটটি আবার মার্কেটে এভেইলেবল হয়েছে!' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('অর্ডার ক্যানসেল করতে সমস্যা হয়েছে!');
    } finally {
      await queryRunner.release();
    }
  }
}