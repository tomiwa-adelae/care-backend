import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class SelectPlansDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Please select at least one plan' })
  @IsString({ each: true })
  selectedPlans: string[];
}
