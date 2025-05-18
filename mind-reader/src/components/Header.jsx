/* eslint-disable no-unused-vars */
// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, X, LogOut, User, Settings, Bell, Users, Check, X as XIcon, Home, History, Info, Brain } from 'lucide-react';
import { getFriendRequests, acceptFriendRequest, rejectFriendRequest } from '../services/friendService';
import { connectSocket, onSocketEvent, offSocketEvent } from '../services/socketService';
import { getUserInfo } from '../services/authService';
import { getToken, removeToken } from '../utils/tokenHelper';

// JWT tokenden ID almayla ilgili yardımcı fonksiyon
const getUserIdFromToken = () => {
  const token = getToken();
  
  if (!token) return null;
  
  try {
    // JWT token'ın ikinci kısmını (payload) decode et
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    
    return payload.id; // JWT token'daki kullanıcı ID'si
  } catch (error) {
    console.error('Token çözümlenirken hata:', error);
    return null;
  }
};

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState('');
  const [friendRequests, setFriendRequests] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
    // SessionStorage'ı dinleyen fonksiyon
  const loadUserFromSessionStorage = () => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // Eğer email varsa onu kullan, yoksa username kullan
        setUserEmail(user.email || user.username || 'Kullanıcı');
        // Profil fotoğrafını ayarla (eğer varsa)
        if (user.profileImage) {
          setProfileImage(user.profileImage);
        } else {
          setProfileImage(''); // Profil fotoğrafı yoksa temizle
        }
      } catch (error) {
        console.error('Kullanıcı bilgisi çözümlenirken hata:', error);
      }
    }
  };
  
  // Arkadaşlık isteklerini yükle
  const loadFriendRequests = async () => {
    try {
      const response = await getFriendRequests();
      if (response.data && response.data.friendRequests) {
        setFriendRequests(response.data.friendRequests);
      }
    } catch (error) {
      console.error('Arkadaşlık istekleri yüklenirken hata:', error);
    }
  };

  // WebSocket event handler
  const handleSocketFriendRequest = (data) => {
    console.log('Yeni arkadaşlık isteği bildirimi:', data);
    loadFriendRequests(); // Yeni bir istek geldiğinde istekleri yeniden yükle
  };  // Profil bilgilerini sunucudan yükle 
  const loadUserProfile = async () => {
    try {
      const response = await getUserInfo();
      if (response.data && response.data.user) {
        const user = response.data.user;
        setUserEmail(user.email || user.username || 'Kullanıcı');
        
        // Profil fotoğrafını API'den al
        if (user.profileImage) {
          setProfileImage(user.profileImage);
        } else {
          setProfileImage('');
        }
      }
    } catch (error) {
      console.error('Kullanıcı bilgisi yüklenirken hata:', error);
    }
  };

  // Bileşen yüklendiğinde kullanıcı bilgilerini yükle
  useEffect(() => {
    loadUserFromSessionStorage(); // İlk olarak sessionStorage'dan yükle
    loadUserProfile();            // Sonra API'den en güncel bilgileri al
    loadFriendRequests();
    
    // WebSocket bağlantısını kur
    const userId = getUserIdFromToken();
    if (userId) {
      connectSocket(userId);
      onSocketEvent('friendRequest', handleSocketFriendRequest);
    }
    
    // 1 dakikada bir arkadaşlık isteklerini kontrol et
    const interval = setInterval(loadFriendRequests, 60000);
    
    // Storage değişikliklerini dinle
    window.addEventListener('storage', loadUserFromSessionStorage);
    
    // Component unmount olduğunda event listener'ları kaldır
    return () => {
      window.removeEventListener('storage', loadUserFromSessionStorage);
      if (userId) {
        offSocketEvent('friendRequest', handleSocketFriendRequest);
      }
      clearInterval(interval);
    };
  }, []);  // Çıkış yap
  const handleLogout = () => {
    removeToken();
    sessionStorage.removeItem('user');
    navigate('/login');
  };
  
  // Arkadaşlık isteğini kabul et
  const handleAcceptRequest = async (requestId) => {
    if (isProcessing) return; // İşlem devam ediyorsa çıkış yap
    
    setIsProcessing(true);
    try {
      await acceptFriendRequest(requestId);
      // Kullanıcı arayüzünü güncelle - isteği kabul edilenler listesinden kaldır
      setFriendRequests(prev => prev.filter(request => request._id !== requestId));
    } catch (error) {
      console.error('Arkadaşlık isteği kabul edilirken hata:', error);
      alert('İstek kabul edilirken bir hata oluştu.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Arkadaşlık isteğini reddet
  const handleRejectRequest = async (requestId) => {
    if (isProcessing) return; // İşlem devam ediyorsa çıkış yap
    
    setIsProcessing(true);
    try {
      await rejectFriendRequest(requestId);
      // Kullanıcı arayüzünü güncelle - reddedilen isteği listeden kaldır
      setFriendRequests(prev => prev.filter(request => request._id !== requestId));
    } catch (error) {
      console.error('Arkadaşlık isteği reddedilirken hata:', error);
      alert('İstek reddedilirken bir hata oluştu.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Kullanıcı adının baş harfini al (avatar için)
  const getInitial = () => {
    if (!userEmail) return '?';
    return userEmail.charAt(0).toUpperCase();
  };

  return (
    <header className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo ve uygulama adı */}          <div className="flex items-center">
            <span className="text-2xl font-bold">Mind Reader</span>
            <span className="ml-2 text-sm bg-blue-700 rounded-full px-2">💭</span>
          </div>          {/* Masaüstü menü */}          <nav className="hidden md:flex space-x-6">
            <Link to="/home" className="hover:text-blue-200 font-medium flex items-center">
              <Home size={16} className="mr-1.5" /> Ana Sayfa
            </Link>
            <Link to="/friends" className="hover:text-blue-200 font-medium flex items-center">
              <Users size={16} className="mr-1.5" /> Arkadaşlar
              {friendRequests.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
                  {friendRequests.length}
                </span>
              )}
            </Link>
            <Link to="/history" className="hover:text-blue-200 font-medium flex items-center">
              <History size={16} className="mr-1.5" /> Geçmiş Analizler
            </Link>
            <Link to="/about" className="hover:text-blue-200 font-medium flex items-center">
              <Info size={16} className="mr-1.5" /> Hakkında
            </Link>
          </nav>{/* Kullanıcı Profili */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Bildirim Butonu */}
            <div className="relative">              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300 relative transition-all duration-200 flex items-center justify-center w-10 h-10"
                title="Bildirimler"
              >
                <Bell size={18} />
                {friendRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full border-2 border-white">
                    {friendRequests.length}
                  </span>
                )}
              </button>
                {/* Bildirimler Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg py-1 z-10 text-gray-800">
                  <div className="px-4 py-2 font-medium border-b border-gray-200">Bildirimler</div>
                  
                  {friendRequests.length > 0 ? (
                    <>
                      {friendRequests.map(request => (
                        <div key={request._id} className="px-4 py-2 hover:bg-gray-50 border-b border-gray-100">
                          <div className="flex items-center">
                            {request.profileImage ? (
                              <img 
                                src={request.profileImage} 
                                alt="Profil" 
                                className="w-8 h-8 rounded-full mr-2"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                                <span className="text-blue-600 font-medium">
                                  {(request.email || '?').charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {request.email}
                              </p>
                              <p className="text-xs text-gray-500">arkadaşlık isteği gönderdi</p>                            </div>
                            <div className="flex space-x-2 ml-auto">
                              <button 
                                onClick={() => handleAcceptRequest(request._id)}
                                disabled={isProcessing}
                                className="p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-sm transition-all duration-200 flex items-center justify-center w-8 h-8"
                                title="Kabul Et"
                              >
                                <Check size={16} />
                              </button>
                              <button 
                                onClick={() => handleRejectRequest(request._id)}
                                disabled={isProcessing}
                                className="p-1.5 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 shadow-sm transition-all duration-200 flex items-center justify-center w-8 h-8"
                                title="Reddet"
                              >
                                <XIcon size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      Bildirim bulunmuyor
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="text-sm">{userEmail}</div>
            <div className="relative group">
              <button 
                className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-500 focus:ring-white"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {profileImage ? (
                  <img src={profileImage} alt="Profil" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-blue-700 flex items-center justify-center">
                    <span className="font-semibold text-white">{getInitial()}</span>
                  </div>
                )}
              </button>
                {/* Dropdown menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 text-gray-800">
                  <Link to="/profile" className="px-4 py-2 text-sm hover:bg-gray-100 flex items-center">
                    <User className="w-4 h-4 mr-2" /> Profil
                  </Link>
                  <Link to="/settings" className="px-4 py-2 text-sm hover:bg-gray-100 flex items-center">
                    <Settings className="w-4 h-4 mr-2" /> Ayarlar
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          </div>          {/* Mobil menü butonu */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-gray-200 focus:outline-none"
            >
              {profileImage ? (
                <img src={profileImage} alt="Profil" className="w-8 h-8 rounded-full object-cover border-2 border-white" />
              ) : (
                isMenuOpen ? 
                <X className="block h-6 w-6" /> : 
                <div className="w-8 h-8 bg-blue-700 flex items-center justify-center rounded-full border-2 border-white">
                  <span className="font-semibold text-white">{getInitial()}</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>      {/* Mobil menü */}      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/home" className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600">
              <Home size={16} className="mr-2" /> Ana Sayfa
            </Link>
            <Link to="/friends" className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600">
              <Users size={16} className="mr-2" /> Arkadaşlar
              {friendRequests.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
                  {friendRequests.length}
                </span>
              )}
            </Link>
            <Link to="/history" className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600">
              <History size={16} className="mr-2" /> Geçmiş Analizler
            </Link>
            <Link to="/about" className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600">
              <Info size={16} className="mr-2" /> Hakkında
            </Link>
          </div>
            <div className="pt-4 pb-3 border-t border-blue-400">
            <div className="flex items-center px-5">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                {profileImage ? (
                  <img src={profileImage} alt="Profil" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-blue-700 flex items-center justify-center">
                    <span className="font-semibold text-white">{getInitial()}</span>
                  </div>
                )}
              </div>
              <div className="ml-3">
                <div className="text-base font-medium">{userEmail}</div>
              </div>
            </div><div className="mt-3 px-2 space-y-1">
              <Link to="/profile" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 flex items-center">
                <User className="w-4 h-4 mr-2" /> Profil
              </Link>
              <Link to="/settings" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 flex items-center">
                <Settings className="w-4 h-4 mr-2" /> Ayarlar
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 flex items-center"
              >
                <LogOut className="w-4 h-4 mr-2" /> Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;