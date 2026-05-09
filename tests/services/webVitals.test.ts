import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onCLS, onFID, onLCP, onFCP, onTTFB, onINP } from 'web-vitals';

// Mock web-vitals
vi.mock('web-vitals', () => ({
  onCLS: vi.fn(),
  onFID: vi.fn(),
  onLCP: vi.fn(),
  onFCP: vi.fn(),
  onTTFB: vi.fn(),
  onINP: vi.fn(),
}));

// Mock monitoring service
vi.mock('../../services/monitoring', () => ({
  recordMetric: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

describe('Web Vitals Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('reportWebVitals', () => {
    it('should register all web vitals listeners', async () => {
      const { reportWebVitals } = await import('../../services/webVitals');
      
      reportWebVitals();
      
      expect(onCLS).toHaveBeenCalled();
      expect(onFID).toHaveBeenCalled();
      expect(onLCP).toHaveBeenCalled();
      expect(onFCP).toHaveBeenCalled();
      expect(onTTFB).toHaveBeenCalled();
      expect(onINP).toHaveBeenCalled();
    });

    it('should handle CLS metric', async () => {
      const { reportWebVitals } = await import('../../services/webVitals');
      const { recordMetric } = await import('../../services/monitoring');
      
      // Mock onCLS to call the callback
      vi.mocked(onCLS).mockImplementation((callback) => {
        callback({
          name: 'CLS',
          value: 0.05,
          rating: 'good',
          delta: 0.05,
          id: 'test-id',
        } as any);
      });
      
      reportWebVitals();
      
      expect(recordMetric).toHaveBeenCalledWith('webvital.CLS', 0.05, 'score');
    });

    it('should handle LCP metric', async () => {
      const { reportWebVitals } = await import('../../services/webVitals');
      const { recordMetric } = await import('../../services/monitoring');
      
      vi.mocked(onLCP).mockImplementation((callback) => {
        callback({
          name: 'LCP',
          value: 2000,
          rating: 'good',
          delta: 2000,
          id: 'test-id',
        } as any);
      });
      
      reportWebVitals();
      
      expect(recordMetric).toHaveBeenCalledWith('webvital.LCP', 2000, 'ms');
    });

    it('should handle FID metric', async () => {
      const { reportWebVitals } = await import('../../services/webVitals');
      const { recordMetric } = await import('../../services/monitoring');
      
      vi.mocked(onFID).mockImplementation((callback) => {
        callback({
          name: 'FID',
          value: 50,
          rating: 'good',
          delta: 50,
          id: 'test-id',
        } as any);
      });
      
      reportWebVitals();
      
      expect(recordMetric).toHaveBeenCalledWith('webvital.FID', 50, 'ms');
    });

    it('should handle FCP metric', async () => {
      const { reportWebVitals } = await import('../../services/webVitals');
      const { recordMetric } = await import('../../services/monitoring');
      
      vi.mocked(onFCP).mockImplementation((callback) => {
        callback({
          name: 'FCP',
          value: 1500,
          rating: 'good',
          delta: 1500,
          id: 'test-id',
        } as any);
      });
      
      reportWebVitals();
      
      expect(recordMetric).toHaveBeenCalledWith('webvital.FCP', 1500, 'ms');
    });

    it('should handle TTFB metric', async () => {
      const { reportWebVitals } = await import('../../services/webVitals');
      const { recordMetric } = await import('../../services/monitoring');
      
      vi.mocked(onTTFB).mockImplementation((callback) => {
        callback({
          name: 'TTFB',
          value: 500,
          rating: 'good',
          delta: 500,
          id: 'test-id',
        } as any);
      });
      
      reportWebVitals();
      
      expect(recordMetric).toHaveBeenCalledWith('webvital.TTFB', 500, 'ms');
    });

    it('should handle INP metric', async () => {
      const { reportWebVitals } = await import('../../services/webVitals');
      const { recordMetric } = await import('../../services/monitoring');
      
      vi.mocked(onINP).mockImplementation((callback) => {
        callback({
          name: 'INP',
          value: 100,
          rating: 'good',
          delta: 100,
          id: 'test-id',
        } as any);
      });
      
      reportWebVitals();
      
      expect(recordMetric).toHaveBeenCalledWith('webvital.INP', 100, 'ms');
    });
  });

  describe('measureCustomPerformance', () => {
    it('should measure custom performance mark', async () => {
      const { measureCustomPerformance } = await import('../../services/webVitals');
      
      // Mock performance API
      const mockMark = vi.fn();
      const mockMeasure = vi.fn(() => ({
        duration: 150,
      }));
      const mockGetEntriesByName = vi.fn(() => [{ duration: 150 }]);
      
      global.performance = {
        mark: mockMark,
        measure: mockMeasure,
        getEntriesByName: mockGetEntriesByName,
      } as any;
      
      const duration = measureCustomPerformance('test-start', 'test-end', 'test-measure');
      
      expect(mockMeasure).toHaveBeenCalledWith('test-measure', 'test-start', 'test-end');
      expect(duration).toBe(150);
    });

    it('should return 0 when measure fails', async () => {
      const { measureCustomPerformance } = await import('../../services/webVitals');
      
      global.performance = {
        mark: vi.fn(),
        measure: vi.fn(() => {
          throw new Error('Measure failed');
        }),
        getEntriesByName: vi.fn(() => []),
      } as any;
      
      const duration = measureCustomPerformance('test-start', 'test-end', 'test-measure');
      
      expect(duration).toBe(0);
    });
  });

  describe('markPerformance', () => {
    it('should create performance mark', async () => {
      const { markPerformance } = await import('../../services/webVitals');
      
      const mockMark = vi.fn();
      global.performance = {
        mark: mockMark,
      } as any;
      
      markPerformance('test-mark');
      
      expect(mockMark).toHaveBeenCalledWith('test-mark');
    });

    it('should handle mark errors gracefully', async () => {
      const { markPerformance } = await import('../../services/webVitals');
      
      global.performance = {
        mark: vi.fn(() => {
          throw new Error('Mark failed');
        }),
      } as any;
      
      // Should not throw
      expect(() => markPerformance('test-mark')).not.toThrow();
    });
  });

  describe('getNavigationTiming', () => {
    it('should return navigation timing metrics', async () => {
      const { getNavigationTiming } = await import('../../services/webVitals');
      
      const mockTiming = {
        domContentLoadedEventEnd: 1500,
        domContentLoadedEventStart: 1000,
        loadEventEnd: 2500,
        loadEventStart: 2000,
        domInteractive: 800,
        fetchStart: 0,
      };
      
      global.performance = {
        timing: mockTiming,
      } as any;
      
      const timing = getNavigationTiming();
      
      expect(timing).toEqual({
        domContentLoaded: 500,
        loadComplete: 500,
        domInteractive: 800,
      });
    });

    it('should return null when timing not available', async () => {
      const { getNavigationTiming } = await import('../../services/webVitals');
      
      global.performance = {} as any;
      
      const timing = getNavigationTiming();
      
      expect(timing).toBeNull();
    });
  });
});
