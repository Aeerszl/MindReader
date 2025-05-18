// friendService.js
import axios from "axios";
import { getToken } from "../utils/tokenHelper";

const API_URL = "http://localhost:5000/api";

/**
 * Arkadaş listesini getir
 * @returns {Promise} Arkadaş listesi verisi
 */
export const getFriends = () => {
  const token = getToken();
  return axios.get(`${API_URL}/friends`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

/**
 * Gelen arkadaşlık isteklerini getir
 * @returns {Promise} Arkadaşlık istekleri verisi
 */
export const getFriendRequests = () => {
  const token = getToken();
  return axios.get(`${API_URL}/friends/requests`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

/**
 * Gönderilen arkadaşlık isteklerini getir
 * @returns {Promise} Gönderilen arkadaşlık istekleri verisi
 */
export const getSentRequests = () => {
  const token = getToken();
  return axios.get(`${API_URL}/friends/sent-requests`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

/**
 * Kullanıcı ara
 * @param {string} searchQuery - Arama sorgusu (kullanıcı adı veya e-posta)
 * @returns {Promise} Arama sonuçları
 */
export const searchUsers = (searchQuery) => {
  const token = getToken();
  return axios.get(`${API_URL}/friends/search/${searchQuery}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

/**
 * Arkadaşlık isteği gönder
 * @param {string} userId - İstek gönderilecek kullanıcı ID'si
 * @returns {Promise} İşlem sonucu
 */
export const sendFriendRequest = (userId) => {
  const token = getToken();
  return axios.post(`${API_URL}/friends/send-request/${userId}`, {}, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

/**
 * Arkadaşlık isteğini kabul et
 * @param {string} userId - İsteği gönderen kullanıcı ID'si
 * @returns {Promise} İşlem sonucu
 */
export const acceptFriendRequest = (userId) => {
  const token = getToken();
  return axios.post(`${API_URL}/friends/accept-request/${userId}`, {}, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

/**
 * Arkadaşlık isteğini reddet
 * @param {string} userId - İsteği gönderen kullanıcı ID'si
 * @returns {Promise} İşlem sonucu
 */
export const rejectFriendRequest = (userId) => {
  const token = getToken();
  return axios.post(`${API_URL}/friends/reject-request/${userId}`, {}, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

/**
 * Arkadaşı kaldır
 * @param {string} userId - Kaldırılacak arkadaşın ID'si
 * @returns {Promise} İşlem sonucu
 */
export const removeFriend = (userId) => {
  const token = getToken();
  return axios.delete(`${API_URL}/friends/remove/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

/**
 * Gönderilen arkadaşlık isteğini iptal et
 * @param {string} userId - İptal edilecek istek alıcısının ID'si
 * @returns {Promise} İşlem sonucu
 */
export const cancelFriendRequest = (userId) => {
  const token = getToken();
  return axios.delete(`${API_URL}/friends/cancel-request/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

/**
 * Arkadaş profilini getir
 * @param {string} friendId - Profili getirilecek arkadaşın ID'si
 * @returns {Promise} Arkadaş profil verisi
 */
export const getFriendProfile = (friendId) => {
  const token = getToken();
  return axios.get(`${API_URL}/friends/${friendId}/profile`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

/**
 * Arkadaş analiz verilerini getir
 * @param {string} friendId - Analiz verileri getirilecek arkadaşın ID'si
 * @returns {Promise} Arkadaş analiz verileri
 */
export const getFriendAnalytics = (friendId) => {
  const token = getToken();
  return axios.get(`${API_URL}/friends/${friendId}/analytics`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};
