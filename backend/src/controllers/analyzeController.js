const User = require('../models/User');
const axios = require('axios');

// Hugging Face API için ayarlar
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
// Ana duygu analizi modeli
const SENTIMENT_API_URL = "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment";
// Alternatif duygu analizi modeli
const ALTERNATIVE_SENTIMENT_URL = "https://api-inference.huggingface.co/models/nlptown/bert-base-multilingual-uncased-sentiment";

// Google Translate API ile çeviri yapma
async function translateText(text) {
  try {
    // Google Translate API için temel URL
    const encodedText = encodeURIComponent(text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=tr&tl=en&dt=t&q=${encodedText}`;
    
    console.log("Çeviri yapılıyor...");
    const response = await axios.get(url);
    
    // Google Translate API yanıtını işleme
    let translatedText = '';
    if (response.data && response.data[0]) {
      response.data[0].forEach(item => {
        if (item[0]) {
          translatedText += item[0];
        }
      });
    }
    
    console.log(`Türkçe metin: "${text}" -> İngilizce çeviri: "${translatedText}"`);
    return translatedText;
  } catch (error) {
    console.error("Çeviri hatası:", error.message);
    throw new Error("Metin çevirilirken bir hata oluştu.");
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
        }
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
        }
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
  try {
    // Test amaçlı API durumunu kontrol et
    const testResponse = await axios.post(
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
    
    // Çeviri API'sini de kontrol et
    const translationTest = await translateText("Merhaba dünya");
    
    return res.status(200).json({
      sentiment: 'available',
      translation: 'available',
      message: 'API çalışıyor'
    });
  } catch (error) {
    console.error('Durum kontrolü hatası:', error);
    // Hatanın çeviri mi yoksa sentiment analizinden mi kaynaklandığını belirle
    const status = {
      sentiment: 'error',
      translation: 'error',
      message: 'API bağlantısında sorun olabilir'
    };
    
    if (error.message.includes('Çeviri')) {
      status.translation = 'error';
      status.sentiment = 'unknown';
    } else {
      status.sentiment = 'error';
      status.translation = 'unknown';
    }
    
    return res.status(200).json(status);
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
    
    // Basit bir Türkçe karakter kontrolü
    const hasTurkishChars = /[çğıöşüÇĞİÖŞÜ]/.test(text);
    if (hasTurkishChars || text.includes('ı') || text.includes('İ')) {
      translatedText = await translateText(text);
      textToAnalyze = translatedText;
    }

    // Duygu analizi yap
    const sentiment = await analyzeSentiment(textToAnalyze);
    console.log('Duygu analizi sonucu:', sentiment);

    // Kullanıcının analizler listesine ekle
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    user.analyses.push({
      text,
      translatedText,
      sentiment: JSON.stringify(sentiment),
      createdAt: new Date()
    });

    await user.save();

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

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    const sortedAnalyses = [...user.analyses].sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    return res.status(200).json(sortedAnalyses);

  } catch (error) {
    console.error('Analizleri getirme hatası:', error);
    return res.status(500).json({
      error: error.message || 'Analizler getirilirken bir hata oluştu'
    });
  }
};