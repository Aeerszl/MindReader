// Backend tarafındaki haftalık analiz verisini test etmek için bir script
const mongoose = require('mongoose');
require('dotenv').config();
const Analysis = require('./src/models/Analysis');
const User = require('./src/models/User');

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB bağlantısı başarılı');
    testWeeklyAnalysis();
  })
  .catch(err => {
    console.error('MongoDB bağlantı hatası:', err);
    process.exit(1);
  });

// Haftalık analiz fonksiyonunu test et
async function testWeeklyAnalysis() {
  try {
    // Rastgele bir kullanıcı seç
    const user = await User.findOne();
    
    if (!user) {
      console.log('Herhangi bir kullanıcı bulunamadı. Test tamamlanamıyor.');
      process.exit();
    }
    
    console.log(`Test için kullanıcı ID: ${user._id}`);
    
    // Son 7 gün için tarih hesapla
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Günün sonuna ayarla
    
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 6); // 7 gün (bugün dahil)
    lastWeek.setHours(0, 0, 0, 0); // Günün başına ayarla
    
    // Son 7 gündeki analizleri getir
    const analyses = await Analysis.find({
      userId: user._id,
      createdAt: { $gte: lastWeek, $lte: today }
    }).sort({ createdAt: 1 });
    
    console.log(`Son 7 gün için ${analyses.length} adet analiz bulundu.`);
    
    // İlk 3 analizi göster (varsa)
    const sampleSize = Math.min(analyses.length, 3);
    if (sampleSize > 0) {
      console.log(`İlk ${sampleSize} analiz örneği:`);
      for (let i = 0; i < sampleSize; i++) {
        console.log(`\nAnaliz ${i+1}:`);
        console.log('- Text:', analyses[i].text);
        console.log('- Date:', analyses[i].createdAt);
        console.log('- Sentiment:', analyses[i].sentiment);
      }
    }
    
    // Analiz sonuçlarını hazırla
    const weeklyAnalyses = analyses.map(analysis => {
      return {
        text: analysis.text,
        createdAt: analysis.createdAt,
        sentiment: analysis.sentiment
      };
    });
    
    // Günlere göre grupla
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
        average: 0,
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
          // Sentiment değerleri
          const sentiment = analysis.sentiment;
          
          if (sentiment) {
            dailyData[dateStr].positive += sentiment.positive || 0;
            dailyData[dateStr].neutral += sentiment.neutral || 0;
            dailyData[dateStr].negative += sentiment.negative || 0;
            
            // Duygu puanı hesapla (-1 ile 1 arasında)
            const emotionValue = 
              (sentiment.positive * 1) + 
              (sentiment.neutral * 0) + 
              (sentiment.negative * -1);
              
            dailyData[dateStr].average += emotionValue;
            dailyData[dateStr].count++;
          }
        }
      } catch (analysisError) {
        console.error("Analiz hesaplama hatası:", analysisError);
      }
    });
    
    // Günlük ortalamaları hesapla
    const result = Object.values(dailyData).map(day => {
      if (day.count > 0) {
        day.average = day.average / day.count;
        day.positive = day.positive / day.count;
        day.neutral = day.neutral / day.count;
        day.negative = day.negative / day.count;
      }
      return day;
    });
    
    // Sonuçları tarihe göre sırala
    result.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    console.log('\n--- Haftalık Analiz Sonuçları ---');
    console.log(JSON.stringify(result, null, 2));
    
    // Geçersiz değerleri kontrol et
    const hasInvalidValue = result.some(day => {
      return isNaN(day.average) || 
             isNaN(day.positive) || 
             isNaN(day.negative) || 
             isNaN(day.neutral);
    });
    
    if (hasInvalidValue) {
      console.warn('\n⚠️ DİKKAT: Haftalık verilerde geçersiz değerler var!');
    } else {
      console.log('\n✅ Tüm haftalık veriler geçerli.');
    }
    
  } catch (error) {
    console.error('Test sırasında hata:', error);
  } finally {
    mongoose.disconnect();
  }
}
