import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from './entities/vehicle.entity';
import { CustomersService } from '../customers/customers.service';

describe('VehiclesService', () => {
  let service: VehiclesService;

  const mockVehicleRepository = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softRemove: jest.fn(),
  };

  const mockCustomersService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: getRepositoryToken(Vehicle), useValue: mockVehicleRepository },
        { provide: CustomersService, useValue: mockCustomersService },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a vehicle after verifying customer exists', async () => {
      const dto = { customerId: 'cust-1', plate: 'ABC-123', brand: 'Toyota', model: 'Corolla', year: 2020 };
      const vehicle = { id: 'uuid-1', ...dto };

      mockCustomersService.findOne.mockResolvedValue({ id: 'cust-1', name: 'Carlos' });
      mockVehicleRepository.create.mockReturnValue(vehicle);
      mockVehicleRepository.save.mockResolvedValue(vehicle);

      const result = await service.create(dto);

      expect(mockCustomersService.findOne).toHaveBeenCalledWith('cust-1');
      expect(result).toEqual(vehicle);
    });

    it('should throw NotFoundException if customer does not exist', async () => {
      mockCustomersService.findOne.mockRejectedValue(new NotFoundException());

      await expect(
        service.create({ customerId: 'invalid', plate: 'XYZ-999', brand: 'Kia', model: 'Rio', year: 2021 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated vehicles with customer relation', async () => {
      const vehicles = [
        { id: 'uuid-1', plate: 'ABC-123', brand: 'Toyota', model: 'Corolla', year: 2020 },
        { id: 'uuid-2', plate: 'DEF-456', brand: 'Mazda', model: 'CX-5', year: 2022 },
      ];
      mockVehicleRepository.findAndCount.mockResolvedValue([vehicles, 2]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(vehicles);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(mockVehicleRepository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        relations: ['customer'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a vehicle with relations', async () => {
      const vehicle = { id: 'uuid-1', plate: 'ABC-123', customer: {}, workOrders: [] };
      mockVehicleRepository.findOne.mockResolvedValue(vehicle);

      const result = await service.findOne('uuid-1');

      expect(result).toEqual(vehicle);
      expect(mockVehicleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        relations: ['customer', 'workOrders'],
      });
    });

    it('should throw NotFoundException if vehicle not found', async () => {
      mockVehicleRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-remove a vehicle', async () => {
      const vehicle = { id: 'uuid-1', plate: 'ABC-123' };
      mockVehicleRepository.findOne.mockResolvedValue(vehicle);
      mockVehicleRepository.softRemove.mockResolvedValue(vehicle);

      await service.remove('uuid-1');

      expect(mockVehicleRepository.softRemove).toHaveBeenCalledWith(vehicle);
    });
  });
});
