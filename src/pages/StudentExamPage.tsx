import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClass } from '../contexts/ClassContext';
import api from '../utils/api';
import {
    FaClipboardList,
    FaSearch,
    FaClock,
    FaPlay,
    FaEye,
    FaCheckCircle,
    FaHistory,
    FaStar,
    FaCalendarAlt,
    FaHourglassHalf,
    FaExclamationCircle,
} from 'react-icons/fa';
import '../assets/styles/ExamList.css';

const StudentExamPage: React.FC = () => {
    const { selectedClass } = useClass();
    const navigate = useNavigate();
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (selectedClass) {
            fetchExams();
        }
    }, [selectedClass]);

    const fetchExams = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/exams/class/${selectedClass?.id}`);
            setExams(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartExam = (examId: number) => {
        if (window.confirm('Bắt đầu làm bài thi? Thời gian sẽ bắt đầu tính ngay lập tức.')) {
            navigate(`/take-exam/${examId}`);
        }
    };

    const handleReviewExam = (submissionId: number) => {
        navigate(`/exam-review/${submissionId}`);
    };

    const filteredExams = exams.filter((e) =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getExamStatus = (exam: any) => {
        const now = new Date();
        const start = new Date(exam.start_time);
        const end = new Date(exam.end_time);

        if (now < start) return { text: 'Chưa mở', color: '#6c757d', icon: <FaClock /> };
        if (now > end) return { text: 'Đã đóng', color: '#dc3545', icon: <FaExclamationCircle /> };
        if (exam.attempt_count > 0)
            return { text: 'Đã làm', color: '#28a745', icon: <FaCheckCircle /> };
        return { text: 'Đang diễn ra', color: '#007bff', icon: <FaHourglassHalf /> };
    };

    if (loading)
        return (
            <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
                <FaHourglassHalf className="spin" /> Đang tải danh sách đề thi...
            </div>
        );

    return (
        <div className="exam-list-container" style={{ padding: 20 }}>
            {}
            <div
                className="exam-header"
                style={{ marginBottom: 20, borderBottom: '2px solid #f0f0f0', paddingBottom: 15 }}
            >
                <h2
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        color: '#2c3e50',
                        margin: 0,
                    }}
                >
                    <FaClipboardList color="#007bff" />
                    Danh sách Bài kiểm tra
                </h2>
                <div style={{ marginTop: 10, position: 'relative' }}>
                    <FaSearch
                        style={{
                            position: 'absolute',
                            left: 12,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#aaa',
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Tìm kiếm bài thi..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 10px 10px 35px',
                            borderRadius: 8,
                            border: '1px solid #ddd',
                            outline: 'none',
                        }}
                    />
                </div>
            </div>

            {}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 20,
                }}
            >
                {filteredExams.length === 0 ? (
                    <div
                        style={{
                            gridColumn: '1/-1',
                            textAlign: 'center',
                            color: '#999',
                            padding: 30,
                            background: '#f9f9f9',
                            borderRadius: 8,
                        }}
                    >
                        Không có bài kiểm tra nào.
                    </div>
                ) : (
                    filteredExams.map((exam) => {
                        const status = getExamStatus(exam);
                        const canTake =
                            new Date() >= new Date(exam.start_time) &&
                            new Date() <= new Date(exam.end_time) &&
                            (exam.max_attempts === 999 || exam.attempt_count < exam.max_attempts);

                        return (
                            <div
                                key={exam.id}
                                style={{
                                    background: 'white',
                                    borderRadius: 12,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                    border: '1px solid #eee',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                {}
                                <div style={{ padding: 20, flex: 1 }}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: 10,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: '0.8rem',
                                                fontWeight: 'bold',
                                                color: status.color,
                                                background: `${status.color}15`,
                                                padding: '4px 10px',
                                                borderRadius: 20,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 5,
                                            }}
                                        >
                                            {status.icon} {status.text}
                                        </span>
                                        {exam.best_score !== null && (
                                            <span
                                                style={{
                                                    fontSize: '0.9rem',
                                                    fontWeight: 'bold',
                                                    color: '#ffc107',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 5,
                                                }}
                                            >
                                                <FaStar /> {parseFloat(exam.best_score).toFixed(2)}
                                            </span>
                                        )}
                                    </div>

                                    <h3
                                        style={{
                                            margin: '0 0 10px 0',
                                            color: '#333',
                                            fontSize: '1.1rem',
                                        }}
                                    >
                                        {exam.title}
                                    </h3>

                                    <div
                                        style={{
                                            fontSize: '0.9rem',
                                            color: '#666',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 8,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                            }}
                                        >
                                            <FaClock color="#17a2b8" />
                                            <span>
                                                Thời gian: <b>{exam.duration_minutes} phút</b>
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                            }}
                                        >
                                            <FaHistory color="#6c757d" />
                                            <span>
                                                Số lần làm: <b>{exam.attempt_count}</b> /{' '}
                                                {exam.max_attempts === 999
                                                    ? '∞'
                                                    : exam.max_attempts}
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                            }}
                                        >
                                            <FaCalendarAlt color="#28a745" />
                                            <span>
                                                Hạn:{' '}
                                                {new Date(exam.end_time).toLocaleDateString(
                                                    'vi-VN'
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {}
                                <div
                                    style={{
                                        padding: 15,
                                        background: '#f8f9fa',
                                        borderTop: '1px solid #eee',
                                        display: 'flex',
                                        gap: 10,
                                        justifyContent: 'flex-end',
                                    }}
                                >
                                    {}
                                    {exam.last_submission_id && (
                                        <button
                                            onClick={() =>
                                                handleReviewExam(exam.last_submission_id)
                                            }
                                            style={{
                                                background: 'white',
                                                border: '1px solid #ddd',
                                                color: '#555',
                                                padding: '8px 15px',
                                                borderRadius: 6,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                fontWeight: 500,
                                            }}
                                        >
                                            <FaEye /> Xem lại
                                        </button>
                                    )}

                                    {}
                                    {canTake ? (
                                        <button
                                            onClick={() => handleStartExam(exam.id)}
                                            style={{
                                                background: '#007bff',
                                                border: 'none',
                                                color: 'white',
                                                padding: '8px 20px',
                                                borderRadius: 6,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                fontWeight: 600,
                                                boxShadow: '0 2px 5px rgba(0,123,255,0.3)',
                                            }}
                                        >
                                            <FaPlay /> Làm bài
                                        </button>
                                    ) : (
                                        <button
                                            disabled
                                            style={{
                                                background: '#e9ecef',
                                                border: 'none',
                                                color: '#aaa',
                                                padding: '8px 20px',
                                                borderRadius: 6,
                                                cursor: 'not-allowed',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                            }}
                                        >
                                            <FaPlay /> Làm bài
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default StudentExamPage;
