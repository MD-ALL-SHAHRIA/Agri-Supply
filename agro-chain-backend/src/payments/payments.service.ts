// src/payments/payments.service.ts
import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { Lot } from '../inventory/entities/lot.entity';
import { OrderStatus } from '../common/enums/order-status.enum';
import { LotStatus } from '../common/enums/lot-status.enum';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class PaymentsService {
  private redisClient: Redis;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly dataSource: DataSource,
    private configService: ConfigService,
  ) {
    
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST'),
      port: this.configService.get<number>('REDIS_PORT'),
    });
  }

 
  async initiatePayment(orderId: string, buyerId: string) {
    const order = await this.dataSource.manager.findOne(Order, { where: { id: orderId, buyer_id: buyerId } });

    if (!order) throw new NotFoundException('অর্ডারটি পাওয়া যায়নি!');
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('শুধুমাত্র পেন্ডিং অর্ডারের পেমেন্ট করা সম্ভব!');
    }

   
    const existingPayment = await this.paymentRepository.findOne({
      where: { order_id: orderId, status: PaymentStatus.PENDING }
    });

    if (existingPayment) {
      return {
        message: 'এই অর্ডারের জন্য অলরেডি একটি পেমেন্ট রিকোয়েস্ট তৈরি করা আছে।',
        transaction_id: existingPayment.transaction_id,
        dummy_payment_url: `http://localhost:3000/payments/verify?txn_id=${existingPayment.transaction_id}`,
      };
    }

    const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newPayment = this.paymentRepository.create({
      order_id: orderId,
      buyer_id: buyerId,
      amount: order.total_amount,
      transaction_id: transactionId,
      status: PaymentStatus.PENDING,
    });

    await this.paymentRepository.save(newPayment);

    return {
      message: 'পেমেন্ট গেটওয়েতে পাঠানো হচ্ছে...',
      transaction_id: transactionId,
      amount: order.total_amount,
      dummy_payment_url: `http://localhost:3000/payments/verify?txn_id=${transactionId}`,
    };
  }

  
  async verifyPayment(transactionId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const payment = await queryRunner.manager.findOne(Payment, { where: { transaction_id: transactionId } });
      if (!payment) throw new NotFoundException('ট্রানজেকশন পাওয়া যায়নি!');
      if (payment.status === PaymentStatus.SUCCESS) return { message: 'পেমেন্ট অলরেডি সফল হয়েছে।' };

      
      payment.status = PaymentStatus.SUCCESS;
      await queryRunner.manager.save(payment);

      let isLotSold = false;

     
      const order = await queryRunner.manager.findOne(Order, { where: { id: payment.order_id } });
      if (order) {
        order.status = OrderStatus.PAID;
        await queryRunner.manager.save(order);

        
        const lot = await queryRunner.manager.findOne(Lot, { where: { id: order.lot_id } });
        if (lot) {
          lot.status = LotStatus.SOLD;
          await queryRunner.manager.save(lot);
          isLotSold = true;
        }
      }

      await queryRunner.commitTransaction();

      
      if (isLotSold) {
        await this.redisClient.del('live_market_lots');
      }

      return { message: 'পেমেন্ট সফল হয়েছে এবং লটটি এখন SOLD হিসেবে গণ্য হবে!', transaction_id: transactionId };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('পেমেন্ট প্রসেস করতে সমস্যা হয়েছে!');
    } finally {
      await queryRunner.release();
    }
  }
}