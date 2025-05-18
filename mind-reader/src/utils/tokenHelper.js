// tokenHelper.js
/**
 * Token işlemleri için yardımcı fonksiyonlar
 */

// Token storage metodunu buradan yönetiyoruz. 
// Uygulamanın her yerinde tutarlı kullanım için.
export const getToken = () => {
  return sessionStorage.getItem('token');
};

export const setToken = (token) => {
  sessionStorage.setItem('token', token);
};

export const removeToken = () => {
  sessionStorage.removeItem('token');
};

/**
 * JWT token'dan kullanıcı ID'sini al
 * @returns {string|null} - Kullanıcı ID'si
 */
export const getUserIdFromToken = () => {
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
