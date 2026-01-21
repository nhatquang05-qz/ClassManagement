import React, { useEffect, useState, useMemo, useRef, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import {
    FaArrowLeft,
    FaCheckCircle,
    FaTimesCircle,
    FaHistory,
    FaCheck,
    FaTimes,
    FaEyeSlash,
    FaUserTie
} from 'react-icons/fa';
import '../assets/styles/ExamTakingPage.css';

const formatScore = (num: any) => {
    const n = parseFloat(num);
    if (isNaN(n)) return 0;
    return parseFloat(n.toFixed(2));
};


const ResultMatching = ({ question, userAnswer, showDetails }: any) => {
    const pairs = useMemo(() => userAnswer || {}, [JSON.stringify(userAnswer)]);
    const correctPairs = useMemo(() => question.content_data?.pairs || [], [question]);
    const containerRef = useRef<HTMLDivElement>(null);
    const [lines, setLines] = useState<any[]>([]);

    
    const dbIsCorrect = question.is_correct;

    useLayoutEffect(() => {
        if (!containerRef.current) return;
        const newLines: any[] = [];
        const containerRect = containerRef.current.getBoundingClientRect();

        Object.entries(pairs).forEach(([leftText, rightText]) => {
            const safeLeft = String(leftText).replace(/"/g, '\\"');
            const safeRight = String(rightText).replace(/"/g, '\\"');

            const leftEl = containerRef.current?.querySelector(`[data-res-left="${safeLeft}"]`);
            const rightEl = containerRef.current?.querySelector(
                `[data-res-right="${safeRight}"]`
            );

            if (leftEl && rightEl) {
                const leftRect = leftEl.getBoundingClientRect();
                const rightRect = rightEl.getBoundingClientRect();
                
                
                
                
                let isLineCorrect = false;
                if (showDetails) {
                    
                    if (dbIsCorrect) {
                        isLineCorrect = true;
                    } else {
                        
                        isLineCorrect = correctPairs.some(
                            (p: any) => p.left === leftText && p.right === rightText
                        );
                    }
                }

                newLines.push({
                    x1: leftRect.right - containerRect.left,
                    y1: leftRect.top + leftRect.height / 2 - containerRect.top,
                    x2: rightRect.left - containerRect.left,
                    y2: rightRect.top + rightRect.height / 2 - containerRect.top,
                    color: !showDetails ? '#6c757d' : (isLineCorrect ? '#28a745' : '#dc3545'),
                    key: `${leftText}-${rightText}`,
                });
            }
        });

        setLines((prev) => {
            if (JSON.stringify(prev) !== JSON.stringify(newLines)) return newLines;
            return prev;
        });
    }, [pairs, correctPairs, showDetails, dbIsCorrect]);

    return (
        <div className="matching-container" ref={containerRef} style={{ position: 'relative' }}>
            <svg className="matching-lines-svg">
                {lines.map((line) => (
                    <line
                        key={line.key}
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke={line.color}
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                ))}
            </svg>
            <div className="col-left">
                {(question.content_data?.pairs || []).map((p: any, idx: number) => (
                    <div
                        key={idx}
                        data-res-left={p.left}
                        className="match-item left matched"
                        style={{ cursor: 'default' }}
                    >
                        {p.left}
                        <span className="connect-dot right"></span>
                    </div>
                ))}
            </div>
            <div className="col-space" style={{ width: '60px' }}></div>
            <div className="col-right">
                {(question.content_data?.pairs || []).map((p: any, idx: number) => (
                    <div
                        key={idx}
                        data-res-right={p.right}
                        className="match-item right matched"
                        style={{ cursor: 'default' }}
                    >
                        <span className="connect-dot left"></span>
                        {p.right}
                    </div>
                ))}
            </div>
        </div>
    );
};


const ResultMultipleChoice = ({ question, userAnswer, showDetails }: any) => {
    const options = question.content_data?.options || [];
    const correctIds = question.content_data?.correct_ids || [];
    
    const questionIsCorrect = question.is_correct; 

    return (
        <div className="mc-options">
            {options.map((opt: any) => {
                
                const isSelected = String(userAnswer || '').trim() === String(opt.id).trim();
                const isConfiguredCorrect = correctIds.some((id: any) => String(id).trim() === String(opt.id).trim());
                
                let styleClass = 'mc-label';
                let borderColor = '1px solid #eee';
                let bgColor = 'white';

                if (showDetails) {
                    if (isConfiguredCorrect) {
                        
                        borderColor = '2px solid #28a745';
                        bgColor = '#d4edda';
                    } else if (isSelected) {
                        
                        
                        
                        
                        if (questionIsCorrect) {
                            borderColor = '2px solid #28a745';
                            bgColor = '#d4edda';
                        } else {
                            
                            borderColor = '2px solid #dc3545';
                            bgColor = '#f8d7da';
                        }
                        styleClass += ' selected';
                    }
                } else {
                    if (isSelected) {
                        borderColor = '2px solid #007bff';
                        bgColor = '#e7f1ff';
                        styleClass += ' selected';
                    }
                }

                return (
                    <div
                        key={opt.id}
                        className={styleClass}
                        style={{ border: borderColor, backgroundColor: bgColor }}
                    >
                        <input
                            type="radio"
                            checked={isSelected}
                            readOnly
                            disabled
                            style={{ marginRight: '10px' }}
                        />
                        {opt.text}
                        
                        {}
                        {showDetails && (
                            <>
                                {}
                                {(isConfiguredCorrect || (isSelected && questionIsCorrect)) && (
                                    <FaCheckCircle color="green" style={{ marginLeft: 'auto' }} />
                                )}
                                {}
                                {isSelected && !questionIsCorrect && !isConfiguredCorrect && (
                                    <FaTimesCircle color="red" style={{ marginLeft: 'auto' }} />
                                )}
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
};


const ResultFillBlank = ({ question, userAnswer, showDetails }: any) => {
    const correctAnswer = question.content_data?.correct_answer || '';
    
    
    const isCorrect = question.is_correct; 
    
    
    
    
    return (
        <div>
            <div style={{ marginBottom: 5 }}>
                <strong>Trả lời của bạn:</strong>
                <span
                    style={{
                        color: !showDetails ? '#333' : (isCorrect ? 'green' : 'red'),
                        fontWeight: 'bold',
                        marginLeft: 5,
                        borderBottom: !showDetails ? '1px solid #ccc' : (isCorrect ? 'none' : '1px dashed red'),
                    }}
                >
                    {userAnswer ? String(userAnswer) : '(Bỏ trống)'}
                </span>
            </div>
            {showDetails && !isCorrect && (
                <div style={{ color: '#28a745', marginTop: 5 }}>
                    <strong>Đáp án đúng:</strong> {correctAnswer}
                </div>
            )}
        </div>
    );
};


const ResultOrdering = ({ question, userAnswer, showDetails }: any) => {
    const correctItems = question.content_data?.items || [];
    const itemsToShow = userAnswer && Array.isArray(userAnswer) ? userAnswer : [];
    const dbIsCorrect = question.is_correct;

    return (
        <div className="ordering-container">
            {itemsToShow.length > 0 ? (
                itemsToShow.map((item: any, index: number) => {
                    
                    let isCorrectPos = correctItems[index]?.text === item.text;
                    
                    
                    if (dbIsCorrect) isCorrectPos = true;

                    return (
                        <div
                            key={index}
                            className="order-item"
                            style={{
                                border: showDetails 
                                    ? (isCorrectPos ? '1px solid #28a745' : '1px solid #dc3545')
                                    : '1px solid #ced4da', 
                                background: showDetails
                                    ? (isCorrectPos ? '#e8f5e9' : '#ffebee')
                                    : '#f8f9fa',
                            }}
                        >
                            <div className="order-content">
                                <span className="index-badge">{index + 1}</span>
                                {item.text}
                            </div>
                            <div style={{ marginLeft: 'auto' }}>
                                {showDetails && (isCorrectPos ? <FaCheck color="green" /> : <FaTimes color="red" />)}
                            </div>
                        </div>
                    );
                })
            ) : (
                <div style={{ color: '#999', fontStyle: 'italic', padding: 10 }}>
                    Bạn chưa sắp xếp câu này.
                </div>
            )}
            {showDetails && !dbIsCorrect && (
                <div
                    style={{
                        marginTop: 15,
                        padding: 15,
                        background: '#f9f9f9',
                        borderRadius: 6,
                        border: '1px solid #eee',
                    }}
                >
                    <strong style={{ color: '#28a745' }}>Thứ tự đúng:</strong>
                    <ol style={{ paddingLeft: 20, margin: '5px 0' }}>
                        {correctItems.map((it: any, i: number) => (
                            <li key={i} style={{ marginBottom: 4 }}>
                                {it.text}
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
};


const ResultQuestionRenderer = ({ question, showDetails }: any) => {
    const { id, type, content, points, user_answer, is_correct, score_obtained, media_url, media_type } = question;
    
    const parsedUserAnswer = useMemo(() => {
        if (typeof user_answer === 'string') {
            try {
                return JSON.parse(user_answer);
            } catch {
                return user_answer;
            }
        }
        return user_answer;
    }, [user_answer]);

    return (
        <div
            className="question-card"
            style={{
                background: 'white',
                padding: 20,
                marginBottom: 20,
                borderRadius: 8,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                borderLeft: showDetails 
                    ? (is_correct ? '5px solid #28a745' : '5px solid #dc3545')
                    : '5px solid #6c757d',
            }}
        >
            <div
                style={{
                    marginBottom: 15,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                }}
            >
                <div style={{ flex: 1 }}>
                    <span style={{ color: '#007bff', marginRight: 8, fontWeight: 'bold' }}>
                        Câu hỏi:
                    </span>
                    {content}
                </div>
                <div style={{ textAlign: 'right', minWidth: '100px' }}>
                    {showDetails ? (
                        <>
                            <div
                                style={{
                                    fontSize: '0.9rem',
                                    color: is_correct ? 'green' : 'red',
                                    fontWeight: 'bold',
                                }}
                            >
                                {is_correct ? 'ĐÚNG' : 'SAI'}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>
                                {formatScore(score_obtained)} / {formatScore(points)} điểm
                            </div>
                        </>
                    ) : (
                        <div style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>
                            (Đã làm)
                        </div>
                    )}
                </div>
            </div>

            {media_url && (
                <div style={{ marginBottom: 20, textAlign: 'center', background: '#f8f9fa', padding: 10, borderRadius: 8 }}>
                    {media_type === 'image' && <img src={media_url} style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 4 }} alt="Minh họa" />}
                    {media_type === 'video' && <video src={media_url} controls style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 4 }} />}
                    {media_type === 'audio' && <audio src={media_url} controls style={{ width: '100%' }} />}
                </div>
            )}

            <div className="result-content">
                {type === 'multiple_choice' && (
                    <ResultMultipleChoice question={question} userAnswer={parsedUserAnswer} showDetails={showDetails} />
                )}
                {(type === 'fill_in_blank' || type === 'fill_blank') && (
                    <ResultFillBlank question={question} userAnswer={parsedUserAnswer} showDetails={showDetails} />
                )}
                {type === 'matching' && (
                    <ResultMatching question={question} userAnswer={parsedUserAnswer} showDetails={showDetails} />
                )}
                {(type === 'ordering' || type === 'reorder') && (
                    <ResultOrdering question={question} userAnswer={parsedUserAnswer} showDetails={showDetails} />
                )}
            </div>
        </div>
    );
};


const ExamResultPage = () => {
    const { submissionId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [data, setData] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/exams/review/${submissionId}`);
                setData(res.data);
                const examId = res.data.exam.exam_id;
                const histRes = await api.get(`/exams/${examId}/submissions`);
                setHistory(Array.isArray(histRes.data) ? histRes.data : []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        if (submissionId) fetchData();
    }, [submissionId]);

    const handleAttemptChange = (newSubId: string) => {
        if (newSubId !== submissionId) {
            navigate(`/exam-result/${newSubId}`);
        }
    };

    const handleBack = () => {
        if (user?.role === 'admin') {
             if (data?.exam?.exam_id) {
                navigate(`/teacher/exams/${data.exam.exam_id}`);
            } else {
                navigate('/teacher/exams');
            }
        } else {
            navigate('/student-exams', { replace: true });
        }
    };

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải kết quả...</div>;
    if (!data) return <div style={{ padding: 40, textAlign: 'center' }}>Không tìm thấy dữ liệu.</div>;

    const { exam, sections } = data;

    
    const isTeacher = user?.role === 'admin'; 
    let showDetails = true;
    const mode = exam.view_answer_mode;

    if (isTeacher) {
        showDetails = true;
    } else {
        if (mode === 'never') {
            showDetails = false;
        } else if (mode === 'after_close') {
            const endTime = exam.end_time ? new Date(exam.end_time).getTime() : 0;
            const now = Date.now();
            if (now <= endTime) {
                showDetails = false;
            }
        }
    }

    return (
        <div className="exam-taking-page">
            <div
                className="exam-header"
                style={{ height: 'auto', flexWrap: 'wrap', gap: 10, padding: '15px' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                        className="btn-submit"
                        style={{ background: '#6c757d', padding: '8px 15px' }}
                        onClick={handleBack}
                    >
                        <FaArrowLeft /> Thoát
                    </button>
                    <div>
                        <h3 style={{ margin: 0 }}>
                            {exam.title}
                            {isTeacher && <span style={{fontSize: '0.8rem', color: '#007bff', marginLeft: 8}}>(Quyền Giáo viên)</span>}
                        </h3>
                        <span style={{ fontSize: '0.9rem', color: '#666' }}>
                            Học sinh: {exam.student_name}
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            background: '#f8f9fa',
                            padding: '5px 10px',
                            borderRadius: 6,
                            border: '1px solid #ddd',
                        }}
                    >
                        <FaHistory color="#007bff" />
                        <select
                            value={submissionId}
                            onChange={(e) => handleAttemptChange(e.target.value)}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                fontWeight: 'bold',
                                outline: 'none',
                                cursor: 'pointer',
                                maxWidth: '200px',
                            }}
                        >
                            {history.map((h: any) => (
                                <option key={h.id} value={h.id}>
                                    Lần {h.attempt_number} {showDetails ? `- ${formatScore(h.score)} điểm` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {showDetails ? (
                        <div
                            className="timer-badge"
                            style={{ color: '#28a745', borderColor: '#28a745', background: '#e8f5e9' }}
                        >
                            Điểm: {formatScore(exam.score)}
                        </div>
                    ) : (
                        <div
                            className="timer-badge"
                            style={{ color: '#6c757d', borderColor: '#6c757d', background: '#f8f9fa' }}
                        >
                            <FaEyeSlash style={{ marginRight: 5 }} /> Chưa công bố điểm
                        </div>
                    )}
                    
                    {isTeacher && (
                        <div title="Bạn đang xem với quyền Admin/Giáo viên" style={{color: '#007bff', fontSize: '1.2rem'}}>
                            <FaUserTie />
                        </div>
                    )}
                </div>
            </div>

            <div className="exam-body-container">
                {sections.map((sec: any) => (
                    <div key={sec.id || `sec-${Math.random()}`} className="section-block">
                        <div className="section-title">
                            <h4>{sec.title}</h4>
                        </div>
                        {sec.questions.map((q: any) => (
                            <ResultQuestionRenderer
                                key={q.id || `q-${Math.random()}`}
                                question={q}
                                showDetails={showDetails}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ExamResultPage;