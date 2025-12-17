import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database
vi.mock('../db', () => ({
  getDb: vi.fn(() => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        orderBy: vi.fn(() => Promise.resolve([])),
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve([{ insertId: 1 }])),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve()),
    })),
  })),
}));

describe('Sprints Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export sprint router functions', async () => {
    const { sprintsRouter } = await import('./sprints');
    
    expect(sprintsRouter).toBeDefined();
    expect(sprintsRouter._def).toBeDefined();
    expect(sprintsRouter._def.procedures).toBeDefined();
  });

  it('should have list procedure', async () => {
    const { sprintsRouter } = await import('./sprints');
    
    expect(sprintsRouter._def.procedures.list).toBeDefined();
  });

  it('should have current procedure', async () => {
    const { sprintsRouter } = await import('./sprints');
    
    expect(sprintsRouter._def.procedures.current).toBeDefined();
  });

  it('should have getById procedure', async () => {
    const { sprintsRouter } = await import('./sprints');
    
    expect(sprintsRouter._def.procedures.getById).toBeDefined();
  });

  it('should have create procedure', async () => {
    const { sprintsRouter } = await import('./sprints');
    
    expect(sprintsRouter._def.procedures.create).toBeDefined();
  });

  it('should have update procedure', async () => {
    const { sprintsRouter } = await import('./sprints');
    
    expect(sprintsRouter._def.procedures.update).toBeDefined();
  });

  it('should have activate procedure', async () => {
    const { sprintsRouter } = await import('./sprints');
    
    expect(sprintsRouter._def.procedures.activate).toBeDefined();
  });

  it('should have delete procedure', async () => {
    const { sprintsRouter } = await import('./sprints');
    
    expect(sprintsRouter._def.procedures.delete).toBeDefined();
  });
});
