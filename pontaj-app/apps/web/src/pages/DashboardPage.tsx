import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import api from "../services/api";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

type PermissionType = "WFO" | "WFH" | "Vacation";

interface ChartData {
  name: PermissionType;
  value: number;
}

export default function DashboardPage() {
  const today = new Date();

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [data, setData] = useState<ChartData[]>([]);
  const [balance, setBalance] = useState<any>(null);

  useEffect(() => {
    loadDashboard();
  }, [month, year]);

  const loadDashboard = async () => {
    try {
      const response = await api.get(
        `/hours/me?month=${month}&year=${year}`
      );

      const stats: Record<PermissionType, number> = {
        WFO: 0,
        WFH: 0,
        Vacation: 0,
      };

      response.data.forEach((h: any) => {
        if (stats[h.permission as PermissionType] !== undefined) {
          stats[h.permission as PermissionType] += 1;
        }
      });

      setData([
        { name: "WFO", value: stats.WFO },
        { name: "WFH", value: stats.WFH },
        { name: "Vacation", value: stats.Vacation },
      ]);

      const balanceRes = await api.get(`/hours/balance/${year}`);
      setBalance(balanceRes.data);

    } catch (err) {
      console.error("Dashboard error:", err);
    }
  };

  const totalDays = data.reduce((acc, item) => acc + item.value, 0);

  const colors = ["#22c55e", "#3b82f6", "#facc15"];

  // 🔥 SAFE formatter functions
  const tooltipFormatter = (value: any) => {
    return `${value} days`;
  };

  const pieLabel = (entry: any) => {
    if (!entry.percent) return "";
    return `${(entry.percent * 100).toFixed(0)}%`;
  };

  return (
    <MainLayout>
      <h2 className="text-3xl font-bold mb-8">
        Dashboard Lunar
      </h2>

      {/* Month Selector */}
      <div className="flex gap-4 mb-10">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="p-3 bg-slate-800 border border-slate-700 rounded-lg"
        >
          {[...Array(12)].map((_, i) => (
            <option key={i} value={i + 1}>
              {new Date(0, i).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="p-3 bg-slate-800 border border-slate-700 rounded-lg w-28"
        />
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-6 mb-12">
        <div className="bg-slate-800 p-6 rounded-2xl shadow">
          <p className="text-slate-400 text-sm">Total days</p>
          <h2 className="text-3xl font-bold mt-2">{totalDays}</h2>
        </div>

        {data.map((item, index) => (
          <div
            key={item.name}
            className="p-6 rounded-2xl shadow"
            style={{ backgroundColor: colors[index] }}
          >
            <p className="text-white text-sm">{item.name}</p>
            <h2 className="text-3xl font-bold mt-2 text-white">
              {item.value}
            </h2>
          </div>
        ))}
      </div>

      {/* Annual Balance */}
      {balance && (
        <div className="bg-slate-900 p-6 rounded-2xl mb-12 border border-slate-700">
          <h3 className="text-xl font-semibold mb-6">
            Status Anual {year}
          </h3>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-slate-400 text-sm">Overtime total</p>
              <h2 className="text-2xl font-bold">
                {balance.total_overtime_hours} h
              </h2>
            </div>

            <div>
              <p className="text-slate-400 text-sm">Leave (LP)</p>
              <h2 className="text-2xl font-bold">
                {balance.total_leave_hours} h
              </h2>
            </div>

            <div>
              <p className="text-slate-400 text-sm">Balance</p>
              <h2
                className={`text-2xl font-bold ${
                  balance.overtime_balance_hours >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {balance.overtime_balance_hours} h
              </h2>
            </div>
          </div>
        </div>
      )}

      {/* CHARTS */}
      <div className="grid grid-cols-2 gap-8">

        {/* PIE */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700">
          <h3 className="mb-6 text-lg font-semibold text-slate-300">
            Procentual Distribution
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                outerRadius={110}
                innerRadius={60}
                label={pieLabel}
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={colors[index]} />
                ))}
              </Pie>

              <Tooltip formatter={tooltipFormatter} />
            </PieChart>
          </ResponsiveContainer>

          <div className="text-center mt-4 text-slate-400 font-semibold">
            Total: {totalDays} days
          </div>
        </div>

        {/* BAR */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700">
          <h3 className="mb-6 text-lg font-semibold text-slate-300">
            Numerical Distribution
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip formatter={tooltipFormatter} />
              <Bar
                dataKey="value"
                radius={[10, 10, 0, 0]}
                label={{ position: "top", fill: "#94a3b8" }}
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={colors[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </MainLayout>
  );
}