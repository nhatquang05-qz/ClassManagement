import React, { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } from 'react';
import { FaArrowUp, FaArrowDown, FaTimes, FaExchangeAlt } from 'react-icons/fa';

const formatPoints = (num: number) => {
    return parseFloat(Number(num).toFixed(2));
};

const MatchingQuestion = ({ data, value, onChange, questionId }: any) => {
    const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
    const pairs = useMemo(() => value || {}, [JSON.stringify(value)]);
    const containerRef = useRef<HTMLDivElement>(null);
    const [lines, setLines] = useState<any[]>([]);

    const calculateLines = useCallback(() => {
        if (!containerRef.current) return;
        const newLines: any[] = [];
        const containerRect = containerRef.current.getBoundingClientRect();

        Object.entries(pairs).forEach(([leftText, rightText]) => {
            const leftEl = containerRef.current?.querySelector(`[data-match-left="${leftText}"]`);
            const rightEl = containerRef.current?.querySelector(
                `[data-match-right="${rightText}"]`
            );

            if (leftEl && rightEl) {
                const leftRect = leftEl.getBoundingClientRect();
                const rightRect = rightEl.getBoundingClientRect();
                newLines.push({
                    x1: leftRect.right - containerRect.left,
                    y1: leftRect.top + leftRect.height / 2 - containerRect.top,
                    x2: rightRect.left - containerRect.left,
                    y2: rightRect.top + rightRect.height / 2 - containerRect.top,
                    key: `${leftText}-${rightText}`,
                });
            }
        });

        setLines((prev) => {
            if (JSON.stringify(prev) !== JSON.stringify(newLines)) return newLines;
            return prev;
        });
    }, [pairs]);

    useLayoutEffect(() => {
        calculateLines();
        window.addEventListener('resize', calculateLines);
        return () => window.removeEventListener('resize', calculateLines);
    }, [calculateLines]);

    const handleLeftClick = (text: string) => {
        if (selectedLeft === text) setSelectedLeft(null);
        else setSelectedLeft(text);
    };

    const handleRightClick = (rightText: string) => {
        if (selectedLeft) {
            const newPairs = { ...pairs };
            const oldLeft = Object.keys(newPairs).find((key) => newPairs[key] === rightText);
            if (oldLeft) delete newPairs[oldLeft];
            newPairs[selectedLeft] = rightText;
            onChange(newPairs);
            setSelectedLeft(null);
        }
    };

    const getLeftStatus = (text: string) => {
        if (selectedLeft === text) return 'selected';
        if (pairs[text]) return 'matched';
        return '';
    };

    const getRightStatus = (text: string) => {
        if (Object.values(pairs).includes(text)) return 'matched';
        return '';
    };

    return (
        <div className="matching-container" ref={containerRef} style={{ position: 'relative' }}>
            <svg className="matching-lines-svg">
                {lines.map((line, idx) => (
                    <line
                        key={line.key || idx}
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke="#3498db"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                ))}
            </svg>
            <div className="col-left">
                {data.pairs?.map((p: any, idx: number) => (
                    <div
                        key={idx}
                        data-match-left={p.left}
                        className={`match-item left ${getLeftStatus(p.left)}`}
                        onClick={() => handleLeftClick(p.left)}
                    >
                        {p.left}
                        <span className="connect-dot right"></span>
                    </div>
                ))}
            </div>
            <div className="col-space" style={{ width: '50px' }}></div>
            <div className="col-right">
                {data.pairs?.map((p: any, idx: number) => (
                    <div
                        key={idx}
                        data-match-right={p.right}
                        className={`match-item right ${getRightStatus(p.right)} ${selectedLeft ? 'waiting-target' : ''}`}
                        onClick={() => handleRightClick(p.right)}
                    >
                        <span className="connect-dot left"></span>
                        {p.right}
                    </div>
                ))}
            </div>
        </div>
    );
};

const OrderingQuestion = ({ data, value, onChange }: any) => {
    const [items, setItems] = useState<any[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    useEffect(() => {
        if (value && value.length > 0) setItems(value);
        else if (data.items) {
            const defaultItems = [...data.items];
            setItems(defaultItems);
            if (!value) onChange(defaultItems);
        }
    }, [data, value]);

    const handleItemClick = (index: number) => {
        if (selectedIndex === null) setSelectedIndex(index);
        else if (selectedIndex === index) setSelectedIndex(null);
        else {
            const newItems = [...items];
            [newItems[selectedIndex], newItems[index]] = [newItems[index], newItems[selectedIndex]];
            setItems(newItems);
            onChange(newItems);
            setSelectedIndex(null);
        }
    };

    const moveItem = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
        e.stopPropagation();
        const newItems = [...items];
        if (direction === 'up' && index > 0)
            [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
        else if (direction === 'down' && index < newItems.length - 1)
            [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
        setItems(newItems);
        onChange(newItems);
    };

    return (
        <div className="ordering-container">
            <p style={{ fontSize: '0.9rem', color: '#666', fontStyle: 'italic', marginBottom: 10 }}>
                *Bấm vào 2 ô để đổi chỗ cho nhau.
            </p>
            {items.map((item: any, index: number) => (
                <div
                    key={index}
                    className={`order-item ${selectedIndex === index ? 'swapping' : ''}`}
                    onClick={() => handleItemClick(index)}
                >
                    <div className="order-content">
                        <span className={`index-badge ${selectedIndex === index ? 'active' : ''}`}>
                            {index + 1}
                        </span>
                        {item.text}
                    </div>
                    <div className="order-actions">
                        <button disabled={index === 0} onClick={(e) => moveItem(index, 'up', e)}>
                            <FaArrowUp />
                        </button>
                        <button
                            disabled={index === items.length - 1}
                            onClick={(e) => moveItem(index, 'down', e)}
                        >
                            <FaArrowDown />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const QuestionRenderer = ({ question, answer, onAnswer }: any) => {
    const { id, type, content, media_url, media_type, content_data, points } = question;

    const data = useMemo(() => {
        if (typeof content_data === 'string') {
            try {
                return JSON.parse(content_data);
            } catch (e) {
                return {};
            }
        }
        return content_data || {};
    }, [content_data]);

    return (
        <div
            className="question-card"
            style={{
                background: 'white',
                padding: 20,
                marginBottom: 20,
                borderRadius: 8,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            }}
        >
            <div
                style={{
                    marginBottom: 15,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    display: 'flex',
                    justifyContent: 'space-between',
                }}
            >
                <div>
                    <span style={{ color: '#007bff', marginRight: 8, fontWeight: 'bold' }}>
                        Câu hỏi:
                    </span>
                    {content}
                </div>
                <span
                    style={{
                        fontSize: '0.9rem',
                        color: '#e67e22',
                        whiteSpace: 'nowrap',
                        marginLeft: 10,
                    }}
                >
                    {formatPoints(points)} điểm
                </span>
            </div>

            {}
            {media_url && (
                <div
                    style={{
                        marginBottom: 20,
                        textAlign: 'center',
                        background: '#f8f9fa',
                        padding: 10,
                        borderRadius: 8,
                    }}
                >
                    {media_type === 'image' && (
                        <img
                            src={media_url}
                            style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 4 }}
                            alt="Minh họa"
                        />
                    )}
                    {media_type === 'video' && (
                        <video
                            src={media_url}
                            controls
                            style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 4 }}
                        />
                    )}
                    {media_type === 'audio' && (
                        <audio src={media_url} controls style={{ width: '100%' }} />
                    )}
                </div>
            )}
            {}

            <div className="question-interaction-area">
                {type === 'multiple_choice' && (
                    <div className="mc-options">
                        {data.options?.map((opt: any) => (
                            <label
                                key={opt.id}
                                className={`mc-label ${String(answer) === String(opt.id) ? 'selected' : ''}`}
                            >
                                <input
                                    type="radio"
                                    name={`q-${id}`}
                                    checked={String(answer) === String(opt.id)}
                                    onChange={() => onAnswer(opt.id)}
                                />
                                {opt.text}
                            </label>
                        ))}
                    </div>
                )}

                {(type === 'fill_in_blank' || type === 'fill_blank') && (
                    <div className="fill-blank-area">
                        <input
                            type="text"
                            className="fill-input"
                            value={answer || ''}
                            onChange={(e) => onAnswer(e.target.value)}
                            placeholder="Nhập câu trả lời..."
                        />
                    </div>
                )}

                {type === 'matching' && (
                    <MatchingQuestion
                        data={data}
                        value={answer}
                        onChange={onAnswer}
                        questionId={id}
                    />
                )}

                {(type === 'ordering' || type === 'reorder') && (
                    <OrderingQuestion data={data} value={answer} onChange={onAnswer} />
                )}
            </div>
        </div>
    );
};

export default QuestionRenderer;
