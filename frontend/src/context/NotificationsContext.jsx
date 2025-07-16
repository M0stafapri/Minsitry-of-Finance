import React, { createContext, useContext, useState, useEffect } from 'react';
import { customerAPI } from "@/api";

// Create the notifications context
const NotificationsContext = createContext();

// Custom hook to use the notifications context
export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

export const NotificationsProvider = ({ children }) => {
  // Use localStorage for notifications
  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem('notifications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [customers, setCustomers] = useState([]);

  // Fetch customers from API on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await customerAPI.getAllCustomers();
        if (response && response.status === 'success' && response.data && response.data.customers) {
          setCustomers(response.data.customers);
          localStorage.setItem('customers', JSON.stringify(response.data.customers));
        }
      } catch (e) {
        // Ignore errors
      }
    };
    fetchCustomers();
  }, []);

  // Load current user data
  useEffect(() => {
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Calculate unread count for current user whenever notifications change
  useEffect(() => {
    if (!currentUser) return;
    const count = notifications.filter(notification => {
      // Check if notification is unread
      const isUnread = !notification.read;
      // Check if notification is for current user
      const isForCurrentUser =
        notification.forUser === currentUser.username ||
        (notification.forUsers && notification.forUsers.includes(currentUser.username)) ||
        (notification.forRoles && notification.forRoles.includes(currentUser.role)) ||
        (!notification.forUser && !notification.forUsers && !notification.forRoles);
      return isUnread && isForCurrentUser;
    }).length;
    setUnreadCount(count);
  }, [notifications, currentUser]);

  // Check for expiring customers and notify whenever customers or notifications change
  useEffect(() => {
    if (!customers || customers.length === 0) return;
    const now = new Date();
    const soon = new Date();
    soon.setDate(soon.getDate() + 30);
    soon.setHours(23, 59, 59, 999);
    customers.forEach(customer => {
      if (!customer.expiryDate) return;
      const expiry = new Date(customer.expiryDate);
      if (expiry >= now && expiry <= soon) {
        // Check if notification already exists for this customer and expiryDate
        const alreadyNotified = notifications.some(n =>
          n.type === 'certificate_expiry' &&
          n.customerId === customer._id &&
          n.expiryDate === customer.expiryDate
        );
        if (!alreadyNotified) {
          addNotification({
            type: 'certificate_expiry',
            customerId: customer._id,
            customerName: customer.customerName,
            expiryDate: customer.expiryDate,
            title: 'Certificate Expiry Alert',
            message: `The certificate for customer ${customer.customerName} will expire on ${new Date(customer.expiryDate).toLocaleDateString('en-GB')}`
          });
        }
      }
    });
  }, [customers, notifications]);

  // Add a new notification
  const addNotification = (notification) => {
    try {
      if (!notification) return;
      const baseNotification = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        read: false,
        type: notification.type || 'info',
        title: notification.title || '',
        message: notification.message || '',
        path: notification.path || '/',
        icon: notification.icon || 'Bell',
        color: notification.color || 'blue',
        ...notification
      };
      let newNotifications = [];
      if (notification.forUser) {
        newNotifications.push({ ...baseNotification, forUser: notification.forUser });
      }
      if (notification.forUsers && Array.isArray(notification.forUsers)) {
        notification.forUsers.forEach(username => {
          if (username) {
            newNotifications.push({ ...baseNotification, id: `${baseNotification.id}-user-${username}`, forUser: username });
          }
        });
      }
      if (notification.forRoles && Array.isArray(notification.forRoles)) {
        newNotifications.push({ ...baseNotification, id: `${baseNotification.id}-roles`, forRoles: notification.forRoles });
      }
      if (!notification.forUser && !notification.forUsers && !notification.forRoles) {
        newNotifications.push(baseNotification);
      }
      // Remove existing notifications for the same customer and type (and expiryDate if present)
      setNotifications(prev => {
        let filtered = prev.filter(n => {
          // Only filter if notification has customerId and type
          if (notification.customerId && n.customerId && n.type === notification.type && n.customerId === notification.customerId) {
            // If expiryDate is present, also match on expiryDate
            if (notification.expiryDate && n.expiryDate) {
              return n.expiryDate !== notification.expiryDate;
            }
            return false; // Remove if same type and customerId
          }
          return true;
        });
        return [...newNotifications, ...filtered];
      });
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  // Mark a notification as read
  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notification =>
        (notification.id === id || notification._id === id)
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Remove a notification
  const removeNotification = (id) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== id)
    );
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Format relative time
  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - notificationTime) / 1000);
    
    if (diffInSeconds < 60) {
      return 'منذ لحظات';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`;
    }
  };

  // Navigate to notification page
  const navigateToNotificationPage = (notification) => {
    markAsRead(notification.id);
    return notification.path || '/';
  };

  // Get default path for notification type
  const getDefaultPathForNotificationType = (type) => {
    const pathMap = {
      'trip-added': '/trips',
      'trip-updated': '/trips',
      'trip-deleted': '/trips',
      'trip-completed': '/trips/completed',
      'trip-status-changed': '/trips',
      'attendance-check-in': '/attendance',
      'attendance-check-out': '/attendance',
      'deduction': '/deductions',
      'reward': '/deductions',
      'target': '/'
    };
    return pathMap[type] || '/';
  };

  // Notify target achievement
  const notifyTargetAchievement = (employeeName, percentage) => {
    let title, message, icon;
    
    if (percentage >= 100) {
      title = "🎉 مبروك! تم تحقيق التارجت بالكامل";
      message = `تهانينا! لقد حققت ${percentage}% من التارجت الشهري`;
      icon = "Award";
    } else if (percentage >= 80) {
      title = "👏 أداء متميز! اقتربت من تحقيق التارجت";
      message = `أحسنت! لقد حققت ${percentage}% من التارجت الشهري`;
      icon = "TrendingUp";
    } else if (percentage >= 50) {
      title = "💪 نصف الطريق! استمر في التقدم";
      message = `جيد! لقد حققت ${percentage}% من التارجت الشهري`;
      icon = "Target";
    }

    addNotification({
      type: 'target',
      title,
      message,
      icon,
      color: percentage >= 100 ? 'green' : percentage >= 80 ? 'blue' : 'amber',
      forUser: employeeName,
      path: '/'
    });
  };

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    formatRelativeTime,
    navigateToNotificationPage,
    notifyTargetAchievement
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};
