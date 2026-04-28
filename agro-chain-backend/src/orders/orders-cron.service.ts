// src/orders/orders-cron.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { Lot } from '../inventory/entities/lot.entity';
import { OrderStatus } from '../common/enums/order-status.enum';
import { LotStatus } from '../common/enums/lot-status.enum';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class OrdersCronService {
  private readonly logger = new Logger(OrdersCronService.name);
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

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleAutoCancelOrders() {
    this.logger.debug('অটো-ক্যানসেল ক্রন জব চেকিং শুরু হয়েছে...');

    
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() - 30); 

   
    const expiredOrders = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.status = :status', { status: OrderStatus.PENDING })
      .andWhere('order.created_at <= :expirationTime', { expirationTime })
      .getMany();

    if (expiredOrders.length === 0) {
      this.logger.debug('ক্যানসেল করার মতো কোনো পুরনো অর্ডার পাওয়া যায়নি।');
      return;
    }

    this.logger.log(`মোট ${expiredOrders.length} টি মেয়াদোত্তীর্ণ অর্ডার পাওয়া গেছে। ক্যানসেল প্রক্রিয়া শুরু হচ্ছে...`);

    let cacheNeedsClear = false;

    
    for (const order of expiredOrders) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        
        order.status = OrderStatus.CANCELLED;
        await queryRunner.manager.save(order);

        
        const lot = await queryRunner.manager.findOne(Lot, { where: { id: order.lot_id } });
        if (lot) {
          lot.status = LotStatus.AVAILABLE;
          await queryRunner.manager.save(lot);
          cacheNeedsClear = true; 
        }

        await queryRunner.commitTransaction();
        this.logger.log(`অর্ডার আইডি ${order.id} অটো-ক্যানসেল করা হয়েছে।`);
      } catch (error) {
        await queryRunner.rollbackTransaction();
        this.logger.error(`অর্ডার আইডি ${order.id} ক্যানসেল করতে সমস্যা হয়েছে: ${error.message}`);
      } finally {
        await queryRunner.release();
      }
    }


    if (cacheNeedsClear) {
      await this.redisClient.del('live_market_lots');
      this.logger.debug('লাইভ মার্কেটের ডেটা ক্যাশ ক্লিয়ার করা হয়েছে।');
    }
  }
}