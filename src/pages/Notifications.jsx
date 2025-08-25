import React, { useEffect, useState } from "react";
import translations from '../translations';
import { firestore } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

const Notifications = () => {
  const language = localStorage.getItem('language') || 'en';
  const t = translations[language];
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        // Fetch all notifications, ordered by timestamp
        const q = query(
          collection(firestore, "notifications"),
          orderBy("timestamp", "desc")
        );
        const snap = await getDocs(q);
        const all = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNotifications(all);
      } catch (err) {
        setNotifications([]);
      }
      setLoading(false);
    };
    fetchNotifications();
  }, []);

  return (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', background: '#e3f2fd', padding: '40px 0' }}>
  <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: 'center', marginBottom: 32 }}>{t.notifications || 'Notifications'}</h2>
      {loading ? (
        <div style={{ textAlign: 'center', color: '#888' }}>{t.loadingNotifications || 'Loading notifications...'}</div>
      ) : notifications.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#888' }}>{t.noUpcomingEvents || 'No upcoming election events.'}</div>
      ) : (
        <ul style={{ padding: 0, margin: 0, listStyle: 'none', width: '100%', maxWidth: 600 }}>
          {notifications.map(n => (
            <li key={n.id} style={{ marginBottom: 18, padding: 18, background: '#eaf2fb', borderRadius: 10, boxShadow: '0 2px 8px #2d6cdf11', marginLeft: 'auto', marginRight: 'auto', maxWidth: 600 }}>
              <div style={{ fontWeight: 600, color: '#1a237e', fontSize: 18 }}>{n.title || t.electionEvent || "Election Event"}</div>
              <div style={{ fontSize: 15, color: '#333', marginTop: 4 }}>{n.body}</div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 6 }}>
                {n.timestamp
                  ? (n.timestamp.seconds
                      ? new Date(n.timestamp.seconds * 1000).toLocaleString()
                      : (n.timestamp instanceof Date
                          ? n.timestamp.toLocaleString()
                          : String(n.timestamp)))
                  : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notifications;
