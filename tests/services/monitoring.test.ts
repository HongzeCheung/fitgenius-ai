import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Sentry before importing
const mockInit = vi.fn();
const mockSetUser = vi.fn();
const mockCaptureException = vi.fn();
const mockCaptureMessage = vi.fn();
const mockAddBreadcrumb = vi.fn();
const mockStartSpan = vi.fn((options, callback) => {
  void options;
  return callback(undefined);
});
const mockSetContext = vi.fn();
const mockBrowserTracingIntegration = vi.fn(() => ({}));
const mockReplayIntegration = vi.fn(() => ({}));

vi.mock('@sentry/react', () => ({
  init: mockInit,
  setUser: mockSetUser,
  captureException: mockCaptureException,
  captureMessage: mockCaptureMessage,
  addBreadcrumb: mockAddBreadcrumb,
  startSpan: mockStartSpan,
  setContext: mockSetContext,
  browserTracingIntegration: mockBrowserTracingIntegration,
  replayIntegration: mockReplayIntegration,
}));

describe('Monitoring Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment
    delete process.env.SENTRY_DSN;
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('initMonitoring', () => {
    it.skip('should initialize Sentry with correct config', async () => {
      // Set DSN before importing
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      
      // Import after setting env
      const { initMonitoring } = await import('../../services/monitoring');
      
      initMonitoring();
      
      expect(mockInit).toHaveBeenCalled();
    });

    it('should warn when DSN is not configured', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Import without DSN
      const { initMonitoring } = await import('../../services/monitoring');
      initMonitoring();
      
      expect(consoleSpy).toHaveBeenCalledWith('Sentry DSN not configured. Monitoring disabled.');
      expect(mockInit).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('setUser', () => {
    it('should set user context', async () => {
      const { setUser } = await import('../../services/monitoring');
      
      setUser('user123', 'testuser');
      
      expect(mockSetUser).toHaveBeenCalledWith({
        id: 'user123',
        username: 'testuser',
      });
    });

    it('should use anonymous when username not provided', async () => {
      const { setUser } = await import('../../services/monitoring');
      
      setUser('user123');
      
      expect(mockSetUser).toHaveBeenCalledWith({
        id: 'user123',
        username: 'anonymous',
      });
    });
  });

  describe('clearUser', () => {
    it('should clear user context', async () => {
      const { clearUser } = await import('../../services/monitoring');
      
      clearUser();
      
      expect(mockSetUser).toHaveBeenCalledWith(null);
    });
  });

  describe('captureException', () => {
    it('should capture exception with context', async () => {
      const { captureException } = await import('../../services/monitoring');
      const error = new Error('Test error');
      const context = { userId: '123', action: 'test' };
      
      captureException(error, context);
      
      expect(mockCaptureException).toHaveBeenCalledWith(error, {
        extra: context,
      });
    });

    it('should capture exception without context', async () => {
      const { captureException } = await import('../../services/monitoring');
      const error = new Error('Test error');
      
      captureException(error);
      
      expect(mockCaptureException).toHaveBeenCalledWith(error, {
        extra: undefined,
      });
    });
  });

  describe('captureMessage', () => {
    it('should capture message with default level', async () => {
      const { captureMessage } = await import('../../services/monitoring');
      
      captureMessage('Test message');
      
      expect(mockCaptureMessage).toHaveBeenCalledWith('Test message', 'info');
    });

    it('should capture message with custom level', async () => {
      const { captureMessage } = await import('../../services/monitoring');
      
      captureMessage('Error message', 'error');
      
      expect(mockCaptureMessage).toHaveBeenCalledWith('Error message', 'error');
    });
  });

  describe('addBreadcrumb', () => {
    it('should add breadcrumb with data', async () => {
      const { addBreadcrumb } = await import('../../services/monitoring');
      
      addBreadcrumb('User action', 'user', { button: 'submit' });
      
      expect(mockAddBreadcrumb).toHaveBeenCalledWith({
        message: 'User action',
        category: 'user',
        level: 'info',
        data: { button: 'submit' },
      });
    });

    it('should add breadcrumb without data', async () => {
      const { addBreadcrumb } = await import('../../services/monitoring');
      
      addBreadcrumb('Navigation', 'navigation');
      
      expect(mockAddBreadcrumb).toHaveBeenCalledWith({
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
      
      expect(mockStartSpan).toHaveBeenCalled();
      expect(result).toBe('result');
    });
  });

  describe('monitorAIRequest', () => {
    it('should monitor successful AI request', async () => {
      const { monitorAIRequest } = await import('../../services/monitoring');
      const requestFn = vi.fn(async () => 'success');
      
      const result = await monitorAIRequest('test-request', requestFn, { model: 'gpt-4' });
      
      expect(result).toBe('success');
      expect(mockAddBreadcrumb).toHaveBeenCalled();
    });

    it('should capture error on failed AI request', async () => {
      const { monitorAIRequest } = await import('../../services/monitoring');
      const error = new Error('AI request failed');
      const requestFn = vi.fn(async () => {
        throw error;
      });
      
      await expect(monitorAIRequest('test-request', requestFn)).rejects.toThrow('AI request failed');
      expect(mockCaptureException).toHaveBeenCalled();
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
      expect(mockCaptureException).toHaveBeenCalled();
    });
  });

  describe('trackUserAction', () => {
    it('should track user action with properties', async () => {
      const { trackUserAction } = await import('../../services/monitoring');
      
      trackUserAction('button_click', { button: 'submit', page: 'login' });
      
      expect(mockAddBreadcrumb).toHaveBeenCalled();
    });

    it('should track user action without properties', async () => {
      const { trackUserAction } = await import('../../services/monitoring');
      
      trackUserAction('page_view');
      
      expect(mockAddBreadcrumb).toHaveBeenCalled();
    });
  });

  describe('recordMetric', () => {
    it('should record metric with default unit', async () => {
      const { recordMetric } = await import('../../services/monitoring');
      
      recordMetric('api.response.time', 150);
      
      expect(mockSetContext).toHaveBeenCalled();
      expect(mockAddBreadcrumb).toHaveBeenCalled();
    });

    it('should record metric with custom unit', async () => {
      const { recordMetric } = await import('../../services/monitoring');
      
      recordMetric('memory.usage', 512, 'MB');
      
      expect(mockSetContext).toHaveBeenCalled();
      expect(mockAddBreadcrumb).toHaveBeenCalled();
    });
  });
});
