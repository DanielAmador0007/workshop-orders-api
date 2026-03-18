import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { WorkOrderStatus } from '../enums/work-order-status.enum';

export class UpdateWorkOrderStatusDto {
  @ApiProperty({
    enum: WorkOrderStatus,
    example: WorkOrderStatus.IN_PROGRESS,
    description: 'New status. Must follow: RECEIVED → IN_PROGRESS → COMPLETED → DELIVERED',
  })
  @IsEnum(WorkOrderStatus)
  @IsNotEmpty()
  status: WorkOrderStatus;
}
