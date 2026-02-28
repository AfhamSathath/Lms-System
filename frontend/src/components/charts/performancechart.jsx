import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const PerformanceChart = ({ subjects, results }) => {
  const getSubjectMarks = (subjectId) => {
    for (let sem in results) {
      const result = results[sem].subjects.find(
        r => r.subject._id === subjectId
      );
      if (result) return result.marks;
    }
    return 0;
  };

  const getGradeColor = (marks) => {
    if (marks >= 75) return 'rgba(34, 197, 94, 0.8)'; // Green
    if (marks >= 50) return 'rgba(234, 179, 8, 0.8)'; // Yellow
    return 'rgba(239, 68, 68, 0.8)'; // Red
  };

  const chartData = {
    labels: subjects.map(s => s.code),
    datasets: [
      {
        label: 'Marks',
        data: subjects.map(subject => getSubjectMarks(subject._id)),
        backgroundColor: subjects.map(subject => 
          getGradeColor(getSubjectMarks(subject._id))
        ),
        borderColor: subjects.map(subject => 
          getGradeColor(getSubjectMarks(subject._id)).replace('0.8', '1')
        ),
        borderWidth: 1,
        borderRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Subject Performance',
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        callbacks: {
          label: (context) => {
            const marks = context.raw;
            let grade = '';
            if (marks >= 75) grade = 'A';
            else if (marks >= 60) grade = 'B';
            else if (marks >= 50) grade = 'C';
            else if (marks >= 40) grade = 'D';
            else grade = 'F';
            return `Marks: ${marks} (Grade: ${grade})`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        title: {
          display: true,
          text: 'Marks',
          font: {
            size: 12,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        title: {
          display: true,
          text: 'Subject Code',
          font: {
            size: 12,
          },
        },
      },
    },
  };

  return (
    <div className="h-64 w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default PerformanceChart;