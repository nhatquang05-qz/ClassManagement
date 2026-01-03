import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClass } from '../contexts/ClassContext';
import { FaInfoCircle, FaUser, FaKey, FaQuestionCircle } from 'react-icons/fa'; 
import api from '../utils/api';
import '../assets/styles/AuthPage.css';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const [showChangePass, setShowChangePass] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [tempToken, setTempToken] = useState('');

    const [tempUser, setTempUser] = useState<any>(null);

    const { login } = useAuth();
    const { setSelectedClass } = useClass();
    const navigate = useNavigate();

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        localStorage.removeItem('selectedClassId');
        localStorage.removeItem('selectedClassName');
        localStorage.removeItem('currentClass');
        if (setSelectedClass) setSelectedClass(null);

        try {
            const res = await api.post('/auth/login', { username, password });
            const { token, user } = res.data;

            if (user.must_change_password) {
                setTempToken(token);
                setTempUser(user);
                localStorage.setItem('token', token);
                setShowChangePass(true);
            } else {
                await processLoginSuccess(token, user);
            }
        } catch (err: any) {
            console.error('Lỗi đăng nhập:', err);
            setError(err.response?.data?.message || 'Đăng nhập thất bại');
        }
    };

    const processLoginSuccess = async (token: string, user: any) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        const tryLoadClass = async (classId: number) => {
            try {
                const clsRes = await api.get(`/classes/${classId}`);
                if (setSelectedClass) setSelectedClass(clsRes.data);
                localStorage.setItem('selectedClassId', classId.toString());
                localStorage.setItem('selectedClassName', clsRes.data.name);
                localStorage.setItem('currentClass', JSON.stringify(clsRes.data));
                return true;
            } catch (err) {
                return false;
            }
        };

        if (user.role === 'group_leader') {
            let loaded = false;
            if (user.class_id) loaded = await tryLoadClass(user.class_id);
            if (loaded) window.location.href = '/tracking';
            else window.location.href = '/';
        } else {
            if (user.class_id) await tryLoadClass(user.class_id);
            window.location.href = '/';
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword.length < 8) {
            setError('Mật khẩu phải có ít nhất 8 ký tự');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Mật khẩu nhập lại không khớp');
            return;
        }

        try {
            await api.post('/auth/change-password', { newPassword });
            alert('Đổi mật khẩu thành công! Vui lòng chờ...');

            if (tempUser) {
                const u = { ...tempUser };
                u.must_change_password = 0;
                await processLoginSuccess(tempToken, u);
            } else {
                window.location.reload();
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Đổi mật khẩu thất bại');
        }
    };

    if (showChangePass) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <h2>Đổi Mật Khẩu</h2>
                        <p style={{ color: 'red' }}>
                            Lần đầu đăng nhập, vui lòng đổi mật khẩu mới!
                        </p>
                    </div>
                    {error && <div className="error-message">{error}</div>}
                    <form onSubmit={handleChangePassword}>
                        <div className="form-group">
                            <label>Mật khẩu mới (tối thiểu 8 ký tự)</label>
                            <input
                                type="password"
                                className="form-control"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Nhập lại mật khẩu</label>
                            <input
                                type="password"
                                className="form-control"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-100">
                            Xác nhận & Đăng nhập
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: '450px' }}>
                <div className="auth-header">
                    <h2>Đăng Nhập</h2>
                    <p>Hệ thống quản lý nề nếp học sinh</p>
                </div>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleLoginSubmit}>
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

                {}
                <div
                    style={{
                        marginTop: '25px',
                        padding: '15px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        color: '#555',
                        border: '1px solid #e9ecef',
                    }}
                >
                    <h4
                        style={{
                            margin: '0 0 12px 0',
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#2c3e50',
                            borderBottom: '1px solid #ddd',
                            paddingBottom: '8px',
                        }}
                    >
                        <FaInfoCircle style={{ marginRight: '8px', color: '#3498db' }} />
                        Hướng dẫn đăng nhập
                    </h4>

                    <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'flex-start' }}>
                        <FaUser
                            style={{
                                marginRight: '10px',
                                marginTop: '4px',
                                color: '#e67e22',
                                minWidth: '16px',
                            }}
                        />
                        <div style={{ lineHeight: '1.4' }}>
                            <strong>Quy tắc Tên đăng nhập:</strong> <br />
                            <em>[Tên][Họ][Đệm] + [Tên lớp] + [2 số cuối của 2 năm học]</em>
                            <br />
                            <span style={{ fontSize: '0.85rem', color: '#666' }}>
                                Ví dụ: HS <strong>Nguyễn Văn An</strong>, lớp <strong>10A1</strong>,
                                năm học <strong>2024-2025</strong>
                                <br />➜ Username: <strong>ANV10A12425</strong>
                            </span>
                        </div>
                    </div>

                    <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                        <FaKey style={{ marginRight: '10px', color: '#27ae60', minWidth: '16px' }} />
                        <div>
                            <strong>Mật khẩu mặc định:</strong>{' '}
                            <code
                                style={{
                                    background: '#eee',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontWeight: 'bold',
                                    color: '#c0392b',
                                }}
                            >
                                123456
                            </code>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <FaQuestionCircle
                            style={{
                                marginRight: '10px',
                                marginTop: '3px',
                                color: '#8e44ad',
                                minWidth: '16px',
                            }}
                        />
                        <div>
                            <strong>Quên mật khẩu?</strong> Liên hệ Giáo viên chủ nhiệm để được cấp
                            lại (Reset).
                        </div>
                    </div>
                </div>
                {}
            </div>
        </div>
    );
};

export default LoginPage;