import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { FaArrowLeft, FaCheck, FaTimes } from 'react-icons/fa';
import '../assets/styles/ExamTakingPage.css';

const ExamResultPage = () => {
    const { submissionId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        api.get(`/exams/review/${submissionId}`)
            .then((res) => setData(res.data))
            .catch((err) => {
                alert('Không thể xem chi tiết bài làm này.');
                navigate('/student-exams');
            });
    }, [submissionId, navigate]);

    if (!data) return <div style={{ padding: 20 }}>Đang tải kết quả...</div>;

    const { exam, sections } = data;

    return (
        <div className="exam-taking-page">
            <div
                className="exam-header"
                style={{
                    background: '#fff',
                    borderBottom: '1px solid #ddd',
                    padding: '15px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                }}
            >
                <button
                    onClick={() => navigate('/student-exams')}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: '1rem',
                    }}
                >
                    <FaArrowLeft /> Quay lại danh sách
                </button>
                <div style={{ textAlign: 'right' }}>
                    <h3 style={{ margin: 0, color: exam.score >= 5 ? 'green' : 'red' }}>
                        Kết quả: {exam.score} điểm
                    </h3>
                    <small>Nộp lúc: {new Date(exam.submitted_at).toLocaleString()}</small>
                </div>
            </div>

            <div className="exam-body-container" style={{ paddingTop: 20 }}>
                {sections.map((sec: any) => (
                    <div key={sec.id} className="section-block">
                        <div className="section-title">
                            <h4>{sec.title}</h4>
                        </div>
                        {sec.questions.map((q: any) => (
                            <div
                                key={q.id}
                                className="question-card"
                                style={{
                                    borderLeft: q.is_correct ? '5px solid green' : '5px solid red',
                                }}
                            >
                                <div style={{ marginBottom: 10 }}>
                                    <strong>{q.content}</strong>
                                    <span
                                        style={{
                                            float: 'right',
                                            fontWeight: 'bold',
                                            color: q.is_correct ? 'green' : 'red',
                                        }}
                                    >
                                        {q.is_correct ? <FaCheck /> : <FaTimes />}{' '}
                                        {q.score_obtained}/{q.points} điểm
                                    </span>
                                </div>

                                <div
                                    style={{
                                        background: '#f9f9f9',
                                        padding: 10,
                                        borderRadius: 4,
                                        marginTop: 10,
                                    }}
                                >
                                    <p
                                        style={{
                                            margin: '0 0 5px 0',
                                            fontSize: '0.9rem',
                                            color: '#666',
                                        }}
                                    >
                                        Bài làm của bạn:
                                    </p>
                                    <p style={{ margin: 0, fontWeight: 500 }}>
                                        {JSON.stringify(q.user_answer)}
                                    </p>
                                </div>

                                {/* Hiển thị đáp án đúng nếu có (tuỳ logic backend có trả về hay không) */}
                                {q.content_data.correct_answer && (
                                    <div
                                        style={{ marginTop: 5, color: 'green', fontSize: '0.9rem' }}
                                    >
                                        Đáp án đúng: {q.content_data.correct_answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ExamResultPage;
