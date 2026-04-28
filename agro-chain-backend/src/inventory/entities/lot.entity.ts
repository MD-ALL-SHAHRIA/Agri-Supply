import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { LotStatus } from '../../common/enums/lot-status.enum';

@Entity('inventory_lots')
export class Lot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  crop_name: string; 

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity_in_kg: number; 

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  base_price_per_kg: number; 

  @Column({ type: 'varchar', length: 50 })
  grade: string; 

  
  @Column({ type: 'varchar', nullable: true })
  image_url: string;

  @Column({ type: 'enum', enum: LotStatus, default: LotStatus.AVAILABLE })
  status: LotStatus;

  @Column({ type: 'uuid' })
  agent_id: string; 

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}