/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
//Home.jsx
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, Clock, History, RefreshCw, Shield, Globe, ChevronDown, Languages } from 'lucide-react';

const EmotionAnalysis = () => {
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [text, setText] = useState('');
  const [emotions, setEmotions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [translatedText, setTranslatedText] = useState('');
  const [apiStatus, setApiStatus] = useState({ translation: 'kontrol ediliyor...', sentiment: 'kontrol ediliyor...' });
  const [statusChecking, setStatusChecking] = useState(false);
  const [language, setLanguage] = useState('auto'); // Varsayılan olarak otomatik algılama
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false); // Dil menüsü durumu

  // Desteklenen diller
  const languages = [
    { code: 'auto', name: 'Otomatik Algıla', flag: '🌐' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'İngilizce', flag: '🇬🇧' }
  ];

  const apiBaseUrl = 'http://localhost:5000/api/analysis';
  const API_TIMEOUT = 60000; // 60 saniye

  // Token'ı localStorage'dan al
  const getAuthToken = () => localStorage.getItem('token');

  // Bileşen yüklendiğinde API durumunu kontrol et
  useEffect(() => {
    checkApiStatus();
  }, []);

  // Dil menüsü dışında bir yere tıklandığında menüyü kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageMenuOpen && !event.target.closest('.language-menu')) {
        setLanguageMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [languageMenuOpen]);
  
  const checkApiStatus = async () => {
    setStatusChecking(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${apiBaseUrl}/status`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Token'ı ekle
        }
      });
      if (response.ok) {
        const data = await response.json();
        setApiStatus(data); // API'den gelen veriyi set et
      } else {
        setApiStatus({ translation: 'bilinmiyor', sentiment: 'bilinmiyor' });
      }
    } catch (err) {
      console.error("API durum kontrolü hatası:", err);
      setApiStatus({ translation: 'bağlantı hatası', sentiment: 'bağlantı hatası' });
    } finally {
      setStatusChecking(false);
    }
  };
  const analyzeText = async () => {
    if (!text.trim()) {
      setError('Lütfen analiz edilecek bir metin giriniz.');
      return;
    }

    setLoading(true);
    setError(null);
    setEmotions(null);
    setTranslatedText('');

    // Zaman aşımını kontrol için
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError('İstek zaman aşımına uğradı. Sunucu yanıt vermiyor olabilir.');
      }
    }, API_TIMEOUT);

    try {
      const controller = new AbortController();
      const signal = controller.signal;
      
      // Timeout'tan 5 saniye önce isteği iptal et
      setTimeout(() => controller.abort(), API_TIMEOUT - 5000);

      const token = getAuthToken();      const response = await fetch(`${apiBaseUrl}`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          text: text,
          language: language // Seçilen dil bilgisini gönder
        }),
        signal: signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP hata! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("API yanıtı:", data);

      setTranslatedText(data.translatedText || '');

      // API'den gelen duygu verilerini işleme
      if (!data.sentiments || data.sentiments.length === 0) {
        throw new Error("Sonuçlar alınamadı, lütfen tekrar deneyin.");
      }

      const emotionData = data.sentiments.map(item => {
        let emotion = item.label;
        // Türkçe model veya İngilizce model etiketlerine uyum sağlama
        if (emotion === 'NEGATIVE' || emotion === 'LABEL_0' || emotion === '1 star' || emotion === '2 stars') 
          emotion = 'Negatif';
        else if (emotion === 'NEUTRAL' || emotion === 'LABEL_1' || emotion === '3 stars') 
          emotion = 'Nötr';
        else if (emotion === 'POSITIVE' || emotion === 'LABEL_2' || emotion === '4 stars' || emotion === '5 stars') 
          emotion = 'Pozitif';
        else 
          emotion = emotion || 'Belirsiz';

        return {
          emotion: emotion,
          score: parseFloat((item.score * 100).toFixed(1)),
        };
      });

      setEmotions(emotionData);

      const newAnalysis = {
        id: Date.now(),
        text: text,
        translatedText: data.translatedText || '',
        result: emotionData,
        timestamp: new Date().toLocaleString('tr-TR'),
      };

      setAnalysisHistory(prev => [newAnalysis, ...prev.slice(0, 9)]);
    } catch (err) {
      console.error("Analiz hatası:", err);
      clearTimeout(timeoutId);
      
      let errorMessage = err.message;
      
      // Abort controller hatası için özel mesaj
      if (err.name === 'AbortError') {
        errorMessage = 'İstek zaman aşımına uğradı. Lütfen daha sonra tekrar deneyiniz.';
      } else if (errorMessage.includes("Failed to fetch") || errorMessage.includes("Network Error")) {
        errorMessage = 'Sunucu bağlantısı kurulamadı. Lütfen internet bağlantınızı kontrol edin.';
        // API durumunu güncelle
        checkApiStatus();
      }
      
      setError("Analiz sırasında bir hata oluştu: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Yeniden analiz denemesi
  const retryAnalysis = () => {
    if (text.trim()) {
      analyzeText();
    }
  };

  // Seçilen dilin bilgilerini getir
  const getSelectedLanguage = () => {
    return languages.find(lang => lang.code === language) || languages[0];
  };

  // Enter tuşu ile analiz etme
  const handleKeyDown = (e) => {
    // Enter tuşuna basıldığında ve Shift tuşu basılı değilse analiz et
    if (e.key === 'Enter' && !e.shiftKey && !loading) {
      e.preventDefault(); // Varsayılan davranışı engelle (yeni satır ekleme)
      
      // Metin varsa analiz yap
      if (text.trim()) {
        analyzeText();
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Duygu Analizi Uygulaması</h1>
       <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Analiz edilecek metin:</label>
          
          {/* Dil seçici dropdown */}
          <div className="relative language-menu">
            <button 
              className="flex items-center text-sm bg-white border border-gray-300 rounded-md px-3 py-1.5 shadow-sm
                        hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
              aria-label="Dil seçimi"
              title="Metin dilini seçin"
            >
              <Globe className="w-4 h-4 mr-1.5 text-gray-500" />
              <span className="mr-1">{getSelectedLanguage().flag}</span>
              <span>{getSelectedLanguage().name}</span>
              <ChevronDown className="w-4 h-4 ml-1.5 text-gray-500" />
            </button>
            
            {languageMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-md shadow-lg z-10
                             border border-gray-200 py-1">
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    className={`flex items-center w-full text-left px-4 py-2 text-sm hover:bg-gray-100
                              ${language === lang.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                    onClick={() => {
                      setLanguage(lang.code);
                      setLanguageMenuOpen(false);
                    }}
                  >
                    <span className="mr-2 text-lg">{lang.flag}</span>
                    <span>{lang.name}</span>
                    {language === lang.code && (
                      <svg className="w-4 h-4 ml-auto text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <textarea
          className="w-full p-4 border rounded-lg shadow-sm min-h-[150px]"
          placeholder={language === 'tr' ? 'Nasıl hissettiğinizi buraya yazın...' : 
                       language === 'en' ? 'Write how you feel here...' : 
                       'Nasıl hissettiğinizi buraya yazın... / Write how you feel here...'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
          <div className="flex flex-wrap items-center gap-2 mt-4">
          <button
            className={`px-6 py-2 ${loading ? 'bg-gray-500' : 'bg-blue-600'} text-white rounded-lg hover:bg-blue-700 transition-colors duration-200`}
            onClick={analyzeText}
            disabled={loading}
          >
            {loading ? 'Analiz Ediliyor...' : 'Analiz Et'}
          </button>
          
         
          {error && (
            <button
              onClick={retryAnalysis}
              className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center hover:bg-green-700 transition-colors duration-200"
            >
              <RefreshCw className="w-4 h-4 mr-1" /> Yeniden Dene
            </button>
          )}
          
          <button
            onClick={checkApiStatus}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg flex items-center"
            disabled={statusChecking}
          >
            <Shield className="w-4 h-4 mr-1" /> {statusChecking ? 'Kontrol Ediliyor...' : 'API Durumu Kontrol Et'}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Hata</p>
              <p>{error}</p>
              <p className="text-sm mt-1">Eğer API hazır değilse, lütfen biraz bekleyin ve tekrar deneyin.</p>
            </div>
          </div>
        )}
        
        {loading && (
          <div className="mt-4 p-3 bg-blue-100 text-blue-700 rounded-lg">
            <p className="text-center">Analiz yapılıyor, lütfen bekleyin...</p>
            <div className="w-full bg-blue-200 rounded-full h-2.5 mt-2">
              <div className="animate-pulse bg-blue-600 h-2.5 rounded-full w-full"></div>
            </div>
          </div>
        )}
      </div>

      {emotions && (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h3 className="text-xl font-bold mb-4">Duygu Analizi Sonuçları</h3>
            {translatedText && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center mb-1">
                <p className="text-sm text-gray-700 font-medium">İngilizce çevirisi:</p>
                <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                  {getSelectedLanguage().flag} {getSelectedLanguage().code === 'auto' ? 'Otomatik Algılandı' : getSelectedLanguage().name}
                </span>
              </div>
              <p className="italic">&ldquo;{translatedText}&rdquo;</p>
            </div>
          )}
          
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emotions}>
                <XAxis dataKey="emotion" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Skor']} />
                <Bar dataKey="score" fill="#4F46E5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {analysisHistory.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">Son Analizler</h3>
          <div className="space-y-2">
            {analysisHistory.map(item => (
              <div key={item.id} className="p-3 bg-white rounded-lg shadow border">
                <div className="flex justify-between">
                  <p className="font-medium truncate max-w-xs">{item.text}</p>
                  <p className="text-sm text-gray-500">{item.timestamp}</p>
                </div>
                <div className="flex gap-2 mt-2">
                  {item.result.map((emotion, i) => (
                    <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {emotion.emotion}: {emotion.score}%
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-lg shadow">
          <History className="w-6 h-6 text-blue-600 mb-2" />
          <h4 className="font-bold">Geçmiş Analizler</h4>
          <p className="text-sm text-gray-600">Son analizlerinizi görüntüleyin</p>
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <Clock className="w-6 h-6 text-blue-600 mb-2" />
          <h4 className="font-bold">Zaman İçindeki Değişim</h4>
          <p className="text-sm text-gray-600">Duygularınızın değişimini takip edin</p>
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <AlertCircle className="w-6 h-6 text-blue-600 mb-2" />
          <h4 className="font-bold">Duygu Önerileri</h4>
          <p className="text-sm text-gray-600">Ruh halinizi iyileştirmek için öneriler alın</p>
        </div>
      </div>
    </div>
  );
};

export default EmotionAnalysis;