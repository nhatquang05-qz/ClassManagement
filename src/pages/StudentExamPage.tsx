import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useClass } from '../contexts/ClassContext';
import { FaClock, FaPlayCircle, FaHistory, FaCheckCircle, FaEye } from 'react-icons/fa';

const StudentExamPage = () => {
    const { selectedClass } = useClass();
    const [exams, setExams] = useState<any[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (selectedClass?.id) {
            api.get(`/exams/class/${selectedClass.id}`)
                .then((res) => setExams(res.data))
                .catch((err) => console.error(err));
        }
    }, [selectedClass]);

    const handleStartExam = (examId: number) => {
        navigate(`/take-exam/${examId}`);
    };

    const handleReview = (submissionId: number) => {
        navigate(`/exam-review/${submissionId}`);
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>Bài kiểm tra của lớp {selectedClass?.name}</h2>
            <div
                className="exam-grid"
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: 20,
                    marginTop: 20,
                }}
            >
                {exams.map((exam) => {
                    const isUnlimited = exam.max_attempts === 999;
                    const attemptsUsed = exam.attempt_count || 0;
                    const attemptsRemaining = exam.max_attempts - attemptsUsed;

                    const canDo = isUnlimited || attemptsRemaining > 0;

                    return (
                        <div
                            key={exam.id}
                            style={{
                                background: 'white',
                                padding: 20,
                                borderRadius: 8,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            }}
                        >
                            <h3 style={{ marginTop: 0 }}>{exam.title}</h3>
                            <div style={{ color: '#666', marginBottom: 15, fontSize: '0.9rem' }}>
                                <p style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <FaClock /> Thời gian: {exam.duration_minutes} phút
                                </p>
                                <p style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <FaHistory /> Số lần làm: {attemptsUsed} /{' '}
                                    {isUnlimited ? '∞' : exam.max_attempts}
                                </p>
                                {exam.best_score !== null && (
                                    <p
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 5,
                                            color: 'green',
                                        }}
                                    >
                                        <FaCheckCircle /> Điểm cao nhất:{' '}
                                        <strong>{exam.best_score}</strong>
                                    </p>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: 10 }}>
                                {canDo ? (
                                    <button
                                        onClick={() => handleStartExam(exam.id)}
                                        style={{
                                            flex: 1,
                                            padding: 10,
                                            background: '#28a745',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: 4,
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 5,
                                        }}
                                    >
                                        <FaPlayCircle /> Làm bài
                                    </button>
                                ) : (
                                    <button
                                        disabled
                                        style={{
                                            flex: 1,
                                            padding: 10,
                                            background: '#ccc',
                                            color: '#666',
                                            border: 'none',
                                            borderRadius: 4,
                                            cursor: 'not-allowed',
                                        }}
                                    >
                                        Hết lượt
                                    </button>
                                )}

                                {}
                                {exam.last_submission_id && (
                                    <button
                                        onClick={() => handleReview(exam.last_submission_id)}
                                        style={{
                                            flex: 1,
                                            padding: 10,
                                            background: '#007bff',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: 4,
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 5,
                                        }}
                                    >
                                        <FaEye /> Xem lại
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
                {exams.length === 0 && <p>Chưa có bài kiểm tra nào.</p>}
            </div>
        </div>
    );
};

export default StudentExamPage;
