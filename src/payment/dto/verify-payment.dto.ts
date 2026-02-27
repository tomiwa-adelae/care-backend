import { IsArray, IsBoolean, IsNumber, IsString } from 'class-validator';

export class VerifyPaymentDto {
  @IsString()
  reference: string;

  @IsArray()
  @IsString({ each: true })
  selectedPlans: string[];

  @IsNumber()
  amount: number;

  @IsBoolean()
  isBundle: boolean;
}
