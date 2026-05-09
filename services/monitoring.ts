/**
 * 监控服务 - Sentry 集成
 * 
 * 功能:
 * 1. 错误追踪和上报
 * 2. 性能监控
 * 3. 用户行为追踪
 * 4. 自定义事件记录
 */

import * as Sentry from '@sentry/react';

// 环境配置
const SENTRY_DSN = process.env.SENTRY_DSN || '';
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const RELEASE = process.env.VITE_APP_VERSION || '1.0.0';

/**
 * 初始化 Sentry
 * 在 App 入口调用
 */
export const initMonitoring = () => {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Monitoring disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: RELEASE,
    
    // 性能监控
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // 采样率配置
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // 忽略特定错误
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'Network request failed',
    ],
    
    // 面包屑配置
    beforeBreadcrumb(breadcrumb) {
      // 过滤敏感信息
      if (breadcrumb.category === 'console') {
        return null;
      }
      return breadcrumb;
    },
    
    // 事件前处理
    beforeSend(event, hint) {
      // 开发环境只打印,不上报
      if (ENVIRONMENT === 'development') {
        console.error('Sentry Event:', event, hint);
        return null;
      }
      
      // 过滤用户敏感信息
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }
      
      return event;
    },
  });
};

/**
 * 设置用户上下文
 */
export const setUser = (userId: string, username?: string) => {
  Sentry.setUser({
    id: userId,
    username: username || 'anonymous',
  });
};

/**
 * 清除用户上下文 (登出时调用)
 */
export const clearUser = () => {
  Sentry.setUser(null);
};

/**
 * 手动捕获异常
 */
export const captureException = (error: Error, context?: Record<string, any>) => {
  Sentry.captureException(error, {
    extra: context,
  });
};

/**
 * 记录自定义消息
 */
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level);
};

/**
 * 添加面包屑 (用户行为追踪)
 */
export const addBreadcrumb = (message: string, category: string, data?: Record<string, any>) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
  });
};

/**
 * 性能监控 - 手动事务
 */
export const startTransaction = (name: string, op: string) => {
  return Sentry.startTransaction({
    name,
    op,
  });
};

/**
 * AI 请求监控装饰器
 */
export const monitorAIRequest = async <T>(
  requestName: string,
  requestFn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  const transaction = startTransaction(`ai.${requestName}`, 'ai.request');
  
  try {
    addBreadcrumb(`AI Request: ${requestName}`, 'ai', metadata);
    const result = await requestFn();
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    captureException(error as Error, {
      requestName,
      ...metadata,
    });
    throw error;
  } finally {
    transaction.finish();
  }
};

/**
 * API 请求监控装饰器
 */
export const monitorAPIRequest = async <T>(
  endpoint: string,
  requestFn: () => Promise<T>
): Promise<T> => {
  const transaction = startTransaction(`api.${endpoint}`, 'http.request');
  
  try {
    const result = await requestFn();
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    captureException(error as Error, { endpoint });
    throw error;
  } finally {
    transaction.finish();
  }
};

/**
 * 用户行为追踪
 */
export const trackUserAction = (action: string, properties?: Record<string, any>) => {
  addBreadcrumb(action, 'user.action', properties);
  
  // 可选: 集成第三方分析工具
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, properties);
  }
};

/**
 * 性能指标记录
 */
export const recordMetric = (name: string, value: number, unit: string = 'ms') => {
  Sentry.metrics.distribution(name, value, {
    unit,
    tags: { environment: ENVIRONMENT },
  });
};

export default {
  initMonitoring,
  setUser,
  clearUser,
  captureException,
  captureMessage,
  addBreadcrumb,
  startTransaction,
  monitorAIRequest,
  monitorAPIRequest,
  trackUserAction,
  recordMetric,
};
