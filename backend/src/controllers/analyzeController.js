const User = require('../models/User');
const Analysis = require('../models/Analysis');
const axios = require('axios');

// Hugging Face API için ayarlar
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
// DeepL API anahtarı (varsa)
const DEEPL_API_KEY = process.env.DEEPL_API_KEY || null;
// LibreTranslate API URL ve anahtarı (varsa)
const LIBRETRANSLATE_URL = process.env.LIBRETRANSLATE_URL || 'https://libretranslate.de';
const LIBRETRANSLATE_API_KEY = process.env.LIBRETRANSLATE_API_KEY || null;

// Ana duygu analizi modeli
const SENTIMENT_API_URL = "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment";
// Alternatif duygu analizi modeli
const ALTERNATIVE_SENTIMENT_URL = "https://api-inference.huggingface.co/models/nlptown/bert-base-multilingual-uncased-sentiment";

// Çoklu çeviri API'leri kullanarak çeviri yapma
async function translateText(text, sourceLang = 'tr', targetLang = 'en') {
  // API isimleri ve fonksiyonları listesi
  const translators = [
    { name: 'Google Translate', fn: (t) => googleTranslate(t, sourceLang, targetLang) },
    { name: 'DeepL', fn: (t) => deeplTranslate(t, sourceLang.toUpperCase(), targetLang.toUpperCase()) },
    { name: 'LibreTranslate', fn: (t) => libreTranslate(t, sourceLang, targetLang) }
  ];
  
  let lastError = null;
    // Her çeviriciyi sırayla dene
  for (const translator of translators) {
    try {
      console.log(`${translator.name} çeviri deneniyor... (${sourceLang} -> ${targetLang})`);
      const result = await translator.fn(text);
      
      // Sonuç geçerli mi kontrol et
      if (result && typeof result === 'string' && result.trim() !== '' && result !== text) {
        console.log(`${translator.name} başarılı çeviri: "${text.substring(0, 20)}${text.length > 20 ? '...' : ''}" -> "${result.substring(0, 20)}${result.length > 20 ? '...' : ''}"`);
        return result;
      }
      
      console.log(`${translator.name} çeviri sonucu geçersiz veya orijinal metinle aynı.`);
      
    } catch (error) {
      lastError = error;
      console.error(`${translator.name} çeviri hatası:`, error.message);
    }
  }
  
  // Tüm çeviriciler başarısız olursa
  if (lastError) {
    console.error("Tüm çeviri servisleri başarısız oldu:", lastError.message);
    throw new Error("Metin çevirilirken bir hata oluştu. Tüm çeviri servisleri başarısız.");
  }
  
  // Hiçbir çevirici çalışmazsa, orijinal metni döndür
  console.log("Hiçbir çeviri servisi çalışmadı, orijinal metin kullanılıyor.");
  return text;
}

// Google Translate API ile çeviri
async function googleTranslate(text, sourceLang = 'tr', targetLang = 'en') {
  try {
    // Çok kısa metinleri çevirme (opsiyonel)
    if (text.length <= 2) return text;
    
    const encodedText = encodeURIComponent(text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodedText}`;
    
    const response = await axios.get(url, { 
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      } 
    });
    
    let translatedText = '';
    if (response.data && response.data[0]) {
      response.data[0].forEach(item => {
        if (item[0]) {
          translatedText += item[0];
        }
      });
    }
    
    return translatedText;
  } catch (error) {
    console.error("Google Translate hatası:", error.message);
    throw error;
  }
}

// DeepL API ile çeviri
async function deeplTranslate(text, sourceLang = 'TR', targetLang = 'EN') {
  // DeepL API anahtarı yoksa hata fırlat
  if (!DEEPL_API_KEY) {
    throw new Error("DeepL API anahtarı tanımlanmamış");
  }
  
  try {
    const response = await axios.post(
      'https://api-free.deepl.com/v2/translate',
      new URLSearchParams({
        'auth_key': DEEPL_API_KEY,
        'text': text,
        'source_lang': sourceLang,
        'target_lang': targetLang
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 5000
      }
    );
    
    if (response.data && response.data.translations && response.data.translations.length > 0) {
      return response.data.translations[0].text;
    }
    
    throw new Error("DeepL yanıtı geçerli çeviri içermiyor");
    
  } catch (error) {
    console.error("DeepL çeviri hatası:", error.message);
    throw error;
  }
}

// LibreTranslate API ile çeviri
async function libreTranslate(text, sourceLang = 'tr', targetLang = 'en') {
  try {
    const payload = {
      q: text,
      source: sourceLang,
      target: targetLang,
      format: "text"
    };
    
    // API anahtarı varsa ekle
    if (LIBRETRANSLATE_API_KEY) {
      payload.api_key = LIBRETRANSLATE_API_KEY;
    }
    
    const response = await axios.post(
      `${LIBRETRANSLATE_URL}/translate`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );
    
    if (response.data && response.data.translatedText) {
      return response.data.translatedText;
    }
    
    throw new Error("LibreTranslate yanıtı geçerli çeviri içermiyor");
    
  } catch (error) {
    console.error("LibreTranslate hatası:", error.message);
    throw error;
  }
}

// Duygu analizi için fonksiyon
async function analyzeSentiment(text) {
  let lastError = null;
  
  // Ana model ile dene
  try {
    console.log('Ana duygu analizi modeli deneniyor:', SENTIMENT_API_URL);
    const response = await axios.post(
      SENTIMENT_API_URL,
      { inputs: text },
      {
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    if (response.data && Array.isArray(response.data[0])) {
      const result = {
        negative: 0,
        neutral: 0,
        positive: 0
      };
      
      response.data[0].forEach(item => {
        // Twitter RoBERTa model için etiketler: LABEL_0 (negative), LABEL_1 (neutral), LABEL_2 (positive)
        if (item.label === 'NEGATIVE' || item.label === 'LABEL_0') {
          result.negative = item.score;
        } else if (item.label === 'NEUTRAL' || item.label === 'LABEL_1') {
          result.neutral = item.score;
        } else if (item.label === 'POSITIVE' || item.label === 'LABEL_2') {
          result.positive = item.score;
        }
      });
      
      return result;
    }
    
  } catch (error) {
    console.error('Ana duygu analizi modeli hatası:', error.message);
    lastError = error;
    // Ana model başarısız olursa alternatif modeli dene
  }

  // Alternatif model ile dene
  try {
    console.log('Alternatif duygu analizi modeli deneniyor:', ALTERNATIVE_SENTIMENT_URL);
    
    const response = await axios.post(
      ALTERNATIVE_SENTIMENT_URL,
      { inputs: text },
      {
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    if (response.data && Array.isArray(response.data)) {
      const result = {
        negative: 0,
        neutral: 0,
        positive: 0
      };
      
      // BERT multi-lingual için etiketler yıldız bazlı (1-5 stars)
      response.data.forEach(item => {
        const label = item.label;
        if (label.includes('1 star') || label.includes('2 stars')) {
          result.negative = item.score;
        } else if (label.includes('3 stars')) {
          result.neutral = item.score;
        } else if (label.includes('4 stars') || label.includes('5 stars')) {
          result.positive = item.score;
        }
      });
      
      return result;
    }
  } catch (error) {
    console.error('Alternatif duygu analizi modeli hatası:', error.message);
    lastError = error;
  }
  
  // Tüm modeller başarısız olduysa hata fırlat
  throw new Error('Duygu analizi yapılırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
}

// API durumunu kontrol et
exports.checkStatus = async (req, res) => {
  const status = {
    sentiment: 'checking',
    translation: {
      google: 'checking',
      deepl: 'checking',
      libretranslate: 'checking'
    },
    message: 'API durumları kontrol ediliyor'
  };
  
  try {
    // Duygu analizi API durumu
    try {
      await axios.post(
        SENTIMENT_API_URL,
        { inputs: "Hello world" },
        {
          headers: {
            'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );
      status.sentiment = 'available';
    } catch (error) {
      console.error('Duygu analizi API durumu hatası:', error.message);
      status.sentiment = 'error';
    }
    
    // Google Translate durumu
    try {
      const googleResult = await googleTranslate("test");
      status.translation.google = googleResult ? 'available' : 'error';
    } catch (error) {
      console.error('Google Translate durumu hatası:', error.message);
      status.translation.google = 'error';
    }
    
    // DeepL durumu
    try {
      if (DEEPL_API_KEY) {
        const deeplResult = await deeplTranslate("test");
        status.translation.deepl = deeplResult ? 'available' : 'error';
      } else {
        status.translation.deepl = 'not_configured';
      }
    } catch (error) {
      console.error('DeepL durumu hatası:', error.message);
      status.translation.deepl = 'error';
    }
    
    // LibreTranslate durumu
    try {
      const libreResult = await libreTranslate("test");
      status.translation.libretranslate = libreResult ? 'available' : 'error';
    } catch (error) {
      console.error('LibreTranslate durumu hatası:', error.message);
      status.translation.libretranslate = 'error';
    }
    
    // En az bir çeviri servisi çalışıyorsa
    const anyTranslationAvailable = Object.values(status.translation).some(s => s === 'available');
    
    // Mesaj güncelle
    if (status.sentiment === 'available' && anyTranslationAvailable) {
      status.message = 'API servisleri çalışıyor';
    } else if (status.sentiment === 'available') {
      status.message = 'Duygu analizi çalışıyor, çeviri servisleri çalışmıyor';
    } else if (anyTranslationAvailable) {
      status.message = 'Çeviri servisleri çalışıyor, duygu analizi çalışmıyor';
    } else {
      status.message = 'API servislerinde sorun var';
    }
    
    return res.status(200).json(status);
  } catch (error) {
    console.error('Durum kontrolü hatası:', error);
    return res.status(500).json({
      sentiment: 'error',
      translation: {
        google: 'error',
        deepl: 'error',
        libretranslate: 'error'
      },
      message: 'API bağlantısı kontrol edilirken bir hata oluştu'
    });
  }
};

// Ana analiz controller fonksiyonu - Çeviri ve analiz
exports.analyzeText = async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.userId;

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ error: 'Geçerli bir metin girilmelidir' });
    }

    console.log(`Analiz isteği: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

    // Metin Türkçe ise İngilizce'ye çevir
    let textToAnalyze = text;
    let translatedText = '';
    
    try {
      // Basit bir Türkçe karakter kontrolü
      const hasTurkishChars = /[çğıöşüÇĞİÖŞÜ]/.test(text);
      if (hasTurkishChars || text.includes('ı') || text.includes('İ')) {
        translatedText = await translateText(text);
        if (translatedText && translatedText !== text) {
          textToAnalyze = translatedText;
        }
      }
    } catch (translateError) {
      console.error("Çeviri hatası, orijinal metin kullanılacak:", translateError.message);
      // Çeviri başarısız olursa orijinal metni kullan
      textToAnalyze = text;
    }    // Duygu analizi yap
    const sentiment = await analyzeSentiment(textToAnalyze);
    console.log('Duygu analizi sonucu:', sentiment);    // Analizi MongoDB'ye kaydet
    try {
      // Önce kullanıcıyı kontrol et
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      }
      
      // Duygu durumunu belirle
      const sentimentLabel = sentiment.positive > sentiment.negative && sentiment.positive > sentiment.neutral 
        ? 'POSITIVE' 
        : sentiment.negative > sentiment.positive && sentiment.negative > sentiment.neutral 
          ? 'NEGATIVE' 
          : 'NEUTRAL';
      
      // Analysis koleksiyonuna tam verilerle kaydet
      const newAnalysis = new Analysis({
        userId: userId,
        text: text,
        translatedText: translatedText, // Çevrilen metni de ekle
        language: 'auto', // Varsayılan olarak otomatik
        sentiment: {
          score: Math.max(sentiment.positive, sentiment.negative, sentiment.neutral),
          label: sentimentLabel,
          positive: sentiment.positive,
          negative: sentiment.negative,
          neutral: sentiment.neutral
        },
        recommendations: [] // İleriki sürümde duyguya göre öneriler eklenebilir
      });
      
      // MongoDB'ye kaydet
      await newAnalysis.save();
      console.log('Analiz MongoDB Analysis koleksiyonuna kaydedildi. ID:', newAnalysis._id);
      
      // Eğer duygu durumu NEGATİF ise, arkadaşlarına bildirim gönder
      if (sentimentLabel === 'NEGATIVE' && sentiment.negative > 0.6) { // Negatif duygu skoru yüksekse
        try {
          const Notification = require('../models/Notification');
          
          // Kullanıcının tüm arkadaşlarını bul
          const userWithFriends = await User.findById(userId).select('friends');
          
          if (userWithFriends && userWithFriends.friends.length > 0) {
            console.log(`${userWithFriends.friends.length} arkadaşa negatif duygu durumu bildirimi gönderiliyor`);
            
            // Her arkadaşa bildirim oluştur
            const notifications = userWithFriends.friends.map(friendId => {
              return {
                recipient: friendId,
                sender: userId,
                type: 'MOOD_NEGATIVE',
                extraData: { 
                  moodValue: sentiment.negative,
                  text: text.length > 50 ? text.substring(0, 50) + '...' : text 
                }
              };
            });
            
            // Bildirimleri toplu olarak kaydet
            await Notification.insertMany(notifications);
            console.log('Negatif duygu durumu bildirimleri gönderildi');
          }
        } catch (notifError) {
          console.error("Duygu durumu bildirimi gönderilirken hata oluştu:", notifError);
        }
      }
      
    } catch (dbError) {
      console.error("Veritabanı kayıt hatası:", dbError.message);
      // Veritabanı hatası olsa bile analiz sonucunu döndür
    }

    // Sonuçları sentiments dizisi olarak döndür
    const sentiments = [
      { label: 'Negatif', score: sentiment.negative },
      { label: 'Nötr', score: sentiment.neutral },
      { label: 'Pozitif', score: sentiment.positive }
    ];

    return res.status(200).json({
      text,
      translatedText, // Çevrilmiş metni frontend'e gönder
      sentiments
    });

  } catch (error) {
    console.error('Analiz işlemi hatası:', error);
    return res.status(500).json({
      error: error.message || 'Analiz işlemi sırasında bir hata oluştu'
    });
  }
};

// Kullanıcının analizlerini getir
exports.getUserAnalyses = async (req, res) => {
  try {
    const userId = req.userId || (req.user && req.user.id);

    if (!userId) {
      return res.status(401).json({ error: 'Kullanıcı kimliği bulunamadı' });
    }

    // Sadece Analysis modelinden kullanıcının analizlerini getir
    const analyses = await Analysis.find({ userId: userId }).sort({ createdAt: -1 });
    
    console.log(`${userId} kullanıcısının ${analyses.length} adet analizi MongoDB'den çekildi.`);

    return res.status(200).json(analyses);

  } catch (error) {
    console.error('Analizleri getirme hatası:', error);
    return res.status(500).json({
      error: error.message || 'Analizler getirilirken bir hata oluştu'
    });
  }
};

// Kullanıcının bir analizini sil
exports.deleteAnalysis = async (req, res) => {
  try {
    const userId = req.userId;
    const { analysisId } = req.params;

    console.log(`Silme isteği alındı - UserId: ${userId}, AnalysisId: ${analysisId}`);

    if (!userId) {
      console.error('Kullanıcı kimliği (userId) boş!');
      return res.status(401).json({ error: 'Kullanıcı kimliği bulunamadı' });
    }

    if (!analysisId) {
      console.error('Analiz ID parametresi boş!');
      return res.status(400).json({ error: 'Analiz ID\'si gerekli' });
    }

    console.log(`Analiz silme işlemi başlatılıyor - UserID: ${userId}, AnalysisID: ${analysisId}`);

    try {
      // Önce analizi bulalım (silmeden önce kontrol)
      const analysis = await Analysis.findOne({
        _id: analysisId,
        userId: userId
      });

      if (!analysis) {
        console.log(`Analiz bulunamadı veya erişim yok - AnalysisID: ${analysisId}, UserID: ${userId}`);
        return res.status(404).json({ error: 'Belirtilen analiz bulunamadı veya silme yetkiniz yok' });
      }

      console.log('Silme işlemi öncesi analiz bulundu:', analysis);
    } catch (findError) {
      console.error('Analiz arama hatası:', findError);
    }

    // Direkt olarak Analysis koleksiyonundan silme işlemi yap
    // ÖNEMLİ: Silme işleminde mutlaka userId kontrolü yapılmalı
    const deleteResult = await Analysis.deleteOne({
      _id: analysisId,
      userId: userId // Güvenlik için kullanıcı kimliği kontrolü
    });

    console.log('Silme işlemi sonucu:', deleteResult);

    if (deleteResult.deletedCount === 0) {
      console.error(`Silme başarısız - Silinecek kayıt bulunamadı. AnalysisID: ${analysisId}`);
      return res.status(404).json({ error: 'Belirtilen analiz bulunamadı veya silme yetkiniz yok' });
    }

    console.log(`Analiz başarıyla silindi - AnalysisID: ${analysisId}`);
    return res.status(200).json({ 
      message: 'Analiz başarıyla silindi',
      deletedAnalysisId: analysisId
    });

  } catch (error) {
    console.error('Analiz silme hatası:', error);
    return res.status(500).json({
      error: error.message || 'Analiz silinirken bir hata oluştu'
    });
  }
};

// Kullanıcının son haftalık analizlerinin günlük ortalamasını getir
exports.getWeeklyAnalysis = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Kullanıcı kimliği bulunamadı' });
    }

    // Son 7 gün için tarih hesapla
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Günün sonuna ayarla
    
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 6); // 7 gün (bugün dahil)
    lastWeek.setHours(0, 0, 0, 0); // Günün başına ayarla
    
    // Son 7 gündeki analizleri MongoDB'den direk getir
    const analyses = await Analysis.find({
      userId: userId,
      createdAt: { $gte: lastWeek, $lte: today }
    }).sort({ createdAt: 1 });
    
    console.log(`Son 7 gün için ${analyses.length} adet analiz bulundu.`);
    
    // Analiz sonuçlarını analiz et
    const weeklyAnalyses = analyses.map(analysis => {
      return {
        text: analysis.text,
        createdAt: analysis.createdAt,
        sentiment: {
          positive: analysis.sentiment.positive || 0,
          negative: analysis.sentiment.negative || 0,
          neutral: analysis.sentiment.neutral || 0
        }
      };
    });
    
    // Günlere göre grupla ve ortalama hesapla
    const dailyData = {};
    
    // Son 7 gün için boş günlük veri nesnesi oluştur
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD formatı
      dailyData[dateStr] = {
        date: dateStr,
        positive: 0,
        neutral: 0,
        negative: 0,
        average: 0, // Duygusal değer: positive=1, neutral=0, negative=-1
        count: 0
      };
    }

    // Analizleri günlere göre duygu puanlarını hesapla
    weeklyAnalyses.forEach(analysis => {
      try {
        // Analiz tarihini al ve gün formatına çevir
        const analysisDate = new Date(analysis.createdAt);
        const dateStr = analysisDate.toISOString().split('T')[0]; // YYYY-MM-DD formatı
          // Gün verisi mevcutsa (son 7 gün içindeyse)
        if (dailyData[dateStr]) {
          // Sentiment objesi direkt kullan (parse etmeden)
          const sentiment = analysis.sentiment;
          
          // Sentiment değerlerini ekle
          if (sentiment) {
            dailyData[dateStr].positive += sentiment.positive || 0;
            dailyData[dateStr].neutral += sentiment.neutral || 0;
            dailyData[dateStr].negative += sentiment.negative || 0;
            
            // Duygu puanı hesapla (-1 ile 1 arasında)
            // Pozitif=1, Nötr=0, Negatif=-1 değerlerinin ağırlıklı ortalaması
            const emotionValue = 
              (sentiment.positive * 1) + 
              (sentiment.neutral * 0) + 
              (sentiment.negative * -1);
              
            // Günlük ortalamaya ekle (daha sonra analiz sayısına bölünecek)
            dailyData[dateStr].average += emotionValue;
            dailyData[dateStr].count++;
          }
        }
      } catch (analysisError) {
        console.error("Analiz hesaplama hatası:", analysisError);
        // Hatalı analizi atla ve devam et
      }
    });
    
    // Günlük ortalamaları hesapla
    const result = Object.values(dailyData).map(day => {
      if (day.count > 0) {
        // Ortalama duygu değerini hesapla
        day.average = day.average / day.count;
        
        // Her duygu türü için ortalama hesapla
        day.positive = day.count > 0 ? day.positive / day.count : 0;
        day.neutral = day.count > 0 ? day.neutral / day.count : 0;
        day.negative = day.count > 0 ? day.negative / day.count : 0;
      }
      return day;
    });
      // Sonuçları tarihe göre sırala (en eskiden en yeniye)
    result.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Döndürmeden önce detaylı loglama yap
    console.log('Haftalık analiz sonuçları:');
    console.log('Toplam gün sayısı:', result.length);
    console.log('Örnek veri (ilk gün):', result[0]);
    
    // NaN, undefined veya null değerler var mı kontrol et
    const hasInvalidValue = result.some(day => {
      return isNaN(day.average) || 
             isNaN(day.positive) || 
             isNaN(day.negative) || 
             isNaN(day.neutral) ||
             day.average === undefined || 
             day.positive === undefined || 
             day.negative === undefined || 
             day.neutral === undefined;
    });
    
    if (hasInvalidValue) {
      console.warn('DİKKAT: Haftalık verilerde geçersiz değerler var!');
      
      // Geçersiz değerleri düzelt
      result.forEach(day => {
        if (isNaN(day.average) || day.average === undefined) day.average = 0;
        if (isNaN(day.positive) || day.positive === undefined) day.positive = 0;
        if (isNaN(day.negative) || day.negative === undefined) day.negative = 0;
        if (isNaN(day.neutral) || day.neutral === undefined) day.neutral = 0;
      });
      
      console.log('Düzeltilmiş veriler:', result);
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('Haftalık analiz getirme hatası:', error);
    return res.status(500).json({
      error: error.message || 'Haftalık analiz verileri getirilirken bir hata oluştu'
    });
  }
};

/**
 * @route GET /api/analysis/weekly/:friendId
 * @desc Bir arkadaşın haftalık analiz verilerini getir
 * @access Private
 */
exports.getFriendWeeklyAnalysis = async (req, res) => {
  try {
    const userId = req.userId; // İsteği yapan kullanıcının ID'si
    const friendId = req.params.friendId; // İstenen arkadaşın ID'si

    if (!userId) {
      return res.status(401).json({ error: 'Kullanıcı kimliği bulunamadı' });
    }

    if (!friendId) {
      return res.status(400).json({ error: 'Arkadaş kimliği gereklidir' });
    }

    // Öncelikle bu kullanıcının arkadaşlar listesinde olup olmadığını kontrol et
    const user = await User.findById(userId).select('friends');
    
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    // Arkadaşlık durumunu kontrol et
    const isFriend = user.friends.includes(friendId);
    
    if (!isFriend) {
      return res.status(403).json({ error: 'Bu kullanıcı sizin arkadaşınız değil' });
    }

    // Son 7 gün için tarih hesapla
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Günün sonuna ayarla
    
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 6); // 7 gün (bugün dahil)
    lastWeek.setHours(0, 0, 0, 0); // Günün başına ayarla
    
    // Arkadaşın son 7 gündeki analizlerini MongoDB'den getir
    const analyses = await Analysis.find({
      userId: friendId,
      createdAt: { $gte: lastWeek, $lte: today }
    }).sort({ createdAt: 1 });
    
    console.log(`Arkadaşın son 7 günü için ${analyses.length} adet analiz bulundu.`);
    
    // Analiz sonuçlarını analiz et
    const weeklyAnalyses = analyses.map(analysis => {
      return {
        text: analysis.text,
        createdAt: analysis.createdAt,
        sentiment: {
          positive: analysis.sentiment.positive || 0,
          negative: analysis.sentiment.negative || 0,
          neutral: analysis.sentiment.neutral || 0
        }
      };
    });
    
    // Günlere göre grupla ve ortalama hesapla
    const dailyData = {};
    
    // Son 7 gün için boş günlük veri nesnesi oluştur
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD formatı
      dailyData[dateStr] = {
        date: dateStr,
        positive: 0,
        neutral: 0,
        negative: 0,
        average: 0, // Duygusal değer: positive=1, neutral=0, negative=-1
        count: 0 // Bu gün için toplam analiz sayısı
      };
    }
    
    // Her analiz için günlük verileri topla
    weeklyAnalyses.forEach(analysis => {
      const dateStr = new Date(analysis.createdAt).toISOString().split('T')[0];
      
      // Bu tarih son 7 gün içinde mi kontrol et
      if (dailyData[dateStr]) {
        dailyData[dateStr].positive += analysis.sentiment.positive;
        dailyData[dateStr].neutral += analysis.sentiment.neutral;
        dailyData[dateStr].negative += analysis.sentiment.negative;
        dailyData[dateStr].count++;
      }
    });
    
    // Günlük ortalamaları hesapla
    const weeklyData = Object.values(dailyData).map(day => {
      if (day.count > 0) {
        day.positive /= day.count;
        day.neutral /= day.count;
        day.negative /= day.count;
        
        // Duygusal ortalama hesapla (1 pozitif, 0 nötr, -1 negatif)
        day.average = (day.positive - day.negative);
      }
      
      // Count alanını sonuçtan çıkar (frontend'e gerek yok)
      const { count, ...result } = day;
      return result;
    });
    
    // Tarihe göre sırala (eskiden yeniye)
    weeklyData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    res.json(weeklyData);
    
  } catch (error) {
    console.error('Arkadaş haftalık analiz getirme hatası:', error);
    return res.status(500).json({
      error: error.message || 'Arkadaşın haftalık analiz verileri getirilirken bir hata oluştu'
    });
  }
};