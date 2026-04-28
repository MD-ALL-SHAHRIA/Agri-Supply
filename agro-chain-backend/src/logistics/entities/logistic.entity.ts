// src/logistics/entities/logistic.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { LogisticsStatus } from '../../common/enums/logistics-status.enum';

@Entity('logistics')
export class Logistic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  order_id: string; 

  @Column({ type: 'varchar', length: 100, unique: true })
  tracking_number: string; 

  @Column({ type: 'enum', enum: LogisticsStatus, default: LogisticsStatus.PENDING })
  status: LogisticsStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  current_location: string; 

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}