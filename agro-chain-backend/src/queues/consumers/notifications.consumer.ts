// src/queues/consumers/notifications.consumer.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('notifications')
export class NotificationsConsumer extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'send-email':
        console.log(`\n[Queue: Consumer] ইমেইল পাঠানোর কাজ শুরু হয়েছে... (Order ID: ${job.data.orderId})`);
        
        
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        console.log(`[Queue: Consumer] ইমেইল সফলভাবে পাঠানো হয়েছে! (Buyer ID: ${job.data.buyerId})\n`);
        break;
    }
  }
}