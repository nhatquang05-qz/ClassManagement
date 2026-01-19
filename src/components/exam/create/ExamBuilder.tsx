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

interface ExamBuilderProps {
    onBack: () => void;
    onSuccess?: () => void;
    examId?: number | null;
    classId: number;
    initialData?: any;
}

const ExamBuilder: React.FC<ExamBuilderProps> = ({
    onBack,
    onSuccess,
    examId,
    classId,
    initialData,
}) => {
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
        const dataToLoad = initialData;

        if (dataToLoad) {
            const formatForInput = (isoString: string) =>
                isoString ? new Date(isoString).toISOString().slice(0, 16) : '';

            setSettings({
                title: dataToLoad.title,
                description: dataToLoad.description || '',

                duration: dataToLoad.duration_minutes || dataToLoad.duration || 45,
                start_time: formatForInput(dataToLoad.start_time),
                end_time: formatForInput(dataToLoad.end_time),
                max_attempts: dataToLoad.max_attempts || 1,
                is_unlimited_attempts: dataToLoad.max_attempts === 999,
                view_answer_mode: dataToLoad.view_answer_mode || 'after_close',
                is_shuffled: Boolean(dataToLoad.is_shuffled),
            });

            if (dataToLoad.sections && dataToLoad.sections.length > 0) {
                const mappedSections = dataToLoad.sections.map((sec: any) => ({
                    id: `sec-${sec.id}`,
                    title: sec.title,
                    description: sec.description || '',
                    media_url: sec.media_url,
                    media_type: sec.media_type,
                    section_points: 0,
                    questions:
                        sec.questions?.map((q: any) => {
                            let parsedData: any = {};
                            try {
                                parsedData =
                                    typeof q.content_data === 'string'
                                        ? JSON.parse(q.content_data)
                                        : q.content_data || {};
                            } catch (e) {
                                parsedData = {};
                            }

                            let type: Question['type'] = 'multiple_choice';
                            if (q.type === 'fill_in_blank') type = 'fill_blank';
                            else if (q.type === 'ordering') type = 'reorder';
                            else type = q.type;

                            return {
                                id: `q-${q.id}`,
                                type: type,
                                content: q.content,
                                points: Number(q.points),
                                media_url: q.media_url,
                                options: parsedData.options?.map((o: any) => ({
                                    ...o,
                                    isCorrect: parsedData.correct_ids?.includes(o.id),
                                })),
                                correctAnswer: parsedData.correct_answer,
                                pairs: parsedData.pairs,
                                orderItems: parsedData.items,
                            };
                        }) || [],
                }));
                setSections(mappedSections);
            } else if (dataToLoad.questions) {
            }
        }
    }, [initialData, examId]);

    const handleFileUpload = async (file: File): Promise<string | null> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'file');

        try {
            const res = await api.post('/materials', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data.url;
        } catch (error) {
            console.error('Upload failed', error);
            return URL.createObjectURL(file);
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
            let avgPoints = Math.floor((totalP / qCount) * 100) / 100;

            let currentSum = avgPoints * (qCount - 1);

            let lastPoints = parseFloat((totalP - currentSum).toFixed(2));

            const updatedQuestions = section.questions.map((q, index) => {
                let newPoints = avgPoints;
                if (index === qCount - 1) {
                    newPoints = lastPoints;
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
            correctAnswer: '',
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
        if (!selectedClass && !classId) return alert('Lỗi: Không tìm thấy ID lớp học.');

        setLoading(true);
        try {
            const formatDate = (dateString: string) =>
                dateString ? dateString.replace('T', ' ') + ':00' : null;

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

                    let backendType = q.type;
                    if (q.type === 'fill_blank') backendType = 'fill_in_blank' as any;
                    if (q.type === 'reorder') backendType = 'ordering' as any;

                    return {
                        type: backendType,
                        content: q.content || '',
                        points: Number(q.points) || 0,
                        media_url: q.media_url || null,
                        content_data: content_data,
                    };
                }),
            }));

            const payload = {
                class_id: classId || selectedClass?.id,
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

            if (examId || initialData?.id) {
                await api.put(`/exams/${examId || initialData.id}`, payload);
                alert('Cập nhật đề thi thành công!');
            } else {
                await api.post('/exams/create', payload);
                alert('Tạo đề thi thành công!');
            }

            if (onSuccess) onSuccess();
            else onBack();
        } catch (error: any) {
            console.error(error);
            const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra.';
            alert(`Lỗi Server: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="exam-builder-container">
            <div className="builder-header">
                <button onClick={onBack} className="btn-back">
                    <FaArrowLeft /> Quay lại
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h2>{examId || initialData ? 'Chỉnh sửa đề thi' : 'Tạo đề thi mới'}</h2>
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>
                        <FaCalculator style={{ marginRight: 5 }} /> Tổng điểm: <b>{totalScore}</b>
                    </span>
                </div>
                <button className="btn-save" onClick={handleSave} disabled={loading}>
                    {loading ? (
                        'Đang lưu...'
                    ) : (
                        <>
                            <FaSave /> Lưu Đề Thi
                        </>
                    )}
                </button>
            </div>

            <div className="exam-builder-body">
                <div className="exam-info-card">
                    <h4>Cấu hình chung</h4>
                    <div className="form-group">
                        <label>Tên bài thi</label>
                        <input
                            value={settings.title}
                            onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                            placeholder="VD: Kiểm tra 1 tiết"
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
                        <label>Lượt làm bài</label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
                                style={{ width: '60px' }}
                            />
                            <label
                                style={{
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: 0,
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={settings.is_unlimited_attempts}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            is_unlimited_attempts: e.target.checked,
                                        })
                                    }
                                    style={{ marginRight: '5px' }}
                                />{' '}
                                Không giới hạn
                            </label>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Bắt đầu lúc</label>
                        <input
                            type="datetime-local"
                            value={settings.start_time}
                            onChange={(e) =>
                                setSettings({ ...settings, start_time: e.target.value })
                            }
                        />
                    </div>
                    <div className="form-group">
                        <label>Kết thúc lúc</label>
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
                            <option value="after_close">Sau khi đóng đề</option>
                            <option value="never">Không cho xem</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={settings.is_shuffled}
                                onChange={(e) =>
                                    setSettings({ ...settings, is_shuffled: e.target.checked })
                                }
                                style={{ marginRight: '8px' }}
                            />
                            Trộn câu hỏi ngẫu nhiên
                        </label>
                    </div>
                </div>

                <div style={{ flex: 1, paddingRight: '5px' }}>
                    {sections.map((sec, secIdx) => (
                        <div
                            key={sec.id}
                            className="exam-info-card"
                            style={{ marginBottom: '20px', width: 'auto' }}
                        >
                            <div className="q-header">
                                <div style={{ flex: 1, marginRight: '15px' }}>
                                    <input
                                        className="exam-builder-section-title"
                                        value={sec.title}
                                        onChange={(e) =>
                                            updateSection(secIdx, 'title', e.target.value)
                                        }
                                        placeholder="Tiêu đề phần (VD: Phần 1 - Trắc nghiệm)"
                                    />
                                    <textarea
                                        value={sec.description}
                                        onChange={(e) =>
                                            updateSection(secIdx, 'description', e.target.value)
                                        }
                                        placeholder="Mô tả phần thi..."
                                        rows={1}
                                        style={{
                                            width: '100%',
                                            border: 'none',
                                            background: 'transparent',
                                            resize: 'none',
                                            fontSize: '0.9rem',
                                            color: '#666',
                                            outline: 'none',
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                        }}
                                    >
                                        <span style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                            Điểm phần:
                                        </span>
                                        <input
                                            type="number"
                                            value={sec.section_points || ''}
                                            placeholder="0"
                                            onChange={(e) =>
                                                handleSectionPointsChange(
                                                    secIdx,
                                                    Number(e.target.value)
                                                )
                                            }
                                            style={{
                                                width: '50px',
                                                padding: '5px',
                                                textAlign: 'center',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                            }}
                                        />
                                        <button
                                            title="Chia đều điểm"
                                            style={{
                                                border: 'none',
                                                background: 'none',
                                                cursor: 'pointer',
                                                color: '#3498db',
                                            }}
                                            onClick={() =>
                                                handleSectionPointsChange(
                                                    secIdx,
                                                    sec.section_points || 0
                                                )
                                            }
                                        >
                                            <FaMagic />
                                        </button>
                                    </div>
                                    <button
                                        className="btn-remove-q"
                                        onClick={() => {
                                            if (window.confirm('Xóa phần này?'))
                                                setSections(
                                                    sections.filter((_, i) => i !== secIdx)
                                                );
                                        }}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>

                            <div className="questions-list">
                                {sec.questions.map((q, qIdx) => (
                                    <div key={q.id} className="question-card">
                                        <div className="q-header">
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        background: '#e1f5fe',
                                                        color: '#0288d1',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 'bold',
                                                    }}
                                                >
                                                    {q.type === 'multiple_choice'
                                                        ? 'Trắc nghiệm'
                                                        : q.type === 'fill_blank'
                                                          ? 'Điền từ'
                                                          : q.type === 'matching'
                                                            ? 'Nối cột'
                                                            : 'Sắp xếp'}
                                                </span>
                                                <span style={{ fontSize: '0.9rem', color: '#666' }}>
                                                    Câu {qIdx + 1}
                                                </span>
                                            </div>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                }}
                                            >
                                                <label style={{ fontSize: '0.85rem' }}>Điểm:</label>
                                                <input
                                                    type="number"
                                                    value={q.points}
                                                    onChange={(e) =>
                                                        updateQuestion(
                                                            secIdx,
                                                            qIdx,
                                                            'points',
                                                            Number(e.target.value)
                                                        )
                                                    }
                                                    className="points-input"
                                                />
                                                <button
                                                    className="btn-remove-q"
                                                    onClick={() => deleteQuestion(secIdx, qIdx)}
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="q-content">
                                            <textarea
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

                                            <div style={{ marginBottom: '10px' }}>
                                                <label className="exam-builder-btn-upload">
                                                    <FaImage /> Thêm ảnh/Audio
                                                    <input
                                                        type="file"
                                                        hidden
                                                        accept="image/*,audio/*"
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
                                                    <div style={{ marginTop: '5px' }}>
                                                        {q.media_type === 'audio' ? (
                                                            <audio controls src={q.media_url} />
                                                        ) : (
                                                            <img
                                                                src={q.media_url}
                                                                alt="Question media"
                                                                style={{
                                                                    maxWidth: '200px',
                                                                    borderRadius: '4px',
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {q.type === 'multiple_choice' && (
                                                <div className="q-options">
                                                    {q.options?.map((opt, i) => (
                                                        <div key={opt.id} className="option-row">
                                                            <input
                                                                type="radio"
                                                                name={`q-${q.id}`}
                                                                checked={opt.isCorrect}
                                                                onChange={() => {
                                                                    const ns = [...sections];
                                                                    ns[secIdx].questions[
                                                                        qIdx
                                                                    ].options?.forEach(
                                                                        (o) => (o.isCorrect = false)
                                                                    );
                                                                    if (
                                                                        ns[secIdx].questions[qIdx]
                                                                            .options
                                                                    )
                                                                        ns[secIdx].questions[
                                                                            qIdx
                                                                        ].options![i].isCorrect =
                                                                            true;
                                                                    setSections(ns);
                                                                }}
                                                            />
                                                            <input
                                                                type="text"
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
                                                                placeholder={`Đáp án ${i + 1}`}
                                                            />
                                                            <button
                                                                className="btn-remove-q"
                                                                style={{
                                                                    width: '24px',
                                                                    height: '24px',
                                                                }}
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
                                                        style={{
                                                            background: 'none',
                                                            border: '1px dashed #ccc',
                                                            padding: '5px',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.85rem',
                                                            color: '#666',
                                                            marginTop: '5px',
                                                            width: '100%',
                                                        }}
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
                                                        + Thêm đáp án
                                                    </button>
                                                </div>
                                            )}

                                            {q.type === 'fill_blank' && (
                                                <input
                                                    type="text"
                                                    value={q.correctAnswer}
                                                    onChange={(e) =>
                                                        updateQuestion(
                                                            secIdx,
                                                            qIdx,
                                                            'correctAnswer',
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Nhập đáp án đúng (chính xác từng ký tự)..."
                                                    style={{
                                                        width: '100%',
                                                        padding: '10px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px',
                                                    }}
                                                />
                                            )}

                                            {q.type === 'matching' && (
                                                <div className="q-options">
                                                    {q.pairs?.map((p, i) => (
                                                        <div key={p.id} className="option-row">
                                                            <input
                                                                type="text"
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
                                                                placeholder="Vế trái"
                                                                style={{ flex: 1 }}
                                                            />
                                                            <span>-</span>
                                                            <input
                                                                type="text"
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
                                                                placeholder="Vế phải"
                                                                style={{ flex: 1 }}
                                                            />
                                                            <button
                                                                className="btn-remove-q"
                                                                style={{
                                                                    width: '24px',
                                                                    height: '24px',
                                                                }}
                                                                onClick={() => {
                                                                    const ns = [...sections];
                                                                    ns[secIdx].questions[
                                                                        qIdx
                                                                    ].pairs?.splice(i, 1);
                                                                    setSections(ns);
                                                                }}
                                                            >
                                                                x
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        style={{
                                                            background: 'none',
                                                            border: '1px dashed #ccc',
                                                            padding: '5px',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.85rem',
                                                            color: '#666',
                                                            marginTop: '5px',
                                                            width: '100%',
                                                        }}
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
                                                        + Thêm cặp nối
                                                    </button>
                                                </div>
                                            )}

                                            {q.type === 'reorder' && (
                                                <div className="q-options">
                                                    {q.orderItems?.map((o, i) => (
                                                        <div key={o.id} className="option-row">
                                                            <span
                                                                style={{
                                                                    fontWeight: 'bold',
                                                                    width: '20px',
                                                                }}
                                                            >
                                                                {i + 1}.
                                                            </span>
                                                            <input
                                                                type="text"
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
                                                                placeholder="Nội dung"
                                                                style={{ flex: 1 }}
                                                            />
                                                            <button
                                                                className="btn-remove-q"
                                                                style={{
                                                                    width: '24px',
                                                                    height: '24px',
                                                                }}
                                                                onClick={() => {
                                                                    const ns = [...sections];
                                                                    ns[secIdx].questions[
                                                                        qIdx
                                                                    ].orderItems?.splice(i, 1);
                                                                    setSections(ns);
                                                                }}
                                                            >
                                                                x
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        style={{
                                                            background: 'none',
                                                            border: '1px dashed #ccc',
                                                            padding: '5px',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.85rem',
                                                            color: '#666',
                                                            marginTop: '5px',
                                                            width: '100%',
                                                        }}
                                                        onClick={() => {
                                                            const ns = [...sections];
                                                            ns[secIdx].questions[
                                                                qIdx
                                                            ].orderItems?.push({
                                                                id: `ord-${Date.now()}`,
                                                                text: '',
                                                                order:
                                                                    ns[secIdx].questions[qIdx]
                                                                        .orderItems!.length + 1,
                                                            });
                                                            setSections(ns);
                                                        }}
                                                    >
                                                        + Thêm bước
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
                                    + Nối cột
                                </button>
                                <button onClick={() => addQuestion(secIdx, 'reorder')}>
                                    + Sắp xếp
                                </button>
                            </div>
                        </div>
                    ))}

                    <button
                        className="btn-add-q"
                        style={{ background: '#e8f5e9', borderColor: '#2ecc71', color: '#27ae60' }}
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
