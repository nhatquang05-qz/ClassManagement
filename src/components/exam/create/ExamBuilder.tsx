import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaSave, FaTrash, FaMicrophone, FaImage, FaPlus } from 'react-icons/fa';
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
    points: number;
    media_url?: string;
    media_type?: 'image' | 'audio';
    // State UI
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
        // [FIX 1] Giá trị mặc định phải khớp ENUM trong DB
        view_answer_mode: 'after_close',
        is_shuffled: false,
    });

    const [sections, setSections] = useState<Section[]>([
        { id: 'sec-1', title: 'Phần 1', description: '', questions: [] },
    ]);

    useEffect(() => {
        if (!selectedClass) {
            alert('Cảnh báo: Bạn chưa chọn lớp học. Vui lòng chọn lớp trước khi lưu đề.');
        }
    }, [selectedClass]);

    // --- 1. Upload Handler ---
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
            alert('Lỗi upload file. Vui lòng thử lại.');
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

    // --- 2. State Update Handlers ---
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
            points: 1,
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

    // --- 3. Save Handler (Core Logic Fix) ---
    const handleSave = async () => {
        if (!settings.title) return alert('Vui lòng nhập tên đề thi!');
        if (!selectedClass) return alert('Lỗi: Không tìm thấy ID lớp học. Vui lòng chọn lớp!');

        setLoading(true);

        try {
            const formatDate = (dateString: string) => {
                if (!dateString) return null;
                return dateString.replace('T', ' ') + ':00';
            };

            // [FIX 2] Hàm Map loại câu hỏi từ Frontend -> Database ENUM
            const mapQuestionType = (feType: string) => {
                switch (feType) {
                    case 'fill_blank':
                        return 'fill_in_blank'; // Frontend 'fill_blank' -> DB 'fill_in_blank'
                    case 'reorder':
                        return 'ordering'; // Frontend 'reorder' -> DB 'ordering'
                    default:
                        return feType; // 'multiple_choice', 'matching' giữ nguyên
                }
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
                        content_data = {
                            correct_answer: q.correctAnswer,
                        };
                    } else if (q.type === 'matching') {
                        content_data = {
                            pairs: q.pairs,
                        };
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
                        type: mapQuestionType(q.type), // Sử dụng hàm map đã fix
                        content: q.content || '',
                        points: q.points || 1,
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
                view_answer_mode: settings.view_answer_mode, // Đã fix ở Select bên dưới
                is_shuffled: settings.is_shuffled ? 1 : 0,
                sections: formattedSections,
            };

            console.log('Submitting payload:', payload);

            const res = await api.post('/exams/create', payload);

            if (res.status === 201) {
                alert('Tạo đề thi thành công!');
                onBack();
            }
        } catch (error: any) {
            console.error('Lỗi lưu đề:', error);
            const errorMsg =
                error.response?.data?.message ||
                error.response?.data?.error ||
                'Có lỗi xảy ra khi lưu đề thi.';
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
                <h3>{settings.title || 'Đề thi mới'}</h3>
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
                <div className="builder-settings">
                    <h4>Cấu hình</h4>
                    <div className="form-group">
                        <label>Tên bài thi</label>
                        <input
                            value={settings.title}
                            onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                            placeholder="Nhập tên bài thi..."
                        />
                    </div>
                    <div className="form-group">
                        <label>Mô tả ngắn</label>
                        <textarea
                            style={{
                                width: '100%',
                                padding: 8,
                                border: '1px solid #ccc',
                                borderRadius: 4,
                            }}
                            value={settings.description}
                            onChange={(e) =>
                                setSettings({ ...settings, description: e.target.value })
                            }
                        />
                    </div>
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
                        <label>Số lượt làm</label>
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
                                style={{ width: '60px', marginRight: '10px' }}
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
                        <label>Thời gian mở</label>
                        <input
                            type="datetime-local"
                            value={settings.start_time}
                            onChange={(e) =>
                                setSettings({ ...settings, start_time: e.target.value })
                            }
                        />
                    </div>
                    <div className="form-group">
                        <label>Thời gian đóng</label>
                        <input
                            type="datetime-local"
                            value={settings.end_time}
                            onChange={(e) => setSettings({ ...settings, end_time: e.target.value })}
                        />
                    </div>

                    {/* [FIX 1] Select Values khớp DB: immediate, after_close, never */}
                    <div className="form-group">
                        <label>Xem đáp án</label>
                        <select
                            value={settings.view_answer_mode}
                            onChange={(e) =>
                                setSettings({ ...settings, view_answer_mode: e.target.value })
                            }
                        >
                            <option value="immediate">Ngay khi nộp</option>
                            <option value="after_close">Sau khi hết hạn</option>
                            <option value="never">Không cho xem</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={settings.is_shuffled}
                                onChange={(e) =>
                                    setSettings({ ...settings, is_shuffled: e.target.checked })
                                }
                            />{' '}
                            Trộn câu hỏi
                        </label>
                    </div>
                </div>

                {/* MAIN BUILDER AREA */}
                <div className="builder-content">
                    {sections.map((sec, secIdx) => (
                        <div key={sec.id} className="section-card">
                            <div className="section-header">
                                <input
                                    className="section-title-input"
                                    value={sec.title}
                                    onChange={(e) => updateSection(secIdx, 'title', e.target.value)}
                                    placeholder="Tiêu đề phần (Ví dụ: Reading Part 1)"
                                />
                                <button
                                    className="btn-icon-danger"
                                    onClick={() => {
                                        if (
                                            window.confirm(
                                                'Xoá phần này sẽ xoá hết câu hỏi bên trong?'
                                            )
                                        ) {
                                            const newSecs = sections.filter((_, i) => i !== secIdx);
                                            setSections(newSecs);
                                        }
                                    }}
                                >
                                    <FaTrash />
                                </button>
                            </div>

                            <div className="section-meta">
                                <textarea
                                    className="section-desc-input"
                                    placeholder="Nhập hướng dẫn chung hoặc đoạn văn bài đọc..."
                                    value={sec.description}
                                    onChange={(e) =>
                                        updateSection(secIdx, 'description', e.target.value)
                                    }
                                />
                                <div className="media-control">
                                    <label className="btn-upload">
                                        {loading ? (
                                            'Đang tải...'
                                        ) : (
                                            <>
                                                <FaMicrophone /> Audio chung
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            hidden
                                            accept="audio/*"
                                            onChange={(e) => {
                                                if (e.target.files?.[0])
                                                    handleMediaUpload(
                                                        e.target.files[0],
                                                        'section',
                                                        secIdx
                                                    );
                                            }}
                                        />
                                    </label>
                                    {sec.media_url && sec.media_type === 'audio' && (
                                        <div className="audio-preview">
                                            <audio controls src={sec.media_url} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="questions-container">
                                {sec.questions.map((q, qIdx) => (
                                    <div key={q.id} className="question-card">
                                        <div className="q-header-row">
                                            <span className="q-type-badge">
                                                {q.type === 'multiple_choice'
                                                    ? 'Trắc nghiệm'
                                                    : q.type === 'fill_blank'
                                                      ? 'Điền từ'
                                                      : q.type === 'matching'
                                                        ? 'Nối'
                                                        : 'Sắp xếp'}
                                            </span>
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
                                                title="Điểm số"
                                            />
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

                                        <div className="q-body">
                                            <div className="q-content-row">
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
                                                    placeholder="Nhập nội dung câu hỏi..."
                                                />
                                                <label className="btn-icon-upload" title="Thêm ảnh">
                                                    <FaImage />
                                                    <input
                                                        type="file"
                                                        hidden
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            if (e.target.files?.[0])
                                                                handleMediaUpload(
                                                                    e.target.files[0],
                                                                    'question',
                                                                    secIdx,
                                                                    qIdx
                                                                );
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                            {q.media_url && (
                                                <img
                                                    src={q.media_url}
                                                    alt="Question Media"
                                                    className="q-media-preview"
                                                />
                                            )}

                                            {q.type === 'multiple_choice' && (
                                                <div className="q-options-list">
                                                    {q.options?.map((opt, optIdx) => (
                                                        <div key={opt.id} className="option-row">
                                                            <input
                                                                type="radio"
                                                                name={`correct-${q.id}`}
                                                                checked={opt.isCorrect}
                                                                onChange={() => {
                                                                    const newSecs = [...sections];
                                                                    const opts =
                                                                        newSecs[secIdx].questions[
                                                                            qIdx
                                                                        ].options || [];
                                                                    opts.forEach(
                                                                        (o) => (o.isCorrect = false)
                                                                    );
                                                                    opts[optIdx].isCorrect = true;
                                                                    setSections(newSecs);
                                                                }}
                                                            />
                                                            <input
                                                                className="option-text-input"
                                                                value={opt.text}
                                                                onChange={(e) =>
                                                                    updateDeep(
                                                                        secIdx,
                                                                        qIdx,
                                                                        'options',
                                                                        optIdx,
                                                                        'text',
                                                                        e.target.value
                                                                    )
                                                                }
                                                                placeholder={`Lựa chọn ${optIdx + 1}`}
                                                            />
                                                            <button
                                                                className="btn-icon-danger small"
                                                                onClick={() => {
                                                                    const newSecs = [...sections];
                                                                    newSecs[secIdx].questions[
                                                                        qIdx
                                                                    ].options?.splice(optIdx, 1);
                                                                    setSections(newSecs);
                                                                }}
                                                            >
                                                                x
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        className="btn-dashed"
                                                        onClick={() => {
                                                            const newSecs = [...sections];
                                                            newSecs[secIdx].questions[
                                                                qIdx
                                                            ].options?.push({
                                                                id: `opt-${Date.now()}`,
                                                                text: '',
                                                                isCorrect: false,
                                                            });
                                                            setSections(newSecs);
                                                        }}
                                                    >
                                                        + Thêm lựa chọn
                                                    </button>
                                                </div>
                                            )}

                                            {q.type === 'fill_blank' && (
                                                <div className="q-fill-input">
                                                    <label>Đáp án đúng:</label>
                                                    <input
                                                        value={q.correctAnswer || ''}
                                                        onChange={(e) =>
                                                            updateQuestion(
                                                                secIdx,
                                                                qIdx,
                                                                'correctAnswer',
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Nhập đáp án chính xác..."
                                                    />
                                                </div>
                                            )}

                                            {q.type === 'matching' && (
                                                <div className="q-matching-list">
                                                    <p className="hint-text">
                                                        Nhập các cặp tương ứng (Học sinh sẽ thấy thứ
                                                        tự bị xáo trộn)
                                                    </p>
                                                    {q.pairs?.map((pair, pIdx) => (
                                                        <div key={pair.id} className="pair-row">
                                                            <input
                                                                placeholder="Vế trái (A)"
                                                                value={pair.left}
                                                                onChange={(e) =>
                                                                    updateDeep(
                                                                        secIdx,
                                                                        qIdx,
                                                                        'pairs',
                                                                        pIdx,
                                                                        'left',
                                                                        e.target.value
                                                                    )
                                                                }
                                                            />
                                                            <span>↔</span>
                                                            <input
                                                                placeholder="Vế phải (B)"
                                                                value={pair.right}
                                                                onChange={(e) =>
                                                                    updateDeep(
                                                                        secIdx,
                                                                        qIdx,
                                                                        'pairs',
                                                                        pIdx,
                                                                        'right',
                                                                        e.target.value
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    ))}
                                                    <button
                                                        className="btn-dashed"
                                                        onClick={() => {
                                                            const newSecs = [...sections];
                                                            newSecs[secIdx].questions[
                                                                qIdx
                                                            ].pairs?.push({
                                                                id: `p-${Date.now()}`,
                                                                left: '',
                                                                right: '',
                                                            });
                                                            setSections(newSecs);
                                                        }}
                                                    >
                                                        + Thêm cặp
                                                    </button>
                                                </div>
                                            )}

                                            {q.type === 'reorder' && (
                                                <div className="q-reorder-list">
                                                    <p className="hint-text">
                                                        Nhập các câu theo đúng thứ tự (Hệ thống sẽ
                                                        xáo trộn)
                                                    </p>
                                                    {q.orderItems?.map((item, iIdx) => (
                                                        <div key={item.id} className="reorder-row">
                                                            <span className="order-idx">
                                                                {iIdx + 1}
                                                            </span>
                                                            <input
                                                                value={item.text}
                                                                onChange={(e) =>
                                                                    updateDeep(
                                                                        secIdx,
                                                                        qIdx,
                                                                        'orderItems',
                                                                        iIdx,
                                                                        'text',
                                                                        e.target.value
                                                                    )
                                                                }
                                                                placeholder="Nội dung câu..."
                                                            />
                                                        </div>
                                                    ))}
                                                    <button
                                                        className="btn-dashed"
                                                        onClick={() => {
                                                            const newSecs = [...sections];
                                                            const items =
                                                                newSecs[secIdx].questions[qIdx]
                                                                    .orderItems || [];
                                                            items.push({
                                                                id: `ord-${Date.now()}`,
                                                                text: '',
                                                                order: items.length + 1,
                                                            });
                                                            setSections(newSecs);
                                                        }}
                                                    >
                                                        + Thêm dòng
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
