package com.mindease.service;

import org.springframework.stereotype.Service;
import java.lang.management.ManagementFactory;
import java.lang.management.OperatingSystemMXBean;
import java.lang.management.MemoryMXBean;
import java.util.HashMap;
import java.util.Map;

@Service
public class PerformanceMonitorService {

    private final OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
    private final MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();

    public Map<String, Object> getSystemMetrics() {
        Map<String, Object> metrics = new HashMap<>();

        // Memory
        long heapMemoryUsed = memoryBean.getHeapMemoryUsage().getUsed();
        long heapMemoryMax = memoryBean.getHeapMemoryUsage().getMax();
        metrics.put("heapMemoryUsed", heapMemoryUsed);
        metrics.put("heapMemoryMax", heapMemoryMax);
        metrics.put("heapMemoryUsagePercent", (double) heapMemoryUsed / heapMemoryMax * 100);

        // CPU Load (if available)
        if (osBean instanceof com.sun.management.OperatingSystemMXBean) {
            double cpuLoad = ((com.sun.management.OperatingSystemMXBean) osBean).getSystemCpuLoad();
            metrics.put("systemCpuLoad", cpuLoad * 100);
        } else {
            // getSystemLoadAverage() returns load average, not CPU percentage
            // Convert load average to approximate percentage
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

        return metrics;
    }
}
