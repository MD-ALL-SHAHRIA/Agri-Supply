// src/queues/queues.module.ts
import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsProducer } from './producers/notifications.producer';
import { NotificationsConsumer } from './consumers/notifications.consumer';

@Global() 
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications', 
    }),
  ],
  providers: [NotificationsProducer, NotificationsConsumer],
  exports: [NotificationsProducer], 
})
export class QueuesModule {}