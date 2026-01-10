import React, { useState, useEffect, useMemo } from 'react';
import {
    FaArrowLeft,
    FaSave,
    FaTrash,
    FaMicrophone,
    FaImage,
    FaPlus,
    FaCalculator,
} from 'react-icons/fa';
import { useClass } from '../../../contexts/ClassContext';
import api from '../../../utils/api';
import '../../../assets/styles/ExamManager.css';

// --- Interfaces ---
interface Option {
    id: string;
    text: string;
    isCorrect: boolean;
}
interface Pair {
    id: string;
    left: string;
    right: string;
}
interface OrderItem {
    id: string;
    text: string;
    order: number;
}

interface Question {
    id: string;
    type: 'multiple_choice' | 'fill_blank' | 'matching' | 'reorder';
    content: string;
    points: number; // Điểm số
    media_url?: string;
    media_type?: 'image' | 'audio';
    options?: Option[];
    correctAnswer?: string;
    pairs?: Pair[];
    orderItems?: OrderItem[];
}

interface Section {
    id: string;
    title: string;
    description: string;
    media_url?: string;
    media_type?: 'image' | 'audio';
    questions: Question[];
}

const ExamBuilder = ({ onBack }: { onBack: () => void }) => {
    const { selectedClass } = useClass();
    const [loading, setLoading] = useState(false);

    // --- Settings State ---
    const [settings, setSettings] = useState({
        title: '',
        description: '',
        duration: 45,
        start_time: '',
        end_time: '',
        max_attempts: 1,
        is_unlimited_attempts: false,
        view_answer_mode: 'after_close',
        is_shuffled: false,
    });

    const [sections, setSections] = useState<Section[]>([
        { id: 'sec-1', title: 'Phần 1', description: '', questions: [] },
    ]);

    // [NEW] Tính tổng điểm tự động
    const totalScore = useMemo(() => {
        return sections.reduce(
            (acc, sec) =>
                acc + sec.questions.reduce((qAcc, q) => qAcc + (Number(q.points) || 0), 0),
            0
        );
    }, [sections]);

    useEffect(() => {
        if (!selectedClass) {
            alert('Cảnh báo: Bạn chưa chọn lớp học.');
        }
    }, [selectedClass]);

    // --- Upload Handler ---
    const handleFileUpload = async (file: File): Promise<string | null> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'file');
        formData.append('title', `Exam Asset ${Date.now()}`);
        formData.append('parentId', 'null');

        try {
            const res = await api.post('/materials', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data.url;
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Lỗi upload file.');
            return null;
        }
    };

    const handleMediaUpload = async (
        file: File,
        target: 'section' | 'question',
        secIdx: number,
        qIdx?: number
    ) => {
        setLoading(true);
        const type = file.type.startsWith('image') ? 'image' : 'audio';
        const url = await handleFileUpload(file);
        if (url) {
            const newSections = [...sections];
            if (target === 'section') {
                newSections[secIdx].media_url = url;
                newSections[secIdx].media_type = type;
            } else if (typeof qIdx === 'number') {
                newSections[secIdx].questions[qIdx].media_url = url;
                newSections[secIdx].questions[qIdx].media_type = type;
            }
            setSections(newSections);
        }
        setLoading(false);
    };

    // --- State Update Handlers ---
    const updateSection = (idx: number, field: keyof Section, value: any) => {
        const newSections = [...sections];
        (newSections[idx] as any)[field] = value;
        setSections(newSections);
    };

    const addQuestion = (secIdx: number, type: Question['type']) => {
        const newSections = [...sections];
        const newQ: Question = {
            id: `q-${Date.now()}`,
            type,
            content: '',
            points: 1, // Mặc định 1 điểm
            options:
                type === 'multiple_choice'
                    ? [
                          { id: `opt-${Date.now()}-1`, text: '', isCorrect: false },
                          { id: `opt-${Date.now()}-2`, text: '', isCorrect: false },
                      ]
                    : undefined,
            pairs:
                type === 'matching'
                    ? [{ id: `pair-${Date.now()}-1`, left: '', right: '' }]
                    : undefined,
            orderItems:
                type === 'reorder'
                    ? [{ id: `ord-${Date.now()}-1`, text: '', order: 1 }]
                    : undefined,
        };
        newSections[secIdx].questions.push(newQ);
        setSections(newSections);
    };

    const updateQuestion = (secIdx: number, qIdx: number, field: keyof Question, value: any) => {
        const newSections = [...sections];
        (newSections[secIdx].questions[qIdx] as any)[field] = value;
        setSections(newSections);
    };

    const updateDeep = (
        secIdx: number,
        qIdx: number,
        arrayField: 'options' | 'pairs' | 'orderItems',
        itemIdx: number,
        key: string,
        value: any
    ) => {
        const newSections = [...sections];
        const targetArray = newSections[secIdx].questions[qIdx][arrayField] as any[];
        targetArray[itemIdx][key] = value;
        setSections(newSections);
    };

    // --- Save Handler ---
    const handleSave = async () => {
        if (!settings.title) return alert('Vui lòng nhập tên đề thi!');
        if (!selectedClass) return alert('Lỗi: Không tìm thấy ID lớp học.');

        setLoading(true);
        try {
            const formatDate = (dateString: string) =>
                dateString ? dateString.replace('T', ' ') + ':00' : null;
            const mapQuestionType = (feType: string) => {
                if (feType === 'fill_blank') return 'fill_in_blank';
                if (feType === 'reorder') return 'ordering';
                return feType;
            };

            const formattedSections = sections.map((sec) => ({
                title: sec.title,
                description: sec.description || '',
                media_url: sec.media_url || null,
                media_type: sec.media_type || null,
                questions: sec.questions.map((q) => {
                    let content_data: any = {};
                    if (q.type === 'multiple_choice') {
                        content_data = {
                            options: q.options?.map((o) => ({ id: o.id, text: o.text })),
                            correct_ids: q.options?.filter((o) => o.isCorrect).map((o) => o.id),
                        };
                    } else if (q.type === 'fill_blank') {
                        content_data = { correct_answer: q.correctAnswer };
                    } else if (q.type === 'matching') {
                        content_data = { pairs: q.pairs };
                    } else if (q.type === 'reorder') {
                        content_data = {
                            items: q.orderItems?.map((i) => ({
                                id: i.id,
                                text: i.text,
                                order: i.order,
                            })),
                        };
                    }

                    return {
                        type: mapQuestionType(q.type),
                        content: q.content || '',
                        points: Number(q.points) || 0, // Đảm bảo gửi điểm số
                        media_url: q.media_url || null,
                        content_data: content_data,
                    };
                }),
            }));

            const payload = {
                class_id: selectedClass.id,
                title: settings.title,
                description: settings.description || '',
                start_time: formatDate(settings.start_time),
                end_time: formatDate(settings.end_time),
                duration_minutes: settings.duration,
                max_attempts: settings.is_unlimited_attempts ? 999 : settings.max_attempts,
                view_answer_mode: settings.view_answer_mode,
                is_shuffled: settings.is_shuffled ? 1 : 0,
                sections: formattedSections,
            };

            const res = await api.post('/exams/create', payload);
            if (res.status === 201) {
                alert('Tạo đề thi thành công!');
                onBack();
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra.';
            alert(`Lỗi Server: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="exam-builder-container">
            <div className="builder-header sticky-header">
                <button onClick={onBack} className="btn-back">
                    <FaArrowLeft /> Quay lại
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h3>{settings.title || 'Đề thi mới'}</h3>
                    <span
                        style={{
                            fontSize: '0.9rem',
                            color: totalScore > 0 ? '#28a745' : '#666',
                            fontWeight: 'bold',
                        }}
                    >
                        <FaCalculator style={{ marginRight: 5 }} /> Tổng điểm: {totalScore}
                    </span>
                </div>
                <button className="btn-primary" onClick={handleSave} disabled={loading}>
                    {loading ? (
                        'Đang xử lý...'
                    ) : (
                        <>
                            <FaSave /> Lưu Đề Thi
                        </>
                    )}
                </button>
            </div>

            <div className="builder-body">
                {/* SETTINGS SIDEBAR */}
                <div className="builder-settings">
                    <h4>Cấu hình</h4>
                    <div className="form-group">
                        <label>Tên bài thi</label>
                        <input
                            value={settings.title}
                            onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                        />
                    </div>
                    {/* ... Các input settings khác giữ nguyên như cũ ... */}
                    <div className="form-group">
                        <label>Thời gian (phút)</label>
                        <input
                            type="number"
                            value={settings.duration}
                            onChange={(e) =>
                                setSettings({ ...settings, duration: Number(e.target.value) })
                            }
                        />
                    </div>
                    <div className="form-group">
                        <label>Lượt làm</label>
                        <div className="flex-center">
                            <input
                                type="number"
                                value={settings.max_attempts}
                                disabled={settings.is_unlimited_attempts}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        max_attempts: Number(e.target.value),
                                    })
                                }
                                style={{ width: 60, marginRight: 10 }}
                            />
                            <label>
                                <input
                                    type="checkbox"
                                    checked={settings.is_unlimited_attempts}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            is_unlimited_attempts: e.target.checked,
                                        })
                                    }
                                />{' '}
                                KGH
                            </label>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Mở</label>
                        <input
                            type="datetime-local"
                            value={settings.start_time}
                            onChange={(e) =>
                                setSettings({ ...settings, start_time: e.target.value })
                            }
                        />
                    </div>
                    <div className="form-group">
                        <label>Đóng</label>
                        <input
                            type="datetime-local"
                            value={settings.end_time}
                            onChange={(e) => setSettings({ ...settings, end_time: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Xem đáp án</label>
                        <select
                            value={settings.view_answer_mode}
                            onChange={(e) =>
                                setSettings({ ...settings, view_answer_mode: e.target.value })
                            }
                        >
                            <option value="immediate">Ngay khi nộp</option>
                            <option value="after_close">Sau khi đóng</option>
                            <option value="never">Không</option>
                        </select>
                    </div>
                </div>

                {/* QUESTIONS AREA */}
                <div className="builder-content">
                    {sections.map((sec, secIdx) => (
                        <div key={sec.id} className="section-card">
                            <div className="section-header">
                                <input
                                    className="section-title-input"
                                    value={sec.title}
                                    onChange={(e) => updateSection(secIdx, 'title', e.target.value)}
                                    placeholder="Tiêu đề phần"
                                />
                                <button
                                    className="btn-icon-danger"
                                    onClick={() => {
                                        if (window.confirm('Xoá phần này?'))
                                            setSections(sections.filter((_, i) => i !== secIdx));
                                    }}
                                >
                                    <FaTrash />
                                </button>
                            </div>
                            <div className="section-meta">
                                <textarea
                                    className="section-desc-input"
                                    placeholder="Mô tả/Đoạn văn..."
                                    value={sec.description}
                                    onChange={(e) =>
                                        updateSection(secIdx, 'description', e.target.value)
                                    }
                                />
                                {/* ... Media upload logic giữ nguyên ... */}
                            </div>

                            <div className="questions-container">
                                {sec.questions.map((q, qIdx) => (
                                    <div key={q.id} className="question-card">
                                        <div className="q-header-row">
                                            <span className="q-type-badge">{q.type}</span>

                                            {/* [IMPORTANT] INPUT CHỈNH ĐIỂM */}
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <label
                                                    style={{ marginRight: 5, fontSize: '0.8rem' }}
                                                >
                                                    Điểm:
                                                </label>
                                                <input
                                                    type="number"
                                                    className="q-points-input"
                                                    value={q.points}
                                                    onChange={(e) =>
                                                        updateQuestion(
                                                            secIdx,
                                                            qIdx,
                                                            'points',
                                                            Number(e.target.value)
                                                        )
                                                    }
                                                />
                                            </div>

                                            <button
                                                className="btn-icon-danger"
                                                onClick={() => {
                                                    const newSecs = [...sections];
                                                    newSecs[secIdx].questions.splice(qIdx, 1);
                                                    setSections(newSecs);
                                                }}
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>

                                        {/* ... Phần Content câu hỏi giữ nguyên ... */}
                                        <div className="q-body">
                                            <input
                                                className="q-content-input"
                                                value={q.content}
                                                onChange={(e) =>
                                                    updateQuestion(
                                                        secIdx,
                                                        qIdx,
                                                        'content',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Nội dung câu hỏi..."
                                            />
                                            {/* ... Render Options/Pairs/OrderItems logic như cũ ... */}
                                            {/* (Để tiết kiệm không gian tôi không paste lại toàn bộ logic render input câu hỏi ở đây, hãy giữ nguyên phần đó từ code trước) */}
                                            {q.type === 'multiple_choice' && (
                                                <div className="q-options-list">
                                                    {q.options?.map((opt, i) => (
                                                        <div key={opt.id} className="option-row">
                                                            <input
                                                                type="radio"
                                                                checked={opt.isCorrect}
                                                                onChange={() => {
                                                                    const ns = [...sections];
                                                                    ns[secIdx].questions[
                                                                        qIdx
                                                                    ].options?.forEach(
                                                                        (o) => (o.isCorrect = false)
                                                                    );
                                                                    ns[secIdx].questions[
                                                                        qIdx
                                                                    ].options![i].isCorrect = true;
                                                                    setSections(ns);
                                                                }}
                                                            />
                                                            <input
                                                                value={opt.text}
                                                                onChange={(e) =>
                                                                    updateDeep(
                                                                        secIdx,
                                                                        qIdx,
                                                                        'options',
                                                                        i,
                                                                        'text',
                                                                        e.target.value
                                                                    )
                                                                }
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    const ns = [...sections];
                                                                    ns[secIdx].questions[
                                                                        qIdx
                                                                    ].options?.splice(i, 1);
                                                                    setSections(ns);
                                                                }}
                                                            >
                                                                x
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => {
                                                            const ns = [...sections];
                                                            ns[secIdx].questions[
                                                                qIdx
                                                            ].options?.push({
                                                                id: `o-${Date.now()}`,
                                                                text: '',
                                                                isCorrect: false,
                                                            });
                                                            setSections(ns);
                                                        }}
                                                    >
                                                        + Option
                                                    </button>
                                                </div>
                                            )}
                                            {q.type === 'fill_blank' && (
                                                <input
                                                    value={q.correctAnswer}
                                                    onChange={(e) =>
                                                        updateQuestion(
                                                            secIdx,
                                                            qIdx,
                                                            'correctAnswer',
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Đáp án đúng"
                                                />
                                            )}
                                            {q.type === 'matching' && (
                                                <div>
                                                    {q.pairs?.map((p, i) => (
                                                        <div key={p.id} className="pair-row">
                                                            <input
                                                                value={p.left}
                                                                onChange={(e) =>
                                                                    updateDeep(
                                                                        secIdx,
                                                                        qIdx,
                                                                        'pairs',
                                                                        i,
                                                                        'left',
                                                                        e.target.value
                                                                    )
                                                                }
                                                            />
                                                            <input
                                                                value={p.right}
                                                                onChange={(e) =>
                                                                    updateDeep(
                                                                        secIdx,
                                                                        qIdx,
                                                                        'pairs',
                                                                        i,
                                                                        'right',
                                                                        e.target.value
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => {
                                                            const ns = [...sections];
                                                            ns[secIdx].questions[qIdx].pairs?.push({
                                                                id: `p-${Date.now()}`,
                                                                left: '',
                                                                right: '',
                                                            });
                                                            setSections(ns);
                                                        }}
                                                    >
                                                        + Pair
                                                    </button>
                                                </div>
                                            )}
                                            {q.type === 'reorder' && (
                                                <div>
                                                    {q.orderItems?.map((o, i) => (
                                                        <div key={o.id} className="reorder-row">
                                                            <span>{i + 1}</span>
                                                            <input
                                                                value={o.text}
                                                                onChange={(e) =>
                                                                    updateDeep(
                                                                        secIdx,
                                                                        qIdx,
                                                                        'orderItems',
                                                                        i,
                                                                        'text',
                                                                        e.target.value
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => {
                                                            const ns = [...sections];
                                                            ns[secIdx].questions[
                                                                qIdx
                                                            ].orderItems?.push({
                                                                id: `ord-${Date.now()}`,
                                                                text: '',
                                                                order: 0,
                                                            });
                                                            setSections(ns);
                                                        }}
                                                    >
                                                        + Item
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="section-toolbar">
                                <button onClick={() => addQuestion(secIdx, 'multiple_choice')}>
                                    + Trắc nghiệm
                                </button>
                                <button onClick={() => addQuestion(secIdx, 'fill_blank')}>
                                    + Điền từ
                                </button>
                                <button onClick={() => addQuestion(secIdx, 'matching')}>
                                    + Nối
                                </button>
                                <button onClick={() => addQuestion(secIdx, 'reorder')}>
                                    + Sắp xếp
                                </button>
                            </div>
                        </div>
                    ))}
                    <button
                        className="btn-add-section-large"
                        onClick={() =>
                            setSections([
                                ...sections,
                                {
                                    id: `sec-${Date.now()}`,
                                    title: `Phần ${sections.length + 1}`,
                                    description: '',
                                    questions: [],
                                },
                            ])
                        }
                    >
                        <FaPlus /> Thêm Phần Thi Mới
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExamBuilder;
