// src/orders/dto/place-order.dto.ts
import { IsUUID, IsNotEmpty } from 'class-validator';

export class PlaceOrderDto {
  @IsUUID('4', { message: 'সঠিক লট আইডি দিতে হবে' })
  @IsNotEmpty()
  lot_id: string;
}