// notificationService.js
import axios from "axios";
import { getToken } from "../utils/tokenHelper";

const API_URL = "http://localhost:5000/api";

/**
 * Kullanıcının bildirimlerini getir
 * @returns {Promise} Bildirim listesi
 */
export const getNotifications = () => {
  const token = getToken();
  return axios.get(`${API_URL}/notifications`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

/**
 * Bildirimi okundu olarak işaretle
 * @param {string} notificationId - Okundu işaretlenecek bildirimin ID'si
 * @returns {Promise} İşlem sonucu
 */
export const markNotificationAsRead = (notificationId) => {
  const token = getToken();
  return axios.post(`${API_URL}/notifications/read/${notificationId}`, {}, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

/**
 * Tüm bildirimleri okundu olarak işaretle
 * @returns {Promise} İşlem sonucu
 */
export const markAllNotificationsAsRead = () => {
  const token = getToken();
  return axios.post(`${API_URL}/notifications/read-all`, {}, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};