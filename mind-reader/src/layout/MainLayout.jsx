// eslint-disable-next-line no-unused-vars
import React from 'react';
import Header from '../components/Header';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="bg-gray-800 text-white text-center py-4 text-sm">
        <p>&copy; {new Date().getFullYear()} Mind Reader - Duygu Analizi Uygulaması</p>
      </footer>
    </div>
  );
};

export default MainLayout;