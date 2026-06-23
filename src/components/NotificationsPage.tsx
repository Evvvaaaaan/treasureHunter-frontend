import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, MessageCircle, Heart, UserPlus, Award, MapPin, CheckCheck, Trash2 } from 'lucide-react';
import { useTheme } from '../utils/theme';
import BottomNavigation from './BottomNavigation';
import '../styles/notifications-page.css';

interface Notification {
  id: string;
  type: 'match' | 'like' | 'comment' | 'follow' | 'badge' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  relatedItemId?: string;
  relatedUserId?: string;
  icon?: string;
}

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      // Mock data for development
      const mockData: Notification[] = [
        
      ];
      
      setTimeout(() => {
        setNotifications(mockData);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setIsLoading(false);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') {
      return !notification.isRead;
    }
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const deleteNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    // Navigate based on notification type
    if (notification.relatedItemId) {
      navigate(`/items/${notification.relatedItemId}`);
    }
  };

  const getNotificationIcon = (type: string, icon?: string) => {
    if (icon) return icon;
    
    switch (type) {
      case 'match':
        return <MapPin size={20} className="notification-icon-svg" />;
      case 'like':
        return <Heart size={20} className="notification-icon-svg" />;
      case 'comment':
        return <MessageCircle size={20} className="notification-icon-svg" />;
      case 'follow':
        return <UserPlus size={20} className="notification-icon-svg" />;
      case 'badge':
        return <Award size={20} className="notification-icon-svg" />;
      case 'system':
        return <Bell size={20} className="notification-icon-svg" />;
      default:
        return <Bell size={20} className="notification-icon-svg" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'match': return '#10b981';
      case 'like': return '#ef4444';
      case 'comment': return '#3b82f6';
      case 'follow': return '#8b5cf6';
      case 'badge': return '#f59e0b';
      case 'system': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    
    return date.toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className={`notifications-page ${theme}`}>
      {/* Header */}
      <div className="notifications-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className="header-title">
          <h1>알림</h1>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button className="mark-all-read-btn" onClick={markAllAsRead}>
            <CheckCheck size={20} />
          </button>
        )}
        {unreadCount === 0 && <div style={{ width: '44px' }} />}
      </div>

      {/* Filter Tabs */}
      <div className="notification-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          전체 <span className="filter-count">{notifications.length}</span>
        </button>
        <button 
          className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          안읽음 <span className="filter-count">{unreadCount}</span>
        </button>
      </div>

      {/* Content */}
      <div className="notifications-content">
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>알림을 불러오는 중...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <Bell size={64} className="empty-icon" />
            <h3>
              {filter === 'unread' 
                ? '새로운 알림이 없습니다' 
                : '알림이 없습니다'}
            </h3>
            <p>
              {filter === 'unread'
                ? '모든 알림을 확인했어요'
                : '아직 받은 알림이 없어요'}
            </p>
          </div>
        ) : (
          <div className="notifications-list">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div 
                  className="notification-icon"
                  style={{ backgroundColor: `${getNotificationColor(notification.type)}20` }}
                >
                  <div style={{ color: getNotificationColor(notification.type) }}>
                    {getNotificationIcon(notification.type, notification.icon)}
                  </div>
                </div>
                
                <div className="notification-content">
                  <div className="notification-header">
                    <h3 className="notification-title">{notification.title}</h3>
                    {!notification.isRead && <div className="unread-dot" />}
                  </div>
                  <p className="notification-message">{notification.message}</p>
                  <span className="notification-time">{formatTimestamp(notification.timestamp)}</span>
                </div>

                <button 
                  className="delete-btn"
                  onClick={(e) => deleteNotification(e, notification.id)}
                  aria-label="알림 삭제"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default NotificationsPage;
