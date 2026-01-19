import React, { useEffect, useState, useMemo, useRef, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
    FaArrowLeft,
    FaCheckCircle,
    FaTimesCircle,
    FaHistory,
    FaCheck,
    FaTimes,
} from 'react-icons/fa';
import '../assets/styles/ExamTakingPage.css';

const formatScore = (num: any) => {
    const n = parseFloat(num);
    if (isNaN(n)) return 0;
    return parseFloat(n.toFixed(2));
};

const ResultMatching = ({ question, userAnswer }: any) => {
    const pairs = useMemo(() => userAnswer || {}, [JSON.stringify(userAnswer)]);
    const correctPairs = useMemo(() => question.content_data?.pairs || [], [question]);

    const containerRef = useRef<HTMLDivElement>(null);
    const [lines, setLines] = useState<any[]>([]);

    useLayoutEffect(() => {
        if (!containerRef.current) return;

        const newLines: any[] = [];
        const containerRect = containerRef.current.getBoundingClientRect();

        Object.entries(pairs).forEach(([leftText, rightText]) => {
            const leftEl = containerRef.current?.querySelector(`[data-res-left="${leftText}"]`);
            const rightEl = containerRef.current?.querySelector(
                `[data-res-right="${String(rightText)}"]`
            );

            if (leftEl && rightEl) {
                const leftRect = leftEl.getBoundingClientRect();
                const rightRect = rightEl.getBoundingClientRect();

                const isCorrect = correctPairs.some(
                    (p: any) => p.left === leftText && p.right === rightText
                );

                newLines.push({
                    x1: leftRect.right - containerRect.left,
                    y1: leftRect.top + leftRect.height / 2 - containerRect.top,
                    x2: rightRect.left - containerRect.left,
                    y2: rightRect.top + rightRect.height / 2 - containerRect.top,
                    color: isCorrect ? '#28a745' : '#dc3545',
                    key: `${leftText}-${rightText}`,
                });
            }
        });

        setLines((prev) => {
            if (JSON.stringify(prev) !== JSON.stringify(newLines)) {
                return newLines;
            }
            return prev;
        });
    }, [pairs, correctPairs]);

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
                {correctPairs.map((p: any, idx: number) => (
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
                {correctPairs.map((p: any, idx: number) => (
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

const ResultMultipleChoice = ({ question, userAnswer }: any) => {
    const options = question.content_data?.options || [];
    const correctIds = question.content_data?.correct_ids || [];

    return (
        <div className="mc-options">
            {options.map((opt: any) => {
                const isSelected = String(userAnswer) === String(opt.id);
                const isCorrect = correctIds.some((id: any) => String(id) === String(opt.id));

                let styleClass = 'mc-label';
                let borderColor = '1px solid #eee';
                let bgColor = 'white';

                if (isCorrect) {
                    borderColor = '2px solid #28a745';
                    bgColor = '#d4edda';
                } else if (isSelected && !isCorrect) {
                    borderColor = '2px solid #dc3545';
                    bgColor = '#f8d7da';
                } else if (isSelected) {
                    styleClass += ' selected';
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
                        {isCorrect && (
                            <FaCheckCircle color="green" style={{ marginLeft: 'auto' }} />
                        )}
                        {isSelected && !isCorrect && (
                            <FaTimesCircle color="red" style={{ marginLeft: 'auto' }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const ResultFillBlank = ({ question, userAnswer }: any) => {
    const correctAnswer = question.content_data?.correct_answer || '';
    const isCorrect =
        String(userAnswer || '')
            .trim()
            .toLowerCase() === String(correctAnswer).trim().toLowerCase();

    return (
        <div>
            <div style={{ marginBottom: 5 }}>
                <strong>Trả lời:</strong>
                <span
                    style={{
                        color: isCorrect ? 'green' : 'red',
                        fontWeight: 'bold',
                        marginLeft: 5,
                    }}
                >
                    {userAnswer || '(Bỏ trống)'}
                </span>
            </div>
            {!isCorrect && (
                <div style={{ color: '#28a745' }}>
                    <strong>Đáp án đúng:</strong> {correctAnswer}
                </div>
            )}
        </div>
    );
};

const ResultOrdering = ({ question, userAnswer }: any) => {
    const correctItems = question.content_data?.items || [];

    const itemsToShow = userAnswer && Array.isArray(userAnswer) ? userAnswer : [];

    return (
        <div className="ordering-container">
            {itemsToShow.length > 0 ? (
                itemsToShow.map((item: any, index: number) => {
                    const isCorrectPos = correctItems[index]?.text === item.text;
                    return (
                        <div
                            key={index}
                            className="order-item"
                            style={{
                                border: isCorrectPos ? '1px solid #28a745' : '1px solid #dc3545',
                                background: isCorrectPos ? '#e8f5e9' : '#ffebee',
                            }}
                        >
                            <div className="order-content">
                                <span className="index-badge">{index + 1}</span>
                                {item.text}
                            </div>
                            <div style={{ marginLeft: 'auto' }}>
                                {isCorrectPos ? <FaCheck color="green" /> : <FaTimes color="red" />}
                            </div>
                        </div>
                    );
                })
            ) : (
                <div style={{ color: '#999', fontStyle: 'italic', padding: 10 }}>
                    Bạn chưa sắp xếp câu này.
                </div>
            )}

            {}
            {JSON.stringify(itemsToShow) !== JSON.stringify(correctItems) && (
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

const ResultQuestionRenderer = ({ question }: any) => {
    const { id, type, content, points, user_answer, is_correct, score_obtained } = question;

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
                borderLeft: is_correct ? '5px solid #28a745' : '5px solid #dc3545',
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
                </div>
            </div>

            {question.media_url && (
                <div style={{ marginBottom: 15, textAlign: 'center' }}>
                    {question.media_type === 'audio' ? (
                        <audio controls src={question.media_url} style={{ width: '100%' }} />
                    ) : (
                        <img
                            src={question.media_url}
                            style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 4 }}
                        />
                    )}
                </div>
            )}

            <div className="result-content">
                {type === 'multiple_choice' && (
                    <ResultMultipleChoice question={question} userAnswer={parsedUserAnswer} />
                )}
                {(type === 'fill_in_blank' || type === 'fill_blank') && (
                    <ResultFillBlank question={question} userAnswer={parsedUserAnswer} />
                )}
                {type === 'matching' && (
                    <ResultMatching question={question} userAnswer={parsedUserAnswer} />
                )}
                {(type === 'ordering' || type === 'reorder') && (
                    <ResultOrdering question={question} userAnswer={parsedUserAnswer} />
                )}
            </div>
        </div>
    );
};

const ExamResultPage = () => {
    const { submissionId } = useParams();
    const navigate = useNavigate();
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
                setHistory(histRes.data);
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
            navigate(`/exam-review/${newSubId}`);
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải kết quả...</div>;
    if (!data)
        return <div style={{ padding: 40, textAlign: 'center' }}>Không tìm thấy dữ liệu.</div>;

    const { exam, sections } = data;

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
                        <FaArrowLeft /> Quay lại
                    </button>
                    <div>
                        <h3 style={{ margin: 0 }}>{exam.title}</h3>
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
                            {history.map((h: any, idx: number) => (
                                <option key={h.id} value={h.id}>
                                    Lần {h.attempt_number} - {formatScore(h.score)} điểm
                                </option>
                            ))}
                        </select>
                    </div>

                    <div
                        className="timer-badge"
                        style={{ color: '#28a745', borderColor: '#28a745', background: '#e8f5e9' }}
                    >
                        Điểm: {formatScore(exam.score)}
                    </div>
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
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ExamResultPage;
