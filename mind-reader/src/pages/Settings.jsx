// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';

const Settings = () => {
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    language: 'tr',
    saveHistory: true
  });

  const handleToggle = (setting) => {
    setSettings({
      ...settings,
      [setting]: !settings[setting]
    });
  };

  const handleLanguageChange = (e) => {
    setSettings({
      ...settings,
      language: e.target.value
    });
  };

  const handleSave = () => {
    // Save settings to localStorage or backend
    localStorage.setItem('userSettings', JSON.stringify(settings));
    alert('Ayarlar kaydedildi!');
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Ayarlar</h1>
      
      <div className="space-y-6">
        {/* Notification Settings */}
        <div className="border-b border-gray-200 pb-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-700">Bildirimler</h2>
              <p className="text-sm text-gray-500">Bildirim tercihlerinizi yönetin.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.notifications}
                onChange={() => handleToggle('notifications')}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="border-b border-gray-200 pb-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-700">Karanlık Mod</h2>
              <p className="text-sm text-gray-500">Uygulama görünüm tercihini değiştir.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.darkMode}
                onChange={() => handleToggle('darkMode')}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Language Settings */}
        <div className="border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-lg font-medium text-gray-700 mb-2">Dil</h2>
            <p className="text-sm text-gray-500 mb-3">Uygulama dilini seçin.</p>
            <select 
              value={settings.language}
              onChange={handleLanguageChange}
              className="border border-gray-300 text-gray-700 rounded-lg block w-full p-2.5 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="tr">Türkçe</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        {/* History Settings */}
        <div className="border-b border-gray-200 pb-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-700">Analiz Geçmişi</h2>
              <p className="text-sm text-gray-500">Analizlerinizin kaydedilmesini istiyorsanız etkinleştirin.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.saveHistory}
                onChange={() => handleToggle('saveHistory')}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
        
        {/* Save Button */}
        <div className="flex justify-end">
          <button 
            onClick={handleSave}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
