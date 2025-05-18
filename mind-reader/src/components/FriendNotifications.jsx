/* eslint-disable react/prop-types */
// FriendNotifications.jsx
import { useState, useEffect } from 'react';
import { UserPlus, Bell, Check, X } from 'lucide-react';
import { getFriendRequests, acceptFriendRequest, rejectFriendRequest } from '../services/friendService';

const FriendNotifications = () => {
  const [friendRequests, setFriendRequests] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Friend requests'i al
  const fetchFriendRequests = async () => {
    try {
      setLoading(true);
      const response = await getFriendRequests();
      setFriendRequests(response.data.friendRequests || []);
    } catch (err) {
      console.error("Arkadaşlık istekleri alınamadı:", err);
      setError("İstekler yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Component mount olduğunda veya her 30 saniyede bir güncelle
  useEffect(() => {
    fetchFriendRequests();
    
    // 30 saniyede bir güncelle
    const interval = setInterval(fetchFriendRequests, 30000);
    
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
      fetchFriendRequests();
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
      fetchFriendRequests();
    } catch (err) {
      console.error("İstek reddedilirken hata:", err);
      setError("İstek reddedilirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Profil resmi veya baş harfi gösterme
  const ProfileImage = ({ user }) => {
    if (user.profileImage) {
      return (
        <img 
          src={user.profileImage} 
          alt={user.username} 
          className="w-8 h-8 rounded-full object-cover"
        />
      );
    }
    
    return (
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
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
        
        {/* Bildirim sayısı */}
        {friendRequests.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {friendRequests.length}
          </span>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-md shadow-lg z-20 overflow-hidden">
          <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
            <h3 className="font-medium">Arkadaşlık İstekleri</h3>
            <a href="/friends" className="text-blue-600 hover:underline text-sm">Tümünü Gör</a>
          </div>
          
          {loading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="p-4 text-red-600 text-sm text-center">{error}</div>
          ) : friendRequests.length === 0 ? (
            <div className="p-4 text-gray-500 text-sm text-center">
              Arkadaşlık isteğiniz bulunmuyor
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {friendRequests.map(request => (
                <div 
                  key={request._id} 
                  className="p-3 border-b hover:bg-gray-50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <ProfileImage user={request} />
                    <div className="truncate">
                      <p className="font-medium text-sm text-gray-900">{request.username}</p>
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
