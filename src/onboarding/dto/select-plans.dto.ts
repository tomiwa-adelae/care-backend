import { IsArray, IsString, ArrayMinSize, IsOptional } from 'class-validator';

export class SelectPlansDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Please select at least one plan' })
  @IsString({ each: true })
  selectedPlans: string[];

  @IsOptional()
  @IsString()
  billingCycle?: string; // 'monthly' | 'quarterly' | 'annually'
}
