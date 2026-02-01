import { Player } from './Player';

/**
 * Unit tests for Player model schema
 * Tests schema structure, validation rules, and indexes
 */
describe('Player Model', () => {
  describe('Schema Structure', () => {
    it('should have correct schema paths', () => {
      const schema = Player.schema;
      const paths = schema.paths;

      expect(paths).toHaveProperty('userId');
      expect(paths).toHaveProperty('characterId');
      expect(paths).toHaveProperty('cityId');
      expect(paths).toHaveProperty('level');
      expect(paths).toHaveProperty('experience');
      expect(paths).toHaveProperty('soms');
      expect(paths).toHaveProperty('donationCurrency');
      // Subdocument fields are flattened in paths with dot notation
      expect(paths['stats.hunger']).toBeDefined();
      expect(paths['stats.health']).toBeDefined();
      expect(paths['stats.mood']).toBeDefined();
      expect(paths['stats.energy']).toBeDefined();
      expect(paths['cosmetics.clothing']).toBeDefined();
      expect(paths['cosmetics.backgrounds']).toBeDefined();
      expect(paths).toHaveProperty('referralCode');
      expect(paths).toHaveProperty('referredBy');
      expect(paths).toHaveProperty('lastActivityTime');
    });

    it('should have required fields configured correctly', () => {
      const schema = Player.schema;

      expect(schema.path('userId').isRequired).toBe(true);
      expect(schema.path('characterId').isRequired).toBe(true);
      expect(schema.path('cityId').isRequired).toBe(true);
      expect(schema.path('referralCode').isRequired).toBe(true);
      // Optional fields don't have isRequired set to false, it's undefined
      expect(schema.path('referredBy').isRequired).toBeUndefined();
    });

    it('should have correct default values', () => {
      const schema = Player.schema;

      expect((schema.path('level') as any).defaultValue).toBe(1);
      expect((schema.path('experience') as any).defaultValue).toBe(0);
      expect((schema.path('soms') as any).defaultValue).toBe(100);
      expect((schema.path('donationCurrency') as any).defaultValue).toBe(0);
    });

    it('should have stats subdocument with correct structure', () => {
      const schema = Player.schema;

      expect(schema.path('stats.hunger')).toBeDefined();
      expect(schema.path('stats.health')).toBeDefined();
      expect(schema.path('stats.mood')).toBeDefined();
      expect(schema.path('stats.energy')).toBeDefined();

      // Check default values
      expect((schema.path('stats.hunger') as any).defaultValue).toBe(100);
      expect((schema.path('stats.health') as any).defaultValue).toBe(100);
      expect((schema.path('stats.mood') as any).defaultValue).toBe(100);
      expect((schema.path('stats.energy') as any).defaultValue).toBe(100);
    });

    it('should have cosmetics subdocument with correct structure', () => {
      const schema = Player.schema;

      expect(schema.path('cosmetics.clothing')).toBeDefined();
      expect(schema.path('cosmetics.backgrounds')).toBeDefined();
      expect(schema.path('cosmetics.activeClothing')).toBeDefined();
      expect(schema.path('cosmetics.activeBackground')).toBeDefined();
    });

    it('should have timestamps enabled', () => {
      const schema = Player.schema;

      expect(schema.options.timestamps).toBe(true);
      expect(schema.path('createdAt')).toBeDefined();
      expect(schema.path('updatedAt')).toBeDefined();
    });
  });

  describe('Validation Rules', () => {
    it('should enforce minimum level of 1', () => {
      const schema = Player.schema;
      const levelPath = schema.path('level');

      expect(levelPath.options.min).toBe(1);
    });

    it('should enforce non-negative experience', () => {
      const schema = Player.schema;
      const experiencePath = schema.path('experience');

      expect(experiencePath.options.min).toBe(0);
    });

    it('should enforce non-negative soms', () => {
      const schema = Player.schema;
      const somsPath = schema.path('soms');

      expect(somsPath.options.min).toBe(0);
    });

    it('should enforce non-negative donationCurrency', () => {
      const schema = Player.schema;
      const donationCurrencyPath = schema.path('donationCurrency');

      expect(donationCurrencyPath.options.min).toBe(0);
    });

    it('should enforce stat boundaries (0-100)', () => {
      const schema = Player.schema;

      const statPaths = [
        'stats.hunger',
        'stats.health',
        'stats.mood',
        'stats.energy',
      ];

      statPaths.forEach((path) => {
        const statPath = schema.path(path);
        expect(statPath.options.min).toBe(0);
        expect(statPath.options.max).toBe(100);
      });
    });
  });

  describe('Indexes', () => {
    it('should have unique index on userId', () => {
      const schema = Player.schema;
      const userIdPath = schema.path('userId');

      expect(userIdPath.options.unique).toBe(true);
      expect(userIdPath.options.index).toBe(true);
    });

    it('should have index on cityId for city-based queries', () => {
      const schema = Player.schema;
      const cityIdPath = schema.path('cityId');

      expect(cityIdPath.options.index).toBe(true);
    });

    it('should have index on level for leaderboard queries', () => {
      const schema = Player.schema;
      const levelPath = schema.path('level');

      expect(levelPath.options.index).toBe(true);
    });

    it('should have index on soms for leaderboard queries', () => {
      const schema = Player.schema;
      const somsPath = schema.path('soms');

      expect(somsPath.options.index).toBe(true);
    });

    it('should have unique index on referralCode', () => {
      const schema = Player.schema;
      const referralCodePath = schema.path('referralCode');

      expect(referralCodePath.options.unique).toBe(true);
      expect(referralCodePath.options.index).toBe(true);
    });

    it('should have index on referredBy for referral tracking', () => {
      const schema = Player.schema;
      const referredByPath = schema.path('referredBy');

      expect(referredByPath.options.index).toBe(true);
    });
  });

  describe('Field Types', () => {
    it('should have correct field types', () => {
      const schema = Player.schema;

      expect(schema.path('userId').instance).toBe('ObjectId');
      expect(schema.path('characterId').instance).toBe('String');
      expect(schema.path('cityId').instance).toBe('String');
      expect(schema.path('level').instance).toBe('Number');
      expect(schema.path('experience').instance).toBe('Number');
      expect(schema.path('soms').instance).toBe('Number');
      expect(schema.path('donationCurrency').instance).toBe('Number');
      expect(schema.path('referralCode').instance).toBe('String');
      expect(schema.path('referredBy').instance).toBe('String');
      expect(schema.path('lastActivityTime').instance).toBe('Date');
    });

    it('should have userId reference to User model', () => {
      const schema = Player.schema;
      const userIdPath = schema.path('userId');

      expect(userIdPath.options.ref).toBe('User');
    });
  });

  describe('Model Configuration', () => {
    it('should have correct model name', () => {
      expect(Player.modelName).toBe('Player');
    });

    it('should have correct collection name', () => {
      expect(Player.collection.name).toBe('players');
    });
  });
});
