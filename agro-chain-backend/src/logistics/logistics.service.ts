
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logistic } from './entities/logistic.entity';
import { UpdateLogisticDto } from './dto/update-logistic.dto';
import { LogisticsStatus } from '../common/enums/logistics-status.enum';
import { v4 as uuidv4 } from 'uuid';
import { isUUID } from 'class-validator';

@Injectable()
export class LogisticsService {
  constructor(
    @InjectRepository(Logistic)
    private readonly logisticRepository: Repository<Logistic>,
  ) {}

  
  async createShipment(orderId: string) {
    const existing = await this.logisticRepository.findOne({ where: { order_id: orderId } });
    if (existing) {
      throw new BadRequestException('Ei order er jonno already shipment toiri kora ache!');
    }

    
    const trackingNumber = `TRK-${uuidv4().split('-')[0].toUpperCase()}`;

    const newShipment = this.logisticRepository.create({
      order_id: orderId,
      tracking_number: trackingNumber,
      status: LogisticsStatus.PENDING,
      current_location: 'Warehouse / Seller Location',
    });

    return this.logisticRepository.save(newShipment);
  }

  
  async trackOrder(orderId: string) {
    const shipment = await this.logisticRepository.findOne({ where: { order_id: orderId } });
    if (!shipment) throw new NotFoundException('Kono shipment data paowa jayni!');
    return shipment;
  }

  
  async updateTracking(idOrTracking: string, updateLogisticDto: UpdateLogisticDto) {
    let shipment;

    
    if (isUUID(idOrTracking)) {
      shipment = await this.logisticRepository.findOne({ where: { id: idOrTracking } });
    } else {
      shipment = await this.logisticRepository.findOne({ where: { tracking_number: idOrTracking } });
    }

    if (!shipment) throw new NotFoundException('Shipment পাওয়া যায়নি!');

    Object.assign(shipment, updateLogisticDto);
    return this.logisticRepository.save(shipment);
  }
}