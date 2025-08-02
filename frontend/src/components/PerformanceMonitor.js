
import { useEffect } from 'react';

const PerformanceMonitor = () => {
  useEffect(() => {
    // Monitor Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'measure') {
          console.log(`⚡ Performance: ${entry.name} took ${entry.duration}ms`);
          
          // Log slow operations
          if (entry.duration > 100) {
            console.warn(`🐌 Slow operation detected: ${entry.name} (${entry.duration}ms)`);
          }
        }
      });
    });

    observer.observe({ entryTypes: ['measure', 'navigation'] });

    // Monitor memory usage
    if (performance.memory) {
      const checkMemory = () => {
        const memory = performance.memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
        
        if (usedMB > 100) { // Alert if using more than 100MB
          console.warn(`🧠 High memory usage: ${usedMB}MB / ${totalMB}MB`);
        }
      };

      const memoryInterval = setInterval(checkMemory, 30000); // Check every 30s
      return () => clearInterval(memoryInterval);
    }

    return () => observer.disconnect();
  }, []);

  return null;
};

export default PerformanceMonitor;
