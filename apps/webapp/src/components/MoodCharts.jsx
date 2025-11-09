import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import '../styles/components/MoodCharts.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const MoodCharts = ({ moodHistory, isLoading }) => {
  const { t } = useTranslation();

  const detailedMoods = [
    { value: 1, emoji: '😭', label: 'Terrible', color: '#dc2626' },
    { value: 2, emoji: '😢', label: 'Very Bad', color: '#ea580c' },
    { value: 3, emoji: '😔', label: 'Bad', color: '#f97316' },
    { value: 4, emoji: '😕', label: 'Poor', color: '#fb923c' },
    { value: 5, emoji: '😐', label: 'Neutral', color: '#eab308' },
    { value: 6, emoji: '🙂', label: 'Okay', color: '#a3e635' },
    { value: 7, emoji: '😊', label: 'Good', color: '#84cc16' },
    { value: 8, emoji: '😄', label: 'Very Good', color: '#65a30d' },
    { value: 9, emoji: '😁', label: 'Great', color: '#16a34a' },
    { value: 10, emoji: '🤩', label: 'Amazing', color: '#15803d' },
  ];

  const getChartData = () => {
    if (!moodHistory || moodHistory.length === 0) return null;

    const sortedHistory = [...moodHistory].reverse();

    return {
      labels: sortedHistory.map((entry) =>
        new Date(entry.createdAt).toLocaleDateString([], {
          month: 'short',
          day: 'numeric',
        })
      ),
      datasets: [
        {
          label: 'Mood Level',
          data: sortedHistory.map((entry) => entry.moodValue),
          borderColor: 'rgb(21, 128, 61)',
          backgroundColor: 'rgba(21, 128, 61, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: sortedHistory.map((entry) => {
            const mood = detailedMoods.find((m) => m.value === entry.moodValue);
            return mood?.color || 'rgb(21, 128, 61)';
          }),
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
        },
      ],
    };
  };

  const getMoodDistribution = () => {
    if (!moodHistory || moodHistory.length === 0) return null;

    const distribution = detailedMoods.map((mood) => ({
      ...mood,
      count: moodHistory.filter((entry) => entry.moodValue === mood.value).length,
    }));

    return {
      labels: distribution.map((d) => `${d.emoji} ${d.label}`),
      datasets: [
        {
          label: 'Frequency',
          data: distribution.map((d) => d.count),
          backgroundColor: distribution.map((d) => d.color),
          borderColor: distribution.map((d) => d.color),
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Mood Trend Over Time',
        font: {
          size: 16,
          weight: 'bold',
        },
        color: '#15803d',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10,
        ticks: {
          stepSize: 1,
          callback: (value) => {
            const mood = detailedMoods.find((m) => m.value === value);
            return mood ? `${mood.emoji} ${value}` : value;
          },
        },
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Mood Distribution',
        font: {
          size: 16,
          weight: 'bold',
        },
        color: '#15803d',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="charts-container">
        <div className="card chart-card">
          <div className="chart-skeleton">Loading charts...</div>
        </div>
      </div>
    );
  }

  const chartData = getChartData();
  const distributionData = getMoodDistribution();

  if (!chartData || !distributionData) {
    return null;
  }

  return (
    <div className="charts-container">
      <div className="card chart-card">
        <div className="chart-container">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="card chart-card">
        <div className="chart-container">
          <Bar data={distributionData} options={barChartOptions} />
        </div>
      </div>
    </div>
  );
};

export default MoodCharts;
