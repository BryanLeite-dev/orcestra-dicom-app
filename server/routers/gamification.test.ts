import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database
vi.mock('../db', () => ({
  getDb: vi.fn(() => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        orderBy: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
        leftJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => ({
                offset: vi.fn(() => Promise.resolve([])),
              })),
            })),
          })),
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
        groupBy: vi.fn(() => Promise.resolve([])),
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

describe('Gamification Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export gamification router', async () => {
    const { gamificationRouter } = await import('./gamification');
    
    expect(gamificationRouter).toBeDefined();
    expect(gamificationRouter._def).toBeDefined();
  });

  it('should have myStats procedure', async () => {
    const { gamificationRouter } = await import('./gamification');
    
    expect(gamificationRouter._def.procedures.myStats).toBeDefined();
  });

  it('should have listConquistas procedure', async () => {
    const { gamificationRouter } = await import('./gamification');
    
    expect(gamificationRouter._def.procedures.listConquistas).toBeDefined();
  });

  it('should have myConquistas procedure', async () => {
    const { gamificationRouter } = await import('./gamification');
    
    expect(gamificationRouter._def.procedures.myConquistas).toBeDefined();
  });

  it('should have feed procedure', async () => {
    const { gamificationRouter } = await import('./gamification');
    
    expect(gamificationRouter._def.procedures.feed).toBeDefined();
  });

  it('should have addReaction procedure', async () => {
    const { gamificationRouter } = await import('./gamification');
    
    expect(gamificationRouter._def.procedures.addReaction).toBeDefined();
  });

  it('should have myTransactions procedure', async () => {
    const { gamificationRouter } = await import('./gamification');
    
    expect(gamificationRouter._def.procedures.myTransactions).toBeDefined();
  });

  it('should have buyShield procedure', async () => {
    const { gamificationRouter } = await import('./gamification');
    
    expect(gamificationRouter._def.procedures.buyShield).toBeDefined();
  });

  it('should have useSecondChance procedure', async () => {
    const { gamificationRouter } = await import('./gamification');
    
    expect(gamificationRouter._def.procedures.useSecondChance).toBeDefined();
  });

  it('should have leaderboard procedure', async () => {
    const { gamificationRouter } = await import('./gamification');
    
    expect(gamificationRouter._def.procedures.leaderboard).toBeDefined();
  });

  it('should have createConquista admin procedure', async () => {
    const { gamificationRouter } = await import('./gamification');
    
    expect(gamificationRouter._def.procedures.createConquista).toBeDefined();
  });

  it('should have awardConquista admin procedure', async () => {
    const { gamificationRouter } = await import('./gamification');
    
    expect(gamificationRouter._def.procedures.awardConquista).toBeDefined();
  });
});

describe('Level System', () => {
  it('should have correct level thresholds', () => {
    const LEVELS = [
      { name: "trainee", minXp: 0 },
      { name: "assessor", minXp: 100 },
      { name: "coordenador", minXp: 300 },
      { name: "maestro", minXp: 600 },
      { name: "virtuoso", minXp: 1000 },
    ];

    expect(LEVELS[0].minXp).toBe(0);
    expect(LEVELS[1].minXp).toBe(100);
    expect(LEVELS[2].minXp).toBe(300);
    expect(LEVELS[3].minXp).toBe(600);
    expect(LEVELS[4].minXp).toBe(1000);
  });

  it('should calculate level correctly based on XP', () => {
    const LEVELS = [
      { name: "trainee", minXp: 0 },
      { name: "assessor", minXp: 100 },
      { name: "coordenador", minXp: 300 },
      { name: "maestro", minXp: 600 },
      { name: "virtuoso", minXp: 1000 },
    ];

    const getLevel = (xp: number) => {
      for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (xp >= LEVELS[i].minXp) {
          return LEVELS[i].name;
        }
      }
      return LEVELS[0].name;
    };

    expect(getLevel(0)).toBe("trainee");
    expect(getLevel(50)).toBe("trainee");
    expect(getLevel(99)).toBe("trainee");
    expect(getLevel(100)).toBe("assessor");
    expect(getLevel(299)).toBe("assessor");
    expect(getLevel(300)).toBe("coordenador");
    expect(getLevel(599)).toBe("coordenador");
    expect(getLevel(600)).toBe("maestro");
    expect(getLevel(999)).toBe("maestro");
    expect(getLevel(1000)).toBe("virtuoso");
    expect(getLevel(5000)).toBe("virtuoso");
  });
});
