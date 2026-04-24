import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Users, 
  Truck, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock,
  ExternalLink,
  IndianRupee,
  Calendar,
  Plus,
  Edit2
} from "lucide-react";
import Card from "@shared/components/ui/Card";
import PageHeader from "@shared/components/ui/PageHeader";
import Badge from "@shared/components/ui/Badge";
import Button from "@shared/components/ui/Button";
import Modal from "@shared/components/ui/Modal";
import Input from "@shared/components/ui/Input";
import { motion, AnimatePresence } from "framer-motion";
import { 
  fetchAllPlansAdmin, 
  createPlanAdmin, 
  updatePlanAdmin,
  fetchUserSubscriptionsAdmin 
} from "@core/services/subscriptionService";
import { toast } from "sonner";

const Subscriptions = () => {
  const [activeTab, setActiveTab] = useState("sellers");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [plans, setPlans] = useState([]);
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "seller",
    price: "",
    duration: { value: 1, unit: "months" },
    features: [""],
    isActive: true
  });

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [plansData, subsData] = await Promise.all([
          fetchAllPlansAdmin(),
          fetchUserSubscriptionsAdmin()
        ]);
        setPlans(plansData);
        setUserSubscriptions(subsData);
      } catch (error) {
        toast.error("Failed to load subscription data");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSavePlan = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await updatePlanAdmin(editingPlan._id, formData);
        toast.success("Plan updated successfully");
      } else {
        await createPlanAdmin(formData);
        toast.success("Plan created successfully");
      }
      setIsModalOpen(false);
      // Reload plans
      const plansData = await fetchAllPlansAdmin();
      setPlans(plansData);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save plan");
    }
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      role: plan.role,
      price: plan.price,
      duration: plan.duration,
      features: plan.features.length > 0 ? plan.features : [""],
      isActive: plan.isActive
    });
    setIsModalOpen(true);
  };

  const handleOpenModal = () => {
    setEditingPlan(null);
    setFormData({
      name: "",
      role: "seller",
      price: "",
      duration: { value: 1, unit: "months" },
      features: [""],
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ""] });
  };

  const removeFeature = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures });
  };

  const getData = () => {
    if (activeTab === "sellers") {
      return userSubscriptions.filter(s => s.role === "seller").map(s => ({
        id: s._id,
        name: s.userId?.name || "N/A",
        email: s.userId?.email || "N/A",
        status: s.status,
        plan: s.subscriptionPlanId?.name || "N/A",
        date: new Date(s.startDate).toLocaleDateString(),
        amount: `₹${s.subscriptionPlanId?.price || 0}`
      }));
    }
    if (activeTab === "delivery") {
      return userSubscriptions.filter(s => s.role === "delivery").map(s => ({
        id: s._id,
        name: s.userId?.name || "N/A",
        email: s.userId?.email || "N/A",
        status: s.status,
        plan: s.subscriptionPlanId?.name || "N/A",
        date: new Date(s.startDate).toLocaleDateString(),
        amount: `₹${s.subscriptionPlanId?.price || 0}`
      }));
    }
    return plans;
  };

  const data = getData();

  const filteredData = data.filter(item => {
    const name = item.name || item.shopName || "";
    const email = item.email || "";
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || item.status === filterStatus || (activeTab === "plans" && (filterStatus === "active" ? item.isActive : !item.isActive));
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="ds-section-spacing font-['Outfit']">
      <PageHeader 
        title="Subscription Management" 
        description="Monitor and manage partnership subscriptions for vendors and delivery partners."
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-slate-900 text-white border-none shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-white/60 text-xs font-black uppercase tracking-widest mb-2">Total Revenue</p>
            <h3 className="text-3xl font-black">₹26,794</h3>
            <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <CheckCircle size={14} /> +12% from last week
            </div>
          </div>
          <IndianRupee className="absolute top-1/2 right-4 -translate-y-1/2 text-white/5" size={80} />
        </Card>
        <Card className="bg-white border-slate-100 shadow-sm">
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Active Partners</p>
          <h3 className="text-3xl font-black text-slate-900">42</h3>
          <div className="mt-4 flex items-center gap-2 text-blue-600 text-xs font-bold">
            <Users size={14} /> Managed across India
          </div>
        </Card>
        <Card className="bg-white border-slate-100 shadow-sm">
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Pending Approvals</p>
          <h3 className="text-3xl font-black text-slate-900">18</h3>
          <div className="mt-4 flex items-center gap-2 text-amber-500 text-xs font-bold">
            <Clock size={14} /> Action required
          </div>
        </Card>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          <button 
            onClick={() => setActiveTab("sellers")}
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === "sellers" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Sellers
          </button>
          <button 
            onClick={() => setActiveTab("delivery")}
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === "delivery" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Delivery Partners
          </button>
          <button 
            onClick={() => setActiveTab("plans")}
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === "plans" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Plan Management
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {activeTab === "plans" && (
            <Button 
              onClick={handleOpenModal}
              className="bg-slate-900 text-white rounded-xl px-4 py-2 text-xs font-black tracking-widest uppercase flex items-center gap-2"
            >
              <Plus size={16} /> Create Plan
            </Button>
          )}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
            />
          </div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-900 font-bold text-slate-700"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <Card className="p-0 border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {activeTab === "plans" ? "Plan Name" : "Partner Details"}
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {activeTab === "plans" ? "Role" : "Plan Type"}
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Amount</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {activeTab === "plans" ? "Duration" : "Subscription Date"}
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence mode="popLayout">
                {filteredData.map((item) => (
                  <motion.tr 
                    key={item.id || item._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      {activeTab === "plans" ? (
                        <span className="text-sm font-black text-slate-900">{item.name}</span>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-black text-xs">
                            {item.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">{item.name}</p>
                            <p className="text-xs text-slate-500 font-medium">{item.email}</p>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="uppercase text-[9px] font-black tracking-widest">
                        {activeTab === "plans" ? item.role : item.plan}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-slate-900">
                        {activeTab === "plans" ? `₹${item.price}` : item.amount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {activeTab === "plans" ? (
                        <span className="text-sm font-bold text-slate-700">
                          {item.duration.value} {item.duration.unit}
                        </span>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-500">
                          <Calendar size={14} />
                          <span className="text-sm font-medium">{item.date}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <Badge 
                          variant={(item.status === "active" || item.isActive) ? "success" : "warning"} 
                          className="uppercase text-[10px] font-black tracking-widest"
                        >
                          {activeTab === "plans" ? (item.isActive ? "Active" : "Inactive") : item.status}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {activeTab === "plans" ? (
                          <Button 
                            onClick={() => handleEditPlan(item)}
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-slate-900"
                          >
                            <Edit2 size={16} />
                          </Button>
                        ) : (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900">
                              <ExternalLink size={16} />
                            </Button>
                            {item.status === "pending" && (
                              <Button size="sm" className="bg-slate-900 text-white rounded-lg px-4 h-8 text-[10px] font-black tracking-widest uppercase">
                                Approve
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {filteredData.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-slate-300" size={32} />
            </div>
            <p className="text-slate-500 font-bold">No subscriptions found matching your search.</p>
          </div>
        )}
      </Card>

      {/* Plan Management Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? "Edit Subscription Plan" : "Create Subscription Plan"}
      >
        <form onSubmit={handleSavePlan} className="space-y-4 font-['Outfit']">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Plan Name</label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Premium Seller Plan"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Role</label>
              <select 
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:bg-white transition-all outline-none"
              >
                <option value="seller">Seller</option>
                <option value="delivery">Delivery Partner</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Price (INR)</label>
              <Input 
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="e.g. 999"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Duration</label>
              <div className="flex gap-2">
                <Input 
                  type="number"
                  className="w-20"
                  value={formData.duration.value}
                  onChange={(e) => setFormData({ ...formData, duration: { ...formData.duration, value: parseInt(e.target.value) } })}
                  required
                />
                <select 
                  value={formData.duration.unit}
                  onChange={(e) => setFormData({ ...formData, duration: { ...formData.duration, unit: e.target.value } })}
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:bg-white transition-all outline-none"
                >
                  <option value="days">Days</option>
                  <option value="months">Months</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Features</label>
            {formData.features.map((feature, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input 
                  value={feature}
                  onChange={(e) => handleFeatureChange(index, e.target.value)}
                  placeholder="e.g. Priority Support"
                  required
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => removeFeature(index)}
                  className="text-rose-500"
                >
                  <XCircle size={18} />
                </Button>
              </div>
            ))}
            <Button 
              type="button" 
              variant="ghost" 
              onClick={addFeature}
              className="text-slate-900 text-[10px] font-black tracking-widest uppercase flex items-center gap-2"
            >
              <Plus size={14} /> Add Feature
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
            />
            <label htmlFor="isActive" className="text-xs font-black text-slate-900 uppercase tracking-widest">Active Plan</label>
          </div>

          <div className="pt-4 flex gap-3">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setIsModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-slate-900 text-white"
            >
              {editingPlan ? "Update Plan" : "Create Plan"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Subscriptions;
