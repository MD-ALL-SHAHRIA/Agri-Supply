// src/inventory/inventory.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lot } from './entities/lot.entity';
import { CreateLotDto } from './dto/create-lot.dto';
import { ConfigService } from '@nestjs/config';
import { LotStatus } from '../common/enums/lot-status.enum';
import Redis from 'ioredis';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class InventoryService {
  private redisClient: Redis;

  constructor(
    @InjectRepository(Lot)
    private readonly lotRepository: Repository<Lot>,
    private configService: ConfigService,
    private eventsGateway: EventsGateway,
  ) {
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST'),
      port: this.configService.get<number>('REDIS_PORT'),
    });
  }

  async createLot(agentId: string, createLotDto: CreateLotDto) {
    const newLot = this.lotRepository.create({
      ...createLotDto,
      agent_id: agentId,
      status: LotStatus.AVAILABLE,
    });
    const savedLot = await this.lotRepository.save(newLot);
    await this.updateLiveMarketCache();
    return { message: 'নতুন লট সফলভাবে লাইভ মার্কেটে যুক্ত হয়েছে!', lot: savedLot };
  }

  async getLiveMarketLots() {
    const cachedLots = await this.redisClient.get('live_market_lots');
    if (cachedLots) {
      return JSON.parse(cachedLots);
    }
    const lots = await this.lotRepository.find({
      where: { status: LotStatus.AVAILABLE },
      order: { created_at: 'DESC' },
    });
    await this.redisClient.set('live_market_lots', JSON.stringify(lots), 'EX', 60);
    return lots;
  }

  
  async getAgentLots(agentId: string) {
    return this.lotRepository.find({
      where: { agent_id: agentId },
      order: { created_at: 'DESC' },
    });
  }

  
  async getLotById(id: string) {
    const lot = await this.lotRepository.findOne({ where: { id } });
    if (!lot) {
      throw new NotFoundException('লটটি পাওয়া যায়নি!');
    }
    return lot;
  }

  
  async updateLot(agentId: string, id: string, updateData: { base_price_per_kg?: number; quantity_in_kg?: number }) {
    const lot = await this.getLotById(id);

    
    if (lot.agent_id !== agentId) {
      throw new BadRequestException('আপনি শুধু আপনার নিজের লট আপডেট করতে পারবেন!');
    }
    
    if (lot.status !== LotStatus.AVAILABLE) {
      throw new BadRequestException('এই লটটি ইতিমধ্যে বিক্রি বা হোল্ড হয়ে গেছে, তাই আপডেট করা সম্ভব নয়!');
    }

    Object.assign(lot, updateData);
    const updatedLot = await this.lotRepository.save(lot);
    await this.updateLiveMarketCache(); 
    
    return { message: 'লট সফলভাবে আপডেট হয়েছে!', lot: updatedLot };
  }

  
  async deleteLot(agentId: string, id: string) {
    const lot = await this.getLotById(id);

    if (lot.agent_id !== agentId) {
      throw new BadRequestException('আপনি শুধু আপনার নিজের লট ডিলিট করতে পারবেন!');
    }
    if (lot.status !== LotStatus.AVAILABLE) {
      throw new BadRequestException('এই লটটি ইতিমধ্যে বিক্রি বা হোল্ড হয়ে গেছে, তাই ডিলিট করা সম্ভব নয়!');
    }

    await this.lotRepository.remove(lot);
    await this.updateLiveMarketCache(); 
    
    return { message: 'লট সফলভাবে ডিলিট হয়েছে!' };
  }

  private async updateLiveMarketCache() {
    const lots = await this.lotRepository.find({
      where: { status: LotStatus.AVAILABLE },
      order: { created_at: 'DESC' },
    });

    await this.redisClient.set('live_market_lots', JSON.stringify(lots), 'EX', 60);

    this.eventsGateway.broadcastMarketUpdate(lots);
  }
}