import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5000/api/auth"; // Backend adresiniz

export default function Register() {
  const [form, setForm] = useState({ email: "", username: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(2);
  const navigate = useNavigate();

  // Geri sayım efekti
  useEffect(() => {
    let timer;
    if (success && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (success && countdown === 0) {
      navigate("/login");
    }
    return () => clearTimeout(timer);
  }, [success, countdown, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Şifre doğrulama kontrolü
    if (form.password !== form.confirmPassword) {
      setError("Şifreler eşleşmiyor!");
      return;
    }
    
    setLoading(true);
    
    try {      // Gerçek API çağrısı
      const response = await axios.post(`${API_URL}/register`, {
        email: form.email,
        username: form.username,
        password: form.password
      });
      
      if (response.status === 201 || response.data.msg === "Kayıt başarılı") {
        setSuccess(true);
      } else {
        setError("Beklenmeyen bir yanıt alındı!");
        console.error("Beklenmeyen yanıt:", response);
      }
    } catch (err) {
      // Hata mesajını ayarla
      let errorMessage = "Kayıt olurken bir hata oluştu!";
      
      if (err.response) {
        // Sunucudan gelen hata mesajı
        if (err.response.status === 400 && err.response.data?.msg === "Kullanıcı zaten var") {
          errorMessage = "Bu e-posta adresi zaten kullanılıyor!";
        } else if (err.response.data?.error) {
          errorMessage = err.response.data.error;
        } else if (err.response.data?.msg) {
          errorMessage = err.response.data.msg;
        }
      } else if (err.message.includes("Network Error")) {
        errorMessage = "Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.";
      }
      
      setError(errorMessage);
      console.error("Kayıt hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Kayıt Ol</h2>
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            Kayıt başarılı! {countdown} saniye içinde giriş sayfasına yönlendiriliyorsunuz...
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              E-posta
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="E-posta adresinizi girin"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Kullanıcı Adı
            </label>
            <input
              id="username"
              type="text"
              required
              placeholder="Kullanıcı adınızı girin"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Şifre
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              placeholder="En az 6 karakter"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Şifre Tekrar
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={6}
              placeholder="Şifrenizi tekrar girin"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
            } transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Zaten hesabınız var mı?{" "}
            <a href="/login" className="text-blue-600 hover:underline">
              Giriş Yap
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}