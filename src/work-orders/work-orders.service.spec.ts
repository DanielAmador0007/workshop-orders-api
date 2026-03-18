import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service';
import { WorkOrder } from './entities/work-order.entity';
import { WorkOrderStatus } from './enums/work-order-status.enum';
import { VehiclesService } from '../vehicles/vehicles.service';

describe('WorkOrdersService', () => {
  let service: WorkOrdersService;

  const mockWorkOrderRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softRemove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockVehiclesService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkOrdersService,
        { provide: getRepositoryToken(WorkOrder), useValue: mockWorkOrderRepository },
        { provide: VehiclesService, useValue: mockVehiclesService },
      ],
    }).compile();

    service = module.get<WorkOrdersService>(WorkOrdersService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a work order with RECEIVED status', async () => {
      const dto = { vehicleId: 'v-uuid', description: 'Oil change' };
      const workOrder = { id: 'wo-uuid', ...dto, status: WorkOrderStatus.RECEIVED };

      mockVehiclesService.findOne.mockResolvedValue({ id: 'v-uuid' });
      mockWorkOrderRepository.create.mockReturnValue(workOrder);
      mockWorkOrderRepository.save.mockResolvedValue(workOrder);

      const result = await service.create(dto);

      expect(result.status).toBe(WorkOrderStatus.RECEIVED);
      expect(mockVehiclesService.findOne).toHaveBeenCalledWith('v-uuid');
    });
  });

  describe('updateStatus', () => {
    it('should transition from RECEIVED to IN_PROGRESS', async () => {
      const workOrder = {
        id: 'wo-uuid',
        status: WorkOrderStatus.RECEIVED,
        vehicle: { customer: {} },
      };
      mockWorkOrderRepository.findOne.mockResolvedValue(workOrder);
      mockWorkOrderRepository.save.mockResolvedValue({
        ...workOrder,
        status: WorkOrderStatus.IN_PROGRESS,
      });

      const result = await service.updateStatus('wo-uuid', {
        status: WorkOrderStatus.IN_PROGRESS,
      });

      expect(result.status).toBe(WorkOrderStatus.IN_PROGRESS);
    });

    it('should transition from IN_PROGRESS to COMPLETED', async () => {
      const workOrder = {
        id: 'wo-uuid',
        status: WorkOrderStatus.IN_PROGRESS,
        vehicle: { customer: {} },
      };
      mockWorkOrderRepository.findOne.mockResolvedValue(workOrder);
      mockWorkOrderRepository.save.mockResolvedValue({
        ...workOrder,
        status: WorkOrderStatus.COMPLETED,
      });

      const result = await service.updateStatus('wo-uuid', {
        status: WorkOrderStatus.COMPLETED,
      });

      expect(result.status).toBe(WorkOrderStatus.COMPLETED);
    });

    it('should transition from COMPLETED to DELIVERED', async () => {
      const workOrder = {
        id: 'wo-uuid',
        status: WorkOrderStatus.COMPLETED,
        vehicle: { customer: {} },
      };
      mockWorkOrderRepository.findOne.mockResolvedValue(workOrder);
      mockWorkOrderRepository.save.mockResolvedValue({
        ...workOrder,
        status: WorkOrderStatus.DELIVERED,
      });

      const result = await service.updateStatus('wo-uuid', {
        status: WorkOrderStatus.DELIVERED,
      });

      expect(result.status).toBe(WorkOrderStatus.DELIVERED);
    });

    it('should reject invalid transition from RECEIVED to COMPLETED', async () => {
      const workOrder = {
        id: 'wo-uuid',
        status: WorkOrderStatus.RECEIVED,
        vehicle: { customer: {} },
      };
      mockWorkOrderRepository.findOne.mockResolvedValue(workOrder);

      await expect(
        service.updateStatus('wo-uuid', { status: WorkOrderStatus.COMPLETED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid transition from DELIVERED to any state', async () => {
      const workOrder = {
        id: 'wo-uuid',
        status: WorkOrderStatus.DELIVERED,
        vehicle: { customer: {} },
      };
      mockWorkOrderRepository.findOne.mockResolvedValue(workOrder);

      await expect(
        service.updateStatus('wo-uuid', { status: WorkOrderStatus.RECEIVED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject backward transition from COMPLETED to IN_PROGRESS', async () => {
      const workOrder = {
        id: 'wo-uuid',
        status: WorkOrderStatus.COMPLETED,
        vehicle: { customer: {} },
      };
      mockWorkOrderRepository.findOne.mockResolvedValue(workOrder);

      await expect(
        service.updateStatus('wo-uuid', { status: WorkOrderStatus.IN_PROGRESS }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when work order not found', async () => {
      mockWorkOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
