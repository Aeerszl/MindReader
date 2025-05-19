/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react/prop-types */
// Friends.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, UserPlus, UserCheck, UserMinus, X, Check, Clock, AlertCircle, User
} from 'lucide-react';
import { 
  getFriends, 
  getFriendRequests, 
  getSentRequests,
  searchUsers, 
  sendFriendRequest, 
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  cancelFriendRequest
} from '../services/friendService';

const Friends = () => {
  // State'ler
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // İlk yüklenmede arkadaş listesi ve istekleri getir
  useEffect(() => {
    loadFriendsData();
  }, []);

  // Tüm arkadaşlık verilerini yükle
  const loadFriendsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Paralel veri çekişi
      const [friendsResponse, requestsResponse, sentResponse] = await Promise.all([
        getFriends(),
        getFriendRequests(),
        getSentRequests()
      ]);

      setFriends(friendsResponse.data.friends || []);
      setFriendRequests(requestsResponse.data.friendRequests || []);
      setSentRequests(sentResponse.data.sentRequests || []);
    } catch (err) {
      console.error("Arkadaşlık verileri yüklenirken hata:", err);
      setError("Arkadaşlık verileri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  // Kullanıcı arama
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await searchUsers(searchQuery);
      setSearchResults(response.data.users || []);
      
      // Kullanıcı aradığında arama sekmesine geç
      setActiveTab('search');
    } catch (err) {
      console.error("Kullanıcı arama hatası:", err);
      setError("Kullanıcı aranırken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  // Arkadaşlık isteği gönder
  const handleSendRequest = async (userId) => {
    try {
      setLoading(true);
      await sendFriendRequest(userId);
      
      // Arama sonuçlarını güncelle - istek gönderilen kullanıcıları filtrelemeye gerek yok,
      // bunun yerine tüm verileri tekrar yükleyerek en güncel durumu alalım
      await loadFriendsData();
      
      // Arama sonuçlarını tekrar getir
      if (searchQuery.trim()) {
        const response = await searchUsers(searchQuery);
        setSearchResults(response.data.users || []);
      }
    } catch (err) {
      console.error("Arkadaşlık isteği gönderilirken hata:", err);
      setError("Arkadaşlık isteği gönderilirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  // Arkadaşlık isteğini kabul et
  const handleAcceptRequest = async (userId) => {
    try {
      setLoading(true);
      await acceptFriendRequest(userId);
      await loadFriendsData();
    } catch (err) {
      console.error("İstek kabul edilirken hata:", err);
      setError("Arkadaşlık isteği kabul edilirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  // Arkadaşlık isteğini reddet
  const handleRejectRequest = async (userId) => {
    try {
      setLoading(true);
      await rejectFriendRequest(userId);
      await loadFriendsData();
    } catch (err) {
      console.error("İstek reddedilirken hata:", err);
      setError("Arkadaşlık isteği reddedilirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  // Arkadaşı kaldır
  const handleRemoveFriend = async (userId) => {
    try {
      setLoading(true);
      await removeFriend(userId);
      await loadFriendsData();
    } catch (err) {
      console.error("Arkadaş kaldırılırken hata:", err);
      setError("Arkadaş kaldırılırken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  // Gönderilen isteği iptal et
  const handleCancelRequest = async (userId) => {
    try {
      setLoading(true);
      await cancelFriendRequest(userId);
      await loadFriendsData();
    } catch (err) {
      console.error("İstek iptal edilirken hata:", err);
      setError("Arkadaşlık isteği iptal edilirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  // Profil resmi veya baş harfi gösterme
  // eslint-disable-next-line react/prop-types
  const ProfileImage = ({ user }) => {
    if (user.profileImage) {
      return (
        <img 
          src={user.profileImage} 
          alt={user.username} 
          className="w-10 h-10 rounded-full object-cover"
        />
      );
    }
    
    return (
      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
        {user.username.charAt(0).toUpperCase()}
      </div>
    );
  };

  // Sekme değiştirme
  const renderTabs = () => (
    <div className="flex border-b border-gray-200 mb-4">
      <button
        className={`px-4 py-2 ${activeTab === 'friends' ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
        onClick={() => setActiveTab('friends')}
      >
        <div className="flex items-center gap-2">
          <UserCheck size={18} />
          <span>Arkadaşlar ({friends.length})</span>
        </div>
      </button>
      <button
        className={`px-4 py-2 ${activeTab === 'requests' ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
        onClick={() => setActiveTab('requests')}
      >
        <div className="flex items-center gap-2">
          <UserPlus size={18} />
          <span>İstekler {friendRequests.length > 0 && `(${friendRequests.length})`}</span>
        </div>
      </button>
      <button
        className={`px-4 py-2 ${activeTab === 'sent' ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
        onClick={() => setActiveTab('sent')}
      >
        <div className="flex items-center gap-2">
          <Clock size={18} />
          <span>Gönderilen {sentRequests.length > 0 && `(${sentRequests.length})`}</span>
        </div>
      </button>
      <button
        className={`px-4 py-2 ${activeTab === 'search' ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
        onClick={() => setActiveTab('search')}
      >
        <div className="flex items-center gap-2">
          <Search size={18} />
          <span>Arkadaş Ara</span>
        </div>
      </button>
    </div>
  );

  // Arama formu
  const renderSearchForm = () => (
    <div className="mb-6 flex">
      <div className="relative flex-1">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Kullanıcı adı veya e-posta ara..."
          className="w-full rounded-l-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        {searchQuery && (
          <button 
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={() => setSearchQuery('')}
          >
            <X size={18} />
          </button>
        )}
      </div>
      <button
        onClick={handleSearch}
        disabled={!searchQuery.trim() || loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 disabled:bg-blue-400 flex items-center"
      >
        <Search size={18} className="mr-1" />
        Ara
      </button>
    </div>
  );

  // Arkadaş listesi
  const renderFriendsList = () => (
    <div>
      {friends.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <UserCheck size={40} className="mx-auto mb-2 text-gray-400" />
          <p className="text-lg font-medium">Henüz arkadaşınız yok</p>
          <p className="mt-2">Arkadaş eklemek için "Arkadaş Ara" sekmesini kullanabilirsiniz</p>
        </div>
      ) : (
        <div className="grid gap-3">          {friends.map(friend => (
            <div 
              key={friend._id} 
              className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <ProfileImage user={friend} />
                <div>
                  <h3 className="font-medium text-gray-900">{friend.username}</h3>
                  <p className="text-gray-500 text-sm">{friend.email}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link 
                  to={`/profile/friend/${friend._id}`}
                  className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 flex items-center gap-1"
                  title="Profili görüntüle"
                >
                  <User size={20} />
                  <span>Profil</span>
                </Link>
                <button 
                  onClick={() => handleRemoveFriend(friend._id)}
                  className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-red-50"
                  title="Arkadaşlıktan çıkar"
                >
                  <UserMinus size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Gelen istekler listesi
  const renderRequestsList = () => (
    <div>
      {friendRequests.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <UserPlus size={40} className="mx-auto mb-2 text-gray-400" />
          <p className="text-lg font-medium">Gelen arkadaşlık isteği bulunmuyor</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {friendRequests.map(request => (
            <div 
              key={request._id} 
              className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <ProfileImage user={request} />
                <div>
                  <h3 className="font-medium text-gray-900">{request.username}</h3>
                  <p className="text-gray-500 text-sm">{request.email}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleAcceptRequest(request._id)}
                  className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"
                  title="Kabul et"
                >
                  <Check size={20} />
                </button>
                <button 
                  onClick={() => handleRejectRequest(request._id)}
                  className="bg-gray-200 text-gray-700 p-2 rounded-full hover:bg-gray-300"
                  title="Reddet"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Gönderilen istekler listesi
  const renderSentRequestsList = () => (
    <div>
      {sentRequests.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Clock size={40} className="mx-auto mb-2 text-gray-400" />
          <p className="text-lg font-medium">Gönderilen arkadaşlık isteği bulunmuyor</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {sentRequests.map(request => (
            <div 
              key={request._id} 
              className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <ProfileImage user={request} />
                <div>
                  <h3 className="font-medium text-gray-900">{request.username}</h3>
                  <p className="text-gray-500 text-sm">{request.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Clock size={16} className="mr-1" />
                <span className="text-sm">Bekliyor</span>
                <button 
                  onClick={() => handleCancelRequest(request._id)}
                  className="ml-2 text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-red-50"
                  title="İsteği iptal et"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Arama sonuçları
  const renderSearchResults = () => (
    <div>
      {searchResults.length === 0 ? (
        searchQuery ? (
          <div className="text-center py-8 text-gray-500">
            <Search size={40} className="mx-auto mb-2 text-gray-400" />
            <p className="text-lg font-medium">Sonuç bulunamadı</p>
            <p className="mt-2">Farklı bir arama terimi deneyin</p>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Search size={40} className="mx-auto mb-2 text-gray-400" />
            <p className="text-lg font-medium">Arkadaş aramak için yukarıdaki arama kutusunu kullanın</p>
          </div>
        )
      ) : (
        <div className="grid gap-3">
          {searchResults.map(user => {
            // Kullanıcının durumunu kontrol et
            const isFriend = friends.some(f => f._id === user._id);
            const isRequested = sentRequests.some(r => r._id === user._id);
            const hasRequestedYou = friendRequests.some(r => r._id === user._id);
            
            return (
              <div 
                key={user._id} 
                className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <ProfileImage user={user} />
                  <div>
                    <h3 className="font-medium text-gray-900">{user.username}</h3>
                    <p className="text-gray-500 text-sm">{user.email}</p>
                  </div>
                </div>
                <div>
                  {isFriend ? (
                    <button 
                      onClick={() => handleRemoveFriend(user._id)}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      <UserCheck size={16} />
                      <span>Arkadaş</span>
                    </button>
                  ) : isRequested ? (
                    <button 
                      onClick={() => handleCancelRequest(user._id)}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
                    >
                      <Clock size={16} />
                      <span>İstek Gönderildi</span>
                    </button>
                  ) : hasRequestedYou ? (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleAcceptRequest(user._id)}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <Check size={16} />
                        <span>Kabul Et</span>
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleSendRequest(user._id)}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <UserPlus size={16} />
                      <span>Arkadaş Ekle</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // Ana içerik
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Arkadaşlar</h1>
      
      {renderTabs()}
      
      {/* Hata mesajı */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      )}
      
      {/* Aktif sekmeye göre içerik göster */}
      <div className="mb-6">
        {activeTab === 'search' && renderSearchForm()}
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'friends' && renderFriendsList()}
            {activeTab === 'requests' && renderRequestsList()}
            {activeTab === 'sent' && renderSentRequestsList()}
            {activeTab === 'search' && renderSearchResults()}
          </>
        )}
      </div>
    </div>
  );
};

export default Friends;
