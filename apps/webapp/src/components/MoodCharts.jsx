import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  BarElement,
  BarController,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import '../styles/components/MoodCharts.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend,
  Filler
);

const detailedMoods = [
  { value: 1, emoji: '😭', labelKey: 'mood.terrible', color: '#dc2626' },
  { value: 2, emoji: '😢', labelKey: 'mood.veryBad', color: '#ea580c' },
  { value: 3, emoji: '😔', labelKey: 'mood.bad', color: '#f97316' },
  { value: 4, emoji: '😕', labelKey: 'mood.poor', color: '#fb923c' },
  { value: 5, emoji: '😐', labelKey: 'mood.neutral', color: '#eab308' },
  { value: 6, emoji: '🙂', labelKey: 'mood.okay', color: '#a3e635' },
  { value: 7, emoji: '😊', labelKey: 'mood.good', color: '#84cc16' },
  { value: 8, emoji: '😄', labelKey: 'mood.veryGood', color: '#65a30d' },
  { value: 9, emoji: '😁', labelKey: 'mood.great', color: '#16a34a' },
  { value: 10, emoji: '🤩', labelKey: 'mood.amazing', color: '#15803d' },
];

const emojiByValue = Object.fromEntries(detailedMoods.map((m) => [m.value, m.emoji]));

const MoodCharts = ({ moodHistory, isLoading }) => {
  const { t } = useTranslation();

  // Debug logging
  console.log('MoodCharts - isLoading:', isLoading);
  console.log('MoodCharts - moodHistory:', moodHistory);
  console.log('MoodCharts - moodHistory length:', moodHistory?.length);

  const chartData = useMemo(() => {
    console.log('MoodCharts - chartData useMemo running, moodHistory:', moodHistory);
    if (!Array.isArray(moodHistory) || moodHistory.length === 0) {
      console.log('MoodCharts - chartData returning null (empty or not array)');
      return null;
    }

    const sortedHistory = [...moodHistory].reverse();
    const normalized = sortedHistory
      .map((entry) => {
        const rawMoodValue = entry?.moodValue ?? entry?.mood_value ?? entry?.value;
        const moodValue = typeof rawMoodValue === 'number' ? rawMoodValue : Number(rawMoodValue);
        if (!Number.isFinite(moodValue)) return null;

        const dateValue = entry?.createdAt ?? entry?.created_at ?? entry?.timestamp ?? entry?.date;
        const date = dateValue ? new Date(dateValue) : null;
        const label =
          date && !Number.isNaN(date.getTime())
            ? date.toLocaleDateString([], { month: 'short', day: 'numeric' })
            : '';

        return { moodValue, label };
      })
      .filter(Boolean);

    if (normalized.length === 0) return null;

    return {
      labels: normalized.map((e) => e.label),
      datasets: [
        {
          label: t('charts.moodLevel'),
          data: normalized.map((e) => e.moodValue),
          borderColor: 'rgb(21, 128, 61)',
          backgroundColor: 'rgba(21, 128, 61, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: normalized.map((e) => {
            const mood = detailedMoods.find((m) => m.value === e.moodValue);
            return mood?.color || 'rgb(21, 128, 61)';
          }),
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
        },
      ],
    };
  }, [moodHistory, t]);

  const distributionData = useMemo(() => {
    if (!Array.isArray(moodHistory) || moodHistory.length === 0) return null;

    const counts = new Map(detailedMoods.map((m) => [m.value, 0]));
    for (const entry of moodHistory) {
      const rawMoodValue = entry?.moodValue ?? entry?.mood_value ?? entry?.value;
      const moodValue = typeof rawMoodValue === 'number' ? rawMoodValue : Number(rawMoodValue);
      if (!Number.isFinite(moodValue) || !counts.has(moodValue)) continue;
      counts.set(moodValue, (counts.get(moodValue) ?? 0) + 1);
    }

    return {
      labels: detailedMoods.map((mood) => `${emojiByValue[mood.value]} ${t(mood.labelKey)}`),
      datasets: [
        {
          label: t('charts.frequency'),
          data: detailedMoods.map((mood) => counts.get(mood.value) ?? 0),
          backgroundColor: detailedMoods.map((mood) => mood.color),
          borderColor: detailedMoods.map((mood) => mood.color),
          borderWidth: 1,
        },
      ],
    };
  }, [moodHistory, t]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: t('charts.moodTrendOverTime'),
        font: { size: 16, weight: 'bold' },
        color: '#15803d',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10,
        ticks: {
          stepSize: 1,
          callback: (value) => `${emojiByValue[value] ?? ''} ${value}`,
        },
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: t('charts.moodDistribution'),
        font: { size: 16, weight: 'bold' },
        color: '#15803d',
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };

  console.log('MoodCharts - chartData:', chartData ? 'has data' : 'null');
  console.log('MoodCharts - distributionData:', distributionData ? 'has data' : 'null');
  console.log('MoodCharts - showLoadingSkeleton:', isLoading && !chartData && !distributionData);

  const showLoadingSkeleton = isLoading && !chartData && !distributionData;
  if (showLoadingSkeleton) {
    console.log('MoodCharts - Showing loading skeleton');
    return (
      <div className="charts-container">
        <div className="card chart-card">
          <div className="chart-skeleton">{t('charts.loading')}</div>
        </div>
      </div>
    );
  }

  // If no data at all, return null
  if (!chartData && !distributionData) {
    console.log('MoodCharts - No chart data, returning null');
    return null;
  }

  console.log('MoodCharts - Rendering charts');

  return (
    <div className="charts-container">
      {chartData && (
        <div className="card chart-card">
          <div className="chart-container">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      )}
      {distributionData && (
        <div className="card chart-card">
          <div className="chart-container">
            <Bar data={distributionData} options={barChartOptions} />
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodCharts;
