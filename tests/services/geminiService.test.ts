import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Cache } from '../../services/geminiService';

describe('GeminiService - Cache', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should store and retrieve data from cache', () => {
    const testData = { name: 'Test Plan', goal: '增肌' };
    Cache.set('test-key', testData);
    
    const retrieved = Cache.get('test-key');
    expect(retrieved).toEqual(testData);
  });

  it('should return null for non-existent key', () => {
    const result = Cache.get('non-existent-key');
    expect(result).toBeNull();
  });

  it('should generate stable cache keys', () => {
    const data1 = { goal: '增肌', level: '中级' };
    const data2 = { goal: '增肌', level: '中级' };
    const data3 = { goal: '减脂', level: '中级' };

    const key1 = Cache.stableKey('plan', data1);
    const key2 = Cache.stableKey('plan', data2);
    const key3 = Cache.stableKey('plan', data3);

    expect(key1).toBe(key2); // 相同数据应生成相同 key
    expect(key1).not.toBe(key3); // 不同数据应生成不同 key
  });

  it('should handle cache set failure gracefully', () => {
    // Mock sessionStorage.setItem to throw error
    const originalSetItem = sessionStorage.setItem;
    sessionStorage.setItem = vi.fn(() => {
      throw new Error('Storage full');
    });

    // Should not throw
    expect(() => {
      Cache.set('test', { data: 'value' });
    }).not.toThrow();

    // Restore
    sessionStorage.setItem = originalSetItem;
  });

  it('should handle corrupted cache data', () => {
    // Manually set invalid JSON
    sessionStorage.setItem('fg_cache_corrupted', 'invalid-json{');
    
    const result = Cache.get('corrupted');
    expect(result).toBeNull();
  });
});
