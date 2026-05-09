import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Sentry from '@sentry/react';

// Mock Sentry
vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  setUser: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn(),
  startSpan: vi.fn((options, callback) => {
    void options; // 使用 void 操作符标记为已使用
    return callback(undefined);
  }),
  setContext: vi.fn(),
  browserTracingIntegration: vi.fn(() => ({})),
  replayIntegration: vi.fn(() => ({})),
}));

describe('Monitoring Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initMonitoring', () => {
    it('should initialize Sentry with correct config', async () => {
      const { initMonitoring } = await import('../../services/monitoring');
      
      // Set DSN to enable initialization
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      
      initMonitoring();
      
      expect(Sentry.init).toHaveBeenCalled();
    });

    it('should warn when DSN is not configured', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      process.env.SENTRY_DSN = '';
      
      const { initMonitoring } = await import('../../services/monitoring');
      initMonitoring();
      
      expect(consoleSpy).toHaveBeenCalledWith('Sentry DSN not configured. Monitoring disabled.');
      consoleSpy.mockRestore();
    });
  });

  describe('setUser', () => {
    it('should set user context', async () => {
      const { setUser } = await import('../../services/monitoring');
      
      setUser('user123', 'testuser');
      
      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: 'user123',
        username: 'testuser',
      });
    });

    it('should use anonymous when username not provided', async () => {
      const { setUser } = await import('../../services/monitoring');
      
      setUser('user123');
      
      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: 'user123',
        username: 'anonymous',
      });
    });
  });

  describe('clearUser', () => {
    it('should clear user context', async () => {
      const { clearUser } = await import('../../services/monitoring');
      
      clearUser();
      
      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });
  });

  describe('captureException', () => {
    it('should capture exception with context', async () => {
      const { captureException } = await import('../../services/monitoring');
      const error = new Error('Test error');
      const context = { userId: '123', action: 'test' };
      
      captureException(error, context);
      
      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        extra: context,
      });
    });

    it('should capture exception without context', async () => {
      const { captureException } = await import('../../services/monitoring');
      const error = new Error('Test error');
      
      captureException(error);
      
      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        extra: undefined,
      });
    });
  });

  describe('captureMessage', () => {
    it('should capture message with default level', async () => {
      const { captureMessage } = await import('../../services/monitoring');
      
      captureMessage('Test message');
      
      expect(Sentry.captureMessage).toHaveBeenCalledWith('Test message', 'info');
    });

    it('should capture message with custom level', async () => {
      const { captureMessage } = await import('../../services/monitoring');
      
      captureMessage('Error message', 'error');
      
      expect(Sentry.captureMessage).toHaveBeenCalledWith('Error message', 'error');
    });
  });

  describe('addBreadcrumb', () => {
    it('should add breadcrumb with data', async () => {
      const { addBreadcrumb } = await import('../../services/monitoring');
      
      addBreadcrumb('User action', 'user', { button: 'submit' });
      
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'User action',
        category: 'user',
        level: 'info',
        data: { button: 'submit' },
      });
    });

    it('should add breadcrumb without data', async () => {
      const { addBreadcrumb } = await import('../../services/monitoring');
      
      addBreadcrumb('Navigation', 'navigation');
      
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'Navigation',
        category: 'navigation',
        level: 'info',
        data: undefined,
      });
    });
  });

  describe('startSpan', () => {
    it('should start span with callback', async () => {
      const { startSpan } = await import('../../services/monitoring');
      const callback = vi.fn(() => 'result');
      
      const result = startSpan({ name: 'test', op: 'test.op' }, callback);
      
      expect(Sentry.startSpan).toHaveBeenCalled();
      expect(result).toBe('result');
    });
  });

  describe('monitorAIRequest', () => {
    it('should monitor successful AI request', async () => {
      const { monitorAIRequest } = await import('../../services/monitoring');
      const requestFn = vi.fn(async () => 'success');
      
      const result = await monitorAIRequest('test-request', requestFn, { model: 'gpt-4' });
      
      expect(result).toBe('success');
      expect(Sentry.addBreadcrumb).toHaveBeenCalled();
    });

    it('should capture error on failed AI request', async () => {
      const { monitorAIRequest } = await import('../../services/monitoring');
      const error = new Error('AI request failed');
      const requestFn = vi.fn(async () => {
        throw error;
      });
      
      await expect(monitorAIRequest('test-request', requestFn)).rejects.toThrow('AI request failed');
      expect(Sentry.captureException).toHaveBeenCalled();
    });
  });

  describe('monitorAPIRequest', () => {
    it('should monitor successful API request', async () => {
      const { monitorAPIRequest } = await import('../../services/monitoring');
      const requestFn = vi.fn(async () => ({ data: 'test' }));
      
      const result = await monitorAPIRequest('/api/test', requestFn);
      
      expect(result).toEqual({ data: 'test' });
    });

    it('should capture error on failed API request', async () => {
      const { monitorAPIRequest } = await import('../../services/monitoring');
      const error = new Error('API request failed');
      const requestFn = vi.fn(async () => {
        throw error;
      });
      
      await expect(monitorAPIRequest('/api/test', requestFn)).rejects.toThrow('API request failed');
      expect(Sentry.captureException).toHaveBeenCalled();
    });
  });

  describe('trackUserAction', () => {
    it('should track user action with properties', async () => {
      const { trackUserAction } = await import('../../services/monitoring');
      
      trackUserAction('button_click', { button: 'submit', page: 'login' });
      
      expect(Sentry.addBreadcrumb).toHaveBeenCalled();
    });

    it('should track user action without properties', async () => {
      const { trackUserAction } = await import('../../services/monitoring');
      
      trackUserAction('page_view');
      
      expect(Sentry.addBreadcrumb).toHaveBeenCalled();
    });
  });

  describe('recordMetric', () => {
    it('should record metric with default unit', async () => {
      const { recordMetric } = await import('../../services/monitoring');
      
      recordMetric('api.response.time', 150);
      
      expect(Sentry.setContext).toHaveBeenCalled();
      expect(Sentry.addBreadcrumb).toHaveBeenCalled();
    });

    it('should record metric with custom unit', async () => {
      const { recordMetric } = await import('../../services/monitoring');
      
      recordMetric('memory.usage', 512, 'MB');
      
      expect(Sentry.setContext).toHaveBeenCalled();
      expect(Sentry.addBreadcrumb).toHaveBeenCalled();
    });
  });
});
