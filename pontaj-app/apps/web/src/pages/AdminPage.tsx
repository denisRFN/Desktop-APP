import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import api from "../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";

const colors = ["#22c55e", "#3b82f6", "#facc15"];

export default function AdminPage() {
  const [data, setData] = useState<any[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, [year]);

  const fetchDashboard = async () => {
    const response = await api.get(`/admin/dashboard/${year}`);
    setData(response.data);

    if (response.data.length > 0) {
      setSelectedUserId(response.data[0].user_id);
    }
  };

  const selectedUser = data.find(
    (u) => u.user_id === selectedUserId
  );

  return (
    <MainLayout>
      <h2 className="text-3xl font-bold mb-8">
        Admin Panel {year}
      </h2>

      {/* YEAR */}
      <div className="mb-6">
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="p-3 bg-slate-800 border border-slate-700 rounded-lg w-32"
        />
      </div>

      {/* OVERALL TABLE */}
      <div className="bg-slate-800 p-6 rounded-xl mb-10">
        <h3 className="text-xl font-semibold mb-6">
          Overall Balance (OT - LP)
        </h3>

        <table className="w-full text-left text-sm">
          <thead className="text-slate-400 border-b border-slate-700">
            <tr>
              <th className="pb-2">User</th>
              <th>Overtime</th>
              <th>Leave (LP)</th>
              <th>Balance</th>
            </tr>
          </thead>

          <tbody>
            {data.map((u) => (
              <tr
                key={u.user_id}
                className="border-b border-slate-700 hover:bg-slate-700 cursor-pointer"
                onClick={() => setSelectedUserId(u.user_id)}
              >
                <td className="py-2">{u.username}</td>
                <td>{u.total_overtime} h</td>
                <td>{u.total_leave} h</td>
                <td
                  className={`font-bold ${
                    u.balance >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {u.balance} h
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SELECTED USER CHART */}
      {selectedUser && (
        <div className="bg-slate-900 p-6 rounded-xl max-w-2xl">
          <h3 className="text-lg font-semibold mb-6">
            {selectedUser.username} - Work Distribution
          </h3>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={[
                { name: "WFO", value: selectedUser.permissions.WFO },
                { name: "WFH", value: selectedUser.permissions.WFH },
                { name: "Vacation", value: selectedUser.permissions.Vacation },
              ]}
            >
              <CartesianGrid stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {[
                  selectedUser.permissions.WFO,
                  selectedUser.permissions.WFH,
                  selectedUser.permissions.Vacation,
                ].map((_, index) => (
                  <Cell key={index} fill={colors[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </MainLayout>
  );
}