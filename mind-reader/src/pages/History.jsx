// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from 'react';
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
import { getWeeklyAnalysis, getUserAnalyses } from '../services/analysisService';

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Haftalık analiz verisini al
        const weeklyResponse = await getWeeklyAnalysis();
        if (weeklyResponse && weeklyResponse.data) {
          setWeeklyData(weeklyResponse.data);
        }
        
        // Son analizleri al
        const analysesResponse = await getUserAnalyses();
        if (analysesResponse && analysesResponse.data) {
          // En son 5 analizi al
          setRecentAnalyses(analysesResponse.data.slice(0, 5));
        }
        
      } catch (err) {
        console.error('Veri alınırken hata:', err);
        setError('Veriler alınırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
  };
  
  // Chart.js için veri hazırlama
  const chartData = {
    labels: weeklyData.map(item => formatDate(item.date)),
    datasets: [
      {
        label: 'Günlük Duygu Değeri',
        data: weeklyData.map(item => Number(item.average.toFixed(2))),
        fill: 'origin',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        tension: 0.4,
        pointBackgroundColor: weeklyData.map(item => {
          // Pozitif değerler için yeşil, negatif değerler için kırmızı, nötr için mavi
          if (item.average > 0.2) return 'rgba(75, 192, 120, 1)'; // yeşil
          if (item.average < -0.2) return 'rgba(255, 99, 132, 1)'; // kırmızı
          return 'rgba(53, 162, 235, 1)'; // mavi
        }),
        pointBorderColor: '#fff',
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ]
  };
  
  const chartOptions = {
    responsive: true,
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
          }
        },
        grid: {
          color: (context) => {
            if (context.tick.value === 0) {
              return 'rgba(0, 0, 0, 0.2)';
            }
            return 'rgba(0, 0, 0, 0.1)';
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
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
  };

  // Duygu dağılımı için grafik verisi
  const emotionBarData = {
    labels: weeklyData.map(item => formatDate(item.date)),
    datasets: [
      {
        label: 'Pozitif',
        data: weeklyData.map(item => Number(item.positive.toFixed(2))),
        backgroundColor: 'rgba(75, 192, 120, 0.7)'
      },
      {
        label: 'Nötr',
        data: weeklyData.map(item => Number(item.neutral.toFixed(2))),
        backgroundColor: 'rgba(53, 162, 235, 0.7)'
      },
      {
        label: 'Negatif',
        data: weeklyData.map(item => Number(item.negative.toFixed(2))),
        backgroundColor: 'rgba(255, 99, 132, 0.7)'
      }
    ]
  };

  // Duygu analizi rengini belirle
  const getSentimentColor = (sentimentStr) => {
    try {
      if (!sentimentStr) return 'bg-gray-200';
      const sentiment = JSON.parse(sentimentStr);
      
      // En yüksek duygu değerini bul
      const maxValue = Math.max(sentiment.positive, sentiment.neutral, sentiment.negative);
      
      if (maxValue === sentiment.positive) return 'bg-green-100 border-green-300';
      if (maxValue === sentiment.negative) return 'bg-red-100 border-red-300';
      return 'bg-blue-100 border-blue-300';
    } catch (e) {
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Haftalık Duygu Grafiği */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Haftalık Duygu Analizi</h2>
            {weeklyData.length === 0 ? (
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
          </div>
          
          {/* Son Analizler ve Duygu Dağılımı */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Son Analizler</h2>
            
            {recentAnalyses.length === 0 ? (
              <p className="text-gray-500">Henüz bir analiz kaydınız bulunmamaktadır.</p>
            ) : (
              <div className="space-y-3">
                {recentAnalyses.map((analysis, index) => (
                  <div 
                    key={index} 
                    className={`border rounded-md p-3 ${getSentimentColor(analysis.sentiment)}`}
                  >
                    <p className="font-medium">{analysis.text.length > 70 
                      ? analysis.text.substring(0, 70) + '...' 
                      : analysis.text}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(analysis.createdAt).toLocaleString('tr-TR')}
                    </p>
                  </div>
                ))}
              </div>
            )}
            
            {weeklyData.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-700 mb-2">Duygu Dağılımı</h3>
                <div className="h-60">
                  <Bar 
                    data={emotionBarData} 
                    options={{
                      responsive: true,
                      scales: {
                        y: {
                          stacked: false,
                          beginAtZero: true,
                          max: 1
                        },
                        x: {
                          stacked: false
                        }
                      }
                    }} 
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
