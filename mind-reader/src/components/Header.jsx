/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { X, LogOut, User, Settings, Users, Home, History, Info } from 'lucide-react';
import { connectSocket, onSocketEvent, offSocketEvent } from '../services/socketService';
import { getUserInfo } from '../services/authService';
import { getToken, removeToken } from '../utils/tokenHelper';
import { getFriendRequests, acceptFriendRequest, rejectFriendRequest } from '../services/friendService';
import FriendNotifications from './FriendNotifications';

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
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState('');
  const [friendRequests, setFriendRequests] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // SessionStorage'ı dinleyen fonksiyon  
  const loadUserFromSessionStorage = () => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // Önce username kullan, yoksa email kullan
        setUserName(user.username || user.email || 'Kullanıcı');
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
  // Arkadaşlık isteklerini yükle fonksiyonu useCallback ile memoize ediyoruz
  const loadFriendRequests = useCallback(async () => {
    try {
      const response = await getFriendRequests();
      if (response.data && response.data.friendRequests) {
        setFriendRequests(response.data.friendRequests);
      }
    } catch (error) {
      console.error('Arkadaşlık istekleri yüklenirken hata:', error);
    }
  }, []);
  
  // WebSocket event handler - useCallback kullanarak gereksiz yeniden renderları önlüyoruz
  const handleSocketFriendRequest = useCallback((data) => {
    console.log('Yeni arkadaşlık isteği bildirimi:', data);
    loadFriendRequests(); // Yeni bir istek geldiğinde istekleri yeniden yükle
  }, [loadFriendRequests]);  // loadFriendRequests dependecy olarak eklendi
  
  // Profil bilgilerini sunucudan yükle 
  const loadUserProfile = async () => {
    try {
      const response = await getUserInfo();
      if (response.data && response.data.user) {
        const user = response.data.user;
        setUserName(user.username || user.email || 'Kullanıcı');
        
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
    window.addEventListener('storage', loadUserFromSessionStorage);    // Component unmount olduğunda event listener'ları kaldır
    return () => {
      window.removeEventListener('storage', loadUserFromSessionStorage);
      if (userId) {
        offSocketEvent('friendRequest', handleSocketFriendRequest);
      }
      clearInterval(interval);
    };
  }, [handleSocketFriendRequest, loadFriendRequests]);  // dependencies added
  
  // Çıkış yap
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
    if (!userName) return '?';
    return userName.charAt(0).toUpperCase();
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
          </nav>{/* Kullanıcı Profili */}          <div className="hidden md:flex items-center space-x-4">
            {/* Bildirim Butonu - FriendNotifications Komponenti */}
            <FriendNotifications />
              <div className="text-md mr-2">{userName}</div>
            <div className="relative group">
              <button 
                className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-500 focus:ring-white"
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
              </div>              <div className="">
                <div className="text-base font-medium">{userName}</div>
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