package com.mindease.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import java.lang.management.ManagementFactory;
import java.lang.management.OperatingSystemMXBean;
import java.lang.management.MemoryMXBean;
import java.util.HashMap;
import java.util.Map;

@Service
public class PerformanceMonitorService {

    private static final Logger logger = LoggerFactory.getLogger(PerformanceMonitorService.class);

    private final OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
    private final MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();

    public Map<String, Object> getSystemMetrics() {
        Map<String, Object> metrics = new HashMap<>();

        // Memory
        long heapMemoryUsed = memoryBean.getHeapMemoryUsage().getUsed();
        long heapMemoryMax = memoryBean.getHeapMemoryUsage().getMax();
        metrics.put("heapMemoryUsed", heapMemoryUsed);
        metrics.put("heapMemoryMax", heapMemoryMax);
        double heapUsagePercent = heapMemoryMax > 0
                ? (double) heapMemoryUsed / heapMemoryMax * 100
                : 0.0;
        metrics.put("heapMemoryUsagePercent", heapUsagePercent);

        // CPU Load (if available)
        if (osBean instanceof com.sun.management.OperatingSystemMXBean) {
            double cpuLoad = ((com.sun.management.OperatingSystemMXBean) osBean).getSystemCpuLoad();
            metrics.put("systemCpuLoad", cpuLoad * 100);
        } else {
            // getSystemLoadAverage() returns load average, not CPU percentage
            // WARNING: Load average represents the average number of runnable and waiting processes,
            // not actual CPU utilization. A load average of 4.0 on a 4-core system could indicate
            // 100% utilization, 50% utilization with blocking I/O, or many other states.
            // This conversion is an approximation and may not reflect actual CPU percentage.
            // For accurate CPU metrics, use a platform-specific library or the com.sun.management
            // OperatingSystemMXBean when available.
            double loadAvg = osBean.getSystemLoadAverage();
            int availableProcessors = osBean.getAvailableProcessors();
            // Approximate: normalize load average by number of processors
            double cpuPercent = loadAvg > 0 && availableProcessors > 0
                    ? Math.min((loadAvg / availableProcessors) * 100, 100.0)
                    : -1.0; // Unavailable on this platform
            metrics.put("systemCpuLoad", cpuPercent);
        }

        // Threads - use ThreadMXBean for accurate thread count
        metrics.put("activeThreads", ManagementFactory.getThreadMXBean().getThreadCount());

        // Uptime
        metrics.put("uptime", ManagementFactory.getRuntimeMXBean().getUptime());

        // Disk usage calculation
        try {
            java.nio.file.FileStore store = java.nio.file.Files.getFileStore(
                    java.nio.file.Paths.get(System.getProperty("user.dir")));
            long totalSpace = store.getTotalSpace();
            long usableSpace = store.getUsableSpace();
            if (totalSpace > 0) {
                int diskUsage = (int) (((totalSpace - usableSpace) * 100) / totalSpace);
                metrics.put("diskUsage", diskUsage);
            } else {
                metrics.put("diskUsage", 0);
            }
        } catch (Exception e) {
            logger.warn("Failed to calculate disk usage", e);
            metrics.put("diskUsage", 0);
        }

        return metrics;
    }
}
