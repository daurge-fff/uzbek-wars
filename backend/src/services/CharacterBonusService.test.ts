import {
  getCharacterModifiers,
  applyIncomeBonus,
  applyExperienceBonus,
  applyActivityTime,
  applyEnergyRecovery,
  applyFoodRecovery,
  applyHealthFromFood,
  applyMoodFromWork,
} from './CharacterBonusService';

describe('CharacterBonusService', () => {
  describe('getCharacterModifiers', () => {
    it('should return modifiers for char_trader', () => {
      const modifiers = getCharacterModifiers('char_trader');
      expect(modifiers.incomeBonus).toBe(12);
      expect(modifiers.shopDiscount).toBe(8);
      expect(modifiers.inventoryBonus).toBe(3);
    });

    it('should return modifiers for char_student', () => {
      const modifiers = getCharacterModifiers('char_student');
      expect(modifiers.experienceBonus).toBe(18);
      expect(modifiers.activityDuration).toBe(-10);
    });

    it('should return modifiers for char_merchant', () => {
      const modifiers = getCharacterModifiers('char_merchant');
      expect(modifiers.incomeBonus).toBe(28);
      expect(modifiers.shopDiscount).toBe(18);
      expect(modifiers.crystalBonus).toBe(15);
    });

    it('should return empty object for unknown character', () => {
      const modifiers = getCharacterModifiers('unknown_char');
      expect(modifiers).toEqual({});
    });
  });

  describe('applyIncomeBonus', () => {
    it('should apply trader income bonus', () => {
      const result = applyIncomeBonus(100, 'char_trader');
      expect(result).toBe(112); // 100 * 1.12
    });

    it('should apply merchant income bonus', () => {
      const result = applyIncomeBonus(100, 'char_merchant');
      expect(result).toBe(128); // 100 * 1.28
    });

    it('should return base value for character without bonus', () => {
      const result = applyIncomeBonus(100, 'char_worker');
      expect(result).toBe(95); // 100 * 0.95 (worker has -5% income)
    });
  });

  describe('applyExperienceBonus', () => {
    it('should apply student experience bonus', () => {
      const result = applyExperienceBonus(100, 'char_student');
      expect(result).toBe(118); // 100 * 1.18
    });

    it('should apply scholar experience bonus', () => {
      const result = applyExperienceBonus(100, 'char_scholar');
      expect(result).toBe(135); // 100 * 1.35
    });

    it('should return base value for character without bonus', () => {
      const result = applyExperienceBonus(100, 'char_trader');
      expect(result).toBe(100);
    });
  });

  describe('applyActivityTime', () => {
    it('should reduce time for student (faster)', () => {
      const result = applyActivityTime(100, 'char_student');
      expect(result).toBe(90); // 100 * 0.9 (-10%)
    });

    it('should reduce time for scholar (faster)', () => {
      const result = applyActivityTime(100, 'char_scholar');
      expect(result).toBe(85); // 100 * 0.85 (-15%)
    });

    it('should increase time for craftsman (slower)', () => {
      const result = applyActivityTime(100, 'char_craftsman');
      expect(result).toBe(108); // 100 * 1.08 (+8%)
    });

    it('should return base value for character without modifier', () => {
      const result = applyActivityTime(100, 'char_trader');
      expect(result).toBe(100);
    });
  });

  describe('applyEnergyRecovery', () => {
    it('should apply worker energy recovery bonus', () => {
      const result = applyEnergyRecovery(40, 'char_worker');
      expect(result).toBe(44); // 40 * 1.10
    });

    it('should apply scholar energy recovery bonus', () => {
      const result = applyEnergyRecovery(40, 'char_scholar');
      expect(result).toBe(51); // 40 * 1.28
    });
  });

  describe('applyFoodRecovery', () => {
    it('should apply cook food recovery bonus', () => {
      const result = applyFoodRecovery(50, 'char_cook');
      expect(result).toBe(61); // 50 * 1.22
    });

    it('should apply master chef food recovery bonus', () => {
      const result = applyFoodRecovery(50, 'char_master_chef');
      expect(result).toBe(72); // 50 * 1.45
    });
  });

  describe('applyHealthFromFood', () => {
    it('should apply cook health from food bonus', () => {
      const result = applyHealthFromFood(10, 'char_cook');
      expect(result).toBe(11); // 10 * 1.12
    });

    it('should apply master chef health from food bonus', () => {
      const result = applyHealthFromFood(10, 'char_master_chef');
      expect(result).toBe(13); // 10 * 1.30
    });
  });

  describe('applyMoodFromWork', () => {
    it('should apply worker mood from work bonus', () => {
      const result = applyMoodFromWork(5, 'char_worker');
      expect(result).toBe(5); // 5 * 1.08
    });

    it('should apply craftsman mood from work bonus', () => {
      const result = applyMoodFromWork(5, 'char_craftsman');
      expect(result).toBe(5); // 5 * 1.12
    });
  });

  describe('Integration: Multiple modifiers', () => {
    it('should apply all relevant modifiers for trader', () => {
      const income = applyIncomeBonus(200, 'char_trader');
      expect(income).toBe(224); // +12%

      const time = applyActivityTime(120, 'char_trader');
      expect(time).toBe(120); // no modifier
    });

    it('should apply all relevant modifiers for student', () => {
      const exp = applyExperienceBonus(50, 'char_student');
      expect(exp).toBe(59); // +18%

      const time = applyActivityTime(120, 'char_student');
      expect(time).toBe(108); // -10%
    });

    it('should apply all relevant modifiers for cook', () => {
      const food = applyFoodRecovery(50, 'char_cook');
      expect(food).toBe(61); // +22%

      const health = applyHealthFromFood(10, 'char_cook');
      expect(health).toBe(11); // +12%
    });
  });
});
