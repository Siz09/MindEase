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
            metrics.put("systemCpuLoad", osBean.getSystemLoadAverage());
        }

        // Threads
        metrics.put("activeThreads", Thread.activeCount());

        // Uptime
        metrics.put("uptime", ManagementFactory.getRuntimeMXBean().getUptime());

        return metrics;
    }
}
