/* eslint-disable react/prop-types */
// FriendNotifications.jsx
import { useState, useEffect } from 'react';
import { UserPlus, Bell, Check, X, HeartPulse, HeartOff   } from 'lucide-react';
import { getFriendRequests, acceptFriendRequest, rejectFriendRequest } from '../services/friendService';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/notificationService';

const FriendNotifications = () => {
  const [friendRequests, setFriendRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Bildirimleri al (hem arkadaşlık istekleri hem de duygu durumu bildirimleri)
  const fetchAllNotifications = async () => {
    try {
      setLoading(true);
      // Arkadaşlık isteklerini al
      const requestsResponse = await getFriendRequests();
      setFriendRequests(requestsResponse.data.friendRequests || []);
      
      // Diğer bildirimleri al
      const notificationsResponse = await getNotifications();
      setNotifications(notificationsResponse.data.notifications || []);
    } catch (err) {
      console.error("Bildirimler alınamadı:", err);
      setError("Bildirimler yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Component mount olduğunda veya her 30 saniyede bir güncelle
  useEffect(() => {
    fetchAllNotifications();
    
    // 30 saniyede bir güncelle
    const interval = setInterval(fetchAllNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Dışarı tıklandığında menüyü kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.friends-notification-container')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  // İstek kabul edildiğinde
  const handleAcceptRequest = async (userId) => {
    try {
      setLoading(true);
      await acceptFriendRequest(userId);
      // Listeleri güncelle
      fetchAllNotifications();
    } catch (err) {
      console.error("İstek kabul edilirken hata:", err);
      setError("İstek kabul edilirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // İstek reddedildiğinde
  const handleRejectRequest = async (userId) => {
    try {
      setLoading(true);
      await rejectFriendRequest(userId);
      // Listeleri güncelle
      fetchAllNotifications();
    } catch (err) {
      console.error("İstek reddedilirken hata:", err);
      setError("İstek reddedilirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };
  
  // Bildirimi okundu olarak işaretle
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      // Bildirimleri güncelle
      fetchAllNotifications();
    } catch (err) {
      console.error("Bildirim işaretlenirken hata:", err);
    }
  };
  // Toplam bildirim sayısını hesapla
  const totalNotificationCount = friendRequests.length + notifications.filter(n => !n.read).length;
  // Profil resmi veya baş harfi gösterme
  const ProfileImage = ({ user }) => {
    if (user.profileImage) {
      return (
        <img 
          src={user.profileImage} 
          alt={user.username} 
          className="w-14 h-14 rounded-full object-cover"
        />
      );
    }
    
    return (
      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
        {user.username.charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <div className="friends-notification-container relative">
      <button 
        className={`relative p-2 rounded-full ${isOpen ? 'bg-blue-600' : 'hover:bg-blue-600/20'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell size={20} className={isOpen ? 'text-white' : ''} />
          {/* Bildirim sayısı - Arkadaşlık istekleri + Duygu durumu bildirimleri */}
        {totalNotificationCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {totalNotificationCount}
          </span>
        )}
      </button>      {/* Dropdown menu */}      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-md shadow-lg z-20 overflow-hidden">
          <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
            <h3 className="font-medium">Bildirimler</h3>
            {notifications.some(n => !n.read) && (
              <button 
                onClick={() => markAllNotificationsAsRead()}
                className="text-blue-600 hover:underline text-xs"
              >
                Tümünü Okundu İşaretle
              </button>
            )}
          </div>
            {loading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="p-4 text-red-600 text-sm text-center">{error}</div>
          ) : (totalNotificationCount === 0) ? (
            <div className="p-4 text-gray-500 text-sm text-center">
              Bildiriminiz bulunmuyor
            </div>
          ) : (            <div className="max-h-80 overflow-y-auto">
              {/* Arkadaşlık İstekleri */}
              {friendRequests.length > 0 && (
                <div className="border-b pt-1">
                  <p className="text-xs text-gray-500 px-3 py-1 bg-gray-50">Arkadaşlık İstekleri</p>
                  
                  {friendRequests.map(request => (
                    <div 
                      key={request._id} 
                      className="p-3 border-b hover:bg-gray-50 flex items-center justify-between"
                    >                      <div className="flex items-center gap-2">
                        <ProfileImage user={request} />
                        <div className="max-w-[60%]">
                          <p className="font-medium text-sm text-gray-900 truncate">{request.username}</p>
                          <p className="text-xs text-gray-500 truncate">{request.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleAcceptRequest(request._id)}
                          className="p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                          title="Kabul et"
                        >
                          <Check size={14} />
                        </button>
                        <button 
                          onClick={() => handleRejectRequest(request._id)}
                          className="p-1.5 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300"
                          title="Reddet"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
                {/* Duygu Durumu Bildirimleri */}
              {notifications.filter(n => n.type === 'MOOD_NEGATIVE' && !n.read).length > 0 && (
                <div className="border-b pt-1">
                  <p className="text-xs text-gray-500 px-3 py-1 bg-gray-50">Duygu Durumu Bildirimleri</p>
                  
                  {notifications
                    .filter(n => n.type === 'MOOD_NEGATIVE' && !n.read)
                    .map(notification => (                      <div 
                        key={notification._id} 
                        className="p-3 border-b hover:bg-gray-50 flex items-center justify-between bg-blue-50"
                      ><div className="flex items-center gap-2">
                          <div className="rounded-full p-2 bg-red-100 text-red-500">
                            <HeartPulse size={16} />
                          </div>
                          <div className="max-w-[60%]">  
                            <p className="font-medium text-sm text-gray-900">
                              <span className="font-semibold">{notification.sender?.username}</span>
                              <span> <HeartOff   className="inline mr-1 text-red-500" size={22}/> duygu durumu negatif</span>
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {new Date(notification.createdAt).toLocaleDateString('tr-TR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>
                        
                        {!notification.read && (
                          <button 
                            onClick={() => handleMarkAsRead(notification._id)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Okundu
                          </button>
                        )}
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          )}

          <a 
            href="/friends" 
            className="block p-3 bg-gray-50 text-center text-blue-600 hover:bg-gray-100 font-medium"
          >
            <div className="flex items-center justify-center gap-1">
              <UserPlus size={16} />
              <span>Arkadaş Ekle</span>
            </div>
          </a>
        </div>
      )}
    </div>
  );
};

export default FriendNotifications;
