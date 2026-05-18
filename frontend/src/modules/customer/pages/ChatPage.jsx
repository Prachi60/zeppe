import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, Phone, Paperclip, Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@core/context/SettingsContext';
import { useAuth } from '@core/context/AuthContext';
import chatService from '@core/services/chatService';
import * as chatSocket from '@core/services/chatSocket';


const emojis = ['😀', '😂', '😍', '🥺', '😎', '😭', '😡', '👍', '👎', '🎉', '❤️', '🔥', '✅', '❌', '👋', '🙏', '👀', '💯', '💩', '🤡'];

const ChatPage = () => {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const { token, user } = useAuth();
    const appName = settings?.appName || 'App';

    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [remoteTyping, setRemoteTyping] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(true);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const getToken = () => token;

    // 1. Initialize Conversation and Socket
    useEffect(() => {
        const initChat = async () => {
            try {
                const { data } = await chatService.initiateConversation();
                setConversation(data);

                // Fetch history
                const { data: historyData } = await chatService.getMessages(data._id);
                setMessages(historyData.messages);

                // Join Socket Room
                chatSocket.joinChatRoom(data._id, getToken);
                
                // Mark as read
                chatService.markAsRead(data._id);

                setLoading(false);
            } catch (error) {
                console.error('Failed to initialize chat:', error);
                setLoading(false);
            }
        };

        if (token) initChat();

        return () => {
            if (conversation) {
                chatSocket.leaveChatRoom(conversation._id, getToken);
            }
        };
    }, [token]);

    // 2. Setup Socket Listeners
    useEffect(() => {
        if (!token || !conversation) return;

        const cleanupMsg = chatSocket.onReceiveMessage(getToken, (newMessage) => {
            if (newMessage.conversationId === conversation._id) {
                setMessages(prev => [...prev, newMessage]);
                chatService.markAsRead(conversation._id);
            }
        });

        const cleanupTyping = chatSocket.onUserTyping(getToken, ({ userId, isTyping }) => {
            if (userId !== user?.id) {
                setRemoteTyping(isTyping);
            }
        });

        const cleanupRead = chatSocket.onMessagesRead(getToken, ({ userId }) => {
            if (userId !== user?.id) {
                // Update UI to show messages are read
                setMessages(prev => prev.map(m => ({ ...m, status: 'read' })));
            }
        });

        return () => {
            cleanupMsg();
            cleanupTyping();
            cleanupRead();
        };
    }, [token, conversation, user]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, remoteTyping, selectedImage]);

    const handleSend = () => {
        if (!inputText.trim() && !selectedImage) return;

        // Optimistic UI update could be added here
        // For now, we rely on the socket broadcast (which includes the sender)
        
        chatSocket.sendChatMessage(conversation._id, inputText, [], getToken);
        
        setInputText('');
        setSelectedImage(null);
        setShowEmojiPicker(false);
        handleTyping(false);
    };

    const handleTyping = (status) => {
        setIsTyping(status);
        chatSocket.sendTypingStatus(conversation._id, status, getToken);
    };

    const onInputChange = (e) => {
        setInputText(e.target.value);
        if (!isTyping) handleTyping(true);

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            handleTyping(false);
        }, 3000);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    const handleEmojiClick = (emoji) => {
        setInputText(prev => prev + emoji);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setSelectedImage(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-white flex items-center justify-center z-[999]">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 border-4 border-[#45B0E2] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">Connecting to Support...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-white flex flex-col z-[999] overflow-hidden">
            {/* Chat Header */}
            <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-slate-100 z-30 shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 rounded-full hover:bg-slate-50 transition-colors text-slate-600"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="h-10 w-10 bg-[#f59931] rounded-full flex items-center justify-center text-black font-black text-sm shadow-sm ring-2 ring-white">
                                AS
                            </div>
                            <div className="absolute bottom-0 right-0 h-3 w-3 bg-cyan-500 rounded-full border-2 border-white animate-pulse"></div>
                        </div>
                        <div>
                            <h1 className="text-base font-black text-slate-800 leading-none">Support Chat</h1>
                            <p className="text-[10px] text-brand-600 font-bold mt-1 uppercase tracking-wider flex items-center gap-1">
                                <span className="h-1 w-1 bg-brand-500 rounded-full"></span> Online
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <a 
                        href="tel:6203858268"
                        className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                    >
                        <Phone size={20} />
                    </a>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 space-y-6 min-h-0">
                {messages.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-slate-400 text-sm italic">No messages yet. Send a message to start chatting with support.</p>
                    </div>
                )}
                {messages.map((msg) => {
                    const isMe = msg.sender.id === user?.id;
                    return (
                        <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] relative group ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                <div className={`px-4 py-3 rounded-2xl shadow-sm border text-sm leading-relaxed ${isMe
                                    ? 'bg-[#45B0E2] text-white border-transparent rounded-tr-none'
                                    : 'bg-white text-slate-700 border-slate-100 rounded-tl-none'
                                    }`}>
                                    {msg.content.attachments?.map((att, idx) => (
                                        <img key={idx} src={att.url} alt="Attachment" className="rounded-lg mb-2 max-w-full h-auto object-cover" />
                                    ))}
                                    {msg.content.text}
                                </div>
                                <div className="flex items-center gap-1.5 mt-1 px-1">
                                    <span className="text-[10px] text-slate-400 font-medium">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {isMe && (
                                        <span className={`text-[10px] font-bold uppercase tracking-tighter ${msg.status === 'read' ? 'text-cyan-500' : 'text-slate-300'}`}>
                                            {msg.status === 'read' ? 'Seen' : 'Sent'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Remote Typing Indicator */}
                <AnimatePresence>
                    {remoteTyping && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex justify-start"
                        >
                            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 flex items-center gap-1.5 h-10 w-16">
                                <div className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white p-3 border-t border-slate-100 shrink-0 z-30 safe-area-bottom relative mb-4">
                {/* Emoji Picker Popover */}
                <AnimatePresence>
                    {showEmojiPicker && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            className="absolute bottom-full left-4 mb-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 grid grid-cols-5 gap-2 w-64 z-50"
                        >
                            {emojis.map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={() => handleEmojiClick(emoji)}
                                    className="text-2xl hover:bg-slate-50 p-2 rounded-lg transition-colors"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Image Preview */}
                <AnimatePresence>
                    {selectedImage && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="absolute bottom-full right-4 mb-2 bg-white rounded-xl shadow-lg border border-slate-100 p-2 z-50"
                        >
                            <div className="relative">
                                <img src={selectedImage} alt="Preview" className="h-20 w-20 object-cover rounded-lg" />
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                                >
                                    <span className="text-xs">✕</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-end gap-2 bg-slate-50 p-2 rounded-[1.5rem] border border-slate-200 focus-within:border-cyan-300 focus-within:shadow-[0_0_0_4px_rgba(97,218,251,0.1)] transition-all">
                    <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={`p-2.5 rounded-full hover:text-slate-600 hover:bg-slate-200 transition-colors flex-shrink-0 ${showEmojiPicker ? 'text-[#f59931] bg-orange-50' : 'text-slate-400'}`}
                    >
                        <Smile size={22} />
                    </button>

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors flex-shrink-0"
                    >
                        <Paperclip size={22} />
                    </button>

                    <input
                        type="text"
                        value={inputText}
                        onChange={onInputChange}
                        onKeyDown={handleKeyPress}
                        placeholder="Type a message..."
                        className="bg-transparent text-sm w-full py-2.5 outline-none text-slate-700 placeholder:text-slate-400 font-medium"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputText.trim() && !selectedImage}
                        className="p-2.5 rounded-full bg-[#f59931] text-black hover:bg-[#faaf5c] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-200 flex-shrink-0"
                    >
                        <Send size={20} className="ml-0.5" />
                    </button>
                </div>
            </div>

            <style>
                {`
                    .safe-area-bottom {
                        padding-bottom: env(safe-area-inset-bottom);
                    }
                `}
            </style>
        </div>
    );
};

export default ChatPage;


