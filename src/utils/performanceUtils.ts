import { IS_PRODUCTION } from "@/config/environment";

// Performance monitoring utilities
export class PerformanceMonitor {
  private static measurements: Map<string, number> = new Map();

  static startMeasure(name: string): void {
    if (!IS_PRODUCTION && "performance" in window) {
      performance.mark(`${name}-start`);
      this.measurements.set(name, performance.now());
    }
  }

  static endMeasure(name: string): number | null {
    if (!IS_PRODUCTION && "performance" in window) {
      const startTime = this.measurements.get(name);
      if (startTime) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);

        console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
        this.measurements.delete(name);

        return duration;
      }
    }
    return null;
  }

  static measureAsync<T>(
    name: string,
    asyncFunction: () => Promise<T>,
  ): Promise<T> {
    this.startMeasure(name);
    return asyncFunction().finally(() => {
      this.endMeasure(name);
    });
  }
}

// Core Web Vitals monitoring
export const initCoreWebVitals = () => {
  if (!IS_PRODUCTION) return;

  // Largest Contentful Paint (LCP)
  if ("PerformanceObserver" in window) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];

      console.log("LCP:", lastEntry.startTime);

      // You can send this to your analytics service
      // analytics.track('core_web_vital', {
      //   metric: 'LCP',
      //   value: lastEntry.startTime
      // });
    });

    observer.observe({ entryTypes: ["largest-contentful-paint"] });

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log("FID:", entry.processingStart - entry.startTime);

        // analytics.track('core_web_vital', {
        //   metric: 'FID',
        //   value: entry.processingStart - entry.startTime
        // });
      }
    });

    fidObserver.observe({ entryTypes: ["first-input"] });
  }

  // Cumulative Layout Shift (CLS)
  let clsValue = 0;
  let clsEntries: PerformanceEntry[] = [];

  if ("PerformanceObserver" in window) {
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsEntries.push(entry);
          clsValue += (entry as any).value;
        }
      }
    });

    clsObserver.observe({ entryTypes: ["layout-shift"] });

    // Report CLS when the page visibility changes
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        console.log("CLS:", clsValue);

        // analytics.track('core_web_vital', {
        //   metric: 'CLS',
        //   value: clsValue
        // });
      }
    });
  }
};

// Image optimization utilities
export const createOptimizedImageUrl = (
  originalUrl: string,
  width?: number,
  height?: number,
  format: "webp" | "jpg" | "png" = "webp",
): string => {
  // If using a service like Cloudinary or ImageKit, construct optimized URL
  // For now, return original URL

  // Example with Cloudinary:
  // if (originalUrl.includes('cloudinary.com')) {
  //   const params = [];
  //   if (width) params.push(`w_${width}`);
  //   if (height) params.push(`h_${height}`);
  //   params.push(`f_${format}`, 'q_auto');
  //
  //   return originalUrl.replace('/upload/', `/upload/${params.join(',')}/`);
  // }

  return originalUrl;
};

// Lazy loading intersection observer
export const createLazyLoadObserver = (
  callback: (element: Element) => void,
): IntersectionObserver => {
  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback(entry.target);
        }
      });
    },
    {
      rootMargin: "50px 0px",
      threshold: 0.1,
    },
  );
};

// Bundle size analyzer (development only)
export const analyzeBundleSize = () => {
  if (IS_PRODUCTION) return;

  const scripts = document.querySelectorAll("script[src]");
  const styles = document.querySelectorAll('link[rel="stylesheet"]');

  console.group("📦 Bundle Analysis");
  console.log(`Scripts: ${scripts.length}`);
  console.log(`Stylesheets: ${styles.length}`);

  // Estimate bundle sizes (approximate)
  let totalEstimatedSize = 0;
  scripts.forEach((script) => {
    const src = (script as HTMLScriptElement).src;
    if (src.includes("index-")) {
      console.log("Main bundle:", src);
    }
  });

  console.groupEnd();
};
