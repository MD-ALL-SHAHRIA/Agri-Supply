import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Role } from '../../common/enums/role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  full_name: string;

  @Column({ type: 'varchar', unique: true, length: 15 })
  phone: string; 

  @Column({ type: 'varchar' })
  password_hash: string;

  @Column({ type: 'enum', enum: Role, default: Role.BUYER })
  role: Role;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean; 

  @Column({ type: 'varchar', nullable: true })
  nid_number: string; 

  
  @Column({ type: 'varchar', nullable: true })
  nid_image_url: string;

  @Column({ type: 'text', nullable: true })
  address: string;


  
 
  @Column({ type: 'varchar', nullable: true })
  reset_password_token: string | null; 

  @Column({ type: 'timestamp', nullable: true })
  reset_password_expires: Date | null; 

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}