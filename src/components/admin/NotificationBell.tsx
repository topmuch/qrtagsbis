'use client';

import { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  baggageId?: string | null;
  agencyId?: string | null;
  read: boolean;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch notifications on mount and poll every 15 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications/unread');
      const data = await res.json();
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Mark all as read locally
      for (const n of notifications) {
        await fetch(`/api/notifications/${n.id}/read`, { method: 'POST' });
      }
      setNotifications([]);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleViewBaggage = (notification: Notification) => {
    if (notification.baggageId) {
      router.push(`/admin/baggage/${notification.baggageId}`);
    }
    markAsRead(notification.id);
    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'baggage_declared_lost':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'baggage_found':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'urgent_scan':
        return <AlertTriangle className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-[#2563EB]" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
            {notifications.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#2563EB]" />
              <h3 className="font-bold text-slate-800 dark:text-white">Notifications</h3>
            </div>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-[#2563EB] hover:text-[#2563EB]/80 transition-colors font-medium"
                >
                  Tout marquer lu
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">Chargement...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-slate-600 dark:text-slate-300">Aucune notification</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Vous êtes à jour !</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group animate-in slide-in-from-right-2 duration-200"
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="mt-0.5 w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 dark:text-slate-500">
                          <Clock className="w-3 h-3" />
                          {formatTime(notification.createdAt)}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          {notification.baggageId && (
                            <button
                              onClick={() => handleViewBaggage(notification)}
                              className="flex items-center gap-1 text-[#2563EB] text-xs font-medium hover:text-[#2563EB]/80 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Voir le bagage
                            </button>
                          )}
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-slate-400 text-xs hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                          >
                            Marquer lu
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                Rafraîchi toutes les 15 secondes
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
