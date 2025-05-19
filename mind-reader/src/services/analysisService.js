// mind-reader\src\services\analysisService.js
import axios from "axios";
import { getToken } from "../utils/tokenHelper";

const API_URL = "http://localhost:5000/api";

// Haftalık duygu analizi verilerini getir
export const getWeeklyAnalysis = () => {
  const token = getToken();
  return axios.get(`${API_URL}/analysis/weekly`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

// Arkadaşın haftalık duygu analizi verilerini getir
export const getFriendWeeklyAnalysis = (friendId) => {
  const token = getToken();
  return axios.get(`${API_URL}/analysis/weekly/${friendId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

// Kullanıcının bütün analizlerini getir
export const getUserAnalyses = () => {
  const token = getToken();
  return axios.get(`${API_URL}/analysis`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

// Metin analizi yap
export const analyzeText = (text, language = 'auto') => {
  const token = getToken();
  return axios.post(`${API_URL}/analysis`, { text, language }, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

// API durumunu kontrol et
export const checkApiStatus = () => {
  const token = localStorage.getItem('token');
  return axios.get(`${API_URL}/analysis/status`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

// Belirli bir analizi sil
export const deleteAnalysis = (analysisId) => {
  if (!analysisId) {
    console.error('deleteAnalysis: analysisId parametresi gerekli');
    return Promise.reject(new Error('analysisId parametresi gerekli'));
  }
  
  const token = getToken(); // localStorage.getItem yerine getToken() kullan
  
  if (!token) {
    console.error('deleteAnalysis: Kimlik doğrulama token\'ı bulunamadı');
    return Promise.reject(new Error('Kimlik doğrulama token\'ı bulunamadı'));
  }
  
  console.log(`DELETE isteği gönderiliyor: ${API_URL}/analysis/${analysisId}`);
  
  return axios.delete(`${API_URL}/analysis/${analysisId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};
