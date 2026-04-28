import React, { useState } from "react";
import { Plus, Edit2, Eye, EyeOff, Trash2, X } from "lucide-react";

const INITIAL_CARDS = [];

const ScratchCardManagement = () => {
  const [cards, setCards] = useState(INITIAL_CARDS);
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [viewingCard, setViewingCard] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    minReward: "",
    maxReward: "",
    startDate: "",
    endDate: "",
    status: "Active"
  });

  const handleOpenForm = (card = null) => {
    if (card) {
      setEditingCard(card);
      setFormData({
        name: card.name,
        minReward: card.minReward,
        maxReward: card.maxReward,
        startDate: card.startDate,
        endDate: card.endDate,
        status: card.status
      });
    } else {
      setEditingCard(null);
      setFormData({
        name: "",
        minReward: "",
        maxReward: "",
        startDate: "",
        endDate: "",
        status: "Active"
      });
    }
    setShowForm(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingCard) {
      setCards(cards.map(c => c.id === editingCard.id ? { ...c, ...formData, minReward: Number(formData.minReward), maxReward: Number(formData.maxReward) } : c));
    } else {
      const newCard = {
        id: Date.now(),
        ...formData,
        minReward: Number(formData.minReward),
        maxReward: Number(formData.maxReward),
        createdAt: new Date().toISOString().split("T")[0]
      };
      setCards([...cards, newCard]);
    }
    setShowForm(false);
  };

  const toggleStatus = (id) => {
    setCards(cards.map(c => c.id === id ? { ...c, status: c.status === "Active" ? "Inactive" : "Active" } : c));
  };

  return (
    <div className="p-6 font-['Outfit',_sans-serif] bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Scratch Cards</h1>
          <p className="text-sm text-slate-500 mt-1">Manage user gamification reward programs</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Add Scratch Card
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Min Reward</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Max Reward</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Created Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cards.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-400 font-semibold bg-white">
                    No scratch cards created yet. Click "Add Scratch Card" to begin.
                  </td>
                </tr>
              ) : (
                cards.map((card) => (
                  <tr key={card.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{card.name}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-600">₹{card.minReward}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-600">₹{card.maxReward}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${card.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                      {card.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{card.createdAt}</td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                    <button
                      onClick={() => setViewingCard(card)}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenForm(card)}
                      className="p-2 hover:bg-indigo-50 rounded-lg text-indigo-400 hover:text-indigo-600 transition-all"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleStatus(card.id)}
                      className={`p-2 rounded-lg transition-all ${card.status === "Active" ? "hover:bg-amber-50 text-amber-400 hover:text-amber-600" : "hover:bg-emerald-50 text-emerald-400 hover:text-emerald-600"}`}
                      title={card.status === "Active" ? "Disable" : "Enable"}
                    >
                      {card.status === "Active" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-base font-black text-slate-800">{editingCard ? "Edit Scratch Card" : "Add Scratch Card"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Scratch Card Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-300"
                  placeholder="e.g. Festival Special"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Min Reward (₹)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.minReward}
                    onChange={(e) => setFormData({ ...formData, minReward: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Max Reward (₹)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.maxReward}
                    onChange={(e) => setFormData({ ...formData, maxReward: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">End Date</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-slate-100 mt-2">
                <span className="text-sm font-bold text-slate-600">Active Campaign</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: formData.status === "Active" ? "Inactive" : "Active" })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.status === "Active" ? "bg-indigo-600" : "bg-slate-200"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.status === "Active" ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm shadow-indigo-100 mt-2"
              >
                Save Scratch Card
              </button>
            </form>
          </div>
        </div>
      )}

      {viewingCard && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-base font-black text-slate-800">Card Details</h2>
              <button onClick={() => setViewingCard(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Name</span>
                  <span className="text-sm font-bold text-slate-800 mt-0.5 block">{viewingCard.name}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold mt-1 ${viewingCard.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                    {viewingCard.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Min Reward</span>
                  <span className="text-sm font-semibold text-slate-700 mt-0.5 block">₹{viewingCard.minReward}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Max Reward</span>
                  <span className="text-sm font-semibold text-slate-700 mt-0.5 block">₹{viewingCard.maxReward}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Start Date</span>
                  <span className="text-sm text-slate-600 mt-0.5 block">{viewingCard.startDate}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">End Date</span>
                  <span className="text-sm text-slate-600 mt-0.5 block">{viewingCard.endDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScratchCardManagement;
