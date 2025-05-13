//authService.js
import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Auth endpoints
export const register = (userData) => axios.post(`${API_URL}/auth/register`, userData);
export const login = (userData) => axios.post(`${API_URL}/auth/login`, userData);

// User endpoints
export const getUserInfo = () => {
  const token = localStorage.getItem('token');
  return axios.get(`${API_URL}/user/info`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const updateProfile = (profileData) => {
  const token = localStorage.getItem('token');
  return axios.put(`${API_URL}/user/updateProfile`, profileData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const changePassword = (passwordData) => {
  const token = localStorage.getItem('token');
  return axios.post(`${API_URL}/auth/change-password`, passwordData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};
