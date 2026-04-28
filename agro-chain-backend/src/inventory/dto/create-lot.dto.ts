import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateLotDto {
  @IsString()
  @IsNotEmpty({ message: 'ফসলের নাম দিতে হবে' })
  crop_name: string;

  @IsNumber()
  @Min(1, { message: 'পরিমাণ কমপক্ষে ১ কেজি হতে হবে' })
  quantity_in_kg: number;

  @IsNumber()
  @Min(1, { message: 'দাম কমপক্ষে ১ টাকা হতে হবে' })
  base_price_per_kg: number;

  @IsString()
  @IsNotEmpty({ message: 'ফসলের গ্রেড উল্লেখ করতে হবে' })
  grade: string;

 
  @IsOptional()
  @IsString()
  image_url?: string;
}