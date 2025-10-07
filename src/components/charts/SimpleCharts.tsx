"use client";
import 'chart.js/auto';
import './setup';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

export function LineChart({ data, options }: { data: any; options?: any }) {
  return <Line data={data} options={options} />;
}
export function BarChart({ data, options }: { data: any; options?: any }) {
  return <Bar data={data} options={options} />;
}
export function DonutChart({ data, options }: { data: any; options?: any }) {
  return <Doughnut data={data} options={options} />;
}
