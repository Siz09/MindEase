'use client';

import { useEffect, useRef } from 'react';
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

const ACTIVE = [
  { day: '2025-10-18', users: 42 },
  { day: '2025-10-19', users: 51 },
  { day: '2025-10-20', users: 37 },
  { day: '2025-10-21', users: 63 },
  { day: '2025-10-22', users: 59 },
  { day: '2025-10-23', users: 71 },
  { day: '2025-10-24', users: 68 },
];
const AI = [
  { day: '2025-10-18', calls: 120 },
  { day: '2025-10-19', calls: 132 },
  { day: '2025-10-20', calls: 101 },
  { day: '2025-10-21', calls: 166 },
  { day: '2025-10-22', calls: 155 },
  { day: '2025-10-23', calls: 190 },
  { day: '2025-10-24', calls: 174 },
];
const MOOD = [
  { day: '2025-10-18', avgMood: 3.7, sessions: 20 },
  { day: '2025-10-19', avgMood: 3.9, sessions: 24 },
  { day: '2025-10-20', avgMood: 3.5, sessions: 18 },
  { day: '2025-10-21', avgMood: 4.1, sessions: 27 },
  { day: '2025-10-22', avgMood: 4.0, sessions: 25 },
  { day: '2025-10-23', avgMood: 3.8, sessions: 29 },
  { day: '2025-10-24', avgMood: 4.2, sessions: 31 },
];

export default function Overview() {
  const activeRef = useRef(null);
  const aiRef = useRef(null);
  const moodRef = useRef(null);
  const charts = useRef({});

  useEffect(() => {
    charts.current.active?.destroy?.();
    charts.current.active = new Chart(activeRef.current, {
      type: 'line',
      data: {
        labels: ACTIVE.map((x) => fmt(x.day)),
        datasets: [{ label: 'Daily Active Users', data: ACTIVE.map((x) => x.users) }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } },
      },
    });

    charts.current.ai?.destroy?.();
    charts.current.ai = new Chart(aiRef.current, {
      type: 'bar',
      data: {
        labels: AI.map((x) => fmt(x.day)),
        datasets: [{ label: 'AI Calls', data: AI.map((x) => x.calls) }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } },
      },
    });

    charts.current.mood?.destroy?.();
    charts.current.mood = new Chart(moodRef.current, {
      type: 'line',
      data: {
        labels: MOOD.map((x) => fmt(x.day)),
        datasets: [
          { label: 'Avg Mood (1–5)', data: MOOD.map((x) => x.avgMood), yAxisID: 'y1' },
          { label: 'Sessions', data: MOOD.map((x) => x.sessions), yAxisID: 'y2' },
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

    return () => Object.values(charts.current).forEach((c) => c?.destroy?.());
  }, []);

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
