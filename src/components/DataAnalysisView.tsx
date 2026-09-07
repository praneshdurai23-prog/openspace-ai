import React, { useState, useMemo } from 'react';
import { useChat } from '../context/ChatContext.tsx';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  FileSpreadsheet,
  Upload,
  BarChart2,
  TrendingUp,
  Table,
  Sparkles,
  RefreshCw,
  Download,
} from 'lucide-react';

interface DataRow {
  [key: string]: any;
}

const SAMPLE_DATA_SALES = `Month,Sales,Revenue,Profit
Jan,120,24000,7200
Feb,150,30000,9000
Mar,180,36000,11500
Apr,220,44000,14000
May,260,52000,17000
Jun,310,62000,21000
Jul,350,70000,24500`;

export const DataAnalysisView: React.FC = () => {
  const { sendMessage, setWorkspaceTab } = useChat();

  const [rawText, setRawText] = useState(SAMPLE_DATA_SALES);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');
  const [selectedX, setSelectedX] = useState<string>('Month');
  const [selectedY, setSelectedY] = useState<string>('Revenue');

  // Parse CSV
  const { data, columns, numericColumns } = useMemo(() => {
    if (!rawText.trim()) return { data: [], columns: [], numericColumns: [] };

    try {
      const lines = rawText.trim().split('\n');
      if (lines.length === 0) return { data: [], columns: [], numericColumns: [] };

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
      const rows: DataRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
        if (values.length === headers.length) {
          const row: DataRow = {};
          headers.forEach((h, idx) => {
            const num = Number(values[idx]);
            row[h] = isNaN(num) ? values[idx] : num;
          });
          rows.push(row);
        }
      }

      const numCols = headers.filter((h) =>
        rows.length > 0 && typeof rows[0][h] === 'number'
      );

      return { data: rows, columns: headers, numericColumns: numCols };
    } catch {
      return { data: [], columns: [], numericColumns: [] };
    }
  }, [rawText]);

  // Adjust default axes if needed
  React.useEffect(() => {
    if (columns.length > 0 && !columns.includes(selectedX)) {
      setSelectedX(columns[0]);
    }
    if (numericColumns.length > 0 && !numericColumns.includes(selectedY)) {
      setSelectedY(numericColumns[0]);
    }
  }, [columns, numericColumns, selectedX, selectedY]);

  // Statistics calculation
  const stats = useMemo(() => {
    if (data.length === 0 || !selectedY) return null;
    const values = data.map((d) => Number(d[selectedY])).filter((v) => !isNaN(v));
    if (values.length === 0) return null;

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    return { count: values.length, sum, avg: avg.toFixed(2), min, max };
  }, [data, selectedY]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) setRawText(content);
    };
    reader.readAsText(file);
  };

  const handleAskAI = () => {
    if (data.length === 0) return;
    const prompt = `Please perform a detailed data analysis on the following dataset:\n\`\`\`csv\n${rawText.slice(0, 1500)}\n\`\`\`\n\nProvide:
1. Executive summary of trends and insights.
2. Key metrics (growth, peaks, anomalies).
3. Strategic recommendations based on this data.`;

    setWorkspaceTab('chat');
    sendMessage(prompt);
  };

  return (
    <div className="flex flex-col flex-1 h-full min-w-0 bg-slate-50 dark:bg-[#080A12] overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#0B0E19] border border-slate-200 dark:border-[#1E2337] p-5 rounded-3xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-[#06B6D4] flex items-center justify-center text-white shadow-md">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-[#F5F7FF]">
              Data Analysis & Visualization
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive chart engine with automated statistical insights
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#15192E] hover:bg-slate-200 dark:hover:bg-[#1E2442] border border-slate-200 dark:border-[#262D47] text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>Upload CSV</span>
            <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            type="button"
            onClick={handleAskAI}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-white text-xs font-bold shadow-md shadow-[#7C3AED]/20 hover:opacity-90 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Analyze with AI</span>
          </button>
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0B0E19] border border-slate-200 dark:border-[#1E2337]">
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Rows</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{stats.count}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0B0E19] border border-slate-200 dark:border-[#1E2337]">
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Sum</p>
            <p className="text-xl font-bold text-[#06B6D4] mt-1">{stats.sum.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0B0E19] border border-slate-200 dark:border-[#1E2337]">
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Average</p>
            <p className="text-xl font-bold text-[#7C3AED] mt-1">{stats.avg}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0B0E19] border border-slate-200 dark:border-[#1E2337]">
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Minimum</p>
            <p className="text-xl font-bold text-amber-500 mt-1">{stats.min.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0B0E19] border border-slate-200 dark:border-[#1E2337]">
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Maximum</p>
            <p className="text-xl font-bold text-emerald-500 mt-1">{stats.max.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Chart Canvas Card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#0B0E19] border border-slate-200 dark:border-[#1E2337] space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#1E2337]">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-[#7C3AED] text-white'
                  : 'bg-slate-100 dark:bg-[#15192E] text-slate-600 dark:text-slate-300'
              }`}
            >
              Bar Chart
            </button>
            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                chartType === 'line'
                  ? 'bg-[#7C3AED] text-white'
                  : 'bg-slate-100 dark:bg-[#15192E] text-slate-600 dark:text-slate-300'
              }`}
            >
              Line Chart
            </button>
            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                chartType === 'area'
                  ? 'bg-[#7C3AED] text-white'
                  : 'bg-slate-100 dark:bg-[#15192E] text-slate-600 dark:text-slate-300'
              }`}
            >
              Area Chart
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">X-Axis:</span>
              <select
                value={selectedX}
                onChange={(e) => setSelectedX(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#15192E] border border-slate-200 dark:border-[#222A47] text-slate-800 dark:text-slate-200"
              >
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Metric (Y):</span>
              <select
                value={selectedY}
                onChange={(e) => setSelectedY(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#15192E] border border-slate-200 dark:border-[#222A47] text-slate-800 dark:text-slate-200 font-semibold text-[#06B6D4]"
              >
                {numericColumns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Chart View */}
        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2337" opacity={0.5} />
                <XAxis dataKey={selectedX} stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B0E19',
                    border: '1px solid #1E2337',
                    borderRadius: '12px',
                    color: '#FFF',
                  }}
                />
                <Legend />
                <Bar dataKey={selectedY} fill="#7C3AED" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : chartType === 'line' ? (
              <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2337" opacity={0.5} />
                <XAxis dataKey={selectedX} stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B0E19',
                    border: '1px solid #1E2337',
                    borderRadius: '12px',
                    color: '#FFF',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={selectedY}
                  stroke="#06B6D4"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            ) : (
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2337" opacity={0.5} />
                <XAxis dataKey={selectedX} stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B0E19',
                    border: '1px solid #1E2337',
                    borderRadius: '12px',
                    color: '#FFF',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey={selectedY}
                  stroke="#7C3AED"
                  fill="#7C3AED"
                  fillOpacity={0.25}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* CSV Data Editor & Preview Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Raw CSV Textarea */}
        <div className="p-4 rounded-3xl bg-white dark:bg-[#0B0E19] border border-slate-200 dark:border-[#1E2337] flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              CSV Data Editor
            </h3>
            <span className="text-[10px] text-slate-400">Comma-separated values</span>
          </div>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={8}
            className="w-full flex-1 p-3 rounded-xl bg-slate-50 dark:bg-[#080A12] border border-slate-200 dark:border-[#1A1F36] text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden"
          />
        </div>

        {/* Data Table Preview */}
        <div className="p-4 rounded-3xl bg-white dark:bg-[#0B0E19] border border-slate-200 dark:border-[#1E2337] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Parsed Table Preview
            </h3>
            <span className="text-[10px] text-slate-400">{data.length} records</span>
          </div>
          <div className="flex-1 overflow-x-auto overflow-y-auto max-h-52 scrollbar-none rounded-xl border border-slate-200 dark:border-[#1A1F36]">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-[#121629] border-b border-slate-200 dark:border-[#1E2337]">
                <tr>
                  {columns.map((col) => (
                    <th key={col} className="p-2 font-bold whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#1E2337]">
                {data.slice(0, 15).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-[#14192F]">
                    {columns.map((col) => (
                      <td key={col} className="p-2 whitespace-nowrap">
                        {String(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
