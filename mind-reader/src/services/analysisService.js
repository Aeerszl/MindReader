// Analiz servisi fonksiyonları
import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Haftalık duygu analizi verilerini getir
export const getWeeklyAnalysis = () => {
  const token = localStorage.getItem('token');
  return axios.get(`${API_URL}/analysis/weekly`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

// Kullanıcının bütün analizlerini getir
export const getUserAnalyses = () => {
  const token = localStorage.getItem('token');
  return axios.get(`${API_URL}/analysis`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

// Metin analizi yap
export const analyzeText = (text) => {
  const token = localStorage.getItem('token');
  return axios.post(`${API_URL}/analysis`, { text }, {
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
