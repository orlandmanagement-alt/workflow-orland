import React from 'react';

interface ChartProps {
  data: any[];
  [key: string]: any;
}

export const LineChart: React.FC<ChartProps> = ({ data, ...props }) => (
  <div className="w-full h-64 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400">
    <p>Line Chart Component</p>
  </div>
);

export const BarChart: React.FC<ChartProps> = ({ data, ...props }) => (
  <div className="w-full h-64 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400">
    <p>Bar Chart Component</p>
  </div>
);

export const PieChart: React.FC<ChartProps> = ({ data, ...props }) => (
  <div className="w-full h-64 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400">
    <p>Pie Chart Component</p>
  </div>
);
