// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, Settings } from 'lucide-react';
import { getUserInfo } from '../services/authService';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    // İlk olarak localStorage'dan bilgileri al (hızlı yükleme)
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // Use email if available, otherwise use username
        setUserEmail(user.email || user.username || 'Kullanıcı');
        if (user.profileImage) {
          setProfileImage(user.profileImage);
        }
      } catch (error) {
        console.error('Kullanıcı bilgisi çözümlenirken hata:', error);
      }
    }    // Ardından API'den en güncel bilgileri getir
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await getUserInfo();
        if (response && response.data && response.data.user) {
          const userData = response.data.user;
          
          // Kullanıcı bilgilerini güncelle
          setUserEmail(userData.email || userData.username || 'Kullanıcı');
          
          // Profil fotoğrafını güncelle
          if (userData.profileImage) {
            setProfileImage(userData.profileImage);
          }
          
          // Kullanıcı bilgilerini localStorage'da güncelle
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } catch (error) {
        console.error('Kullanıcı bilgisi alınırken hata:', error);
      }
    };
    
    fetchUserData();
  }, []);

  const handleLogout = () => {
    // Clear token and user info from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to login page
    navigate('/login');
  };

  // Get initial for avatar if no profile image
  const getInitial = () => {
    if (!userEmail) return '?';
    return userEmail.charAt(0).toUpperCase();
  };

  return (
    <header className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo and app name */}
          <div className="flex items-center">
            <span className="text-2xl font-bold">Mind Reader</span>
            <span className="ml-2 text-sm bg-blue-700 rounded-full px-2">💭</span>
          </div>

          {/* Desktop menu */}
          <nav className="hidden md:flex space-x-6">
            <a href="/home" className="hover:text-blue-200 font-medium">Ana Sayfa</a>
            <a href="/history" className="hover:text-blue-200 font-medium">Geçmiş Analizler</a>
            <a href="/about" className="hover:text-blue-200 font-medium">Hakkında</a>
          </nav>

          {/* User Profile */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-sm">{userEmail}</div>
            <div className="relative group">
              <button 
                className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-500 focus:ring-white overflow-hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-semibold">{getInitial()}</span>
                )}
              </button>
              
              {/* Dropdown menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 text-gray-800">
                  <a href="/profile" className="px-4 py-2 text-sm hover:bg-gray-100 flex items-center">
                    <User className="w-4 h-4 mr-2" /> Profil
                  </a>
                  <a href="/settings" className="px-4 py-2 text-sm hover:bg-gray-100 flex items-center">
                    <Settings className="w-4 h-4 mr-2" /> Ayarlar
                  </a>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-gray-200 focus:outline-none"
            >
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a href="/" className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600">Ana Sayfa</a>
            <a href="/history" className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600">Geçmiş Analizler</a>
            <a href="/about" className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600">Hakkında</a>
          </div>
          
          <div className="pt-4 pb-3 border-t border-blue-400">
            <div className="flex items-center px-5">
              <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center overflow-hidden">
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-semibold">{getInitial()}</span>
                )}
              </div>
              <div className="ml-3">
                <div className="text-base font-medium">{userEmail}</div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <a href="/profile" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 flex items-center">
                <User className="w-4 h-4 mr-2" /> Profil
              </a>
              <a href="/settings" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 flex items-center">
                <Settings className="w-4 h-4 mr-2" /> Ayarlar
              </a>
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