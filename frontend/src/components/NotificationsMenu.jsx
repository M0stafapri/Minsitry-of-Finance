import React, { useEffect, useState } from 'react';
import { getNotifications, markNotificationRead } from '@/api/notifications';

export default function NotificationsMenu() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    getNotifications().then(setNotifications);
  }, []);

  const handleRead = async (id) => {
    await markNotificationRead(id);
    setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
  };

  return (
    <div>
      <h3>الإشعارات</h3>
      {notifications.length === 0 && <div>لا توجد إشعارات</div>}
      {notifications.map(n => (
        <div key={n._id} className={`p-2 mb-2 rounded ${n.read ? 'bg-gray-100' : 'bg-yellow-100'}`}>
          <div>
            ⚠️ شهادة التوقيع الإلكتروني للعميل <b>{n.customerName}</b> ستنتهي في{' '}
            {new Date(n.expiryDate).toLocaleDateString('ar-EG')} 12:59 صباحًا.
          </div>
          <div>
            نقترح التجديد لمدة <b>{n.suggestedDuration}</b> سنة (حسب التجديدات السابقة).
          </div>
          <button onClick={() => handleRead(n._id)}>تمت القراءة</button>
          <a href={`/customers/${n.customerId}/renew?suggestedDuration=${n.suggestedDuration}`} className="ml-2 text-blue-600 underline">تجديد الآن</a>
        </div>
      ))}
    </div>
  );
} 