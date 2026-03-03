import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import api from "../services/api";

interface Hour {
  id: number;
  overtime: string;
  permission: string;
  work_date: string;
}

export default function HistoryPage() {
  const [hours, setHours] = useState<Hour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHours = async () => {
      try {
        const response = await api.get("/hours/me");
        setHours(response.data);
      } catch (error) {
        console.error("Error fetching hours:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHours();
  }, []);

  return (
    <MainLayout>
      <h2 className="text-3xl font-bold mb-6">Istoric Pontaj</h2>

      {loading ? (
        <p>Loading...</p>
      ) : hours.length === 0 ? (
        <p>Nu există pontaje încă.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-slate-800 rounded-xl">
            <thead>
              <tr className="bg-slate-700 text-left">
                <th className="p-3">Data</th>
                <th className="p-3">Overtime</th>
                <th className="p-3">Permission</th>
              </tr>
            </thead>
            <tbody>
              {hours.map((hour) => (
                <tr key={hour.id} className="border-t border-slate-700">
                  <td className="p-3">{hour.work_date}</td>
                  <td className="p-3">{hour.overtime}</td>
                  <td className="p-3">{hour.permission}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </MainLayout>
  );
}