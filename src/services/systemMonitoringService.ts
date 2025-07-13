import { generateSystemValidationReport } from "@/utils/enhancedValidation";
import { getSystemStatistics } from "./apsAwareCourseAssignmentService";

/**
 * System Monitoring Service
 * Addresses critical need for monitoring and error tracking in the university course system
 */

export interface SystemHealthReport {
  timestamp: string;
  status: "healthy" | "warning" | "critical";
  score: number; // 0-100 health score
  issues: {
    critical: number;
    warnings: number;
    fixed: number;
  };
  performance: {
    averageResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
  };
  dataQuality: {
    validCourses: number;
    totalCourses: number;
    averageValidationScore: number;
    facultyCollisions: number;
  };
  recommendations: string[];
}

export interface ErrorLog {
  id: string;
  timestamp: string;
  type: "validation" | "assignment" | "aps" | "ui" | "performance";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  context: any;
  resolved: boolean;
  resolvedAt?: string;
  resolution?: string;
}

class SystemMonitoringService {
  private static instance: SystemMonitoringService;
  private errorLogs: Map<string, ErrorLog> = new Map();
  private performanceMetrics: {
    responseTimes: number[];
    errors: number;
    requests: number;
    cacheHits: number;
    cacheMisses: number;
  } = {
    responseTimes: [],
    errors: 0,
    requests: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  static getInstance(): SystemMonitoringService {
    if (!this.instance) {
      this.instance = new SystemMonitoringService();
    }
    return this.instance;
  }

  /**
   * Log an error with comprehensive context
   */
  logError(
    type: ErrorLog["type"],
    severity: ErrorLog["severity"],
    message: string,
    context: any = {},
  ): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const errorLog: ErrorLog = {
      id,
      timestamp: new Date().toISOString(),
      type,
      severity,
      message,
      context: {
        ...context,
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : "server",
        url: typeof window !== "undefined" ? window.location.href : "unknown",
      },
      resolved: false,
    };

    this.errorLogs.set(id, errorLog);

    // Auto-resolve low severity errors after 1 hour
    if (severity === "low") {
      setTimeout(
        () => {
          this.resolveError(id, "Auto-resolved: Low severity timeout");
        },
        60 * 60 * 1000,
      );
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error(`[${severity.toUpperCase()}] ${type}: ${message}`, context);
    }

    return id;
  }

  /**
   * Mark an error as resolved
   */
  resolveError(id: string, resolution: string): boolean {
    const error = this.errorLogs.get(id);
    if (!error) return false;

    error.resolved = true;
    error.resolvedAt = new Date().toISOString();
    error.resolution = resolution;

    this.errorLogs.set(id, error);
    return true;
  }

  /**
   * Track performance metrics
   */
  trackPerformance(
    responseTime: number,
    isError: boolean = false,
    cacheHit: boolean = false,
  ): void {
    this.performanceMetrics.requests++;
    this.performanceMetrics.responseTimes.push(responseTime);

    if (isError) {
      this.performanceMetrics.errors++;
    }

    if (cacheHit) {
      this.performanceMetrics.cacheHits++;
    } else {
      this.performanceMetrics.cacheMisses++;
    }

    // Keep only last 1000 response times
    if (this.performanceMetrics.responseTimes.length > 1000) {
      this.performanceMetrics.responseTimes =
        this.performanceMetrics.responseTimes.slice(-1000);
    }
  }

  /**
   * Generate comprehensive system health report
   */
  async generateHealthReport(): Promise<SystemHealthReport> {
    try {
      // Get validation report
      const validationReport = generateSystemValidationReport();

      // Get system statistics
      const systemStats = getSystemStatistics();

      // Calculate performance metrics
      const averageResponseTime =
        this.performanceMetrics.responseTimes.length > 0
          ? this.performanceMetrics.responseTimes.reduce((a, b) => a + b, 0) /
            this.performanceMetrics.responseTimes.length
          : 0;

      const errorRate =
        this.performanceMetrics.requests > 0
          ? (this.performanceMetrics.errors /
              this.performanceMetrics.requests) *
            100
          : 0;

      const cacheHitRate =
        this.performanceMetrics.cacheHits +
          this.performanceMetrics.cacheMisses >
        0
          ? (this.performanceMetrics.cacheHits /
              (this.performanceMetrics.cacheHits +
                this.performanceMetrics.cacheMisses)) *
            100
          : 0;

      // Count current issues
      const unresolvedErrors = Array.from(this.errorLogs.values()).filter(
        (e) => !e.resolved,
      );
      const criticalErrors = unresolvedErrors.filter(
        (e) => e.severity === "critical",
      ).length;
      const warningErrors = unresolvedErrors.filter(
        (e) => e.severity === "high" || e.severity === "medium",
      ).length;
      const resolvedErrors = Array.from(this.errorLogs.values()).filter(
        (e) => e.resolved,
      ).length;

      // Calculate overall health score
      let healthScore = 100;

      // Deduct for errors
      healthScore -= criticalErrors * 20;
      healthScore -= warningErrors * 5;
      healthScore -= validationReport.issues.criticalErrors.length * 15;
      healthScore -= validationReport.issues.commonWarnings.length * 2;

      // Deduct for performance issues
      if (errorRate > 5) healthScore -= 10;
      if (averageResponseTime > 1000) healthScore -= 10;
      if (cacheHitRate < 70) healthScore -= 5;

      // Deduct for data quality issues
      const dataQualityScore = validationReport.summary.averageScore;
      if (dataQualityScore < 80) healthScore -= (80 - dataQualityScore) / 2;

      healthScore = Math.max(0, Math.min(100, healthScore));

      // Determine status
      let status: SystemHealthReport["status"] = "healthy";
      if (healthScore < 50 || criticalErrors > 0) {
        status = "critical";
      } else if (
        healthScore < 80 ||
        warningErrors > 5 ||
        dataQualityScore < 70
      ) {
        status = "warning";
      }

      // Generate recommendations
      const recommendations: string[] = [];

      if (criticalErrors > 0) {
        recommendations.push(
          `Address ${criticalErrors} critical errors immediately`,
        );
      }

      if (validationReport.summary.coursesWithErrors > 0) {
        recommendations.push(
          `Fix ${validationReport.summary.coursesWithErrors} courses with data errors`,
        );
      }

      if (errorRate > 5) {
        recommendations.push(
          `High error rate (${errorRate.toFixed(1)}%) - investigate system stability`,
        );
      }

      if (averageResponseTime > 1000) {
        recommendations.push(
          `Slow response times (${averageResponseTime.toFixed(0)}ms) - optimize performance`,
        );
      }

      if (cacheHitRate < 70) {
        recommendations.push(
          `Low cache hit rate (${cacheHitRate.toFixed(1)}%) - review caching strategy`,
        );
      }

      if (dataQualityScore < 80) {
        recommendations.push(
          `Data quality below target (${dataQualityScore}%) - prioritize data cleanup`,
        );
      }

      recommendations.push(...validationReport.recommendations);

      return {
        timestamp: new Date().toISOString(),
        status,
        score: Math.round(healthScore),
        issues: {
          critical: criticalErrors,
          warnings: warningErrors,
          fixed: resolvedErrors,
        },
        performance: {
          averageResponseTime: Math.round(averageResponseTime),
          errorRate: parseFloat(errorRate.toFixed(2)),
          cacheHitRate: parseFloat(cacheHitRate.toFixed(2)),
        },
        dataQuality: {
          validCourses: validationReport.summary.validCourses,
          totalCourses: validationReport.summary.totalCourses,
          averageValidationScore: validationReport.summary.averageScore,
          facultyCollisions: validationReport.issues.facultyCollisions.length,
        },
        recommendations: recommendations.slice(0, 10), // Limit to top 10 recommendations
      };
    } catch (error) {
      // Fallback error report
      this.logError(
        "performance",
        "critical",
        `Failed to generate health report: ${error}`,
      );

      return {
        timestamp: new Date().toISOString(),
        status: "critical",
        score: 0,
        issues: { critical: 1, warnings: 0, fixed: 0 },
        performance: {
          averageResponseTime: 0,
          errorRate: 100,
          cacheHitRate: 0,
        },
        dataQuality: {
          validCourses: 0,
          totalCourses: 0,
          averageValidationScore: 0,
          facultyCollisions: 0,
        },
        recommendations: ["System health monitoring failed - check logs"],
      };
    }
  }

  /**
   * Get error logs with filtering
   */
  getErrorLogs(
    filters: {
      type?: ErrorLog["type"];
      severity?: ErrorLog["severity"];
      resolved?: boolean;
      since?: Date;
    } = {},
  ): ErrorLog[] {
    let logs = Array.from(this.errorLogs.values());

    if (filters.type) {
      logs = logs.filter((log) => log.type === filters.type);
    }

    if (filters.severity) {
      logs = logs.filter((log) => log.severity === filters.severity);
    }

    if (filters.resolved !== undefined) {
      logs = logs.filter((log) => log.resolved === filters.resolved);
    }

    if (filters.since) {
      logs = logs.filter((log) => new Date(log.timestamp) >= filters.since!);
    }

    return logs.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  /**
   * Clear old resolved errors
   */
  cleanupOldErrors(olderThanDays: number = 7): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let cleanedCount = 0;
    for (const [id, error] of this.errorLogs.entries()) {
      if (
        error.resolved &&
        error.resolvedAt &&
        new Date(error.resolvedAt) < cutoffDate
      ) {
        this.errorLogs.delete(id);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Export system data for analysis
   */
  exportSystemData(): {
    healthReport: any;
    errorLogs: ErrorLog[];
    performanceMetrics: any;
    validationReport: any;
  } {
    return {
      healthReport: null, // Will be populated by caller
      errorLogs: this.getErrorLogs(),
      performanceMetrics: { ...this.performanceMetrics },
      validationReport: generateSystemValidationReport(),
    };
  }

  /**
   * Reset metrics (useful for testing)
   */
  resetMetrics(): void {
    this.performanceMetrics = {
      responseTimes: [],
      errors: 0,
      requests: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
    this.errorLogs.clear();
  }
}

// Export singleton instance
export const systemMonitor = SystemMonitoringService.getInstance();

// Convenience functions
export const logError = (
  type: ErrorLog["type"],
  severity: ErrorLog["severity"],
  message: string,
  context?: any,
) => systemMonitor.logError(type, severity, message, context);

export const trackPerformance = (
  responseTime: number,
  isError?: boolean,
  cacheHit?: boolean,
) => systemMonitor.trackPerformance(responseTime, isError, cacheHit);

export const generateHealthReport = () => systemMonitor.generateHealthReport();

export const getErrorLogs = (filters?: any) =>
  systemMonitor.getErrorLogs(filters);

// Auto-cleanup old errors daily
if (typeof window !== "undefined") {
  setInterval(
    () => {
      const cleaned = systemMonitor.cleanupOldErrors(7);
      if (cleaned > 0 && import.meta.env.DEV) {
        console.log(`Cleaned up ${cleaned} old error logs`);
      }
    },
    24 * 60 * 60 * 1000,
  ); // Daily
}
