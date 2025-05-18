//History.jsx
import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Trash2 } from 'lucide-react';
import { getWeeklyAnalysis, getUserAnalyses, deleteAnalysis } from '../services/analysisService';
import { getToken } from '../utils/tokenHelper';

// Chart.js bileşenlerini kaydet
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const History = () => {
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);  // Analizi silme fonksiyonu  // Analizi silme fonksiyonu
  const handleDeleteAnalysis = (analysisId) => {
    if (!analysisId || isDeleting) return;
    
    setIsDeleting(true);
    console.log('Silme işlemi başlatılıyor, analysisId:', analysisId);
    
    // Promise kullanarak async/await olmadan çalışalım
    deleteAnalysis(analysisId)
      .then(deleteResult => {
        console.log('Silme işlemi yanıtı:', deleteResult);
        
        // Silinen analizi listeden kaldır
        setRecentAnalyses(recentAnalyses.filter(analysis => analysis._id !== analysisId));
        console.log('Analiz listesi güncellendi');
        
        // Haftalık analiz verilerini güncelle
        return getWeeklyAnalysis();
      })
      .then(weeklyResponse => {
        if (weeklyResponse && weeklyResponse.data) {
          if (Array.isArray(weeklyResponse.data)) {
            setWeeklyData(weeklyResponse.data);
          } else if (weeklyResponse.data.weeklyData) {
            setWeeklyData(weeklyResponse.data.weeklyData);
          }
          console.log('Haftalık analiz verileri güncellendi');
        }
      })
      .catch(error => {
        console.error('Analiz silinirken hata oluştu:', error);
        
        if (error.response) {
          // Sunucu yanıt verdi ama başarılı olmadı (400, 401, 500 vb.)
          console.error('Sunucu yanıtı:', error.response.status, error.response.data);
        } else if (error.request) {
          // Sunucuya istek gitti ama yanıt gelmedi
          console.error('Sunucudan yanıt alınamadı:', error.request);
        } else {
          // İstek oluşturulurken hata oldu
          console.error('İstek hatası:', error.message);
        }
      })
      .finally(() => {
        setIsDeleting(false);
      });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("Veri çekme başlıyor...");
          // Token kontrolü
        const token = getToken();
        console.log("Token durumu:", token ? "Token var" : "Token yok!");// Haftalık analiz verisini al - basitleştirilmiş
        console.log("Haftalık analiz verileri isteniyor...");
        const weeklyResponse = await getWeeklyAnalysis();
        
        if (weeklyResponse && weeklyResponse.data) {
          console.log("Haftalık analiz verileri:", weeklyResponse.data);
          
          if (Array.isArray(weeklyResponse.data)) {
            setWeeklyData(weeklyResponse.data);
          } else if (weeklyResponse.data.weeklyData) {
            setWeeklyData(weeklyResponse.data.weeklyData);
          } else {
            setWeeklyData([]);
          }
        } else {
          console.warn("Haftalık analiz verileri boş veya hatalı");
          setWeeklyData([]);
        }
          // Tüm son analizleri al (kısıtlama olmadan)
        console.log("Kullanıcı analizleri isteniyor...");
        const analysesResponse = await getUserAnalyses();
        console.log("Kullanıcı analizleri yanıtı:", analysesResponse);
        
        if (analysesResponse && analysesResponse.data) {
          console.log("Bulunan analiz sayısı:", analysesResponse.data.length);
          setRecentAnalyses(analysesResponse.data); // Tüm analizleri gösterelim, slice kaldırıldı
        } else {
          console.warn("Kullanıcı analizleri boş veya hatalı");
        }
        
      } catch (err) {
        console.error('Veri alınırken hata:', err);
        
        if (err.response) {
          console.error('Sunucu yanıtı:', err.response.status, err.response.data);
        } else if (err.request) {
          console.error('Sunucudan yanıt alınamadı:', err.request);        } else {
          console.error('Hata detayı:', err.message);
        }
    
        setError('Veriler alınırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };

    // Sayfa yüklendiğinde veri çekme fonksiyonunu çağır
    fetchData();
  }, []); // Boş dependency array, sadece component mount olduğunda çalışır
  
  // Türkçe ay isimleri
  const turkishMonths = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                         'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  
  // Günleri formatla: (YYYY-MM-DD) -> "5 Mayıs"
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = turkishMonths[date.getMonth()];
    return `${day} ${month}`;
  };  // Chart.js için veri hazırlama - basit yaklaşım
  console.log("Haftalık veri:", weeklyData);
  
  // Backend'den gelen veriyi basit bir şekilde kullan
  const safeWeeklyData = weeklyData && weeklyData.length > 0 ? weeklyData : [{
    date: new Date().toISOString().split('T')[0],
    average: 0,
    positive: 0,
    negative: 0,
    neutral: 0,
    count: 0
  }];
  console.log("Grafik için veri:", safeWeeklyData);
  
  // Basit, daha anlaşılır bir yaklaşım
  const chartData = {
    labels: safeWeeklyData.map(item => formatDate(item.date)),
    datasets: [
      {
        label: 'Günlük Duygu Değeri',
        data: safeWeeklyData.map(item => item.average),
        fill: 'origin',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        tension: 0.4,
        pointBackgroundColor: safeWeeklyData.map(item => {
          // Duygu değerine göre nokta rengi
          if (item.average > 0.2) return 'rgba(75, 192, 120, 1)'; // yeşil (pozitif)
          if (item.average < -0.2) return 'rgba(255, 99, 132, 1)'; // kırmızı (negatif)
          return 'rgba(53, 162, 235, 1)'; // mavi (nötr)
        }),
        pointBorderColor: '#fff',
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ]
  };
    const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: -1,
        max: 1,
        ticks: {
          callback: function(value) {
            if (value === 1) return 'Pozitif';
            if (value === 0) return 'Nötr';
            if (value === -1) return 'Negatif';
            return '';
          },
          font: {
            size: 12
          },
          color: 'rgba(0, 0, 0, 0.6)'
        },
        grid: {
          color: (context) => {
            if (context.tick.value === 0) {
              return 'rgba(0, 0, 0, 0.2)';
            }
            return 'rgba(0, 0, 0, 0.1)';
          }
        }
      },
      x: {
        ticks: {
          font: {
            size: 12
          },
          color: 'rgba(0, 0, 0, 0.6)'
        },
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleFont: {
          size: 13
        },
        bodyFont: {
          size: 12
        },
        callbacks: {
          label: function(context) {
            let value = context.raw;
            let sentiment = 'Nötr';
            if (value > 0.2) sentiment = 'Pozitif';
            if (value < -0.2) sentiment = 'Negatif';
            return `Duygu Değeri: ${value.toFixed(2)} (${sentiment})`;
          }
        }
      }
    },
    layout: {
      padding: {
        top: 10
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    }
  };  // Duygu dağılımı için basit grafik verisi
  const emotionBarData = {
    labels: safeWeeklyData.map(item => formatDate(item.date)),
    datasets: [
      {
        label: 'Pozitif',
        data: safeWeeklyData.map(item => item.positive),
        backgroundColor: 'rgba(75, 192, 120, 0.7)'
      },
      {
        label: 'Nötr',
        data: safeWeeklyData.map(item => item.neutral),
        backgroundColor: 'rgba(53, 162, 235, 0.7)'
      },
      {
        label: 'Negatif',
        data: safeWeeklyData.map(item => item.negative),
        backgroundColor: 'rgba(255, 99, 132, 0.7)'
      }
    ]
  };
  // Duygu analizi rengini belirle
  const getSentimentColor = (sentiment) => {
    try {
      if (!sentiment) return 'bg-gray-200';
      
      // MongoDB'den gelen sentiment objesini kontrol et
      if (typeof sentiment === 'string') {
        // Eski format (JSON string)
        try {
          const parsedSentiment = JSON.parse(sentiment);
          const maxValue = Math.max(parsedSentiment.positive, parsedSentiment.neutral, parsedSentiment.negative);
          
          if (maxValue === parsedSentiment.positive) return 'bg-green-100 border-green-300';
          if (maxValue === parsedSentiment.negative) return 'bg-red-100 border-red-300';
          return 'bg-blue-100 border-blue-300';
        } catch (e) {
          console.error('JSON parse hatası:', e);
          return 'bg-gray-200';
        }
      } else {
        // Yeni format (MongoDB'den gelen doğrudan obje)
        if (sentiment.label === 'POSITIVE') return 'bg-green-100 border-green-300';
        if (sentiment.label === 'NEGATIVE') return 'bg-red-100 border-red-300';
        if (sentiment.label === 'NEUTRAL') return 'bg-blue-100 border-blue-300';
        
        // Pozitif, negatif, nötr değerlerine göre karar ver
        if (sentiment.positive > sentiment.negative && sentiment.positive > sentiment.neutral) {
          return 'bg-green-100 border-green-300';
        }
        if (sentiment.negative > sentiment.positive && sentiment.negative > sentiment.neutral) {
          return 'bg-red-100 border-red-300';
        }
        return 'bg-blue-100 border-blue-300';
      }
    } catch (e) {
      console.error('getSentimentColor hatası:', e);
      return 'bg-gray-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">Analiz Geçmişi</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">          {/* Haftalık Duygu Grafiği */}          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Haftalık Duygu Analizi</h2>
            {(!weeklyData || weeklyData.length === 0) ? (
              <div className="flex flex-col items-center justify-center h-64">
                <p className="text-gray-500 text-lg">Henüz yeterli analiz verisi bulunmamaktadır.</p>
                <p className="text-gray-400 mt-2">Daha fazla metin analizi yaparak grafiği zenginleştirebilirsiniz.</p>
              </div>
            ) : (
              <div className="h-80">
                <Line data={chartData} options={chartOptions} />
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <strong>Duygu Değeri:</strong> Bu grafik, son 7 günde yaptığınız analizlerin ortalama duygu değerini gösterir. 
                Pozitif (1), nötr (0) ve negatif (-1) arasında bir değer alır.
              </p>
            </div>
          </div>          {/* Son Analizler ve Duygu Dağılımı */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Son Analizler</h2>
              <span className="text-xs text-gray-500">{recentAnalyses.length} analiz</span>
            </div>
              {recentAnalyses.length === 0 ? (
              <p className="text-gray-500">Henüz bir analiz kaydınız bulunmamaktadır.</p>
            ) : (              <div className="space-y-3 h-[calc(3*5.5rem)] overflow-y-auto custom-scrollbar pr-2 relative">
                {recentAnalyses.length > 3 && (
                  <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                )}
                {recentAnalyses.map((analysis, index) => {
                  console.log('Analiz verisi:', analysis);
                  return (                  <div 
                    key={index} 
                    className={`border rounded-md p-3 relative h-20 flex flex-col justify-between ${getSentimentColor(analysis.sentiment)}`}
                  >
                    <button
                      onClick={() => {
                        if (!analysis._id) {
                          console.error('Bu analizin ID değeri bulunamadı:', analysis);
                          return;
                        }
                        console.log(`Silme işlemi başlatılıyor: ${analysis._id}`);
                        handleDeleteAnalysis(analysis._id);
                      }}
                      className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                      title="Analizi Sil"
                      aria-label="Analizi Sil"
                      disabled={isDeleting}
                    >
                      <Trash2 size={16} className={`${isDeleting ? 'text-gray-300' : 'text-gray-500 hover:text-red-500'}`} />
                    </button>
                    <div className="overflow-hidden">
                      <p className="font-medium pr-7 truncate">{analysis.text.length > 70 
                        ? analysis.text.substring(0, 70) + '...' 
                        : analysis.text}</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(analysis.createdAt).toLocaleString('tr-TR')}
                    </p>
                  </div>
                  );
                })}
              </div>            )}              {weeklyData && weeklyData.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h3 className="font-medium text-gray-700 mb-3">Haftalık Duygu Dağılımı</h3>
                <div className="h-60"><Bar
                    data={emotionBarData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          stacked: false,
                          beginAtZero: true,
                          max: 1,
                          ticks: {
                            callback: value => `${(value * 100).toFixed(0)}%`,
                            font: { size: 10 },
                            color: 'rgba(0, 0, 0, 0.6)'
                          },
                          grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                          }
                        },
                        x: {
                          stacked: false,
                          grid: {
                            display: false
                          },
                          ticks: {
                            font: { size: 10 },
                            color: 'rgba(0, 0, 0, 0.6)'
                          }
                        }
                      },
                      plugins: {
                        legend: {
                          position: 'top',
                          labels: {
                            boxWidth: 12,
                            usePointStyle: true,
                            pointStyle: 'rectRounded',
                            font: { size: 10 }
                          }
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          callbacks: {
                            label: function(context) {
                              let value = context.raw;
                              return `${context.dataset.label}: ${(value * 100).toFixed(0)}%`;
                            }
                          }
                        }
                      },
                      barThickness: 20,
                      animation: {
                        duration: 800,
                        easing: 'easeOutQuart'
                      }
                    }} 
                  />
                </div>
              </div>
            )}
          </div>
        </div>      )}
  
    </div>
  );
};

export default History;
