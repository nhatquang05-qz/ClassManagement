import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaPaperPlane,
    FaFacebook,
    FaDiscord,
    FaArrowLeft,
    FaExclamationCircle,
    FaHeadset,
} from 'react-icons/fa';
import api from '../utils/api';
import '../assets/styles/SupportPage.css';

const SupportPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState('');

    const ADMIN_CONTACT = {
        facebook: 'https://www.facebook.com/nhtqug.05/',
        discord: 'https://discord.gg/ugSQJjF8',
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) {
            alert('Vui lòng nhập nội dung sự cố.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/support', { content });
            alert('Đã gửi báo cáo! Admin sẽ kiểm tra hệ thống.');
            setContent('');
        } catch (error) {
            console.error(error);
            alert('Có lỗi xảy ra, vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="support-page-container">
            <div className="support-layout">
                {}
                <button className="btn-back-absolute" onClick={() => navigate(-1)}>
                    <FaArrowLeft /> Quay lại
                </button>

                <div className="support-main-card">
                    {}
                    <div className="support-form-section">
                        <div className="section-title">
                            <FaExclamationCircle className="text-orange" />
                            <h2>Báo Cáo Sự Cố</h2>
                        </div>
                        <p className="section-desc">
                            Mô tả lỗi bạn gặp phải để chúng tôi khắc phục sớm nhất.
                        </p>

                        <form onSubmit={handleSubmit}>
                            <textarea
                                className="support-textarea"
                                rows={6}
                                placeholder="Mô tả chi tiết vấn đề (Ví dụ: Không lưu được điểm, lỗi hiển thị ở trang chủ...)"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                            <button type="submit" className="btn-send-report" disabled={loading}>
                                {loading ? (
                                    'Đang gửi...'
                                ) : (
                                    <>
                                        <FaPaperPlane /> Gửi Báo Cáo
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {}
                    <div className="support-divider">
                        <span>HOẶC</span>
                    </div>

                    {}
                    <div className="support-contact-section">
                        <div className="section-title">
                            <FaHeadset className="text-blue" />
                            <h2>Liên Hệ Trực Tiếp</h2>
                        </div>
                        <p className="section-desc">
                            Cần hỗ trợ gấp? Nhắn tin trực tiếp cho Admin qua:
                        </p>

                        <div className="contact-buttons">
                            <a
                                href={ADMIN_CONTACT.facebook}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-contact btn-facebook"
                            >
                                <FaFacebook size={24} />
                                <span>Nhắn tin Facebook</span>
                            </a>

                            <a
                                href={ADMIN_CONTACT.discord}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-contact btn-discord"
                            >
                                <FaDiscord size={24} />
                                <span>Tham gia Discord</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupportPage;
