import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { FaArrowLeft, FaCheck, FaTimes, FaClock, FaUser } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import '../assets/styles/ExamTakingPage.css';

const isCorrectOption = (optId: string, correctIds: string[]) => correctIds?.includes(optId);

const ResultMultipleChoice = ({ options, userAns, correctIds, canViewKey }: any) => {
    return (
        <div className="mc-options">
            {options?.map((opt: any) => {
                const isSelected = userAns === opt.id;
                const isCorrect = correctIds?.includes(opt.id);

                let className = 'mc-label';
                let style = {};

                if (canViewKey) {
                    if (isSelected && isCorrect) {
                        className += ' selected correct';
                        style = { background: '#d4edda', borderColor: '#28a745', color: '#155724' };
                    } else if (isSelected && !isCorrect) {
                        className += ' selected wrong';
                        style = { background: '#f8d7da', borderColor: '#dc3545', color: '#721c24' };
                    } else if (!isSelected && isCorrect) {
                        style = { border: '2px dashed #28a745' };
                    } else if (isSelected) {
                        className += ' selected';
                    }
                } else {
                    if (isSelected) {
                        className += ' selected';
                        style = { background: '#e7f1ff', borderColor: '#007bff' };
                    }
                }

                return (
                    <div
                        key={opt.id}
                        className={className}
                        style={{ ...style, cursor: 'default', pointerEvents: 'none' }}
                    >
                        <input
                            type="radio"
                            checked={isSelected}
                            readOnly
                            style={{ marginRight: 10 }}
                        />
                        {opt.text}
                        {canViewKey && isSelected && isCorrect && (
                            <FaCheck style={{ marginLeft: 'auto', color: '#28a745' }} />
                        )}
                        {canViewKey && isSelected && !isCorrect && (
                            <FaTimes style={{ marginLeft: 'auto', color: '#dc3545' }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const ResultFillBlank = ({ userAns, correctAnswer, canViewKey }: any) => {
    const isCorrect =
        String(userAns || '')
            .trim()
            .toLowerCase() ===
        String(correctAnswer || '')
            .trim()
            .toLowerCase();

    return (
        <div className="fill-blank-area">
            <div
                style={{
                    padding: 10,
                    border: '1px solid',
                    borderColor: canViewKey ? (isCorrect ? '#28a745' : '#dc3545') : '#ccc',
                    background: canViewKey ? (isCorrect ? '#d4edda' : '#f8d7da') : '#fff',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                }}
            >
                <span>{userAns || '(Bỏ trống)'}</span>
                {canViewKey && (isCorrect ? <FaCheck color="green" /> : <FaTimes color="red" />)}
            </div>

            {canViewKey && !isCorrect && (
                <div
                    style={{ marginTop: 5, color: '#28a745', fontWeight: 500, fontSize: '0.9rem' }}
                >
                    Đáp án đúng: {correctAnswer}
                </div>
            )}
        </div>
    );
};

const ResultMatching = ({ pairs, userAns, canViewKey }: any) => {
    const userPairs = Object.entries(userAns || {});

    return (
        <div className="matching-result">
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: 10 }}>
                Các cặp bạn đã nối:
            </p>
            <div className="pair-tags">
                {userPairs.length === 0 && (
                    <span style={{ color: '#999' }}>Không có câu trả lời</span>
                )}

                {userPairs.map(([uLeft, uRight]: any, idx) => {
                    const correctPair = pairs?.find((p: any) => p.left === uLeft);
                    const isCorrect = correctPair && correctPair.right === uRight;

                    const style = canViewKey
                        ? {
                              background: isCorrect ? '#d4edda' : '#f8d7da',
                              border: `1px solid ${isCorrect ? '#28a745' : '#dc3545'}`,
                              color: isCorrect ? '#155724' : '#721c24',
                          }
                        : {
                              background: '#e7f1ff',
                              border: '1px solid #b8daff',
                          };

                    return (
                        <div
                            key={idx}
                            className="pair-tag"
                            style={{
                                ...style,
                                padding: '8px 12px',
                                borderRadius: 4,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                marginBottom: 5,
                            }}
                        >
                            <span>{uLeft}</span>
                            <strong>↔</strong>
                            <span>{uRight}</span>
                            {canViewKey && (isCorrect ? <FaCheck /> : <FaTimes />)}
                        </div>
                    );
                })}
            </div>

            {}
            {canViewKey && pairs && (
                <div style={{ marginTop: 15, borderTop: '1px dashed #ccc', paddingTop: 10 }}>
                    <strong style={{ color: '#28a745', fontSize: '0.9rem' }}>Đáp án chuẩn:</strong>
                    <ul
                        style={{
                            margin: '5px 0',
                            paddingLeft: 20,
                            fontSize: '0.9rem',
                            color: '#555',
                        }}
                    >
                        {pairs.map((p: any, i: number) => (
                            <li key={i}>
                                {p.left} ↔ {p.right}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const ResultOrdering = ({ correctItems, userAns, canViewKey }: any) => {
    const userList = Array.isArray(userAns) ? userAns : [];

    return (
        <div className="ordering-container">
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: 10 }}>
                Thứ tự bạn đã xếp:
            </p>
            {userList.map((item: any, index: number) => {
                const isCorrectPos =
                    correctItems && correctItems[index] && correctItems[index].text === item.text;

                const style = canViewKey
                    ? {
                          background: isCorrectPos ? '#d4edda' : '#f8d7da',
                          borderColor: isCorrectPos ? '#28a745' : '#dc3545',
                      }
                    : {};

                return (
                    <div key={index} className="order-item" style={{ ...style, cursor: 'default' }}>
                        <div className="order-content">
                            <span
                                className="index-badge"
                                style={{
                                    background: canViewKey
                                        ? isCorrectPos
                                            ? '#28a745'
                                            : '#dc3545'
                                        : '#007bff',
                                }}
                            >
                                {index + 1}
                            </span>
                            {item.text}
                        </div>
                        {canViewKey &&
                            (isCorrectPos ? <FaCheck color="green" /> : <FaTimes color="red" />)}
                    </div>
                );
            })}

            {canViewKey &&
                !userList.every(
                    (item: any, idx: number) => correctItems[idx]?.text === item.text
                ) && (
                    <div style={{ marginTop: 15 }}>
                        <strong style={{ color: '#28a745', fontSize: '0.9rem' }}>
                            Thứ tự đúng:
                        </strong>
                        <ol
                            style={{
                                paddingLeft: 20,
                                margin: '5px 0',
                                fontSize: '0.9rem',
                                color: '#555',
                            }}
                        >
                            {correctItems?.map((it: any, i: number) => (
                                <li key={i}>{it.text}</li>
                            ))}
                        </ol>
                    </div>
                )}
        </div>
    );
};

const ResultQuestionRenderer = ({ question, canViewResults }: any) => {
    const { type, content, media_url, content_data, user_answer, points, score_obtained } =
        question;
    const data = content_data || {};

    const isMultipleChoice = type === 'multiple_choice';
    const isFillBlank = type === 'fill_in_blank';
    const isMatching = type === 'matching';
    const isOrdering = type === 'ordering';

    return (
        <div
            className="question-card"
            style={{
                background: 'white',
                padding: 20,
                marginBottom: 20,
                borderRadius: 8,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                borderLeft: canViewResults
                    ? score_obtained >= points
                        ? '5px solid #28a745'
                        : '5px solid #dc3545'
                    : '5px solid #007bff',
            }}
        >
            {}
            <div
                style={{
                    marginBottom: 15,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                }}
            >
                <div style={{ fontSize: '1.1rem', fontWeight: 600, flex: 1 }}>
                    <span style={{ color: '#007bff', marginRight: 8 }}>Câu hỏi:</span>
                    {content}
                </div>
                <div style={{ whiteSpace: 'nowrap', marginLeft: 10, textAlign: 'right' }}>
                    <span style={{ fontSize: '0.9rem', color: '#666', display: 'block' }}>
                        {points} điểm
                    </span>
                    {canViewResults && (
                        <span
                            style={{
                                fontWeight: 'bold',
                                color: score_obtained > 0 ? '#28a745' : '#dc3545',
                            }}
                        >
                            Đạt: {score_obtained}
                        </span>
                    )}
                </div>
            </div>

            {media_url && (
                <div style={{ marginBottom: 15, textAlign: 'center' }}>
                    {question.media_type === 'audio' ? (
                        <audio controls src={media_url} style={{ width: '100%' }} />
                    ) : (
                        <img
                            src={media_url}
                            style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 4 }}
                        />
                    )}
                </div>
            )}

            {}

            {isMultipleChoice && (
                <ResultMultipleChoice
                    options={data.options}
                    userAns={user_answer}
                    correctIds={data.correct_ids}
                    canViewKey={canViewResults}
                />
            )}

            {isFillBlank && (
                <ResultFillBlank
                    userAns={user_answer}
                    correctAnswer={data.correct_answer}
                    canViewKey={canViewResults}
                />
            )}

            {isMatching && (
                <ResultMatching
                    pairs={data.pairs}
                    userAns={user_answer}
                    canViewKey={canViewResults}
                />
            )}

            {isOrdering && (
                <ResultOrdering
                    correctItems={data.items}
                    userAns={user_answer}
                    canViewKey={canViewResults}
                />
            )}
        </div>
    );
};

const ExamResultPage = () => {
    const { submissionId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/exams/review/${submissionId}`)
            .then((res) => {
                setData(res.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                alert('Không thể tải kết quả.');

                if (user?.role === 'student') navigate('/student-exams');
                else navigate('/create-exam');
            });
    }, [submissionId, navigate, user]);

    const handleBack = () => {
        if (user?.role === 'student') navigate('/student-exams');
        else navigate(-1);
    };

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải kết quả...</div>;
    if (!data) return null;

    const { exam, sections } = data;

    const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
    const mode = exam.view_answer_mode;
    const isAfterClose = exam.end_time ? new Date() > new Date(exam.end_time) : false;

    let canViewResults = false;
    if (isTeacher) {
        canViewResults = true;
    } else {
        if (mode === 'immediate') canViewResults = true;
        else if (mode === 'after_close' && isAfterClose) canViewResults = true;
        else canViewResults = false;
    }

    return (
        <div className="exam-taking-page">
            {}
            <div
                className="exam-header"
                style={{
                    height: 'auto',
                    padding: '15px 20px',
                    flexDirection: 'column',
                    gap: 10,
                    alignItems: 'stretch',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <button
                        onClick={handleBack}
                        className="btn-back"
                        style={{ border: 'none', padding: 0 }}
                    >
                        <FaArrowLeft /> {user?.role === 'student' ? 'Danh sách đề thi' : 'Quay lại'}
                    </button>
                    <h3 style={{ margin: 0 }}>{exam.title}</h3>
                    <div style={{ width: 100, textAlign: 'right' }}></div> {}
                </div>

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 30,
                        flexWrap: 'wrap',
                        background: '#f8f9fa',
                        padding: 10,
                        borderRadius: 8,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <FaUser color="#555" />
                        <strong>
                            {isTeacher
                                ? `Học sinh: ${exam.student_name || 'N/A'}`
                                : 'Kết quả của bạn'}
                        </strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <FaClock color="#555" />
                        Nộp lúc: {new Date(exam.submitted_at).toLocaleString()}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <strong>Điểm số:</strong>
                        <span
                            style={{
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                color: exam.score >= 5 ? '#28a745' : '#dc3545',
                            }}
                        >
                            {exam.score}
                        </span>
                    </div>
                </div>

                {!canViewResults && !isTeacher && (
                    <div
                        style={{
                            textAlign: 'center',
                            color: '#dc3545',
                            fontSize: '0.9rem',
                            fontStyle: 'italic',
                        }}
                    >
                        * Bạn chỉ có thể xem điểm số. Chi tiết đáp án đang bị ẩn bởi giáo viên.
                    </div>
                )}
            </div>

            {}
            <div className="exam-body-container">
                {sections.map((sec: any) => (
                    <div key={sec.id} className="section-block">
                        <div className="section-title">
                            <h4>{sec.title}</h4>
                            {sec.description && <p>{sec.description}</p>}
                        </div>
                        {sec.media_url && (
                            <div style={{ marginBottom: 15 }}>
                                <audio controls src={sec.media_url} style={{ width: '100%' }} />
                            </div>
                        )}

                        {sec.questions?.map((q: any) => (
                            <ResultQuestionRenderer
                                key={q.id}
                                question={q}
                                canViewResults={canViewResults}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ExamResultPage;
