import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter } from '../../routers';
import type { Context } from '../../_core/context';

// Mock database functions
vi.mock('../../db', () => ({
  getFarms: vi.fn(),
  getFarmById: vi.fn(),
  createFarm: vi.fn(),
  updateFarm: vi.fn(),
  deleteFarm: vi.fn(),
}));

const mockUser = {
  id: 1,
  openId: 'test-open-id',
  name: 'Test User',
  email: 'test@example.com',
  role: 'admin' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const createMockContext = (user = mockUser): Context => ({
  req: {} as any,
  res: {} as any,
  user,
});

describe('Farms Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('should return list of farms', async () => {
      const { getFarms } = await import('../../db');
      const mockFarms = [
        {
          id: 1,
          name: 'Farm 1',
          area: 50,
          location: 'Location 1',
          status: 'active',
          userId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: 'Farm 2',
          area: 75,
          location: 'Location 2',
          status: 'active',
          userId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (getFarms as any).mockResolvedValue(mockFarms);

      const caller = appRouter.createCaller(createMockContext());
      const result = await caller.farms.list();

      expect(result).toEqual(mockFarms);
      expect(getFarms).toHaveBeenCalled();
    });

    it('should throw error when user is not authenticated', async () => {
      const caller = appRouter.createCaller(createMockContext(null as any));

      await expect(caller.farms.list()).rejects.toThrow();
    });
  });

  describe('getById', () => {
    it('should return farm by id', async () => {
      const { getFarmById } = await import('../../db');
      const mockFarm = {
        id: 1,
        name: 'Farm 1',
        area: 50,
        location: 'Location 1',
        status: 'active',
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (getFarmById as any).mockResolvedValue(mockFarm);

      const caller = appRouter.createCaller(createMockContext());
      const result = await caller.farms.getById({ id: 1 });

      expect(result).toEqual(mockFarm);
      expect(getFarmById).toHaveBeenCalledWith(1);
    });

    it('should throw error when farm not found', async () => {
      const { getFarmById } = await import('../../db');
      (getFarmById as any).mockResolvedValue(null);

      const caller = appRouter.createCaller(createMockContext());

      await expect(caller.farms.getById({ id: 999 })).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should create new farm', async () => {
      const { createFarm } = await import('../../db');
      const newFarm = {
        name: 'New Farm',
        area: 100,
        location: 'New Location',
        status: 'active' as const,
      };

      const createdFarm = {
        id: 3,
        ...newFarm,
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (createFarm as any).mockResolvedValue(createdFarm);

      const caller = appRouter.createCaller(createMockContext());
      const result = await caller.farms.create(newFarm);

      expect(result).toEqual(createdFarm);
      expect(createFarm).toHaveBeenCalledWith({
        ...newFarm,
        userId: 1,
      });
    });

    it('should validate input data', async () => {
      const caller = appRouter.createCaller(createMockContext());

      await expect(
        caller.farms.create({
          name: '',
          area: -10,
          location: '',
          status: 'invalid' as any,
        })
      ).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update existing farm', async () => {
      const { updateFarm, getFarmById } = await import('../../db');
      const existingFarm = {
        id: 1,
        name: 'Old Name',
        area: 50,
        location: 'Old Location',
        status: 'active' as const,
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedFarm = {
        ...existingFarm,
        name: 'New Name',
        area: 75,
      };

      (getFarmById as any).mockResolvedValue(existingFarm);
      (updateFarm as any).mockResolvedValue(updatedFarm);

      const caller = appRouter.createCaller(createMockContext());
      const result = await caller.farms.update({
        id: 1,
        name: 'New Name',
        area: 75,
      });

      expect(result).toEqual(updatedFarm);
      expect(updateFarm).toHaveBeenCalledWith(1, {
        name: 'New Name',
        area: 75,
      });
    });

    it('should throw error when farm not found', async () => {
      const { getFarmById } = await import('../../db');
      (getFarmById as any).mockResolvedValue(null);

      const caller = appRouter.createCaller(createMockContext());

      await expect(
        caller.farms.update({
          id: 999,
          name: 'New Name',
        })
      ).rejects.toThrow();
    });

    it('should prevent updating other user farms', async () => {
      const { getFarmById } = await import('../../db');
      const otherUserFarm = {
        id: 1,
        name: 'Other User Farm',
        area: 50,
        location: 'Location',
        status: 'active' as const,
        userId: 2, // Different user
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (getFarmById as any).mockResolvedValue(otherUserFarm);

      const caller = appRouter.createCaller(createMockContext());

      await expect(
        caller.farms.update({
          id: 1,
          name: 'New Name',
        })
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete farm', async () => {
      const { deleteFarm, getFarmById } = await import('../../db');
      const existingFarm = {
        id: 1,
        name: 'Farm to Delete',
        area: 50,
        location: 'Location',
        status: 'active' as const,
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (getFarmById as any).mockResolvedValue(existingFarm);
      (deleteFarm as any).mockResolvedValue(true);

      const caller = appRouter.createCaller(createMockContext());
      const result = await caller.farms.delete({ id: 1 });

      expect(result).toEqual({ success: true });
      expect(deleteFarm).toHaveBeenCalledWith(1);
    });

    it('should throw error when farm not found', async () => {
      const { getFarmById } = await import('../../db');
      (getFarmById as any).mockResolvedValue(null);

      const caller = appRouter.createCaller(createMockContext());

      await expect(caller.farms.delete({ id: 999 })).rejects.toThrow();
    });

    it('should prevent deleting other user farms', async () => {
      const { getFarmById } = await import('../../db');
      const otherUserFarm = {
        id: 1,
        name: 'Other User Farm',
        area: 50,
        location: 'Location',
        status: 'active' as const,
        userId: 2, // Different user
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (getFarmById as any).mockResolvedValue(otherUserFarm);

      const caller = appRouter.createCaller(createMockContext());

      await expect(caller.farms.delete({ id: 1 })).rejects.toThrow();
    });
  });

  describe('Authorization', () => {
    it('should allow admin to access all farms', async () => {
      const { getFarms } = await import('../../db');
      const adminUser = { ...mockUser, role: 'admin' as const };

      (getFarms as any).mockResolvedValue([]);

      const caller = appRouter.createCaller(createMockContext(adminUser));
      await caller.farms.list();

      expect(getFarms).toHaveBeenCalled();
    });

    it('should allow manager to access farms', async () => {
      const { getFarms } = await import('../../db');
      const managerUser = { ...mockUser, role: 'manager' as const };

      (getFarms as any).mockResolvedValue([]);

      const caller = appRouter.createCaller(createMockContext(managerUser));
      await caller.farms.list();

      expect(getFarms).toHaveBeenCalled();
    });

    it('should allow farmer to access only their farms', async () => {
      const { getFarms } = await import('../../db');
      const farmerUser = { ...mockUser, role: 'farmer' as const };

      (getFarms as any).mockResolvedValue([]);

      const caller = appRouter.createCaller(createMockContext(farmerUser));
      await caller.farms.list();

      expect(getFarms).toHaveBeenCalledWith({ userId: farmerUser.id });
    });
  });
});
