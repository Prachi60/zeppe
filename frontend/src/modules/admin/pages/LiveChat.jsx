import React, { useState, useEffect, useRef } from 'react';
import Card from '@shared/components/ui/Card';
import Badge from '@shared/components/ui/Badge';
import { useAuth } from '@core/context/AuthContext';
import chatService from '@core/services/chatService';
import * as chatSocket from '@core/services/chatSocket';
import { 
    HiOutlineChatBubbleLeftRight, 
    HiOutlineUser, 
    HiOutlineBuildingStorefront,
    HiOutlinePaperAirplane,
    HiOutlineMagnifyingGlass
} from 'react-icons/hi2';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const LiveChat = () => {
    const { token, user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [selectedConv, setSelectedConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [reply, setReply] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [remoteTyping, setRemoteTyping] = useState(false);

    const messagesEndRef = useRef(null);
    const getToken = () => token;

    // 1. Fetch Conversations
    useEffect(() => {
        const fetchConvs = async () => {
            try {
                const { data } = await chatService.getConversations();
                setConversations(data);
                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch conversations:', error);
                setLoading(false);
            }
        };
        if (token) fetchConvs();
    }, [token]);

    // 2. Handle Conversation Selection
    useEffect(() => {
        const loadMessages = async () => {
            if (!selectedConv) return;
            try {
                const { data } = await chatService.getMessages(selectedConv._id);
                setMessages(data.messages);
                
                // Join Room
                chatSocket.joinChatRoom(selectedConv._id, getToken);
                
                // Mark as read
                chatService.markAsRead(selectedConv._id);
                
                // Reset unread count locally
                setConversations(prev => prev.map(c => 
                    c._id === selectedConv._id ? { ...c, unreadCounts: { ...c.unreadCounts, [user.id]: 0 } } : c
                ));
            } catch (error) {
                console.error('Failed to load messages:', error);
            }
        };

        loadMessages();

        return () => {
            if (selectedConv) chatSocket.leaveChatRoom(selectedConv._id, getToken);
        };
    }, [selectedConv]);

    // 3. Socket Listeners
    useEffect(() => {
        if (!token) return;

        const cleanupMsg = chatSocket.onReceiveMessage(getToken, (newMessage) => {
            // Update messages if currently selected
            if (selectedConv && newMessage.conversationId === selectedConv._id) {
                setMessages(prev => [...prev, newMessage]);
                chatService.markAsRead(selectedConv._id);
            }

            // Update conversation list (move to top, update last message)
            setConversations(prev => {
                const index = prev.findIndex(c => c._id === newMessage.conversationId);
                if (index === -1) return prev; // Should ideally fetch new conv if not found

                const updated = [...prev];
                const conv = { ...updated[index], lastMessage: newMessage };
                
                if (!selectedConv || selectedConv._id !== newMessage.conversationId) {
                    const currentUnread = conv.unreadCounts?.[user.id] || 0;
                    conv.unreadCounts = { ...conv.unreadCounts, [user.id]: currentUnread + 1 };
                }

                updated.splice(index, 1);
                updated.unshift(conv);
                return updated;
            });
        });

        const cleanupTyping = chatSocket.onUserTyping(getToken, ({ userId, isTyping, conversationId }) => {
            if (selectedConv?._id === conversationId && userId !== user.id) {
                setRemoteTyping(isTyping);
            }
        });

        return () => {
            cleanupMsg();
            cleanupTyping();
        };
    }, [token, selectedConv, user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, remoteTyping]);

    const handleSend = () => {
        if (!reply.trim() || !selectedConv) return;
        chatSocket.sendChatMessage(selectedConv._id, reply, [], getToken);
        setReply('');
    };

    const filteredConvs = conversations.filter(c => {
        const participant = c.participants.find(p => p.participantId !== user.id);
        return participant?.participantId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
               c.metadata?.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Sidebar: Chat List */}
            <div className="lg:w-[400px] flex flex-col gap-4 h-full">
                <Card className="flex-1 flex flex-col border-none shadow-xl ring-1 ring-slate-100 rounded-xl overflow-hidden bg-white">
                    <div className="p-6 border-b border-slate-50 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Live Chat</h2>
                            <Badge variant="blue" className="text-[10px] font-black">{conversations.length} TOTAL</Badge>
                        </div>
                        <div className="relative group">
                            <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none ring-1 ring-transparent focus:ring-primary/10 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {loading ? (
                            <div className="flex justify-center p-10"><Loader className="animate-spin text-slate-300" /></div>
                        ) : filteredConvs.map((c) => {
                            const other = c.participants.find(p => p.participantId !== user.id);
                            const unread = c.unreadCounts?.[user.id] || 0;
                            return (
                                <button
                                    key={c._id}
                                    onClick={() => setSelectedConv(c)}
                                    className={cn(
                                        "w-full text-left p-4 rounded-2xl transition-all group relative overflow-hidden",
                                        selectedConv?._id === c._id
                                            ? "bg-slate-900 text-white shadow-xl translate-x-1"
                                            : "hover:bg-slate-50 text-slate-700"
                                    )}
                                >
                                    <div className="flex items-start justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            {other?.participantModel === 'User' ? <HiOutlineUser /> : <HiOutlineBuildingStorefront />}
                                            <span className="text-xs font-black truncate max-w-[150px]">
                                                {other?.participantId?.slice(-6).toUpperCase() || 'Unknown'}
                                            </span>
                                        </div>
                                        {unread > 0 && (
                                            <span className="bg-brand-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                                {unread}
                                            </span>
                                        )}
                                    </div>
                                    <p className={cn("text-[10px] truncate", selectedConv?._id === c._id ? "text-white/60" : "text-slate-400")}>
                                        {c.lastMessage?.content?.text || 'No messages yet'}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </Card>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-full min-h-0">
                {selectedConv ? (
                    <Card className="flex-1 flex flex-col border-none shadow-xl ring-1 ring-slate-100 rounded-xl overflow-hidden bg-white">
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-white ring-1 ring-slate-100 flex items-center justify-center text-slate-400 shadow-sm">
                                    <HiOutlineChatBubbleLeftRight className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 leading-none mb-1">Chatting with {selectedConv.type}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                        Conversation ID: {selectedConv._id}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/20">
                            {messages.map((m) => {
                                const isMe = m.sender.id === user.id;
                                return (
                                    <div key={m._id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                                        <div className={cn(
                                            "max-w-[80%] p-4 rounded-xl text-sm font-medium leading-relaxed shadow-sm",
                                            isMe ? "bg-slate-900 text-white rounded-tr-sm" : "bg-white text-slate-700 ring-1 ring-slate-100 rounded-tl-sm"
                                        )}>
                                            {m.content.text}
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-400 mt-2 px-1 uppercase tracking-widest">
                                            {new Date(m.createdAt).toLocaleTimeString()}
                                        </span>
                                    </div>
                                );
                            })}
                            {remoteTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-white px-4 py-2 rounded-xl rounded-tl-none shadow-sm ring-1 ring-slate-100 flex items-center gap-1">
                                        <div className="h-1 w-1 bg-slate-400 rounded-full animate-bounce"></div>
                                        <div className="h-1 w-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                        <div className="h-1 w-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-6 bg-white border-t border-slate-50">
                            <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl ring-1 ring-slate-100 focus-within:ring-primary/20 focus-within:bg-white transition-all">
                                <textarea
                                    value={reply}
                                    onChange={(e) => setReply(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    placeholder="Type your response here..."
                                    className="flex-1 bg-transparent border-none outline-none p-3 text-sm font-bold resize-none min-h-[44px] max-h-[120px]"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!reply.trim()}
                                    className="h-10 w-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    <HiOutlinePaperAirplane className="h-5 w-5 -rotate-45" />
                                </button>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-5 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                        <div className="h-24 w-24 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 ring-1 ring-slate-100">
                            <HiOutlineChatBubbleLeftRight className="h-10 w-10 text-slate-200" />
                        </div>
                        <h4 className="text-xl font-black text-slate-900 uppercase">Live Support Protocol</h4>
                        <p className="text-sm font-bold text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                            Select a live conversation from the sidebar to start real-time communication.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

const Loader = ({ className }) => (
    <div className={cn("h-6 w-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin", className)}></div>
);

export default LiveChat;
