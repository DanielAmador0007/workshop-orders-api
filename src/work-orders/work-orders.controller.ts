import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WorkOrdersService } from './work-orders.service';
import {
  CreateWorkOrderDto,
  UpdateWorkOrderDto,
  UpdateWorkOrderStatusDto,
  FilterWorkOrdersDto,
} from './dto';

@ApiTags('Work Orders')
@ApiBearerAuth()
@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new work order' })
  @ApiResponse({ status: 201, description: 'Work order created' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  create(@Body() createWorkOrderDto: CreateWorkOrderDto) {
    return this.workOrdersService.create(createWorkOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all work orders (paginated, filterable)' })
  @ApiResponse({ status: 200, description: 'List of work orders' })
  findAll(@Query() filterDto: FilterWorkOrdersDto) {
    return this.workOrdersService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a work order by ID' })
  @ApiResponse({ status: 200, description: 'Work order found' })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.workOrdersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update work order fields (not status)' })
  @ApiResponse({ status: 200, description: 'Work order updated' })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWorkOrderDto: UpdateWorkOrderDto,
  ) {
    return this.workOrdersService.update(id, updateWorkOrderDto);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update work order status (RECEIVED → IN_PROGRESS → COMPLETED → DELIVERED)',
  })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateWorkOrderStatusDto,
  ) {
    return this.workOrdersService.updateStatus(id, updateStatusDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a work order' })
  @ApiResponse({ status: 204, description: 'Work order deleted' })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.workOrdersService.remove(id);
  }
}
