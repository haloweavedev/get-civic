// src/hooks/use-performance.ts
import { useEffect } from 'react';

export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 1000) {
        console.warn(
          `[Performance] ${componentName} took ${duration.toFixed(2)}ms to render`
        );
      }
    };
  }, [componentName]);
}