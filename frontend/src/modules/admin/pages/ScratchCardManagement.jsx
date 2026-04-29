import React, { useState, useEffect, useMemo } from "react";
import { Plus, Edit2, Eye, EyeOff, Trash2, X, Gift, Calendar, Users, Trophy } from "lucide-react";
import { adminApi } from "../services/adminApi";
import { useToast } from "@shared/components/ui/Toast";
import Card from "@shared/components/ui/Card";
import Badge from "@shared/components/ui/Badge";
import Modal from "@shared/components/ui/Modal";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const ScratchCardManagement = () => {
  const { showToast } = useToast();
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [viewingCard, setViewingCard] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    rewardType: "cash",
    rewardValue: "",
    minOrderAmount: "",
    startDate: "",
    endDate: "",
    totalCardsLimit: "",
    perUserLimit: "1",
    winningProbability: "100",
    isActive: true,
    termsAndConditions: ""
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getScratchCampaigns();
      if (res.data.success) {
        setCards(res.data.result.items || []);
      }
    } catch (error) {
      showToast("Failed to load campaigns", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenForm = (card = null) => {
    if (card) {
      setEditingCard(card);
      setFormData({
        title: card.title || "",
        description: card.description || "",
        rewardType: card.rewardType || "cash",
        rewardValue: typeof card.rewardValue === 'object' ? JSON.stringify(card.rewardValue) : (card.rewardValue || ""),
        minOrderAmount: card.minOrderAmount || "",
        startDate: card.startDate ? card.startDate.substring(0, 10) : "",
        endDate: card.endDate ? card.endDate.substring(0, 10) : "",
        totalCardsLimit: card.totalCardsLimit || "",
        perUserLimit: card.perUserLimit || "1",
        winningProbability: card.winningProbability || "100",
        isActive: card.isActive ?? true,
        termsAndConditions: card.termsAndConditions || ""
      });
    } else {
      setEditingCard(null);
      setFormData({
        title: "",
        description: "",
        rewardType: "cash",
        rewardValue: "",
        minOrderAmount: "",
        startDate: "",
        endDate: "",
        totalCardsLimit: "",
        perUserLimit: "1",
        winningProbability: "100",
        isActive: true,
        termsAndConditions: ""
      });
    }
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      let finalRewardValue = formData.rewardValue;
      try {
        if (formData.rewardValue.startsWith('{') || formData.rewardValue.startsWith('[')) {
          finalRewardValue = JSON.parse(formData.rewardValue);
        } else if (!isNaN(formData.rewardValue)) {
          finalRewardValue = Number(formData.rewardValue);
        }
      } catch (e) {
        // Keep as string if parsing fails
      }

      const payload = {
        ...formData,
        rewardValue: finalRewardValue,
        minOrderAmount: Number(formData.minOrderAmount),
        totalCardsLimit: Number(formData.totalCardsLimit) || 0,
        perUserLimit: Number(formData.perUserLimit) || 1,
        winningProbability: Number(formData.winningProbability) || 100,
      };

      if (editingCard) {
        await adminApi.updateScratchCampaign(editingCard._id, payload);
        showToast("Campaign updated", "success");
      } else {
        await adminApi.createScratchCampaign(payload);
        showToast("Campaign created", "success");
      }
      setShowForm(false);
      fetchCampaigns();
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to save campaign", "error");
    }
  };

  const toggleStatus = async (id) => {
    try {
      await adminApi.toggleScratchCampaign(id);
      setCards(cards.map(c => c._id === id ? { ...c, isActive: !c.isActive } : c));
      showToast("Status updated", "success");
    } catch (error) {
      showToast("Failed to update status", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminApi.deleteScratchCampaign(id);
      setCards(cards.filter(c => c._id !== id));
      setDeleteTarget(null);
      showToast("Campaign deleted", "warning");
    } catch (error) {
      showToast("Failed to delete campaign", "error");
    }
  };

  const stats = useMemo(() => {
    return {
      total: cards.length,
      active: cards.filter(c => c.isActive).length,
      totalIssued: cards.reduce((acc, c) => acc + (c.stats?.issued || 0), 0),
      totalRedeemed: cards.reduce((acc, c) => acc + (c.stats?.redeemed || 0), 0),
    };
  }, [cards]);

  return (
    <div className="ds-section-spacing animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12 px-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-1">
        <div>
          <h1 className="ds-h1 flex items-center gap-3">
            Scratch Cards
            <Badge variant="primary" className="text-[10px] font-black uppercase tracking-widest">Rewards</Badge>
          </h1>
          <p className="ds-description mt-1">Manage gamified reward programs and scratch card campaigns.</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Plus className="h-5 w-5" />
          ADD CAMPAIGN
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Campaigns', value: stats.total, icon: Gift, color: 'indigo' },
          { label: 'Active Now', value: stats.active, icon: Trophy, color: 'emerald' },
          { label: 'Cards Issued', value: stats.totalIssued.toLocaleString(), icon: Users, color: 'amber' },
          { label: 'Redeemed', value: stats.totalRedeemed.toLocaleString(), icon: Calendar, color: 'rose' },
        ].map((s, i) => (
          <Card key={i} className="p-6 border-none shadow-xl ring-1 ring-slate-100 bg-white group hover:ring-primary/20 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-2.5 rounded-2xl",
                s.color === 'indigo' && "bg-indigo-50 text-indigo-600",
                s.color === 'emerald' && "bg-emerald-50 text-emerald-600",
                s.color === 'amber' && "bg-amber-50 text-amber-600",
                s.color === 'rose' && "bg-rose-50 text-rose-600",
              )}>
                <s.icon className="h-6 w-6" />
              </div>
            </div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{s.label}</h4>
            <h3 className="text-2xl font-black text-slate-900">{s.value}</h3>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-xl ring-1 ring-slate-100 bg-white rounded-xl overflow-hidden mt-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Campaign Details</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reward</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Stats</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Validity</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-400 font-semibold bg-white">
                    Loading campaigns...
                  </td>
                </tr>
              ) : cards.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-400 font-semibold bg-white">
                    No scratch campaigns created yet.
                  </td>
                </tr>
              ) : (
                cards.map((card) => (
                  <tr key={card._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                          <Gift className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 tracking-wider">{card.title}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 line-clamp-1">{card.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="space-y-1">
                        <p className="text-xs font-black text-slate-900 uppercase">
                          {card.rewardType}: {typeof card.rewardValue === 'object' ? 'Range' : `₹${card.rewardValue}`}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400">Min. Order: ₹{card.minOrderAmount}</p>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex gap-3">
                          <div className="text-center">
                            <p className="text-[10px] font-black text-slate-900">{card.stats?.issued || 0}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">Issued</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-black text-slate-900">{card.stats?.scratched || 0}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">Scratch</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-black text-slate-900">{card.stats?.redeemed || 0}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">Won</p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold">
                          {new Date(card.startDate).toLocaleDateString()} - {new Date(card.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <Badge variant={card.isActive ? "success" : "secondary"}>
                        {card.isActive ? "ACTIVE" : "INACTIVE"}
                      </Badge>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
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
                          onClick={() => toggleStatus(card._id)}
                          className={cn("p-2 rounded-lg transition-all", card.isActive ? "hover:bg-amber-50 text-amber-400" : "hover:bg-emerald-50 text-emerald-400")}
                        >
                          {card.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(card)}
                          className="p-2 hover:bg-rose-50 rounded-lg text-rose-400 hover:text-rose-600 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete confirmation dialog */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Delete campaign?</h3>
                <p className="text-slate-500 text-sm mb-6">
                  Are you sure you want to remove <span className="font-semibold text-slate-900">{deleteTarget.title}</span>?
                </p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => setDeleteTarget(null)} className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">Cancel</button>
                  <button onClick={() => handleDelete(deleteTarget._id)} className="px-4 py-2.5 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700 transition-colors">Delete</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingCard ? "Modify Campaign" : "New Campaign"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Campaign Title</label>
              <input
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none ring-1 ring-slate-100 focus:ring-primary/20"
                placeholder="e.g. Weekend Special"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none ring-1 ring-slate-100 focus:ring-primary/20 resize-none"
                rows={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Reward Type</label>
              <select
                value={formData.rewardType}
                onChange={(e) => setFormData({ ...formData, rewardType: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none ring-1 ring-slate-100 focus:ring-primary/20"
              >
                <option value="cash">Cash (Wallet)</option>
                <option value="points">Points</option>
                <option value="discount">Discount Coupon</option>
                <option value="freebie">Freebie</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Value (Fixed or {'{"min":X, "max":Y}'})</label>
              <input
                required
                value={formData.rewardValue}
                onChange={(e) => setFormData({ ...formData, rewardValue: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none ring-1 ring-slate-100 focus:ring-primary/20"
                placeholder={'e.g. 50 or {"min":10, "max":100}'}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Min Order Amount (₹)</label>
              <input
                type="number"
                required
                value={formData.minOrderAmount}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none ring-1 ring-slate-100 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Winning Prob. (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.winningProbability}
                onChange={(e) => setFormData({ ...formData, winningProbability: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none ring-1 ring-slate-100 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Start Date</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none ring-1 ring-slate-100 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">End Date</label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none ring-1 ring-slate-100 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Total Limit (0=inf)</label>
              <input
                type="number"
                value={formData.totalCardsLimit}
                onChange={(e) => setFormData({ ...formData, totalCardsLimit: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none ring-1 ring-slate-100 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Per User Limit</label>
              <input
                type="number"
                value={formData.perUserLimit}
                onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none ring-1 ring-slate-100 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Terms & Conditions</label>
            <textarea
              value={formData.termsAndConditions}
              onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none ring-1 ring-slate-100 focus:ring-primary/20 resize-none"
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 mt-4"
          >
            {editingCard ? 'SAVE CHANGES' : 'CREATE CAMPAIGN'}
          </button>
        </form>
      </Modal>

      {viewingCard && (
        <Modal
          isOpen={!!viewingCard}
          onClose={() => setViewingCard(null)}
          title="Campaign Insights"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Issued</p>
                <p className="text-xl font-black text-slate-900">{viewingCard.stats?.issued || 0}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Scratched</p>
                <p className="text-xl font-black text-slate-900">{viewingCard.stats?.scratched || 0}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl">
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Winners Found</p>
                <p className="text-xl font-black text-emerald-600">{viewingCard.stats?.redeemed || 0}</p>
              </div>
              <div className="p-4 bg-indigo-50 rounded-2xl">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Redemption Rate</p>
                <p className="text-xl font-black text-indigo-600">
                  {viewingCard.stats?.issued ? ((viewingCard.stats.redeemed / viewingCard.stats.issued) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2">Campaign Rules</h4>
                <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">Min Order</span>
                    <span className="text-slate-900">₹{viewingCard.minOrderAmount}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">User Limit</span>
                    <span className="text-slate-900">{viewingCard.perUserLimit} card(s)</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">Winning Prob.</span>
                    <span className="text-slate-900">{viewingCard.winningProbability}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ScratchCardManagement;
