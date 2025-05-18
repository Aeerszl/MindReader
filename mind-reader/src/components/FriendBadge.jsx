// FriendBadge.jsx
import { useState, useEffect } from 'react';
import { UserCheck, UserPlus, Clock, X } from 'lucide-react';
import PropTypes from 'prop-types';
import { 
  sendFriendRequest, 
  acceptFriendRequest, 
  removeFriend,
  cancelFriendRequest
} from '../services/friendService';
import { FRIENDSHIP_STATUS } from '../constants/friendshipConstants';

const FriendBadge = ({ userId, initialStatus = FRIENDSHIP_STATUS.NONE, onStatusChange }) => {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Props değiştiğinde state'i güncelle
  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  // Arkadaş ekle
  const handleAddFriend = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await sendFriendRequest(userId);
      setStatus(FRIENDSHIP_STATUS.PENDING_SENT);
      
      if (onStatusChange) {
        onStatusChange(FRIENDSHIP_STATUS.PENDING_SENT);
      }
    } catch (err) {
      console.error("Arkadaş ekleme hatası:", err);
      setError("İstek gönderilemedi");
    } finally {
      setLoading(false);
    }
  };

  // Arkadaş isteğini kabul et
  const handleAcceptRequest = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await acceptFriendRequest(userId);
      setStatus(FRIENDSHIP_STATUS.FRIEND);
      
      if (onStatusChange) {
        onStatusChange(FRIENDSHIP_STATUS.FRIEND);
      }
    } catch (err) {
      console.error("İstek kabul hatası:", err);
      setError("İstek kabul edilemedi");
    } finally {
      setLoading(false);
    }
  };

  // Arkadaş kaldır
  const handleRemoveFriend = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await removeFriend(userId);
      setStatus(FRIENDSHIP_STATUS.NONE);
      
      if (onStatusChange) {
        onStatusChange(FRIENDSHIP_STATUS.NONE);
      }
    } catch (err) {
      console.error("Arkadaş silme hatası:", err);
      setError("Arkadaş silinemedi");
    } finally {
      setLoading(false);
    }
  };

  // İsteği iptal et
  const handleCancelRequest = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await cancelFriendRequest(userId);
      setStatus(FRIENDSHIP_STATUS.NONE);
      
      if (onStatusChange) {
        onStatusChange(FRIENDSHIP_STATUS.NONE);
      }
    } catch (err) {
      console.error("İstek iptal hatası:", err);
      setError("İstek iptal edilemedi");
    } finally {
      setLoading(false);
    }
  };

  // Duruma göre buton render et
  const renderButton = () => {
    switch (status) {
      case FRIENDSHIP_STATUS.FRIEND:
        return (
          <button
            onClick={handleRemoveFriend}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition"
          >
            <UserCheck size={18} />
            <span>Arkadaş</span>
          </button>
        );

      case FRIENDSHIP_STATUS.PENDING_SENT:
        return (
          <button
            onClick={handleCancelRequest}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md transition"
          >
            <Clock size={18} />
            <span>İstek Gönderildi</span>
          </button>
        );

      case FRIENDSHIP_STATUS.PENDING_RECEIVED:
        return (
          <div className="flex gap-2">
            <button
              onClick={handleAcceptRequest}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
            >
              <UserPlus size={18} />
              <span>Kabul Et</span>
            </button>
            <button
              onClick={handleCancelRequest}
              disabled={loading}
              className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition"
              title="Reddet"
            >
              <X size={18} />
            </button>
          </div>
        );

      case FRIENDSHIP_STATUS.NONE:
      default:
        return (
          <button
            onClick={handleAddFriend}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
          >
            <UserPlus size={18} />
            <span>Arkadaş Ekle</span>
          </button>
        );
    }
  };

  return (
    <div>
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      <div className={loading ? 'opacity-70' : ''}>
        {renderButton()}
        {loading && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          </div>
        )}
      </div>
    </div>
  );
};

// PropTypes tanımlaması
FriendBadge.propTypes = {
  userId: PropTypes.string.isRequired,
  initialStatus: PropTypes.string,
  onStatusChange: PropTypes.func
};

FriendBadge.defaultProps = {
  initialStatus: FRIENDSHIP_STATUS.NONE,
  onStatusChange: () => {}
};

export default FriendBadge;
