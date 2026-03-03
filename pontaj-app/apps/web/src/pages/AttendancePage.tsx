import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import api from "../services/api";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

interface Hour {
  id: number;
  permission: string;
  work_date: string;
  overtime_hours: number;
  leave_hours: number;
}

export default function AttendancePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [permission, setPermission] = useState("WFO");
  const [overtimeHours, setOvertimeHours] = useState(0);
  const [leaveHours, setLeaveHours] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [stats, setStats] = useState({ WFO: 0, WFH: 0, Vacation: 0 });

  useEffect(() => {
    fetchHours();
  }, []);

  const fetchHours = async () => {
    const response = await api.get("/hours/me");

    const formatted = response.data.map((h: Hour) => ({
      id: h.id,
      title: `${h.permission}${
        h.overtime_hours > 0 ? ` (+${h.overtime_hours}h OT)` : ""
      }${h.leave_hours > 0 ? ` (${h.leave_hours}h LP)` : ""}`,
      date: h.work_date,
      color:
        h.permission === "WFO"
          ? "#22c55e"
          : h.permission === "WFH"
          ? "#3b82f6"
          : "#facc15",
      extendedProps: h,
    }));

    setEvents(formatted);
    calculateStats(response.data);
  };

  const calculateStats = (data: Hour[]) => {
    const newStats = { WFO: 0, WFH: 0, Vacation: 0 };

    data.forEach((h) => {
      if (h.permission in newStats) {
        newStats[h.permission as keyof typeof newStats]++;
      }
    });

    setStats(newStats);
  };

  const handleDateClick = (info: any) => {
    const isWeekend =
      info.date.getDay() === 0 || info.date.getDay() === 6;

    if (isWeekend) return;

    setSelectedDate(info.dateStr);
    setEditingId(null);
    setPermission("WFO");
    setOvertimeHours(0);
    setLeaveHours(0);
  };

  const handleEventClick = (info: any) => {
    const data: Hour = info.event.extendedProps;

    setSelectedDate(info.event.startStr);
    setPermission(data.permission);
    setOvertimeHours(data.overtime_hours || 0);
    setLeaveHours(data.leave_hours || 0);
    setEditingId(Number(info.event.id));
  };

  const handleSave = async () => {
    if (!selectedDate) return;

    try {
      if (editingId) {
        await api.put(`/hours/${editingId}`, {
          permission,
          overtime_hours: overtimeHours,
          leave_hours: leaveHours,
        });
      } else {
        await api.post("/hours/", {
          work_date: selectedDate,
          permission,
          overtime_hours: overtimeHours,
          leave_hours: leaveHours,
        });
      }

      fetchHours();
      resetForm();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;

    await api.delete(`/hours/${editingId}`);
    fetchHours();
    resetForm();
  };

  const resetForm = () => {
    setSelectedDate(null);
    setEditingId(null);
    setPermission("WFO");
    setOvertimeHours(0);
    setLeaveHours(0);
  };

  return (
    <MainLayout>
      <h2 className="text-3xl font-bold mb-6">
        Calendar Pontaj
      </h2>

      <div className="grid grid-cols-4 gap-8">
        {/* CALENDAR */}
        <div className="col-span-3 bg-slate-800 p-4 rounded-xl">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            height="auto"
          />
        </div>

        {/* SIDEBAR FORM */}
        <div className="bg-slate-800 p-6 rounded-xl space-y-4">
          {selectedDate ? (
            <>
              <h3 className="text-lg font-semibold">
                {editingId ? "Editează" : "Adaugă"}: {selectedDate}
              </h3>

              {/* Permission */}
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
                className="w-full p-3 bg-slate-700 rounded"
              >
                <option value="WFO">Work From Office</option>
                <option value="WFH">Work From Home</option>
                <option value="Vacation">Vacation</option>
              </select>

              {/* OT + LP doar daca NU e Vacation */}
              {permission !== "Vacation" && (
                <>
                  <div>
                    <label className="text-sm text-slate-400">
                      Overtime Hours
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={overtimeHours}
                      onChange={(e) =>
                        setOvertimeHours(Number(e.target.value))
                      }
                      className="w-full p-2 bg-slate-700 rounded"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-400">
                      Leave Hours (LP recuperabil)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={leaveHours}
                      onChange={(e) =>
                        setLeaveHours(Number(e.target.value))
                      }
                      className="w-full p-2 bg-slate-700 rounded"
                    />
                  </div>
                </>
              )}

              <button
                onClick={handleSave}
                className="w-full bg-green-600 hover:bg-green-700 p-3 rounded"
              >
                {editingId ? "Update" : "Save"}
              </button>

              {editingId && (
                <button
                  onClick={handleDelete}
                  className="w-full bg-red-600 hover:bg-red-700 p-3 rounded"
                >
                  Delete
                </button>
              )}
            </>
          ) : (
            <p>Selectează o zi din calendar.</p>
          )}

          {/* STATS */}
          <div className="pt-6 border-t border-slate-700">
            <h4 className="font-bold mb-2">
              Statistici Lună
            </h4>
            <p>WFO: {stats.WFO}</p>
            <p>WFH: {stats.WFH}</p>
            <p>Vacation: {stats.Vacation}</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}