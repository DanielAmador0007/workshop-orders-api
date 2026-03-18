import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';

describe('CustomersService', () => {
  let service: CustomersService;

  const mockCustomerRepository = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softRemove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: getRepositoryToken(Customer), useValue: mockCustomerRepository },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a customer successfully', async () => {
      const dto = { name: 'John', email: 'john@test.com', phone: '123' };
      const customer = { id: 'uuid-1', ...dto };

      mockCustomerRepository.findOne.mockResolvedValue(null);
      mockCustomerRepository.create.mockReturnValue(customer);
      mockCustomerRepository.save.mockResolvedValue(customer);

      const result = await service.create(dto);

      expect(result).toEqual(customer);
      expect(mockCustomerRepository.create).toHaveBeenCalledWith(dto);
    });

    it('should throw ConflictException for duplicate email', async () => {
      mockCustomerRepository.findOne.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create({ name: 'John', email: 'john@test.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated customers', async () => {
      const customers = [
        { id: 'uuid-1', name: 'John', email: 'john@test.com' },
        { id: 'uuid-2', name: 'Jane', email: 'jane@test.com' },
      ];
      mockCustomerRepository.findAndCount.mockResolvedValue([customers, 2]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(customers);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if customer not found', async () => {
      mockCustomerRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
