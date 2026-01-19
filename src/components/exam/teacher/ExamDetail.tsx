import React, { useEffect, useState, useMemo } from 'react';
import {
    FaArrowLeft,
    FaSearch,
    FaChevronDown,
    FaChevronUp,
    FaEye,
    FaClock,
    FaTrophy,
    FaUserGraduate,
} from 'react-icons/fa';
import api from '../../../utils/api';
import { useNavigate, useParams } from 'react-router-dom';
import '../../../assets/styles/ExamDetail.css';

const formatScore = (num: any) => {
    const n = parseFloat(num);
    return isNaN(n) ? 0 : parseFloat(n.toFixed(2));
};

const ExamDetail: React.FC = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const [exam, setExam] = useState<any>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedStudentId, setExpandedStudentId] = useState<number | null>(null);

    useEffect(() => {
        if (!examId) return;
        const fetchData = async () => {
            try {
                const [examRes, subRes] = await Promise.all([
                    api.get(`/exams/${examId}`),
                    api.get(`/exams/${examId}/submissions`),
                ]);
                setExam(examRes.data);
                setSubmissions(subRes.data);
            } catch (error) {
                console.error(error);
                alert('Lỗi tải dữ liệu hoặc đề thi không tồn tại.');
                navigate('/teacher/exams');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [examId, navigate]);

    const groupedData = useMemo(() => {
        const groups: Record<number, any> = {};
        submissions.forEach((sub) => {
            if (!groups[sub.student_id]) {
                groups[sub.student_id] = {
                    student_id: sub.student_id,
                    student_name: sub.student_name,
                    attempts: [],
                    best_score: 0,
                };
            }
            groups[sub.student_id].attempts.push(sub);
            const currentScore = parseFloat(sub.score);
            if (currentScore > groups[sub.student_id].best_score) {
                groups[sub.student_id].best_score = currentScore;
            }
        });
        return Object.values(groups).filter((g: any) =>
            g.student_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [submissions, searchTerm]);

    const toggleExpand = (studentId: number) => {
        setExpandedStudentId((prev) => (prev === studentId ? null : studentId));
    };

    const handleViewSubmission = (submissionId: number) => {
        navigate(`/exam-review/${submissionId}`);
    };

    const handleBack = () => {
        navigate('/teacher/exams');
    };

    if (loading)
        return (
            <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
                Đang tải dữ liệu...
            </div>
        );

    return (
        <div className="ed-container">
            {}
            <div className="ed-header">
                <div className="ed-header-left">
                    <button onClick={handleBack} className="ed-btn-back">
                        <FaArrowLeft /> Danh sách Đề thi
                    </button>
                    <div className="ed-title-group">
                        <h2>{exam?.title}</h2>
                        <div className="ed-subtitle">Chi tiết lượt nộp bài</div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span
                        style={{
                            background: '#e3f2fd',
                            color: '#1976d2',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                        }}
                    >
                        Tổng bài nộp: {submissions.length}
                    </span>
                </div>
            </div>

            {}
            <div className="ed-search-container">
                <FaSearch className="ed-search-icon" />
                <input
                    type="text"
                    className="ed-search-input"
                    placeholder="Tìm kiếm theo tên học sinh..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="ed-student-list">
                {groupedData.length === 0 ? (
                    <div className="ed-empty-state">
                        Chưa có dữ liệu hoặc không tìm thấy học sinh.
                    </div>
                ) : (
                    groupedData.map((student: any) => (
                        <div key={student.student_id} className="ed-student-card">
                            <div
                                className={`ed-card-summary ${expandedStudentId === student.student_id ? 'active' : ''}`}
                                onClick={() => toggleExpand(student.student_id)}
                            >
                                <div className="ed-student-info">
                                    <div className="ed-avatar">
                                        <FaUserGraduate />
                                    </div>
                                    <div className="ed-info-text">
                                        <h4>{student.student_name}</h4>
                                        <div className="ed-stats">
                                            <span className="ed-stat-item">
                                                <FaClock /> Số lần thi:{' '}
                                                <span className="ed-stat-highlight">
                                                    {student.attempts.length}
                                                </span>
                                            </span>
                                            <span className="ed-stat-item">
                                                <FaTrophy color="#f1c40f" /> Cao nhất:{' '}
                                                <span className="ed-stat-score">
                                                    {formatScore(student.best_score)}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="ed-chevron">
                                    {expandedStudentId === student.student_id ? (
                                        <FaChevronUp />
                                    ) : (
                                        <FaChevronDown />
                                    )}
                                </div>
                            </div>

                            {expandedStudentId === student.student_id && (
                                <div className="ed-attempts-container">
                                    <table className="ed-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '15%' }}>Lần thi</th>
                                                <th style={{ width: '15%', textAlign: 'center' }}>
                                                    Điểm số
                                                </th>
                                                <th style={{ width: '40%' }}>Thời gian nộp</th>
                                                <th style={{ width: '30%', textAlign: 'right' }}>
                                                    Thao tác
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {student.attempts.map((attempt: any) => (
                                                <tr key={attempt.id}>
                                                    <td>Lần {attempt.attempt_number}</td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span
                                                            className={`ed-score-badge ${attempt.score >= 5 ? 'ed-score-high' : 'ed-score-low'}`}
                                                        >
                                                            {formatScore(attempt.score)}
                                                        </span>
                                                    </td>
                                                    <td style={{ color: '#666' }}>
                                                        {new Date(
                                                            attempt.submitted_at
                                                        ).toLocaleString('vi-VN')}
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <button
                                                            className="ed-btn-view"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleViewSubmission(attempt.id);
                                                            }}
                                                        >
                                                            <FaEye /> Xem bài làm
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ExamDetail;
