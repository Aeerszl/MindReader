// eslint-disable-next-line no-unused-vars     
import React, { useState, useEffect } from 'react';
import { User, Camera, Save, Key, X } from 'lucide-react';
import { getUserInfo, updateProfile, changePassword } from '../services/authService';
import { getToken } from '../utils/tokenHelper';

const Profile = () => {
  const [user, setUser] = useState({
    email: '',
    username: '',
    joinDate: ''
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Local state'i önce localStorage'dan doldur (hızlı yükleme için)
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        setUser({
          email: parsedUser.email || '-',
          username: parsedUser.username || '-',
          joinDate: parsedUser.createdAt ? new Date(parsedUser.createdAt).toLocaleDateString('tr-TR') : '-'
        });
        
        // Profil fotoğrafını ayarla
        if (parsedUser.profileImage) {
          setPreviewImage(parsedUser.profileImage);
        }
      } catch (error) {
        console.error('Kullanıcı bilgisi çözümlenirken hata:', error);
      }
    }

    // API'den kullanıcı bilgilerini al
    const fetchUserInfo = async () => {
      try {
        const response = await getUserInfo();
        if (response && response.data && response.data.user) {
          const userData = response.data.user;
          setUser({
            email: userData.email || '-',
            username: userData.username || '-',
            joinDate: userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('tr-TR') : '-'
          });
          
          // Profil fotoğrafını ayarla
          if (userData.profileImage) {
            setPreviewImage(userData.profileImage);
          }
          
          // localStorage'ı güncelle
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } catch (error) {
        console.error('API\'den kullanıcı bilgisi alınırken hata:', error);
      }
    };    // Token varsa API çağrısı yap
    if (getToken()) {
      fetchUserInfo();
    }
  }, []);

  // Resim sıkıştırma fonksiyonu
  const compressImage = (src, quality, callback) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Eğer resim çok büyükse boyutunu küçült
      let width = img.width;
      let height = img.height;
      
      // Maksimum boyut 1200px
      const MAX_SIZE = 1200;
      if (width > height && width > MAX_SIZE) {
        height = Math.round((height * MAX_SIZE) / width);
        width = MAX_SIZE;
      } else if (height > MAX_SIZE) {
        width = Math.round((width * MAX_SIZE) / height);
        height = MAX_SIZE;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      // Sıkıştırılmış resmi döndür
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      callback(compressedDataUrl);
    };
    img.src = src;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Dosya boyutunu kontrol et (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('Dosya boyutu çok büyük! Lütfen 10MB\'dan küçük bir resim seçin.');
        return;
      }
      
      setSelectedFile(file);
      
      // Create a preview URL for the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        // Resmi optimize et (boyutlandır ve sıkıştır)
        compressImage(reader.result, 0.7, (compressedImage) => {
          setPreviewImage(compressedImage);
        });
      };
      reader.readAsDataURL(file);
    }
  };  const handleImageUpload = async () => {
    if (previewImage && selectedFile) {
      try {
        setLoading(true);
        
        // Base64 formatındaki resmi direkt API'ye gönder
        // API'ye profil fotoğrafı güncellemesini gönder
        const response = await updateProfile({ profileImage: previewImage });
          if (response && response.data && response.data.user) {
          // localStorage'ı güncelle
          localStorage.setItem('user', JSON.stringify(response.data.user));
          
          // Header bileşenini haberdar etmek için storage event'i tetikle
          window.dispatchEvent(new Event('storage'));
          
          // Başarı mesajı göster
          alert('Profil fotoğrafı başarıyla güncellendi.');
        }
      } catch (error) {
        console.error('Profil fotoğrafı güncellenirken hata:', error);
        alert('Profil fotoğrafı güncellenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    }
  };

  const removeProfileImage = async () => {
    try {
      setLoading(true);
      // API'ye profil fotoğrafı kaldırma isteği gönder
      const response = await updateProfile({ profileImage: null });
      
      if (response && response.data) {
        // UI'ı güncelle
        setPreviewImage(null);
        setSelectedFile(null);
          // LocalStorage'ı güncelle
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
          
          // Header bileşenini haberdar etmek için storage event'i tetikle
          window.dispatchEvent(new Event('storage'));
        }
        
        // Başarı mesajı göster
        alert('Profil fotoğrafı başarıyla kaldırıldı.');
      }
    } catch (error) {
      console.error('Profil fotoğrafı kaldırılırken hata:', error);
      alert('Profil fotoğrafı kaldırılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Şifre kontrolü
    if (!passwords.currentPassword) {
      setPasswordMessage({ text: 'Mevcut şifreyi giriniz', type: 'error' });
      return;
    }
    
    if (passwords.newPassword.length < 6) {
      setPasswordMessage({ text: 'Yeni şifre en az 6 karakter olmalıdır', type: 'error' });
      return;
    }
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordMessage({ text: 'Şifreler eşleşmiyor', type: 'error' });
      return;
    }
    
    setLoading(true);
    setPasswordMessage({ text: 'Şifre değiştiriliyor...', type: 'info' });
      try {
      // API'ye şifre değiştirme isteği gönder
      const response = await changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      
      if (response && response.data) {
        // Başarılı ise form alanlarını temizle
        setPasswordMessage({ text: 'Şifreniz başarıyla güncellendi!', type: 'success' });
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        console.log('Şifre başarıyla değiştirildi');
      }
    } catch (error) {
      console.error('Şifre değiştirme hatası:', error);
      
      // API'den gelen hata mesajını göster
      if (error.response && error.response.data && error.response.data.message) {
        setPasswordMessage({ 
          text: error.response.data.message, 
          type: 'error' 
        });
      } else {
        setPasswordMessage({ 
          text: 'Şifre değiştirilirken bir hata oluştu', 
          type: 'error' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Profil Sayfası</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Profil Bilgileri */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <div className="relative">
              {previewImage ? (
                <img 
                  src={previewImage} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
                />
              ) : (
                <div className="w-24 h-24 bg-blue-100 flex items-center justify-center rounded-full text-blue-600">
                  <User size={40} />
                </div>
              )}
              
              <label htmlFor="profile-image" className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                <Camera size={16} />
                <input 
                  type="file" 
                  id="profile-image" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </label>
              
              {previewImage && (
                <button 
                  onClick={removeProfileImage}
                  className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                  title="Profil fotoğrafını kaldır"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            
            <div className="ml-6">
              <h2 className="text-xl font-semibold">{user.username}</h2>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-gray-500 text-sm">Üyelik başlangıcı: {user.joinDate}</p>
              
              {selectedFile && previewImage && (
                <button
                  onClick={handleImageUpload}
                  className="mt-2 flex items-center text-sm px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Save size={14} className="mr-1" /> Fotoğrafı Kaydet
                </button>
              )}
            </div>
          </div>
          
          <div className="mt-4">
            <h3 className="font-semibold text-gray-700 mb-2">Hesap Bilgileri</h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-3 border-b pb-2">
                <span className="text-gray-500">Kullanıcı Adı</span>
                <div className="col-span-2 flex items-center">
                  <input
                    type="text"
                    className="border-b border-gray-300 bg-transparent py-1 font-medium focus:border-blue-500 focus:outline-none"
                    value={user.username}
                    onChange={(e) => setUser({...user, username: e.target.value})}
                    onBlur={async () => {
                      try {
                        setLoading(true);
                        // API'ye kullanıcı adını güncelle
                        const response = await updateProfile({ username: user.username });
                        if (response && response.data && response.data.user) {
                          // localStorage'ı güncelle
                          localStorage.setItem('user', JSON.stringify(response.data.user));
                          alert('Kullanıcı adı güncellendi');
                        }
                      } catch (error) {
                        console.error('Kullanıcı adı güncellenirken hata:', error);
                        alert('Kullanıcı adı güncellenirken bir hata oluştu');
                      } finally {
                        setLoading(false);
                      }
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 border-b pb-2">
                <span className="text-gray-500">E-posta</span>
                <span className="col-span-2 font-medium">{user.email}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-gray-500">Katılım Tarihi</span>
                <span className="col-span-2 font-medium">{user.joinDate}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Şifre Değiştirme */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <Key className="text-blue-600 mr-2" />
            <h3 className="font-semibold">Şifre Değiştir</h3>
          </div>
          
          <form onSubmit={handlePasswordChange}>
            {passwordMessage.text && (
              <div className={`p-3 mb-4 rounded ${
                passwordMessage.type === 'success' ? 'bg-green-100 text-green-700' : 
                passwordMessage.type === 'info' ? 'bg-blue-100 text-blue-700' : 
                'bg-red-100 text-red-700'
              }`}>
                {passwordMessage.text}
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-1">Mevcut Şifre</label>
              <input 
                type="password"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mevcut şifrenizi girin"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-1">Yeni Şifre</label>
              <input 
                type="password"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="En az 6 karakter"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-1">Şifre Tekrarı</label>
              <input 
                type="password"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Yeni şifrenizi tekrar girin"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
              />
            </div>
            
            <button 
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              {loading ? "İşlem yapılıyor..." : "Şifreyi Güncelle"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;