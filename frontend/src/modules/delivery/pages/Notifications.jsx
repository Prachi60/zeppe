import React, { useState, useEffect } from "react";
import {
  Bell,
  ArrowLeft,
  Calendar,
  Megaphone,
  CheckCircle,
  Clock,
  Trash2,
  Package,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@/shared/components/ui/Button";
import Card from "@/shared/components/ui/Card";
import { deliveryApi } from "../services/deliveryApi";
import { toast } from "sonner";
import {
  getOrderSocket,
  onDeliveryBroadcastWithdrawn,
} from "@/core/services/orderSocket";

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const getNotificationIcon = (type) => {
    switch (type) {
      case "ORDER_DELIVERED":
      case "RETURN_QC_PASSED":
        return <CheckCircle size={20} className="text-emerald-600" />;
      case "DELIVERY_ASSIGNED":
      case "ORDER_READY":
      case "RETURN_PICKUP_ASSIGNED":
      case "NEW_DELIVERY_BROADCAST":
      case "NEW_RETURN_BROADCAST":
        return <Package size={20} className="text-orange-600" />;
      case "CASH_OVER_LIMIT":
      case "RETURN_QC_FAILED":
        return <Megaphone size={20} className="text-rose-600" />;
      default:
        return <Bell size={20} className="text-blue-600" />;
    }
  };

  const getIconContainerColor = (type, isRead) => {
    if (isRead) return "bg-gray-100 text-gray-400 opacity-70";
    switch (type) {
      case "ORDER_DELIVERED":
      case "RETURN_QC_PASSED":
        return "bg-emerald-50 text-emerald-600";
      case "DELIVERY_ASSIGNED":
      case "ORDER_READY":
      case "RETURN_PICKUP_ASSIGNED":
      case "NEW_DELIVERY_BROADCAST":
      case "NEW_RETURN_BROADCAST":
        return "bg-orange-50 text-orange-600";
      case "CASH_OVER_LIMIT":
      case "RETURN_QC_FAILED":
        return "bg-rose-50 text-rose-600";
      default:
        return "bg-blue-50 text-blue-600";
    }
  };

  const handleNotificationClick = async (notif) => {
    const id = notif._id || notif.id;
    if (!notif.isRead) {
      await handleMarkAsRead(id);
    }
    if (notif.data?.orderId) {
      navigate(`/delivery/order-details/${notif.data.orderId}`);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await deliveryApi.getNotifications();
      if (response.data.success) {
        setNotifications(response.data.result.notifications);
      }
    } catch (error) {
      toast.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const getToken = () => localStorage.getItem("auth_delivery");
    getOrderSocket(getToken);
    return onDeliveryBroadcastWithdrawn(getToken, (payload) => {
      const orderId = payload?.orderId;
      if (!orderId) return;
      setNotifications((current) =>
        current.filter((notification) => notification?.data?.orderId !== orderId),
      );
      toast.info("An order request was accepted by another partner.");
    });
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await deliveryApi.markNotificationRead(id);
      setNotifications(notifications.map(n => (n._id === id || n.id === id) ? { ...n, isRead: true } : n));
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await deliveryApi.markAllNotificationsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      toast.success("Marked all as read");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div className="bg-gray-50/50 min-h-screen pb-24 font-sans">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 sticky top-0 z-30 backdrop-blur-md bg-white/90">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="mr-2">
              <ArrowLeft size={24} />
            </Button>
            <h1 className="ds-h3 text-gray-900">Notifications</h1>
          </div>
          {notifications.some(n => !n.isRead) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-primary text-xs font-bold hover:bg-primary/5 px-2">
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : (
          <motion.div
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible">
            <AnimatePresence mode="popLayout">
              {notifications.map((notification) => (
                <motion.div
                  key={notification._id || notification.id}
                  variants={itemVariants}
                  layout
                  onClick={() => handleNotificationClick(notification)}>
                  <Card
                    className={`p-4 border-none shadow-sm relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-md hover:scale-[1.01] ${!notification.isRead
                      ? "bg-blue-50/50 border-l-4 border-l-blue-500 shadow-blue-500/5"
                      : "bg-white opacity-95 border border-slate-100"
                      }`}>
                    {!notification.isRead && (
                      <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    )}

                    <div className="flex items-start">
                      <div
                        className={`p-3 rounded-full mr-4 flex-shrink-0 transition-transform ${getIconContainerColor(notification.type, notification.isRead)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <h3
                            className={`font-black text-gray-900 text-sm ${!notification.isRead ? "text-blue-900" : "text-gray-700 font-bold"}`}>
                            {notification.title}
                          </h3>
                        </div>

                        <p className={`text-xs mb-2 leading-relaxed ${!notification.isRead ? "text-slate-800 font-medium" : "text-slate-500"}`}>
                          {notification.message || notification.body}
                        </p>

                        {/* Order ID Badge & Click to View Alert */}
                        {notification.data?.orderId && (
                          <div className="flex flex-wrap gap-2 mb-2.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">
                              Order: #{notification.data.orderId.slice(-8).toUpperCase()}
                            </span>
                            <span className="inline-flex items-center text-[10px] font-extrabold text-blue-500 hover:text-blue-600">
                              Tap to view details →
                            </span>
                          </div>
                        )}

                        {/* Rich Order Preview Data (pickup, drop, total) */}
                        {notification.data?.preview && (
                          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 mb-2.5 space-y-1.5 text-[11px] text-slate-600 shadow-inner">
                            {notification.data.preview.pickup && (
                              <div className="flex items-start gap-1">
                                <span className="font-extrabold text-slate-800 w-14 flex-shrink-0">PICKUP:</span>
                                <span className="font-medium text-slate-600 truncate">{notification.data.preview.pickup}</span>
                              </div>
                            )}
                            {notification.data.preview.drop && (
                              <div className="flex items-start gap-1">
                                <span className="font-extrabold text-slate-800 w-14 flex-shrink-0">DROP:</span>
                                <span className="font-medium text-slate-600 line-clamp-1">{notification.data.preview.drop}</span>
                              </div>
                            )}
                            {notification.data.preview.total && (
                              <div className="flex items-center gap-1 text-slate-800">
                                <span className="font-extrabold w-14">TOTAL:</span>
                                <span className="font-black text-amber-600">₹ {notification.data.preview.total}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                          <Clock size={10} className="mr-1" />
                          {new Date(notification.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {notifications.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 px-6">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Bell size={40} className="text-gray-300" />
                </div>
                <h3 className="ds-h3 text-gray-900 mb-2">You're All Caught Up!</h3>
                <p className="text-gray-500 text-sm max-w-[200px] mx-auto">
                  New notifications will appear here automatically.
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
