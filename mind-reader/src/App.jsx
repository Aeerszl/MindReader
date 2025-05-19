/* eslint-disable no-unused-vars */
//App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import AuthenticatedRoute from './components/AuthenticatedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Friends from './pages/Friends';
import Profile from './pages/Profile';
import FriendProfile from './pages/FriendProfile';
import History from './pages/History';
import Settings from './pages/Settings';
import About from './pages/About';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes - no header/footer */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} /> 
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes with MainLayout (header/footer) */}
        <Route element={<AuthenticatedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/friend/:friendId" element={<FriendProfile />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/about" element={<About />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;