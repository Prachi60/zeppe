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
import { motion, AnimatePresence } from "framer-motion";
import { fetchAllPlansAdmin, createPlanAdmin, updatePlanAdmin } from "@core/services/subscriptionService";
import { toast } from "sonner";

const Subscriptions = () => {
  const [activeTab, setActiveTab] = useState("sellers");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch plans on mount
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const data = await fetchAllPlansAdmin();
        setPlans(data);
      } catch (error) {
        toast.error("Failed to load subscription plans");
      } finally {
        setIsLoading(false);
      }
    };
    loadPlans();
  }, []);

  // Mock data for user subscriptions (since backend API for this is pending)
  const sellers = [
    { id: "S101", name: "Harsh's Hub", shopName: "Harsh's Hub", email: "harsh@appzeto.com", status: "active", plan: "Annual Partner", date: "23 Apr 2024", amount: "₹8399" },
    { id: "S102", name: "Premium Electronics", shopName: "Premium Store", email: "contact@premium.com", status: "pending", plan: "Basic Onboarding", date: "22 Apr 2024", amount: "₹8399" },
    { id: "S103", name: "Green Grocers", shopName: "Green Market", email: "green@market.com", status: "active", plan: "Annual Partner", date: "20 Apr 2024", amount: "₹8399" },
  ];

  const deliveryBoys = [
    { id: "D501", name: "Rahul Kumar", email: "rahul@zeppe.com", status: "active", plan: "Premium Partner", date: "23 Apr 2024", amount: "₹599" },
    { id: "D502", name: "Amit Singh", email: "amit@zeppe.com", status: "pending", plan: "Basic Plan", date: "21 Apr 2024", amount: "₹399" },
    { id: "D503", name: "Vikas Verma", email: "vikas@zeppe.com", status: "active", plan: "Premium Partner", date: "19 Apr 2024", amount: "₹599" },
  ];

  const getData = () => {
    if (activeTab === "sellers") return sellers;
    if (activeTab === "delivery") return deliveryBoys;
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
            <Button className="bg-slate-900 text-white rounded-xl px-4 py-2 text-xs font-black tracking-widest uppercase flex items-center gap-2">
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
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900">
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
    </div>
  );
};

export default Subscriptions;
