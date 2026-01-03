import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClass } from '../contexts/ClassContext';
import api from '../utils/api';
import '../assets/styles/AuthPage.css';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const { setSelectedClass } = useClass();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(username, password);

            const userRes = await api.get('/auth/me');
            const user = userRes.data;

            if (user.role === 'group_leader') {
                if (user.class_id) {
                    try {
                        const clsRes = await api.get(`/classes/${user.class_id}`);
                        setSelectedClass(clsRes.data);
                        localStorage.setItem('selectedClassId', user.class_id.toString());
                        localStorage.setItem('selectedClassName', clsRes.data.name);
                        localStorage.setItem('currentClass', JSON.stringify(clsRes.data));
                    } catch (err) {
                        console.error('Không tải được thông tin lớp', err);
                    }
                }

                navigate('/tracking');
            } else if (user.role === 'student') {
                if (user.class_id) {
                    try {
                        const clsRes = await api.get(`/classes/${user.class_id}`);
                        setSelectedClass(clsRes.data);
                        localStorage.setItem('selectedClassId', user.class_id.toString());
                        localStorage.setItem('selectedClassName', clsRes.data.name);
                        localStorage.setItem('currentClass', JSON.stringify(clsRes.data));
                    } catch (err) {}
                }
                navigate('/');
            } else {
                const savedClassId = localStorage.getItem('selectedClassId');
                if (savedClassId) {
                    navigate('/');
                } else {
                    navigate('/classes');
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Đăng nhập thất bại');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>Đăng Nhập</h2>
                    <p>Hệ thống quản lý nề nếp học sinh</p>
                </div>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Tên đăng nhập</label>
                        <input
                            type="text"
                            className="form-control"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Nhập tên đăng nhập..."
                        />
                    </div>
                    <div className="form-group">
                        <label>Mật khẩu</label>
                        <input
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Nhập mật khẩu..."
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-100">
                        Đăng Nhập
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
