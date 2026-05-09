/**
 * Web Vitals 性能监控
 * 
 * 监控指标:
 * - LCP (Largest Contentful Paint): 最大内容绘制
 * - FID (First Input Delay): 首次输入延迟
 * - CLS (Cumulative Layout Shift): 累积布局偏移
 * - FCP (First Contentful Paint): 首次内容绘制
 * - TTFB (Time to First Byte): 首字节时间
 * - INP (Interaction to Next Paint): 交互到下次绘制
 */

import { onCLS, onFCP, onFID, onLCP, onTTFB, onINP, Metric } from 'web-vitals';
import { recordMetric, captureMessage } from './monitoring';

// 性能阈值 (Google 推荐标准)
const THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 },
  FID: { good: 100, needsImprovement: 300 },
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  TTFB: { good: 800, needsImprovement: 1800 },
  INP: { good: 200, needsImprovement: 500 },
};

type MetricName = keyof typeof THRESHOLDS;

/**
 * 判断性能等级
 */
const getPerformanceRating = (name: MetricName, value: number): 'good' | 'needs-improvement' | 'poor' => {
  const threshold = THRESHOLDS[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
};

/**
 * 通用指标处理函数
 */
const handleMetric = (metric: Metric) => {
  const { name, value, delta, id } = metric;
  
  // 记录到 Sentry
  recordMetric(`web_vitals.${name.toLowerCase()}`, value);
  
  // 计算性能等级
  const performanceRating = getPerformanceRating(name as MetricName, value);
  
  // 性能差时发送警告
  if (performanceRating === 'poor') {
    captureMessage(
      `Poor Web Vital: ${name} = ${value.toFixed(2)}ms`,
      'warning'
    );
  }
  
  // 打印到控制台 (开发环境)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${name}:`, {
      value: value.toFixed(2),
      rating: performanceRating,
      delta: delta.toFixed(2),
      id,
    });
  }
  
  // 可选: 发送到自定义分析服务
  sendToAnalytics({
    metric: name,
    value,
    rating: performanceRating,
    delta,
    id,
  });
};

/**
 * 发送到分析服务 (可选)
 */
const sendToAnalytics = (data: any) => {
  // 示例: 发送到 Google Analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'web_vitals', {
      event_category: 'Web Vitals',
      event_label: data.metric,
      value: Math.round(data.value),
      metric_rating: data.rating,
      non_interaction: true,
    });
  }
  
  // 示例: 发送到自定义后端
  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    navigator.sendBeacon('/api/analytics/web-vitals', blob);
  }
};

/**
 * 初始化 Web Vitals 监控
 */
export const initWebVitals = () => {
  try {
    onLCP(handleMetric);
    onFID(handleMetric);
    onCLS(handleMetric);
    onFCP(handleMetric);
    onTTFB(handleMetric);
    onINP(handleMetric);
    
    console.log('[Web Vitals] Monitoring initialized');
  } catch (error) {
    console.error('[Web Vitals] Initialization failed:', error);
  }
};

/**
 * 手动记录自定义性能指标
 */
export const measurePerformance = (name: string, startTime: number) => {
  const duration = performance.now() - startTime;
  recordMetric(`custom.${name}`, duration);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
  }
  
  return duration;
};

/**
 * 性能标记 (用于自定义测量)
 */
export const mark = (name: string) => {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name);
  }
};

/**
 * 性能测量 (计算两个标记之间的时间)
 */
export const measure = (name: string, startMark: string, endMark: string) => {
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      recordMetric(`measure.${name}`, measure?.duration ?? 0);
      return measure?.duration ?? 0;
    } catch (error) {
      console.error(`[Performance] Measure failed: ${name}`, error);
    }
  }
  return 0;
};

/**
 * 获取导航时间信息
 */
export const getNavigationTiming = () => {
  if (typeof performance === 'undefined' || !performance.getEntriesByType) {
    return null;
  }
  
  const [navigation] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  
  if (!navigation) return null;
  
  return {
    // DNS 查询时间
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    // TCP 连接时间
    tcp: navigation.connectEnd - navigation.connectStart,
    // 请求时间
    request: navigation.responseStart - navigation.requestStart,
    // 响应时间
    response: navigation.responseEnd - navigation.responseStart,
    // DOM 解析时间
    domParse: navigation.domInteractive - navigation.responseEnd,
    // DOM 内容加载完成
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
    // 页面完全加载
    load: navigation.loadEventEnd - navigation.loadEventStart,
    // 总时间
    total: navigation.loadEventEnd - navigation.fetchStart,
  };
};

/**
 * 监控资源加载性能
 */
export const monitorResourceTiming = () => {
  if (typeof performance === 'undefined' || !performance.getEntriesByType) {
    return;
  }
  
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  // 统计慢资源
  const slowResources = resources.filter(resource => resource.duration > 1000);
  
  if (slowResources.length > 0) {
    captureMessage(
      `Slow resources detected: ${slowResources.length} resources took > 1s`,
      'warning'
    );
    
    slowResources.forEach(resource => {
      console.warn('[Slow Resource]', {
        name: resource.name,
        duration: resource.duration.toFixed(2),
        size: (resource as any).transferSize,
      });
    });
  }
};

export default {
  initWebVitals,
  measurePerformance,
  mark,
  measure,
  getNavigationTiming,
  monitorResourceTiming,
};
