import React, { useState, useEffect } from "react";
import axiosInstance from "@core/api/axios";
import { 
  Heart, 
  DollarSign, 
  Users, 
  ClipboardList, 
  Settings, 
  Plus, 
  ToggleLeft, 
  ToggleRight, 
  Trash2, 
  CheckCircle, 
  XCircle 
} from "lucide-react";

const DonationsPage = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    summary: { totalDonations: 0, totalDonors: 0, collectedAmount: 0 },
    donations: [],
    settings: { donationsEnabled: true, suggestedDonationAmounts: [], roundOffDonationsEnabled: false, donationCauses: [] }
  });

  const [newCause, setNewCause] = useState({ title: "", description: "" });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/admin/donations/dashboard");
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load donations data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSettings = async (field, value) => {
    try {
      setSavingSettings(true);
      const updatedSettings = {
        ...data.settings,
        [field]: value
      };
      const res = await axiosInstance.put("/admin/donations/settings", updatedSettings);
      if (res.data?.success) {
        setData(prev => ({
          ...prev,
          settings: {
            ...prev.settings,
            [field]: value
          }
        }));
      }
    } catch (err) {
      console.error("Failed to update settings", err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddCause = async (e) => {
    e.preventDefault();
    if (!newCause.title.trim()) return;

    try {
      const res = await axiosInstance.post("/admin/donations/causes", newCause);
      if (res.data?.success) {
        setData(prev => ({
          ...prev,
          settings: {
            ...prev.settings,
            donationCauses: [...prev.settings.donationCauses, res.data.data]
          }
        }));
        setNewCause({ title: "", description: "" });
      }
    } catch (err) {
      console.error("Failed to add cause", err);
    }
  };

  const handleToggleCauseActive = async (causeId, currentActive) => {
    try {
      const res = await axiosInstance.put(`/admin/donations/causes/${causeId}`, { active: !currentActive });
      if (res.data?.success) {
        setData(prev => ({
          ...prev,
          settings: {
            ...prev.settings,
            donationCauses: prev.settings.donationCauses.map(c => c.id === causeId ? { ...c, active: !currentActive } : c)
          }
        }));
      }
    } catch (err) {
      console.error("Failed to toggle cause", err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-sm font-bold uppercase tracking-widest text-slate-400">Loading Donations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Donations Management</h1>
          <p className="text-slate-500">Track and configure customer donation setups.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="flex items-center gap-5 rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="rounded-xl bg-rose-50 p-3 text-rose-500">
            <Heart className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Donations</p>
            <h3 className="text-2xl font-bold text-slate-900">{data.summary.totalDonations}</h3>
          </div>
        </div>

        <div className="flex items-center gap-5 rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-500">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Collected Amount</p>
            <h3 className="text-2xl font-bold text-slate-900">₹{data.summary.collectedAmount}</h3>
          </div>
        </div>

        <div className="flex items-center gap-5 rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="rounded-xl bg-sky-50 p-3 text-sky-500">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Donors</p>
            <h3 className="text-2xl font-bold text-slate-900">{data.summary.totalDonors}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Settings Panel */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900">Settings</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-slate-700">Enable Donations</p>
                  <p className="text-xs text-slate-400">Allow customers to donate.</p>
                </div>
                <button 
                  onClick={() => handleToggleSettings("donationsEnabled", !data.settings.donationsEnabled)}
                  disabled={savingSettings}
                  className={`text-2xl transition-colors ${data.settings.donationsEnabled ? "text-emerald-500" : "text-slate-300"}`}
                >
                  {data.settings.donationsEnabled ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8" />}
                </button>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-700">Round-Off Donations</p>
                  <p className="text-xs text-slate-400">Ask to round up to the nearest ₹10.</p>
                </div>
                <button 
                  onClick={() => handleToggleSettings("roundOffDonationsEnabled", !data.settings.roundOffDonationsEnabled)}
                  disabled={savingSettings}
                  className={`text-2xl transition-colors ${data.settings.roundOffDonationsEnabled ? "text-emerald-500" : "text-slate-300"}`}
                >
                  {data.settings.roundOffDonationsEnabled ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8" />}
                </button>
              </div>

              <div className="py-2 border-t border-slate-50">
                <p className="text-sm font-medium text-slate-700 mb-2">Suggested Amounts (₹)</p>
                <div className="flex flex-wrap gap-2">
                  {data.settings.suggestedDonationAmounts.map((amt, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-50 text-slate-600 text-xs font-semibold rounded-full border border-slate-200">
                      ₹{amt}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Cause Management */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Causes / NGO Setup</h2>
            
            <form onSubmit={handleAddCause} className="space-y-3 mb-4">
              <input 
                type="text" 
                placeholder="Cause Title" 
                value={newCause.title}
                onChange={e => setNewCause(prev => ({ ...prev, title: e.target.value }))}
                className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <input 
                type="text" 
                placeholder="Brief Description" 
                value={newCause.description}
                onChange={e => setNewCause(prev => ({ ...prev, description: e.target.value }))}
                className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <button 
                type="submit" 
                className="w-full flex items-center justify-center gap-2 p-3 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4" /> Add Cause
              </button>
            </form>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.settings.donationCauses.map((cause) => (
                <div key={cause.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="max-w-[70%]">
                    <p className="text-sm font-medium text-slate-800 truncate">{cause.title}</p>
                    <p className="text-xs text-slate-400 truncate">{cause.description || "No description"}</p>
                  </div>
                  <button 
                    onClick={() => handleToggleCauseActive(cause.id, cause.active)}
                    className={`p-1 rounded-full ${cause.active ? "text-emerald-500 bg-emerald-50" : "text-slate-400 bg-slate-200"}`}
                  >
                    {cause.active ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Donations Table */}
        <div className="rounded-2xl bg-white shadow-sm border border-slate-100 lg:col-span-2 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50">
            <h2 className="text-lg font-semibold text-slate-900">Donation Records</h2>
            <p className="text-slate-400 text-xs">Real-time contribution ledger.</p>
          </div>

          <div className="flex-1 overflow-x-auto">
            {data.donations.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-slate-400">
                <ClipboardList className="h-10 w-10 mb-2 opacity-50" />
                <span className="text-xs">No donation records found.</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-max">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold text-xs border-b border-slate-100">
                    <th className="p-4">Donor</th>
                    <th className="p-4">Cause</th>
                    <th className="p-4">Source</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700 text-sm">
                  {data.donations.map((d) => (
                    <tr key={d._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <p className="font-semibold text-slate-900">{d.donorName}</p>
                        <span className="text-xs text-slate-400">Order: {d.orderId}</span>
                      </td>
                      <td className="p-4 font-medium text-slate-600">{d.causeTitle}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 text-2xs font-semibold rounded-full ${
                          d.source === "ROUND_OFF" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                          d.source === "FIXED" ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : 
                          "bg-blue-50 text-blue-600 border border-blue-100"
                        }`}>
                          {d.source}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-900">₹{d.amount}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 text-2xs font-bold rounded-full ${
                          d.status === "PAID" ? "bg-emerald-50 text-emerald-600" :
                          d.status === "FAILED" ? "bg-rose-50 text-rose-600" : 
                          "bg-slate-100 text-slate-500"
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-400">
                        {new Date(d.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric"
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationsPage;
