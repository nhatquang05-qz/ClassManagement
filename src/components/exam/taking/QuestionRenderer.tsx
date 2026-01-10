import React, { useState } from 'react';

interface QuestionProps {
    question: any;
    value: any;
    onChange: (val: any) => void;
}

const QuestionRenderer: React.FC<QuestionProps> = ({ question, value, onChange }) => {
    if (question.type === 'multiple_choice') {
        return (
            <div className="take-exam-answers">
                {question.options.map((opt: any) => (
                    <div
                        key={opt.id}
                        className={`take-exam-mc-option ${value === opt.id ? 'take-exam-mc-option--selected' : ''}`}
                        onClick={() => onChange(opt.id)}
                    >
                        <div
                            style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                border: '1px solid #ccc',
                                marginRight: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: value === opt.id ? '#007bff' : '#fff',
                            }}
                        >
                            {value === opt.id && (
                                <div
                                    style={{
                                        width: '10px',
                                        height: '10px',
                                        background: '#fff',
                                        borderRadius: '50%',
                                    }}
                                ></div>
                            )}
                        </div>
                        <span>{opt.text}</span>
                    </div>
                ))}
            </div>
        );
    }

    if (question.type === 'fill_blank') {
        return (
            <div className="take-exam-fill-blank">
                <p style={{ fontStyle: 'italic', color: '#666', marginBottom: '10px' }}>
                    Điền đáp án vào ô trống:
                </p>
                <input
                    type="text"
                    className="take-exam-blank-input"
                    style={{ width: '100%', textAlign: 'left', padding: '10px' }}
                    placeholder="Nhập câu trả lời của bạn..."
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>
        );
    }

    if (question.type === 'matching') {
        const matches = value || {};
        const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

        const handleLeftClick = (id: string) => {
            if (matches[id]) {
                const newMatches = { ...matches };
                delete newMatches[id];
                onChange(newMatches);
            } else {
                setSelectedLeft(id);
            }
        };

        const handleRightClick = (id: string) => {
            if (selectedLeft) {
                onChange({ ...matches, [selectedLeft]: id });
                setSelectedLeft(null);
            }
        };

        const isRightMatched = (id: string) => Object.values(matches).includes(id);

        return (
            <div className="take-exam-match-container">
                <div className="take-exam-match-col">
                    <small>Cột A</small>
                    {question.leftOptions.map((item: any) => (
                        <div
                            key={item.id}
                            className={`take-exam-match-item 
                ${selectedLeft === item.id ? 'take-exam-match-item--selected' : ''}
                ${matches[item.id] ? 'take-exam-match-item--matched' : ''}
              `}
                            onClick={() => handleLeftClick(item.id)}
                        >
                            {item.text} {matches[item.id] ? '🔗' : ''}
                        </div>
                    ))}
                </div>
                <div className="take-exam-match-col">
                    <small>Cột B</small>
                    {question.rightOptions.map((item: any) => (
                        <div
                            key={item.id}
                            className={`take-exam-match-item 
                ${isRightMatched(item.id) ? 'take-exam-match-item--matched' : ''}
              `}
                            onClick={() => !isRightMatched(item.id) && handleRightClick(item.id)}
                        >
                            {item.text}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return <div>Loại câu hỏi chưa hỗ trợ</div>;
};

export default QuestionRenderer;
