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
  captureMessage: vi.fn(),
}));

describe('Web Vitals Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initWebVitals', () => {
    it('should register all web vitals listeners', async () => {
      const { initWebVitals } = await import('../../services/webVitals');
      
      initWebVitals();
      
      expect(onCLS).toHaveBeenCalled();
      expect(onFID).toHaveBeenCalled();
      expect(onLCP).toHaveBeenCalled();
      expect(onFCP).toHaveBeenCalled();
      expect(onTTFB).toHaveBeenCalled();
      expect(onINP).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      vi.mocked(onLCP).mockImplementation(() => {
        throw new Error('Init failed');
      });
      
      const { initWebVitals } = await import('../../services/webVitals');
      
      // Should not throw
      expect(() => initWebVitals()).not.toThrow();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('measurePerformance', () => {
    it('should measure performance duration', async () => {
      const { measurePerformance } = await import('../../services/webVitals');
      const { recordMetric } = await import('../../services/monitoring');
      
      const startTime = performance.now();
      const duration = measurePerformance('test-operation', startTime);
      
      expect(duration).toBeGreaterThanOrEqual(0);
      expect(recordMetric).toHaveBeenCalledWith('custom.test-operation', expect.any(Number));
    });
  });

  describe('mark', () => {
    it('should create performance mark', async () => {
      const { mark } = await import('../../services/webVitals');
      
      const mockMark = vi.fn();
      global.performance.mark = mockMark;
      
      mark('test-mark');
      
      expect(mockMark).toHaveBeenCalledWith('test-mark');
    });

    it('should handle missing performance API', async () => {
      const { mark } = await import('../../services/webVitals');
      
      const originalPerformance = global.performance;
      // @ts-expect-error - Testing missing API
      global.performance = undefined;
      
      // Should not throw
      expect(() => mark('test-mark')).not.toThrow();
      
      global.performance = originalPerformance;
    });
  });

  describe('measure', () => {
    it('should measure between two marks', async () => {
      const { measure } = await import('../../services/webVitals');
      const { recordMetric } = await import('../../services/monitoring');
      
      const mockMeasure = vi.fn();
      const mockGetEntriesByName = vi.fn(() => [{ duration: 150 }]);
      
      global.performance.measure = mockMeasure;
      global.performance.getEntriesByName = mockGetEntriesByName as any;
      
      const duration = measure('test-measure', 'start', 'end');
      
      expect(mockMeasure).toHaveBeenCalledWith('test-measure', 'start', 'end');
      expect(recordMetric).toHaveBeenCalledWith('measure.test-measure', 150);
      expect(duration).toBe(150);
    });

    it('should return 0 when measure fails', async () => {
      const { measure } = await import('../../services/webVitals');
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      global.performance.measure = vi.fn(() => {
        throw new Error('Measure failed');
      });
      
      const duration = measure('test-measure', 'start', 'end');
      
      expect(duration).toBe(0);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getNavigationTiming', () => {
    it('should return navigation timing metrics', async () => {
      const { getNavigationTiming } = await import('../../services/webVitals');
      
      const mockNavigation = {
        domainLookupStart: 0,
        domainLookupEnd: 50,
        connectStart: 50,
        connectEnd: 100,
        requestStart: 100,
        responseStart: 200,
        responseEnd: 300,
        domInteractive: 400,
        domContentLoadedEventStart: 500,
        domContentLoadedEventEnd: 550,
        loadEventStart: 600,
        loadEventEnd: 650,
        fetchStart: 0,
      };
      
      global.performance.getEntriesByType = vi.fn(() => [mockNavigation as any]);
      
      const timing = getNavigationTiming();
      
      expect(timing).toEqual({
        dns: 50,
        tcp: 50,
        request: 100,
        response: 100,
        domParse: 100,
        domContentLoaded: 50,
        load: 50,
        total: 650,
      });
    });

    it('should return null when navigation timing not available', async () => {
      const { getNavigationTiming } = await import('../../services/webVitals');
      
      const originalPerformance = global.performance;
      // @ts-expect-error - Testing missing API
      global.performance = {};
      
      const timing = getNavigationTiming();
      
      expect(timing).toBeNull();
      
      global.performance = originalPerformance;
    });

    it('should return null when no navigation entry', async () => {
      const { getNavigationTiming } = await import('../../services/webVitals');
      
      global.performance.getEntriesByType = vi.fn(() => []);
      
      const timing = getNavigationTiming();
      
      expect(timing).toBeNull();
    });
  });

  describe('monitorResourceTiming', () => {
    it('should detect slow resources', async () => {
      const { monitorResourceTiming } = await import('../../services/webVitals');
      const { captureMessage } = await import('../../services/monitoring');
      
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const mockResources = [
        { name: 'slow-script.js', duration: 1500, transferSize: 50000 },
        { name: 'fast-script.js', duration: 100, transferSize: 10000 },
        { name: 'slow-image.png', duration: 2000, transferSize: 100000 },
      ];
      
      global.performance.getEntriesByType = vi.fn(() => mockResources as any);
      
      monitorResourceTiming();
      
      expect(captureMessage).toHaveBeenCalledWith(
        'Slow resources detected: 2 resources took > 1s',
        'warning'
      );
      
      consoleWarnSpy.mockRestore();
    });

    it('should handle missing performance API', async () => {
      const { monitorResourceTiming } = await import('../../services/webVitals');
      
      const originalPerformance = global.performance;
      // @ts-expect-error - Testing missing API
      global.performance = {};
      
      // Should not throw
      expect(() => monitorResourceTiming()).not.toThrow();
      
      global.performance = originalPerformance;
    });
  });
});
