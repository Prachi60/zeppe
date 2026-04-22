import React from "react";
import Card from "@shared/components/ui/Card";
import Badge from "@shared/components/ui/Badge";
import Button from "@shared/components/ui/Button";
import {
  TrendingUp,
  BarChart3,
  DollarSign,
  Download,
  Banknote,
  ArrowDownToLine,
  Building2,
  Calendar,
  Wallet
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { MagicCard } from "@/components/ui/magic-card";
import { BlurFade } from "@/components/ui/blur-fade";
import ShimmerButton from "@/components/ui/shimmer-button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { exportToCSV } from "@/lib/exportUtils";
import { useSellerEarnings } from "../context/SellerEarningsContext";
import { sellerApi } from "../services/sellerApi";

const Earnings = () => {
  const navigate = useNavigate();
  const { earningsData: data, earningsLoading: loading, refreshEarnings } = useSellerEarnings();
  const [withdrawAmount, setWithdrawAmount] = React.useState("");
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = React.useState(false);
  const [isWithdrawing, setIsWithdrawing] = React.useState(false);

  React.useEffect(() => {
    if (data?.balances != null && withdrawAmount === "") {
      const available = Number(data.balances?.availableBalance ?? 0);
      setWithdrawAmount(available > 0 ? String(available) : "");
    }
  }, [data?.balances]);

  const handleWithdraw = async () => {
    const available = Number(data?.balances?.availableBalance ?? 0);
    const amount = parseFloat(withdrawAmount);
    
    if (isNaN(amount) || amount <= 0 || amount > available) {
      toast.error(`Please enter a valid amount (up to ₹${available.toLocaleString()})`);
      return;
    }

    setIsWithdrawing(true);
    try {
        const res = await sellerApi.requestWithdrawal({ amount });
        if (res.data.success) {
            toast.success("Withdrawal request submitted successfully!");
            setIsWithdrawModalOpen(false);
            refreshEarnings();
        }
    } catch (err) {
        toast.error(err.response?.data?.message || "Withdrawal failed");
    } finally {
        setIsWithdrawing(false);
    }
  };

  const handleDownloadReport = () => {
    const ledger = Array.isArray(data?.ledger) ? data.ledger : [];
    if (ledger.length === 0) {
      toast.info("No transaction data available for export.");
      return;
    }
    
    const exportData = ledger.map(txn => ({
      id: txn.id,
      type: txn.type,
      amount: `₹${Number(txn.amount || 0).toLocaleString()}`,
      status: txn.status,
      date: txn.date,
      ref: txn.ref
    }));

    exportToCSV(exportData, "Seller_Earnings_Full_Report", {
      id: "ID",
      type: "Type",
      amount: "Amount",
      status: "Status",
      date: "Date",
      ref: "Reference"
    });
    toast.success("Earnings report downloaded!");
  };

  if (loading && !data) {
    return <div className="flex items-center justify-center h-screen font-black text-slate-600 uppercase tracking-widest">Hydrating Financial Data...</div>;
  }

  return (
    <div className="space-y-8 pb-16">
      <BlurFade delay={0.1}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                Earnings Intelligence
                <Badge variant="success" className="text-[10px] px-2 py-0.5 font-black tracking-widest uppercase bg-emerald-100 text-emerald-700 rounded-lg">
                    Real-time
                </Badge>
            </h1>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-tight opacity-70">
                Track revenue, payouts, and financial health.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button
              onClick={handleDownloadReport}
              variant="outline"
              className="flex-1 md:flex-none rounded-2xl px-6 py-3 border-slate-200 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">
              <Download className="mr-2 h-4 w-4" />
              Statement
            </Button>
            <ShimmerButton
              onClick={() => setIsWithdrawModalOpen(true)}
              className="flex-1 md:flex-none px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-2xl shadow-primary/20 transition-transform active:scale-95">
              Withdraw Funds
            </ShimmerButton>
          </div>
        </div>
      </BlurFade>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <BlurFade delay={0.15}>
          <MagicCard className="bg-slate-900 border-none shadow-2xl overflow-hidden h-full" gradientColor="#1e293b">
            <div className="p-8 relative z-10 flex flex-col justify-between h-full space-y-8">
                <div className="flex justify-between items-start">
                    <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400">
                        <DollarSign className="h-6 w-6" />
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-none shadow-none text-[9px] uppercase font-black px-2 py-0.5">Live Balance</Badge>
                </div>
                <div>
                    <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] mb-1">Total Revenue</p>
                    <h3 className="text-4xl font-black text-white tracking-tight">₹{Number(data?.balances?.totalRevenue ?? 0).toLocaleString()}</h3>
                </div>
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Payout Cycle: T+2</span>
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>
            </div>
          </MagicCard>
        </BlurFade>

        <BlurFade delay={0.2}>
          <Card className="h-full border-none shadow-sm ring-1 ring-slate-100 bg-white p-8 flex flex-col justify-between group hover:shadow-xl hover:ring-primary/10 transition-all duration-500 rounded-[2rem]">
            <div className="flex justify-between items-start">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 transition-transform duration-500 group-hover:scale-110">
                    <Banknote className="h-6 w-6" />
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Settled Funds</p>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">₹{Number(data?.balances?.settledBalance ?? 0).toLocaleString()}</h3>
                </div>
            </div>
            <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Withdrawn</span>
                    <span className="text-sm font-black text-slate-900">₹{Number(data?.balances?.totalWithdrawn ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex gap-2 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                    <Wallet className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div>
                        <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">Available to Withdraw</p>
                        <p className="text-base font-black text-emerald-700 mt-0.5">₹{Number(data?.balances?.availableBalance ?? 0).toLocaleString()}</p>
                    </div>
                </div>
            </div>
          </Card>
        </BlurFade>

        <BlurFade delay={0.25}>
          <Card className="h-full border-none shadow-sm ring-1 ring-slate-100 bg-white p-8 flex flex-col justify-between group hover:shadow-xl hover:ring-amber-500/10 transition-all duration-500 rounded-[2rem]">
            <div className="flex justify-between items-start">
                <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 transition-transform duration-500 group-hover:scale-110">
                    <Calendar className="h-6 w-6" />
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">On Hold (Returns)</p>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">₹{Number(data?.balances?.onHoldBalance ?? 0).toLocaleString()}</h3>
                </div>
            </div>
            <div className="mt-8 flex-1 flex items-center justify-center p-6 border-2 border-dashed border-slate-100 rounded-3xl">
                <div className="text-center">
                    <ArrowDownToLine className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Escrow Balance</p>
                </div>
            </div>
            <div className="mt-6 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Releasing in 48-72h</p>
            </div>
          </Card>
        </BlurFade>
      </div>

      <BlurFade delay={0.4}>
        <Card className="p-8 border-none shadow-2xl shadow-slate-200/50 bg-white rounded-[2.5rem]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
                    <BarChart3 className="h-6 w-6 text-primary" />
                    Revenue Trend
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 ml-9">Past 6 months growth analysis</p>
            </div>
            <button 
                onClick={() => navigate('/seller/analytics')}
                className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 hover:translate-x-1 transition-transform">
                Full Analytics Report
                <TrendingUp className="h-4 w-4" />
            </button>
          </div>
          <div className="h-[350px] w-full min-h-[300px]">
            {(Array.isArray(data?.monthlyChart) ? data.monthlyChart : []).length === 0 ? (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl text-slate-300 font-black uppercase text-xs">No chart data available</div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyChart} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 900 }}
                  dy={15}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 900 }}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "20px",
                    border: "none",
                    boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.15)",
                    padding: "16px",
                  }}
                  itemStyle={{ fontSize: "14px", fontWeight: "900", color: "#0f172a" }}
                  labelStyle={{ fontSize: "10px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, "Gross Revenue"]}
                />
                <Bar
                  dataKey="revenue"
                  fill="url(#colorRevenue)"
                  radius={[12, 12, 4, 4]}
                  barSize={45}
                />
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={1} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </Card>
      </BlurFade>

      {/* Withdrawal Modal */}
      <AnimatePresence>
        {isWithdrawModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => !isWithdrawing && setIsWithdrawModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="w-full max-w-md relative z-10 bg-white rounded-[3rem] shadow-2xl overflow-hidden p-10 text-center">
              
              <div className="h-20 w-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/10">
                <Banknote className="h-10 w-10 text-emerald-600" />
              </div>

              <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">
                Move Funds
              </h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-10">
                Instantly transfer to primary bank
              </p>

              <div className="space-y-6 text-left">
                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner">
                    <div className="flex justify-between items-center mb-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transfer Amount</label>
                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">Available: ₹{Number(data?.balances?.availableBalance ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="relative">
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-3xl font-black text-slate-300">₹</span>
                        <input
                            type="number"
                            className="w-full pl-10 pr-4 py-2 bg-transparent text-4xl font-black text-slate-900 focus:outline-none placeholder:text-slate-100"
                            placeholder="0.00"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-5 border border-slate-100 rounded-[2rem] flex items-center gap-5 cursor-pointer hover:border-primary/20 hover:bg-primary/5 transition-all group">
                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                        <Building2 className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-black text-slate-900">Registered Bank Account</p>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Primary Settlement Node</p>
                    </div>
                    <div className="h-6 w-6 rounded-full border-2 border-slate-100 flex items-center justify-center group-hover:border-primary transition-all">
                        <div className="h-3 w-3 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-10">
                <Button
                  onClick={() => setIsWithdrawModalOpen(false)}
                  disabled={isWithdrawing}
                  variant="outline"
                  className="py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-white border-slate-200">
                  Cancel
                </Button>
                <Button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing}
                  className="py-4 rounded-2xl shadow-xl shadow-primary/20 font-black text-[10px] uppercase tracking-widest">
                  {isWithdrawing ? "Processing..." : "Transfer Now"}
                </Button>
              </div>
              
              <p className="text-[9px] text-slate-300 font-bold uppercase mt-8 tracking-widest leading-relaxed">
                By confirming, you agree to our settlement terms.<br/>Transfers may take up to 24 hours to reflect.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Earnings;
