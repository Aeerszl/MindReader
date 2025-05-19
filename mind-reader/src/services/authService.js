//authService.js
import axios from "axios";
import { getToken } from "../utils/tokenHelper";

const API_URL = "http://localhost:5000/api/auth";
const USER_API_URL = "http://localhost:5000/api/user";

// Auth işlemleri
export const register = (userData) => axios.post(`${API_URL}/register`, userData);
export const login = (userData) => axios.post(`${API_URL}/login`, userData);

// Kullanıcı profil işlemleri
export const getUserInfo = () => {
  const token = getToken();
  return axios.get(`${USER_API_URL}/info`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const updateProfile = (userData) => {
  const token = getToken();
  return axios.put(`${USER_API_URL}/updateProfile`, userData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const changePassword = (passwordData) => {
  const token = getToken();
  return axios.post(`${API_URL}/change-password`, passwordData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const uploadProfilePicture = (formData) => {
  const token = getToken();
  return axios.post(`${USER_API_URL}/upload-profile-picture`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const getUserDetails = (userId) => {
  const token = getToken();
  return axios.get(`${USER_API_URL}/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};
