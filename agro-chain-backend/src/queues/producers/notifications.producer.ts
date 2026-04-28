
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationsProducer {
  constructor(@InjectQueue('notifications') private notificationsQueue: Queue) {}


  async sendPaymentSuccessEmail(buyerId: string, orderId: string) {
    await this.notificationsQueue.add('send-email', {
      buyerId,
      orderId,
      message: 'আপনার পেমেন্ট সফল হয়েছে! লটটি এখন আপনার।',
    });
  }
}