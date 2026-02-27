import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateTrackDto {
  @IsString()
  label: string;

  @IsString()
  color: string;

  @IsString()
  title: string;

  @IsString()
  subtitle: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
