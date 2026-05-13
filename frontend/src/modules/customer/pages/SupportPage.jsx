import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, Phone, Mail, ChevronDown, ChevronUp, FileText, ChevronLeft, PlusCircle, X, Send } from 'lucide-react';
import { useToast } from '@shared/components/ui/Toast';
import { useSettings } from '@core/context/SettingsContext';
import { customerApi } from '../services/customerApi';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import axiosInstance from '@core/api/axios';

const FAQ_CACHE_KEY = 'customer_faqs_cache_v1';
const FAQ_CACHE_TTL_MS = 5 * 60 * 1000;

const SupportPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();
    const { settings } = useSettings();
    const supportEmail = settings?.supportEmail || 'zeppegrocery@gmail.com';
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [ticketLoading, setTicketLoading] = useState(false);
    const [ticketData, setTicketData] = useState({
        subject: '',
        description: '',
        priority: 'medium'
    });
    const [faqs, setFaqs] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [isReplying, setIsReplying] = useState(false);
    const [ticketsLoading, setTicketsLoading] = useState(true);

    const fetchTickets = async () => {
        try {
            setTicketsLoading(true);
            const res = await customerApi.getMyTickets();
            if (res.data.success) {
                setTickets(res.data.results || res.data.result || []);
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setTicketsLoading(false);
        }
    };

    useEffect(() => {
        const fetchFaqs = async () => {
            try {
                const cached = sessionStorage.getItem(FAQ_CACHE_KEY);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    const isFresh = parsed?.ts && Date.now() - parsed.ts < FAQ_CACHE_TTL_MS;
                    if (isFresh && Array.isArray(parsed?.items)) {
                        setFaqs(parsed.items);
                        return;
                    }
                }
            } catch { }

            try {
                const response = await axiosInstance.get('/public/faqs', {
                    params: { category: 'Customer', status: 'published' }
                });
                const data = response.data?.result ?? response.data;
                const list = Array.isArray(data?.items) ? data.items : Array.isArray(data?.results) ? data.results : [];
                setFaqs(list);
                sessionStorage.setItem(FAQ_CACHE_KEY, JSON.stringify({ ts: Date.now(), items: list }));
            } catch (error) {
                console.error('Error fetching FAQs:', error);
            }
        };

        fetchFaqs();
        fetchTickets();
    }, []);

    useEffect(() => {
        if (location.state) {
            const { subject, description, autoOpen } = location.state;
            if (subject || description) {
                setTicketData(prev => ({
                    ...prev,
                    subject: subject || prev.subject,
                    description: description || prev.description
                }));
            }
            if (autoOpen) setIsTicketModalOpen(true);
        }
    }, [location.state]);

    const handleTicketSubmit = async (e) => {
        e.preventDefault();
        try {
            setTicketLoading(true);
            const res = await customerApi.createTicket({ ...ticketData, userType: 'Customer' });
            if (res.data.success) {
                showToast("Ticket raised successfully", "success");
                setIsTicketModalOpen(false);
                setTicketData({ subject: '', description: '', priority: 'medium' });
                fetchTickets();
            }
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to create ticket", "error");
        } finally {
            setTicketLoading(false);
        }
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;
        try {
            setIsReplying(true);
            const res = await customerApi.replyToTicket(selectedTicket._id, { text: replyText });
            if (res.data.success) {
                setSelectedTicket(res.data.result || res.data.results);
                setReplyText('');
                fetchTickets();
            }
        } catch (error) {
            showToast("Failed to send reply", "error");
        } finally {
            setIsReplying(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-24 font-sans">
            <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-sm px-4 pt-4 pb-3 border-b border-slate-200/60 mb-4 flex items-center gap-2">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-slate-200/70 rounded-full transition-colors -ml-1"
                >
                    <ChevronLeft size={22} className="text-slate-800" />
                </button>
                <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Help & Support</h1>
            </div>

            <div className="max-w-2xl mx-auto px-4 pt-1 relative z-20 space-y-5">
                {/* Contact Channels */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <ContactCard icon={MessageCircle} label="Chat Us" sub="Instant Support" to="/chat" />
                    <ContactCard
                        icon={PlusCircle}
                        label="Raise Ticket"
                        sub="Formal Request"
                        onClick={() => setIsTicketModalOpen(true)}
                    />
                    <ContactCard
                        icon={Phone}
                        label="Call Us"
                        sub="+91 6203858268"
                        externalHref="tel:+916203858268"
                    />
                    <ContactCard
                        icon={Mail}
                        label="Email Us"
                        sub={supportEmail}
                        externalHref={`mailto:${supportEmail}`}
                    />
                </div>

                {/* Tickets Section */}
                {tickets.length > 0 && (
                    <div className="space-y-3">
                        <h2 className="text-base font-semibold text-slate-800 px-1">My Active Tickets</h2>
                        <div className="space-y-2">
                            {tickets.map((ticket) => (
                                <button
                                    key={ticket._id}
                                    onClick={() => setSelectedTicket(ticket)}
                                    className="w-full bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between hover:border-[#45B0E2] transition-all group"
                                >
                                    <div className="text-left flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={cn(
                                                "text-[9px] font-black uppercase px-2 py-0.5 rounded-full",
                                                ticket.status === 'open' ? "bg-green-100 text-green-600" :
                                                ticket.status === 'processing' ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-600"
                                            )}>
                                                {ticket.status}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-bold">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-800 truncate">{ticket.subject}</h3>
                                        <p className="text-xs text-slate-500 truncate">{ticket.messages[ticket.messages.length - 1]?.text}</p>
                                    </div>
                                    <ChevronDown className="text-slate-300 -rotate-90 group-hover:text-[#45B0E2] transition-colors" size={20} />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* FAQ Section */}
                <div>
                    <h2 className="text-base font-semibold text-slate-800 mb-3 px-1">Frequently Asked Questions</h2>
                    <div className="space-y-3">
                        {faqs.length > 0 ? (
                            faqs.map((faq) => (
                                <FAQItem
                                    key={faq._id}
                                    question={faq.question}
                                    answer={faq.answer}
                                />
                            ))
                        ) : (
                            <div className="bg-white rounded-2xl shadow-[0_4px_10px_rgb(0,0,0,0.02)] border border-slate-100 px-5 py-4 text-sm text-slate-400 text-center">
                                No FAQs available right now.
                            </div>
                        )}
                    </div>
                </div>

                {/* Legal Links */}
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Legal</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        <Link to="/terms" className="flex items-center gap-2.5 text-slate-700 hover:text-slate-900 font-medium text-xs">
                            <FileText size={16} /> Terms & Conditions
                        </Link>
                        <Link to="/privacy" className="flex items-center gap-2.5 text-slate-700 hover:text-slate-900 font-medium text-xs">
                            <FileText size={16} /> Privacy Policy
                        </Link>
                        <Link to="/refund-policy" className="flex items-center gap-2.5 text-slate-700 hover:text-slate-900 font-medium text-xs">
                            <FileText size={16} /> Refund Policy
                        </Link>
                        <Link to="/return-policy" className="flex items-center gap-2.5 text-slate-700 hover:text-slate-900 font-medium text-xs">
                            <FileText size={16} /> Return Policy
                        </Link>
                        <Link to="/shipping-policy" className="flex items-center gap-2.5 text-slate-700 hover:text-slate-900 font-medium text-xs">
                            <FileText size={16} /> Shipping Policy
                        </Link>
                    </div>
                </div>
            </div>

            {/* Ticket Creation Modal */}
            <AnimatePresence>
                {isTicketModalOpen && (
                    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsTicketModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl overflow-hidden z-10">
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800">Raise a Ticket</h2>
                                        <p className="text-sm text-slate-500 font-medium">Describe your issue in detail</p>
                                    </div>
                                    <button onClick={() => setIsTicketModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                                <form onSubmit={handleTicketSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Subject</label>
                                        <input type="text" required value={ticketData.subject} onChange={(e) => setTicketData({ ...ticketData, subject: e.target.value })} placeholder="What's the issue about?" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-1 ring-transparent focus:ring-[#45B0E2]/20 transition-all" />
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['low', 'medium', 'high'].map((p) => (
                                            <button key={p} type="button" onClick={() => setTicketData({ ...ticketData, priority: p })} className={cn("py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border", ticketData.priority === p ? "bg-[#45B0E2] text-white border-[#45B0E2] shadow-lg shadow-brand-100" : "bg-white text-slate-400 border-slate-100 hover:bg-slate-50")}>{p}</button>
                                        ))}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Description</label>
                                        <textarea required value={ticketData.description} onChange={(e) => setTicketData({ ...ticketData, description: e.target.value })} placeholder="Please explain the issue clearly..." className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold min-h-[150px] outline-none ring-1 ring-transparent focus:ring-[#45B0E2]/20 transition-all" />
                                    </div>
                                    <Button type="submit" disabled={ticketLoading} className="w-full h-14 bg-[#45B0E2] hover:bg-[#0b721b] text-white text-lg font-black rounded-2xl shadow-xl shadow-brand-100 transition-all active:scale-95">
                                        {ticketLoading ? "SUBMITTING..." : "SUBMIT TICKET"}
                                    </Button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Conversation Modal */}
            <AnimatePresence>
                {selectedTicket && (
                    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedTicket(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative bg-white w-full max-w-lg h-[90vh] sm:h-[600px] rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                                <div className="flex-1 min-w-0 mr-4">
                                    <h2 className="text-lg font-black text-slate-800 truncate">{selectedTicket.subject}</h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">#{selectedTicket._id.slice(-8)} • {selectedTicket.status}</p>
                                </div>
                                <button onClick={() => setSelectedTicket(null)} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full text-slate-400">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                                {selectedTicket.messages.map((msg, i) => (
                                    <div key={i} className={cn("flex flex-col", msg.isAdmin ? "items-start" : "items-end")}>
                                        <div className={cn(
                                            "max-w-[85%] p-4 rounded-2xl text-sm font-medium shadow-sm",
                                            msg.isAdmin ? "bg-white text-slate-800 rounded-tl-none border border-slate-100" : "bg-[#45B0E2] text-white rounded-tr-none"
                                        )}>
                                            {msg.text}
                                        </div>
                                        <span className="text-[9px] text-slate-400 font-bold mt-1 px-1">
                                            {msg.isAdmin ? "Support Agent" : "You"} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                                <form onSubmit={handleReplySubmit} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Type your message..."
                                        className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none ring-1 ring-transparent focus:ring-[#45B0E2]/20 transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isReplying || !replyText.trim()}
                                        className="w-12 h-12 flex items-center justify-center bg-[#45B0E2] text-white rounded-xl shadow-lg shadow-brand-100 disabled:opacity-50 transition-all active:scale-95"
                                    >
                                        {isReplying ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={20} />}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ContactCard = ({ icon: Icon, label, sub, to, onClick, externalHref }) => {
    const { showToast } = useToast();
    const CardContent = (
        <div
            className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer group h-full"
            onClick={(!to && !externalHref) ? onClick : undefined}
        >
            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 group-hover:text-slate-800 transition-colors">
                <Icon size={20} />
            </div>
            <div>
                <h3 className="font-semibold text-slate-800 text-sm whitespace-nowrap">{label}</h3>
                <p className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]">{sub}</p>
            </div>
        </div>
    );

    if (externalHref) {
        return (
            <a 
                href={externalHref} 
                className="block h-full no-underline"
                onClick={(e) => {
                    if (externalHref.startsWith('mailto:')) {
                        const email = externalHref.replace('mailto:', '');
                        navigator.clipboard.writeText(email);
                        showToast("Email copied to clipboard", "success");
                    } else if (externalHref.startsWith('tel:')) {
                        const phone = externalHref.replace('tel:', '');
                        navigator.clipboard.writeText(phone);
                        showToast("Phone number copied to clipboard", "success");
                    }
                }}
            >
                {CardContent}
            </a>
        );
    }

    return to ? <Link to={to} className="block h-full no-underline">{CardContent}</Link> : CardContent;
};

const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
            >
                <span className="font-semibold text-slate-800 text-sm">{question}</span>
                {isOpen ? <ChevronUp size={18} className="text-slate-700" /> : <ChevronDown size={18} className="text-slate-400" />}
            </button>
            {isOpen && (
                <div className="px-5 pb-4 text-sm text-slate-500 font-medium leading-relaxed bg-slate-50/50">
                    {answer}
                </div>
            )}
        </div>
    );
};

export default SupportPage;

