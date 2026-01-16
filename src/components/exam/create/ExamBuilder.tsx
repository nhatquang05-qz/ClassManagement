import React, { useState, useEffect, useMemo } from 'react';
import {
    FaArrowLeft,
    FaSave,
    FaTrash,
    FaMicrophone,
    FaImage,
    FaPlus,
    FaCalculator,
    FaMagic,
} from 'react-icons/fa';
import { useClass } from '../../../contexts/ClassContext';
import api from '../../../utils/api';
import '../../../assets/styles/ExamBuilder.css';

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
    section_points?: number;
    questions: Question[];
}

const ExamBuilder = ({ onBack, examId }: { onBack: () => void; examId?: number | null }) => {
    const { selectedClass } = useClass();
    const [loading, setLoading] = useState(false);

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
        { id: 'sec-1', title: 'Phần 1', description: '', section_points: 0, questions: [] },
    ]);

    const totalScore = useMemo(() => {
        return sections.reduce(
            (acc, sec) =>
                acc + sec.questions.reduce((qAcc, q) => qAcc + (Number(q.points) || 0), 0),
            0
        );
    }, [sections]);

    useEffect(() => {
        if (examId) {
            setLoading(true);
            api.get(`/exams/${examId}`)
                .then((res) => {
                    const data = res.data;
                    const formatForInput = (isoString: string) =>
                        isoString ? new Date(isoString).toISOString().slice(0, 16) : '';

                    setSettings({
                        title: data.title,
                        description: data.description || '',
                        duration: data.duration_minutes,
                        start_time: formatForInput(data.start_time),
                        end_time: formatForInput(data.end_time),
                        max_attempts: data.max_attempts,
                        is_unlimited_attempts: data.max_attempts === 999,
                        view_answer_mode: data.view_answer_mode,
                        is_shuffled: Boolean(data.is_shuffled),
                    });

                    if (data.sections && data.sections.length > 0) {
                        const mappedSections = data.sections.map((sec: any) => ({
                            id: `sec-${sec.id}`,
                            title: sec.title,
                            description: sec.description,
                            media_url: sec.media_url,
                            media_type: sec.media_type,
                            section_points: 0,
                            questions: sec.questions.map((q: any) => ({
                                id: `q-${q.id}`,
                                type: q.type,
                                content: q.content,
                                points: q.points,
                                media_url: q.media_url,
                                options: q.content_data.options?.map((o: any) => ({
                                    ...o,
                                    isCorrect: q.content_data.correct_ids?.includes(o.id),
                                })),
                                correctAnswer: q.content_data.correct_answer,
                                pairs: q.content_data.pairs,
                                orderItems: q.content_data.items,
                            })),
                        }));
                        setSections(mappedSections);
                    }
                })
                .catch(() => alert('Lỗi tải đề thi để sửa'))
                .finally(() => setLoading(false));
        }
    }, [examId]);

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
            console.error('Upload failed');
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
                newSections[secIdx] = { ...newSections[secIdx], media_url: url, media_type: type };
            } else if (typeof qIdx === 'number') {
                const newQuestions = [...newSections[secIdx].questions];
                newQuestions[qIdx] = { ...newQuestions[qIdx], media_url: url, media_type: type };
                newSections[secIdx].questions = newQuestions;
            }
            setSections(newSections);
        }
        setLoading(false);
    };

    const distributePoints = (currentSections: Section[], secIdx: number) => {
        const section = currentSections[secIdx];
        const totalP = Number(section.section_points) || 0;
        const qCount = section.questions.length;

        if (qCount > 0 && totalP > 0) {
            const avgPoints = parseFloat((totalP / qCount).toFixed(2));

            const updatedQuestions = section.questions.map((q, index) => {
                let newPoints = avgPoints;
                if (index === qCount - 1) {
                    const sumOthers = avgPoints * (qCount - 1);
                    newPoints = parseFloat((totalP - sumOthers).toFixed(2));
                }
                return { ...q, points: newPoints };
            });
            currentSections[secIdx] = { ...section, questions: updatedQuestions };
        }
        return currentSections;
    };

    const handleSectionPointsChange = (secIdx: number, value: number) => {
        let newSections = [...sections];
        newSections[secIdx] = { ...newSections[secIdx], section_points: value };
        newSections = distributePoints(newSections, secIdx);
        setSections(newSections);
    };

    const updateSection = (idx: number, field: keyof Section, value: any) => {
        const newSections = [...sections];
        newSections[idx] = { ...newSections[idx], [field]: value };
        setSections(newSections);
    };

    const addQuestion = (secIdx: number, type: Question['type']) => {
        let newSections = [...sections];
        const newQ: Question = {
            id: `q-${Date.now()}`,
            type,
            content: '',
            points: 0,
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

        newSections[secIdx] = {
            ...newSections[secIdx],
            questions: [...newSections[secIdx].questions, newQ],
        };

        if ((newSections[secIdx].section_points || 0) > 0) {
            newSections = distributePoints(newSections, secIdx);
        }

        setSections(newSections);
    };

    const deleteQuestion = (secIdx: number, qIdx: number) => {
        let newSections = [...sections];
        const newQuestions = [...newSections[secIdx].questions];
        newQuestions.splice(qIdx, 1);
        newSections[secIdx] = { ...newSections[secIdx], questions: newQuestions };

        if ((newSections[secIdx].section_points || 0) > 0) {
            newSections = distributePoints(newSections, secIdx);
        }
        setSections(newSections);
    };

    const updateQuestion = (secIdx: number, qIdx: number, field: keyof Question, value: any) => {
        const newSections = [...sections];
        const newQuestions = [...newSections[secIdx].questions];
        newQuestions[qIdx] = { ...newQuestions[qIdx], [field]: value };
        newSections[secIdx] = { ...newSections[secIdx], questions: newQuestions };
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
        const newQuestions = [...newSections[secIdx].questions];

        const targetArray = [...(newQuestions[qIdx][arrayField] as any[])];
        targetArray[itemIdx] = { ...targetArray[itemIdx], [key]: value };

        newQuestions[qIdx] = { ...newQuestions[qIdx], [arrayField]: targetArray };
        newSections[secIdx] = { ...newSections[secIdx], questions: newQuestions };
        setSections(newSections);
    };

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
                        points: Number(q.points) || 0,
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

            if (examId) {
                await api.put(`/exams/${examId}`, payload);
                alert('Cập nhật đề thi thành công!');
            } else {
                await api.post('/exams/create', payload);
                alert('Tạo đề thi thành công!');
            }
            onBack();
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra.';
            alert(`Lỗi Server: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="exam-builder-container">
            <div className="exam-builder-header">
                <button onClick={onBack} className="exam-builder-btn exam-builder-btn-back">
                    <FaArrowLeft /> Quay lại
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h3>{examId ? 'Chỉnh sửa đề thi' : 'Tạo đề thi mới'}</h3>
                    <span className="exam-builder-total-score">
                        <FaCalculator style={{ marginRight: 5 }} /> Tổng điểm: {totalScore}
                    </span>
                </div>
                <button
                    className="exam-builder-btn exam-builder-btn-primary"
                    onClick={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        'Đang xử lý...'
                    ) : (
                        <>
                            <FaSave /> {examId ? 'Cập Nhật' : 'Lưu Đề Thi'}
                        </>
                    )}
                </button>
            </div>

            <div className="exam-builder-body">
                <div className="exam-builder-sidebar">
                    <h4>Cấu hình</h4>
                    <div className="exam-builder-form-group">
                        <label>Tên bài thi</label>
                        <input
                            className="exam-builder-input"
                            value={settings.title}
                            onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                        />
                    </div>
                    <div className="exam-builder-form-group">
                        <label>Thời gian (phút)</label>
                        <input
                            className="exam-builder-input"
                            type="number"
                            value={settings.duration}
                            onChange={(e) =>
                                setSettings({ ...settings, duration: Number(e.target.value) })
                            }
                        />
                    </div>
                    <div className="exam-builder-form-group">
                        <label>Lượt làm</label>
                        <div className="exam-builder-flex-center">
                            <input
                                className="exam-builder-input"
                                type="number"
                                value={settings.max_attempts}
                                disabled={settings.is_unlimited_attempts}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        max_attempts: Number(e.target.value),
                                    })
                                }
                                style={{ width: 60 }}
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
                    <div className="exam-builder-form-group">
                        <label>Mở</label>
                        <input
                            className="exam-builder-input"
                            type="datetime-local"
                            value={settings.start_time}
                            onChange={(e) =>
                                setSettings({ ...settings, start_time: e.target.value })
                            }
                        />
                    </div>
                    <div className="exam-builder-form-group">
                        <label>Đóng</label>
                        <input
                            className="exam-builder-input"
                            type="datetime-local"
                            value={settings.end_time}
                            onChange={(e) => setSettings({ ...settings, end_time: e.target.value })}
                        />
                    </div>
                    <div className="exam-builder-form-group">
                        <label>Xem đáp án</label>
                        <select
                            className="exam-builder-select"
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
                    <div className="exam-builder-form-group">
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

                <div className="exam-builder-content">
                    {sections.map((sec, secIdx) => (
                        <div key={sec.id} className="exam-builder-section">
                            <div className="exam-builder-section-header">
                                <input
                                    className="exam-builder-section-title"
                                    value={sec.title}
                                    onChange={(e) => updateSection(secIdx, 'title', e.target.value)}
                                    placeholder="Tiêu đề phần"
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div className="exam-builder-section-points">
                                        <label
                                            style={{
                                                marginRight: 5,
                                                fontSize: '0.85rem',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            Điểm phần này:
                                        </label>
                                        <input
                                            type="number"
                                            style={{
                                                width: 60,
                                                textAlign: 'center',
                                                fontWeight: 'bold',
                                                border: '1px solid #ccc',
                                                borderRadius: 4,
                                            }}
                                            value={sec.section_points || ''}
                                            placeholder="0"
                                            onChange={(e) =>
                                                handleSectionPointsChange(
                                                    secIdx,
                                                    Number(e.target.value)
                                                )
                                            }
                                        />
                                        <span
                                            title="Tự động chia đều"
                                            style={{
                                                marginLeft: 5,
                                                cursor: 'help',
                                                color: '#007bff',
                                            }}
                                        >
                                            <FaMagic />
                                        </span>
                                    </div>
                                    <button
                                        className="exam-builder-btn-icon-danger"
                                        onClick={() => {
                                            if (window.confirm('Xoá phần này?'))
                                                setSections(
                                                    sections.filter((_, i) => i !== secIdx)
                                                );
                                        }}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                            <div className="exam-builder-form-group">
                                <textarea
                                    className="exam-builder-textarea"
                                    placeholder="Mô tả/Đoạn văn..."
                                    value={sec.description}
                                    onChange={(e) =>
                                        updateSection(secIdx, 'description', e.target.value)
                                    }
                                />
                                <div style={{ marginTop: '0.5rem' }}>
                                    <label className="exam-builder-btn-upload">
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
                                        <div className="exam-builder-media-preview">
                                            <audio controls src={sec.media_url} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                {sec.questions.map((q, qIdx) => (
                                    <div key={q.id} className="exam-builder-question">
                                        <div className="exam-builder-q-header">
                                            <span className="exam-builder-q-badge">{q.type}</span>
                                            <div className="exam-builder-q-points-wrapper">
                                                <label
                                                    style={{ marginRight: 5, fontSize: '0.8rem' }}
                                                >
                                                    Điểm:
                                                </label>
                                                <input
                                                    type="number"
                                                    className="exam-builder-q-points-input"
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
                                                className="exam-builder-btn-icon-danger"
                                                onClick={() => deleteQuestion(secIdx, qIdx)}
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>

                                        <div className="exam-builder-q-body">
                                            <input
                                                className="exam-builder-q-content-input"
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
                                            <label className="exam-builder-btn-upload">
                                                <FaImage /> Thêm ảnh
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
                                            {q.media_url && (
                                                <img
                                                    src={q.media_url}
                                                    alt="Question"
                                                    className="exam-builder-media-preview"
                                                />
                                            )}

                                            {q.type === 'multiple_choice' && (
                                                <div className="exam-builder-q-options-list">
                                                    {q.options?.map((opt, i) => (
                                                        <div
                                                            key={opt.id}
                                                            className="exam-builder-option-row"
                                                        >
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
                                                                className="exam-builder-option-input"
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
                                                                className="exam-builder-btn-icon-danger"
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
                                                        className="exam-builder-btn-dashed"
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
                                                    className="exam-builder-input"
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
                                                        <div
                                                            key={p.id}
                                                            className="exam-builder-pair-row"
                                                        >
                                                            <input
                                                                className="exam-builder-option-input"
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
                                                                className="exam-builder-option-input"
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
                                                        className="exam-builder-btn-dashed"
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
                                                        <div
                                                            key={o.id}
                                                            className="exam-builder-reorder-row"
                                                        >
                                                            <span>{i + 1}</span>
                                                            <input
                                                                className="exam-builder-option-input"
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
                                                        className="exam-builder-btn-dashed"
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
                            <div className="exam-builder-section-toolbar">
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
                        className="exam-builder-btn exam-builder-btn-add-section"
                        onClick={() =>
                            setSections([
                                ...sections,
                                {
                                    id: `sec-${Date.now()}`,
                                    title: `Phần ${sections.length + 1}`,
                                    description: '',
                                    section_points: 0,
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
