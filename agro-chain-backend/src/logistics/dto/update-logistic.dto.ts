import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LogisticsStatus } from '../../common/enums/logistics-status.enum';

export class UpdateLogisticDto {
  @IsOptional()
  @IsEnum(LogisticsStatus)
  status?: LogisticsStatus;

  @IsOptional()
  @IsString()
  current_location?: string;
}