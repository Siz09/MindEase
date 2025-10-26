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
import api from '../../utils/api';

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

  const activeRef = useRef(null);
  const aiRef = useRef(null);
  const moodRef = useRef(null);
  const charts = useRef({});

  async function loadAll() {
    const [a, u, m] = await Promise.all([
      api.get('/admin/active-users'),
      api.get('/admin/ai-usage'),
      api.get('/admin/mood-correlation'),
    ]);
    setActive(a.data || []);
    setAi(u.data || []);
    setMood(m.data || []);
  }

  useEffect(() => {
    let mounted = true;
    loadAll().catch(() => undefined);
    const id = setInterval(() => mounted && loadAll().catch(() => undefined), 60000);
    return () => {
      mounted = false;
      clearInterval(id);
      Object.values(charts.current).forEach((c) => c?.destroy?.());
    };
  }, []);

  useEffect(() => {
    if (activeRef.current) {
      charts.current.active?.destroy?.();
      charts.current.active = new Chart(activeRef.current, {
        type: 'line',
        data: {
          labels: active.map((x) => fmt(x.day)),
          datasets: [
            { label: 'Daily Active Users', data: active.map((x) => x.activeUsers ?? x.count ?? 0) },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true } },
        },
      });
    }
    if (aiRef.current) {
      charts.current.ai?.destroy?.();
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
    }
    if (moodRef.current) {
      charts.current.mood?.destroy?.();
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
    }
  }, [active, ai, mood]);

  return (
    <div className="grid">
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
