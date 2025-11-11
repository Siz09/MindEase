'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  BarController,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import api from '../adminApi';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  BarController,
  BarElement,
  Tooltip,
  Legend
);

const fmt = (d) => new Date(d).toLocaleDateString();

export default function Overview() {
  const [active, setActive] = useState([]);
  const [ai, setAi] = useState([]);
  const [mood, setMood] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const activeRef = useRef(null);
  const aiRef = useRef(null);
  const moodRef = useRef(null);
  const charts = useRef({});
  const isCanvasLive = (canvas) => !!(canvas && canvas.ownerDocument && canvas.isConnected);

  useEffect(() => {
    let mounted = true;

    async function loadAllIfMounted() {
      try {
        setError(null);
        const [a, u, m] = await Promise.all([
          api.get('/admin/active-users'),
          api.get('/admin/ai-usage'),
          api.get('/admin/mood-correlation'),
        ]);
        if (mounted) {
          setActive(a.data || []);
          setAi(u.data || []);
          setMood(m.data || []);
        }
      } catch (err) {
        if (mounted) setError('Failed to load dashboard data');
        // Proactively tear down any existing charts to avoid Chart.js acting on detached canvases
        try {
          charts.current.active?.destroy?.();
        } catch (_e) {
          /* noop */
        }
        try {
          charts.current.ai?.destroy?.();
        } catch (_e) {
          /* noop */
        }
        try {
          charts.current.mood?.destroy?.();
        } catch (_e) {
          /* noop */
        }
        charts.current = {};
        console.error('Dashboard load error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAllIfMounted();
    const id = setInterval(() => {
      if (mounted) loadAllIfMounted();
    }, 60000);

    return () => {
      mounted = false;
      clearInterval(id);
      Object.values(charts.current).forEach((c) => c?.destroy?.());
    };
  }, []);

  useEffect(() => {
    // If there was a load error, skip chart work on this pass
    if (error) return;
    if (activeRef.current) {
      if (!charts.current.active && isCanvasLive(activeRef.current)) {
        charts.current.active = new Chart(activeRef.current, {
          type: 'line',
          data: {
            labels: active.map((x) => fmt(x.day)),
            datasets: [
              {
                label: 'Daily Active Users',
                data: active.map((x) => x.activeUsers ?? x.count ?? 0),
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } },
          },
        });
      } else if (charts.current.active && isCanvasLive(charts.current.active.canvas)) {
        charts.current.active.data.labels = active.map((x) => fmt(x.day));
        charts.current.active.data.datasets[0].data = active.map(
          (x) => x.activeUsers ?? x.count ?? 0
        );
        try {
          charts.current.active.update();
        } catch (_e) {
          /* noop */
        }
      } else if (charts.current.active && !isCanvasLive(charts.current.active.canvas)) {
        try {
          charts.current.active.destroy();
        } catch (_e) {
          /* noop */
        }
        charts.current.active = null;
      }
    }
    if (aiRef.current) {
      if (!charts.current.ai && isCanvasLive(aiRef.current)) {
        charts.current.ai = new Chart(aiRef.current, {
          type: 'bar',
          data: {
            labels: ai.map((x) => fmt(x.day)),
            datasets: [{ label: 'AI Calls', data: ai.map((x) => x.calls ?? 0) }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } },
          },
        });
      } else if (charts.current.ai && isCanvasLive(charts.current.ai.canvas)) {
        charts.current.ai.data.labels = ai.map((x) => fmt(x.day));
        charts.current.ai.data.datasets[0].data = ai.map((x) => x.calls ?? 0);
        try {
          charts.current.ai.update();
        } catch (_e) {
          /* noop */
        }
      } else if (charts.current.ai && !isCanvasLive(charts.current.ai.canvas)) {
        try {
          charts.current.ai.destroy();
        } catch (_e) {
          /* noop */
        }
        charts.current.ai = null;
      }
    }
    if (moodRef.current) {
      if (!charts.current.mood && isCanvasLive(moodRef.current)) {
        charts.current.mood = new Chart(moodRef.current, {
          type: 'line',
          data: {
            labels: mood.map((x) => fmt(x.day)),
            datasets: [
              { label: 'Avg Mood (1–5)', data: mood.map((x) => x.avgMood ?? null), yAxisID: 'y1' },
              {
                label: 'Sessions',
                data: mood.map((x) => x.chatCount ?? x.sessionCount ?? 0),
                yAxisID: 'y2',
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y1: { type: 'linear', position: 'left', suggestedMin: 1, suggestedMax: 5 },
              y2: {
                type: 'linear',
                position: 'right',
                beginAtZero: true,
                grid: { drawOnChartArea: false },
              },
            },
          },
        });
      } else if (charts.current.mood && isCanvasLive(charts.current.mood.canvas)) {
        charts.current.mood.data.labels = mood.map((x) => fmt(x.day));
        charts.current.mood.data.datasets[0].data = mood.map((x) => x.avgMood ?? null);
        charts.current.mood.data.datasets[1].data = mood.map(
          (x) => x.chatCount ?? x.sessionCount ?? 0
        );
        try {
          charts.current.mood.update();
        } catch (_e) {
          /* noop */
        }
      } else if (charts.current.mood && !isCanvasLive(charts.current.mood.canvas)) {
        try {
          charts.current.mood.destroy();
        } catch (_e) {
          /* noop */
        }
        charts.current.mood = null;
      }
    }
  }, [active, ai, mood, error]);

  return (
    <div className="grid">
      {loading && !error && active.length === 0 && ai.length === 0 && mood.length === 0 && (
        <div className="panel" style={{ gridColumn: '1 / -1' }}>
          <div className="panel-body">Loading...</div>
        </div>
      )}
      {!!error && (
        <div className="panel" style={{ gridColumn: '1 / -1' }}>
          <div className="panel-body">{error}</div>
        </div>
      )}
      <div className="panel">
        <div className="panel-head">Active Users</div>
        <div className="panel-body">
          <canvas ref={activeRef} />
        </div>
      </div>
      <div className="panel">
        <div className="panel-head">AI Usage</div>
        <div className="panel-body">
          <canvas ref={aiRef} />
        </div>
      </div>
      <div className="panel">
        <div className="panel-head">Mood Correlation</div>
        <div className="panel-body">
          <canvas ref={moodRef} />
        </div>
      </div>
    </div>
  );
}
