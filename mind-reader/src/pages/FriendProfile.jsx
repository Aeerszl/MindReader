// FriendProfile.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
import { getUserDetails } from '../services/authService';
import { getFriendWeeklyAnalysis } from '../services/analysisService';

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

const FriendProfile = () => {
  const { friendId } = useParams();
  const [friendData, setFriendData] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
  
  useEffect(() => {
    const fetchFriendData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Arkadaşın bilgilerini getir
        const userResponse = await getUserDetails(friendId);
        if (userResponse?.data) {
          setFriendData(userResponse.data);
        }

        // Arkadaşın haftalık analizini getir
        const weeklyResponse = await getFriendWeeklyAnalysis(friendId);
        if (weeklyResponse?.data) {
          if (Array.isArray(weeklyResponse.data)) {
            setWeeklyData(weeklyResponse.data);
          } else if (weeklyResponse.data.weeklyData) {
            setWeeklyData(weeklyResponse.data.weeklyData);
          }
        }
      } catch (err) {
        console.error("Arkadaş profili yüklenirken hata:", err);
        setError("Arkadaş profili yüklenirken bir hata oluştu. Lütfen tekrar deneyin.");
      } finally {
        setLoading(false);
      }
    };

    if (friendId) {
      fetchFriendData();
    }
  }, [friendId]);
  // Backend'den gelen veriyi basit bir şekilde kullan
  const safeWeeklyData = weeklyData && weeklyData.length > 0 ? weeklyData : [{
    date: new Date().toISOString().split('T')[0],
    average: 0,
    positive: 0,
    negative: 0,
    neutral: 0,
    count: 0
  }];
  
  // Ana duygu değeri grafiği için veri
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
  };
  
  // Duygu dağılımı bar grafiği için veri
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
  
  const emotionBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 1,
        ticks: {
          callback: function(value) {
            return `${value * 100}%`;
          }
        }
      }
    },
    plugins: {
      title: {
        display: true,
        text: 'Duygu Dağılımı'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${(context.raw * 100).toFixed(1)}%`;
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="text-center">
          <div className="spinner"></div>
          <p className="mt-4 text-gray-600">Arkadaş profili yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Profil Bilgileri - Geliştirilmiş Tasarım */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between">
          <div className="flex flex-col sm:flex-row items-center">
            <div className="w-36 h-36 rounded-full overflow-hidden mb-4 sm:mb-0 sm:mr-6 border-4 border-blue-100 shadow-md">
              <img 
                src={friendData?.profileImage || "/profile-placeholder.png"} 
                alt={`${friendData?.username}'s profile`} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-3xl font-bold text-gray-800">{friendData?.username}</h2>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-600 mt-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                </svg>
                <p>{friendData?.email}</p>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-500 mt-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                </svg>
                <p>Katılım: {new Date(friendData?.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 sm:mt-0 bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-800 text-sm uppercase">Duygu Durumu</h3>
            <div className="mt-2">
              {safeWeeklyData.length > 0 && (
                <div className="flex items-center">
                  {(() => {
                    const lastValue = safeWeeklyData[safeWeeklyData.length-1].average;
                    let color = "text-blue-500";
                    let mood = "Nötr";
                    let icon = (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 5.879a1 1 0 001.415 0 3 3 0 014.242 0 1 1 0 001.415-1.415 5 5 0 00-7.072 0 1 1 0 000 1.415z" clipRule="evenodd"></path>
                      </svg>
                    );
                    
                    if (lastValue > 0.2) {
                      color = "text-green-500";
                      mood = "Pozitif";
                      icon = (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd"></path>
                        </svg>
                      );
                    } else if (lastValue < -0.2) {
                      color = "text-red-500";
                      mood = "Negatif";
                      icon = (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 5.879a1 1 0 001.415 0 3 3 0 014.242 0 1 1 0 001.415-1.415 5 5 0 00-7.072 0 1 1 0 000 1.415z" clipRule="evenodd"></path>
                        </svg>
                      );
                    }
                    
                    return (
                      <>
                        <span className={`${color} mr-2`}>{icon}</span>
                        <span className={`font-bold ${color}`}>{mood}</span>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Haftalık Analiz Grafikleri - 2 Kart Yan Yana */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ana Duygu Grafiği */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"></path>
            </svg>
            Haftalık Duygu Değerleri
          </h3>
          
          {safeWeeklyData.length > 0 ? (
            <div className="h-72">
              <Line data={chartData} options={chartOptions} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500 bg-gray-50 rounded-lg h-72">
              <svg className="w-16 h-16 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p>Bu hafta için analiz verisi bulunmuyor.</p>
            </div>
          )}
        </div>

        {/* Duygu Dağılımı Bar Grafiği */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path>
              <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path>
            </svg>
            Duygu Dağılımı
          </h3>
          
          {safeWeeklyData.length > 0 ? (
            <div className="h-72">
              <Bar data={emotionBarData} options={emotionBarOptions} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500 bg-gray-50 rounded-lg h-72">
              <svg className="w-16 h-16 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              <p>Bu hafta için analiz verisi bulunmuyor.</p>
            </div>
          )}
        </div>
      </div>
      
  
        
       
      </div>
  );
};

export default FriendProfile;