import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../assets/styles/AuthPage.css';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/'); 
    } catch (err) {
      setError('Đăng nhập thất bại. Kiểm tra lại tài khoản/mật khẩu.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Đăng Nhập Hệ Thống</h2>
        {error && <p className="error-msg">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tài khoản</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="Nhập username..."
            />
          </div>
          <div className="form-group">
            <label>Mật khẩu</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Nhập mật khẩu..."
            />
          </div>
          <button type="submit" className="login-btn">Đăng Nhập</button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;