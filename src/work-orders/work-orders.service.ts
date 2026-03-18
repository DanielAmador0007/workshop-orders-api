import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkOrder } from './entities/work-order.entity';
import {
  CreateWorkOrderDto,
  UpdateWorkOrderDto,
  UpdateWorkOrderStatusDto,
  FilterWorkOrdersDto,
} from './dto';
import { PaginatedResponseDto } from '../common/dto';
import { WorkOrderStatus, VALID_TRANSITIONS } from './enums/work-order-status.enum';
import { VehiclesService } from '../vehicles/vehicles.service';

@Injectable()
export class WorkOrdersService {
  constructor(
    @InjectRepository(WorkOrder)
    private readonly workOrderRepository: Repository<WorkOrder>,
    private readonly vehiclesService: VehiclesService,
  ) {}

  async create(createWorkOrderDto: CreateWorkOrderDto): Promise<WorkOrder> {
    // Verify vehicle exists
    await this.vehiclesService.findOne(createWorkOrderDto.vehicleId);

    const workOrder = this.workOrderRepository.create({
      ...createWorkOrderDto,
      status: WorkOrderStatus.RECEIVED,
    });
    return this.workOrderRepository.save(workOrder);
  }

  async findAll(filterDto: FilterWorkOrdersDto): Promise<PaginatedResponseDto<WorkOrder>> {
    const { page, limit, status, customerId } = filterDto;

    const queryBuilder = this.workOrderRepository
      .createQueryBuilder('workOrder')
      .leftJoinAndSelect('workOrder.vehicle', 'vehicle')
      .leftJoinAndSelect('vehicle.customer', 'customer')
      .where('workOrder.deletedAt IS NULL');

    if (status) {
      queryBuilder.andWhere('workOrder.status = :status', { status });
    }

    if (customerId) {
      queryBuilder.andWhere('vehicle.customerId = :customerId', { customerId });
    }

    queryBuilder
      .orderBy('workOrder.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string): Promise<WorkOrder> {
    const workOrder = await this.workOrderRepository.findOne({
      where: { id },
      relations: ['vehicle', 'vehicle.customer'],
    });
    if (!workOrder) {
      throw new NotFoundException(`Work order with id "${id}" not found`);
    }
    return workOrder;
  }

  async update(id: string, updateWorkOrderDto: UpdateWorkOrderDto): Promise<WorkOrder> {
    const workOrder = await this.findOne(id);
    Object.assign(workOrder, updateWorkOrderDto);
    return this.workOrderRepository.save(workOrder);
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateWorkOrderStatusDto,
  ): Promise<WorkOrder> {
    const workOrder = await this.findOne(id);
    const currentStatus = workOrder.status;
    const newStatus = updateStatusDto.status;

    const allowedNextStatus = VALID_TRANSITIONS[currentStatus];

    if (allowedNextStatus !== newStatus) {
      throw new BadRequestException(
        `Invalid status transition from "${currentStatus}" to "${newStatus}". ` +
          `Allowed transition: "${currentStatus}" → "${allowedNextStatus || 'none (final state)'}"`,
      );
    }

    workOrder.status = newStatus;
    return this.workOrderRepository.save(workOrder);
  }

  async remove(id: string): Promise<void> {
    const workOrder = await this.findOne(id);
    await this.workOrderRepository.softRemove(workOrder);
  }
}
