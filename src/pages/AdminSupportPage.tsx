import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaArrowLeft,
    FaTrash,
    FaCheckCircle,
    FaUser,
    FaClock,
    FaExclamationCircle,
} from 'react-icons/fa';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import '../assets/styles/AdminSupport.css';

interface SupportRequest {
    id: number;
    user_id: number;
    content: string;
    status: string;
    created_at: string;
    full_name?: string;
    group_number?: number;
}

const AdminSupportPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [requests, setRequests] = useState<SupportRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && user.role !== 'admin' && user.role !== 'teacher') {
            alert('Bạn không có quyền truy cập trang này');
            navigate('/');
        }
    }, [user, navigate]);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/support');
            setRequests(res.data);
        } catch (error) {
            console.error('Lỗi tải dữ liệu:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Xác nhận đã xử lý xong và xóa yêu cầu này?')) return;
        try {
            await api.delete(`/support/${id}`);
            setRequests(requests.filter((r) => r.id !== id));
        } catch (error) {
            alert('Lỗi khi xóa');
        }
    };

    return (
        <div className="admin-support-container">
            <div className="admin-support-header">
                <button className="btn-back-simple" onClick={() => navigate(-1)}>
                    <FaArrowLeft /> Quay lại
                </button>
                <h1>
                    <FaExclamationCircle color="#e74c3c" /> Danh Sách Cần Hỗ Trợ
                </h1>
            </div>

            {loading ? (
                <div className="loading-text">Đang tải dữ liệu...</div>
            ) : (
                <div className="request-grid">
                    {requests.length === 0 ? (
                        <div className="empty-state">
                            <FaCheckCircle size={50} color="#2ecc71" />
                            <p>Tuyệt vời! Không có yêu cầu hỗ trợ nào chưa xử lý.</p>
                        </div>
                    ) : (
                        requests.map((req) => (
                            <div key={req.id} className="request-card">
                                <div className="req-header">
                                    <div className="req-user">
                                        <FaUser />
                                        <strong>{req.full_name || 'Ẩn danh'}</strong>
                                        {req.group_number && (
                                            <span className="req-group">Tổ {req.group_number}</span>
                                        )}
                                    </div>
                                    <div className="req-time">
                                        <FaClock />{' '}
                                        {new Date(req.created_at).toLocaleString('vi-VN')}
                                    </div>
                                </div>

                                <div className="req-content">{req.content}</div>

                                <div className="req-actions">
                                    <button
                                        className="btn-resolve"
                                        onClick={() => handleDelete(req.id)}
                                    >
                                        <FaCheckCircle /> Đã xử lý xong
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminSupportPage;
