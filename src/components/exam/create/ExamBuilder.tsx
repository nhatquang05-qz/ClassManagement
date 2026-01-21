import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaSave, FaArrowLeft, FaCloudUploadAlt } from 'react-icons/fa';
import api from '../../../utils/api';
import '../../../assets/styles/ExamBuilder.css';

interface Props {
    classId: number;
    onBack: () => void;
    examId?: number;
    initialData?: any;
}

const generateId = () => {
    return Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
};

const ExamBuilder: React.FC<Props> = ({ classId, onBack, examId, initialData }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [durationMinutes, setDurationMinutes] = useState(45);

    const [maxAttempts, setMaxAttempts] = useState(1);
    const [viewAnswerMode, setViewAnswerMode] = useState('immediate');
    const [isShuffled, setIsShuffled] = useState(false);

    const [sections, setSections] = useState<any[]>([
        { title: 'Phần 1', description: '', questions: [] },
    ]);

    const [showErrors, setShowErrors] = useState(false);

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setDescription(initialData.description || '');
            setStartTime(initialData.start_time ? initialData.start_time.slice(0, 16) : '');
            setEndTime(initialData.end_time ? initialData.end_time.slice(0, 16) : '');
            setDurationMinutes(initialData.duration_minutes);

            setMaxAttempts(initialData.max_attempts || 1);
            setViewAnswerMode(initialData.view_answer_mode || 'immediate');
            setIsShuffled(!!initialData.is_shuffled);

            setSections(initialData.sections || []);
        }
    }, [initialData]);

    const handleUploadMedia = async (file: File) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await api.post('/exams/upload-media', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data;
        } catch (error) {
            alert('Lỗi upload file. Vui lòng thử lại.');
            console.error(error);
            return null;
        }
    };

    const onFileChange = async (
        e: React.ChangeEvent<HTMLInputElement>,
        secIndex: number,
        qIndex: number
    ) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const data = await handleUploadMedia(file);

            if (data) {
                setSections((prev) => {
                    const newSections = [...prev];
                    const newQuestions = [...newSections[secIndex].questions];

                    newQuestions[qIndex] = {
                        ...newQuestions[qIndex],
                        media_url: data.url,
                        media_type: data.media_type,
                    };

                    newSections[secIndex] = {
                        ...newSections[secIndex],
                        questions: newQuestions,
                    };
                    return newSections;
                });
            }
        }
    };

    const removeMedia = (secIndex: number, qIndex: number) => {
        setSections((prev) => {
            const newSections = [...prev];
            const newQuestions = [...newSections[secIndex].questions];
            newQuestions[qIndex] = {
                ...newQuestions[qIndex],
                media_url: null,
                media_type: null,
            };
            newSections[secIndex].questions = newQuestions;
            return newSections;
        });
    };

    const addSection = () => {
        setSections([
            ...sections,
            { title: `Phần ${sections.length + 1}`, description: '', questions: [] },
        ]);
    };

    const addQuestion = (secIndex: number) => {
        const newSections = [...sections];
        newSections[secIndex].questions.push({
            type: 'multiple_choice',
            content: '',
            points: 1,
            media_url: '',
            media_type: '',
            content_data: {
                options: [
                    { id: generateId(), text: '' },
                    { id: generateId(), text: '' },
                    { id: generateId(), text: '' },
                    { id: generateId(), text: '' },
                ],
                correct_ids: [],
            },
        });
        setSections(newSections);
    };

    const handleTypeChange = (secIndex: number, qIndex: number, newType: string) => {
        const newSections = [...sections];
        const q = newSections[secIndex].questions[qIndex];
        q.type = newType;

        if (newType === 'multiple_choice') {
            q.content_data = {
                options: [
                    { id: generateId(), text: '' },
                    { id: generateId(), text: '' },
                ],
                correct_ids: [],
            };
        } else if (newType === 'fill_in_blank') {
            q.content_data = { correct_answer: '' };
        } else if (newType === 'matching') {
            q.content_data = {
                pairs: [{ id: generateId(), left: '', right: '' }],
            };
        } else if (newType === 'ordering') {
            q.content_data = {
                items: [{ id: generateId(), text: '', order: 1 }],
            };
        }

        setSections(newSections);
    };

    const updateQuestion = (secIndex: number, qIndex: number, field: string, value: any) => {
        const newSections = [...sections];
        newSections[secIndex].questions[qIndex][field] = value;
        setSections(newSections);
    };

    const toggleCorrectOption = (secIndex: number, qIndex: number, optId: string | number) => {
        const newSections = [...sections];
        const q = newSections[secIndex].questions[qIndex];
        const currentCorrect = q.content_data.correct_ids || [];
        const strOptId = String(optId);
        const exists = currentCorrect.some((id: any) => String(id) === strOptId);

        if (exists) {
            q.content_data.correct_ids = currentCorrect.filter(
                (id: any) => String(id) !== strOptId
            );
        } else {
            q.content_data.correct_ids = [...currentCorrect, strOptId];
        }
        setSections(newSections);
    };

    const addOption = (secIndex: number, qIndex: number) => {
        const newSections = [...sections];
        const options = newSections[secIndex].questions[qIndex].content_data.options;
        options.push({ id: generateId(), text: '' });
        setSections(newSections);
    };

    const removeOption = (secIndex: number, qIndex: number, optIndex: number) => {
        const newSections = [...sections];
        const q = newSections[secIndex].questions[qIndex];
        const options = q.content_data.options;
        const optIdToRemove = options[optIndex].id;
        options.splice(optIndex, 1);
        if (q.content_data.correct_ids) {
            q.content_data.correct_ids = q.content_data.correct_ids.filter(
                (id: any) => String(id) !== String(optIdToRemove)
            );
        }
        setSections(newSections);
    };

    const addPair = (secIndex: number, qIndex: number) => {
        const newSections = [...sections];
        newSections[secIndex].questions[qIndex].content_data.pairs.push({
            id: generateId(),
            left: '',
            right: '',
        });
        setSections(newSections);
    };
    const updatePair = (
        secIndex: number,
        qIndex: number,
        pIndex: number,
        field: 'left' | 'right',
        val: string
    ) => {
        const newSections = [...sections];
        newSections[secIndex].questions[qIndex].content_data.pairs[pIndex][field] = val;
        setSections(newSections);
    };
    const removePair = (secIndex: number, qIndex: number, pIndex: number) => {
        const newSections = [...sections];
        newSections[secIndex].questions[qIndex].content_data.pairs.splice(pIndex, 1);
        setSections(newSections);
    };

    const addOrderItem = (secIndex: number, qIndex: number) => {
        const newSections = [...sections];
        const items = newSections[secIndex].questions[qIndex].content_data.items;
        items.push({ id: generateId(), text: '', order: items.length + 1 });
        setSections(newSections);
    };
    const updateOrderItem = (secIndex: number, qIndex: number, itemIndex: number, val: string) => {
        const newSections = [...sections];
        newSections[secIndex].questions[qIndex].content_data.items[itemIndex].text = val;
        setSections(newSections);
    };
    const removeOrderItem = (secIndex: number, qIndex: number, itemIndex: number) => {
        const newSections = [...sections];
        newSections[secIndex].questions[qIndex].content_data.items.splice(itemIndex, 1);
        setSections(newSections);
    };

    const validateExam = () => {
        if (!title.trim()) return 'Tiêu đề bài thi không được để trống.';
        if (!startTime) return 'Vui lòng chọn thời gian bắt đầu.';
        if (!endTime) return 'Vui lòng chọn thời gian kết thúc.';
        if (new Date(startTime) >= new Date(endTime))
            return 'Thời gian kết thúc phải sau thời gian bắt đầu.';

        for (let i = 0; i < sections.length; i++) {
            const sec = sections[i];
            if (!sec.title.trim()) return `Phần thi thứ ${i + 1} chưa có tên.`;
            if (sec.questions.length === 0) return `Phần thi "${sec.title}" chưa có câu hỏi nào.`;

            for (let j = 0; j < sec.questions.length; j++) {
                const q = sec.questions[j];
                const qNum = `Câu ${j + 1} (Phần ${i + 1})`;

                if (!q.content.trim()) return `${qNum}: Nội dung câu hỏi đang để trống.`;
                if (q.points <= 0) return `${qNum}: Điểm số phải lớn hơn 0.`;

                if (q.type === 'multiple_choice') {
                    const opts = q.content_data.options || [];
                    if (opts.length < 2) return `${qNum}: Cần ít nhất 2 lựa chọn.`;

                    if (opts.some((o: any) => !o.text.trim()))
                        return `${qNum}: Có lựa chọn đang để trống nội dung.`;

                    const uniqueTexts = new Set(opts.map((o: any) => o.text.trim()));
                    if (uniqueTexts.size !== opts.length)
                        return `${qNum}: Các đáp án trắc nghiệm không được trùng nhau.`;

                    if (!q.content_data.correct_ids || q.content_data.correct_ids.length === 0)
                        return `${qNum}: Chưa chọn đáp án đúng.`;
                } else if (q.type === 'fill_in_blank' || q.type === 'fill_blank') {
                    if (!q.content_data.correct_answer?.trim())
                        return `${qNum}: Chưa nhập đáp án đúng.`;
                } else if (q.type === 'matching') {
                    const pairs = q.content_data.pairs || [];
                    if (pairs.length < 1) return `${qNum}: Cần ít nhất 1 cặp nối.`;
                    if (pairs.some((p: any) => !p.left.trim() || !p.right.trim()))
                        return `${qNum}: Có cặp nối chưa điền đầy đủ thông tin.`;
                } else if (q.type === 'ordering') {
                    const items = q.content_data.items || [];
                    if (items.length < 2) return `${qNum}: Cần ít nhất 2 mục để sắp xếp.`;
                    if (items.some((it: any) => !it.text.trim()))
                        return `${qNum}: Có mục sắp xếp đang để trống.`;
                }
            }
        }
        return null;
    };

    const handleSubmit = async () => {
        setShowErrors(true);

        const errorMsg = validateExam();
        if (errorMsg) {
            alert(errorMsg);
            return;
        }

        try {
            const payload = {
                classId,
                title,
                description,
                startTime,
                endTime,
                durationMinutes,
                maxAttempts,
                viewAnswerMode,
                isShuffled,
                sections,
            };

            if (examId) {
                await api.put(`/exams/${examId}`, payload);
                alert('Cập nhật đề thi thành công!');
            } else {
                await api.post('/exams', payload);
                alert('Tạo đề thi thành công!');
            }
            onBack();
        } catch (error) {
            console.error(error);
            alert('Lỗi lưu đề thi (Vui lòng kiểm tra lại kết nối hoặc dữ liệu)');
        }
    };

    const ErrorText = ({ text }: { text?: string }) => {
        if (!text) return null;
        return (
            <div
                style={{ color: 'red', fontSize: '0.8rem', marginTop: '4px', fontStyle: 'italic' }}
            >
                * {text}
            </div>
        );
    };

    return (
        <div className="exam-builder">
            <div className="builder-header">
                <button onClick={onBack} className="btn-back">
                    <FaArrowLeft /> Quay lại
                </button>
                <h2>{examId ? 'Chỉnh sửa Đề thi' : 'Tạo Đề thi Mới'}</h2>
                <button onClick={handleSubmit} className="btn-save">
                    <FaSave /> Lưu Đề thi
                </button>
            </div>

            <div className="builder-meta">
                <div className="form-group">
                    <label>Tiêu đề bài thi:</label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Tiêu đề..."
                        style={{ borderColor: showErrors && !title.trim() ? 'red' : undefined }}
                    />
                    {showErrors && !title.trim() && (
                        <ErrorText text="Tiêu đề không được để trống" />
                    )}
                </div>
                <div className="form-group">
                    <label>Mô tả / Ghi chú:</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Nhập mô tả đề thi..."
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Bắt đầu:</label>
                        <input
                            type="datetime-local"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            style={{ borderColor: showErrors && !startTime ? 'red' : undefined }}
                        />
                    </div>
                    <div className="form-group">
                        <label>Kết thúc:</label>
                        <input
                            type="datetime-local"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            style={{ borderColor: showErrors && !endTime ? 'red' : undefined }}
                        />
                    </div>
                    <div className="form-group">
                        <label>Thời gian (phút):</label>
                        <input
                            type="number"
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(Number(e.target.value))}
                        />
                    </div>
                    <div className="form-group">
                        <label>Số lần làm tối đa:</label>
                        <input
                            type="number"
                            value={maxAttempts}
                            onChange={(e) => setMaxAttempts(Number(e.target.value))}
                            placeholder="999 = Vô hạn"
                        />
                    </div>
                    <div className="form-group">
                        <label>Chế độ xem đáp án:</label>
                        <select
                            value={viewAnswerMode}
                            onChange={(e) => setViewAnswerMode(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                            }}
                        >
                            <option value="immediate">Ngay sau khi nộp</option>
                            <option value="after_close">Sau khi đóng đề (Hết hạn)</option>
                            <option value="never">Không bao giờ</option>
                        </select>
                    </div>

                    <div
                        className="form-group"
                        style={{ display: 'flex', alignItems: 'center', marginTop: 30 }}
                    >
                        <input
                            type="checkbox"
                            id="chkShuffle"
                            checked={isShuffled}
                            onChange={(e) => setIsShuffled(e.target.checked)}
                            style={{ width: 20, height: 20, marginRight: 10, cursor: 'pointer' }}
                        />
                        <label
                            htmlFor="chkShuffle"
                            style={{ margin: 0, cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            Trộn câu hỏi
                        </label>
                    </div>
                </div>
            </div>

            <div className="sections-container">
                {sections.map((sec, sIdx) => (
                    <div key={sIdx} className="section-card">
                        <div className="section-header">
                            <div style={{ flex: 1 }}>
                                <input
                                    className="sec-title-input"
                                    value={sec.title}
                                    onChange={(e) => {
                                        const ns = [...sections];
                                        ns[sIdx].title = e.target.value;
                                        setSections(ns);
                                    }}
                                    placeholder="Tên phần thi..."
                                    style={{
                                        borderColor:
                                            showErrors && !sec.title.trim() ? 'red' : undefined,
                                    }}
                                />
                                {showErrors && !sec.title.trim() && (
                                    <ErrorText text="Tên phần thi trống" />
                                )}
                            </div>

                            <button
                                className="btn-icon danger"
                                onClick={() => {
                                    const ns = [...sections];
                                    ns.splice(sIdx, 1);
                                    setSections(ns);
                                }}
                            >
                                <FaTrash />
                            </button>
                        </div>

                        {sec.questions.map((q: any, qIdx: number) => (
                            <div key={qIdx} className="question-builder-item">
                                <div className="q-header">
                                    <span>Câu {qIdx + 1}</span>
                                    <select
                                        className="type-select"
                                        value={q.type}
                                        onChange={(e) =>
                                            handleTypeChange(sIdx, qIdx, e.target.value)
                                        }
                                        style={{ marginLeft: 10, padding: 5 }}
                                    >
                                        <option value="multiple_choice">Trắc nghiệm</option>
                                        <option value="fill_in_blank">Điền từ/Điền khuyết</option>
                                        <option value="matching">Nối cột</option>
                                        <option value="ordering">Sắp xếp đoạn văn</option>
                                    </select>

                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
                                        <input
                                            type="number"
                                            className="points-input"
                                            value={q.points}
                                            onChange={(e) =>
                                                updateQuestion(sIdx, qIdx, 'points', e.target.value)
                                            }
                                        />
                                        <span>điểm</span>
                                    </div>
                                    <button
                                        className="btn-icon danger"
                                        onClick={() => {
                                            const ns = [...sections];
                                            ns[sIdx].questions.splice(qIdx, 1);
                                            setSections(ns);
                                        }}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>

                                <div className="q-body">
                                    <textarea
                                        placeholder="Nhập nội dung câu hỏi..."
                                        value={q.content}
                                        onChange={(e) =>
                                            updateQuestion(sIdx, qIdx, 'content', e.target.value)
                                        }
                                        style={{
                                            borderColor:
                                                showErrors && !q.content.trim() ? 'red' : undefined,
                                        }}
                                    />
                                    {showErrors && !q.content.trim() && (
                                        <ErrorText text="Nội dung câu hỏi trống" />
                                    )}

                                    {}
                                    <div className="media-upload-area">
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 10,
                                            }}
                                        >
                                            <label className="btn-upload-label">
                                                <FaCloudUploadAlt /> Tải file Media
                                                <input
                                                    type="file"
                                                    hidden
                                                    accept="image/*,video/*,audio/*"
                                                    onChange={(e) => onFileChange(e, sIdx, qIdx)}
                                                />
                                            </label>
                                            {q.media_url ? (
                                                <div style={{ display: 'flex', gap: 5 }}>
                                                    <span
                                                        style={{
                                                            color: 'green',
                                                            fontSize: '0.9rem',
                                                        }}
                                                    >
                                                        Đã tải lên!
                                                    </span>
                                                    <button
                                                        onClick={() => removeMedia(sIdx, qIdx)}
                                                        style={{
                                                            color: 'red',
                                                            border: 'none',
                                                            background: 'transparent',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            ) : (
                                                <span style={{ color: '#999', fontSize: '0.9rem' }}>
                                                    Chưa có file
                                                </span>
                                            )}
                                        </div>
                                        {q.media_url && (
                                            <div style={{ marginTop: 10 }}>
                                                {q.media_type === 'image' && (
                                                    <img
                                                        src={q.media_url}
                                                        style={{ maxHeight: 150, borderRadius: 4 }}
                                                    />
                                                )}
                                                {q.media_type === 'video' && (
                                                    <video
                                                        src={q.media_url}
                                                        controls
                                                        style={{ maxHeight: 150 }}
                                                    />
                                                )}
                                                {q.media_type === 'audio' && (
                                                    <audio src={q.media_url} controls />
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {}
                                    {q.type === 'multiple_choice' && q.content_data?.options && (
                                        <div className="options-builder">
                                            {q.content_data.options.map(
                                                (opt: any, oIdx: number) => {
                                                    const isDuplicated =
                                                        q.content_data.options.filter(
                                                            (o: any) =>
                                                                o.text.trim() !== '' &&
                                                                o.text.trim() === opt.text.trim()
                                                        ).length > 1;

                                                    const isEmpty = !opt.text.trim();

                                                    return (
                                                        <div
                                                            key={oIdx}
                                                            className="option-row-wrapper"
                                                            style={{ marginBottom: 5 }}
                                                        >
                                                            <div
                                                                className="option-row"
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 5,
                                                                }}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={q.content_data.correct_ids?.some(
                                                                        (id: any) =>
                                                                            String(id) ===
                                                                            String(opt.id)
                                                                    )}
                                                                    onChange={() =>
                                                                        toggleCorrectOption(
                                                                            sIdx,
                                                                            qIdx,
                                                                            opt.id
                                                                        )
                                                                    }
                                                                />
                                                                <input
                                                                    value={opt.text}
                                                                    onChange={(e) => {
                                                                        const ns = [...sections];
                                                                        ns[sIdx].questions[
                                                                            qIdx
                                                                        ].content_data.options[
                                                                            oIdx
                                                                        ].text = e.target.value;
                                                                        setSections(ns);
                                                                    }}
                                                                    placeholder={`Lựa chọn ${oIdx + 1}`}
                                                                    style={{
                                                                        flex: 1,
                                                                        borderColor:
                                                                            (isEmpty &&
                                                                                showErrors) ||
                                                                            isDuplicated
                                                                                ? 'red'
                                                                                : undefined,
                                                                    }}
                                                                />
                                                                {q.content_data.options.length >
                                                                    2 && (
                                                                    <button
                                                                        onClick={() =>
                                                                            removeOption(
                                                                                sIdx,
                                                                                qIdx,
                                                                                oIdx
                                                                            )
                                                                        }
                                                                        className="btn-icon danger"
                                                                        style={{
                                                                            fontSize: '0.8rem',
                                                                            padding: '2px 5px',
                                                                        }}
                                                                    >
                                                                        <FaTrash />
                                                                    </button>
                                                                )}
                                                            </div>
                                                            {}
                                                            {isDuplicated && (
                                                                <ErrorText text="Đáp án này bị trùng với đáp án khác!" />
                                                            )}
                                                            {isEmpty && showErrors && (
                                                                <ErrorText text="Nội dung đáp án trống" />
                                                            )}
                                                        </div>
                                                    );
                                                }
                                            )}
                                            <button
                                                onClick={() => addOption(sIdx, qIdx)}
                                                style={{
                                                    marginTop: 5,
                                                    background: '#eef',
                                                    border: '1px solid #ccf',
                                                    padding: '5px 10px',
                                                    borderRadius: 4,
                                                    cursor: 'pointer',
                                                    color: '#007bff',
                                                }}
                                            >
                                                + Thêm lựa chọn
                                            </button>
                                            {showErrors &&
                                                (!q.content_data.correct_ids ||
                                                    q.content_data.correct_ids.length === 0) && (
                                                    <ErrorText text="Chưa chọn đáp án đúng nào!" />
                                                )}
                                        </div>
                                    )}

                                    {}
                                    {(q.type === 'fill_in_blank' || q.type === 'fill_blank') && (
                                        <div style={{ marginTop: 10 }}>
                                            <label>Đáp án đúng (chính xác):</label>
                                            <input
                                                value={q.content_data?.correct_answer || ''}
                                                onChange={(e) => {
                                                    const ns = [...sections];
                                                    if (!ns[sIdx].questions[qIdx].content_data)
                                                        ns[sIdx].questions[qIdx].content_data = {};
                                                    ns[sIdx].questions[
                                                        qIdx
                                                    ].content_data.correct_answer = e.target.value;
                                                    setSections(ns);
                                                }}
                                                placeholder="Nhập từ/câu trả lời..."
                                                className="full-width-input"
                                                style={{
                                                    width: '100%',
                                                    padding: '8px',
                                                    marginTop: '5px',
                                                    borderRadius: '4px',
                                                    border: '1px solid #ddd',
                                                    borderColor:
                                                        showErrors &&
                                                        !q.content_data?.correct_answer?.trim()
                                                            ? 'red'
                                                            : '#ddd',
                                                }}
                                            />
                                            {showErrors &&
                                                !q.content_data?.correct_answer?.trim() && (
                                                    <ErrorText text="Chưa nhập đáp án đúng" />
                                                )}
                                        </div>
                                    )}

                                    {}
                                    {q.type === 'matching' && q.content_data?.pairs && (
                                        <div className="matching-builder">
                                            <label
                                                style={{
                                                    display: 'block',
                                                    marginBottom: 5,
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                Các cặp nối (Trái - Phải):
                                            </label>
                                            {q.content_data.pairs.map((pair: any, pIdx: number) => (
                                                <div key={pIdx}>
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            gap: 10,
                                                            marginBottom: 5,
                                                        }}
                                                    >
                                                        <input
                                                            placeholder="Vế trái"
                                                            value={pair.left}
                                                            onChange={(e) =>
                                                                updatePair(
                                                                    sIdx,
                                                                    qIdx,
                                                                    pIdx,
                                                                    'left',
                                                                    e.target.value
                                                                )
                                                            }
                                                            style={{
                                                                flex: 1,
                                                                padding: 5,
                                                                borderColor:
                                                                    showErrors && !pair.left.trim()
                                                                        ? 'red'
                                                                        : undefined,
                                                            }}
                                                        />
                                                        <span style={{ alignSelf: 'center' }}>
                                                            --
                                                        </span>
                                                        <input
                                                            placeholder="Vế phải"
                                                            value={pair.right}
                                                            onChange={(e) =>
                                                                updatePair(
                                                                    sIdx,
                                                                    qIdx,
                                                                    pIdx,
                                                                    'right',
                                                                    e.target.value
                                                                )
                                                            }
                                                            style={{
                                                                flex: 1,
                                                                padding: 5,
                                                                borderColor:
                                                                    showErrors && !pair.right.trim()
                                                                        ? 'red'
                                                                        : undefined,
                                                            }}
                                                        />
                                                        <button
                                                            onClick={() =>
                                                                removePair(sIdx, qIdx, pIdx)
                                                            }
                                                            className="btn-icon danger"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                    {showErrors &&
                                                        (!pair.left.trim() ||
                                                            !pair.right.trim()) && (
                                                            <ErrorText text="Vế trái hoặc phải đang trống" />
                                                        )}
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => addPair(sIdx, qIdx)}
                                                style={{
                                                    marginTop: 5,
                                                    background: '#eef',
                                                    border: '1px solid #ccf',
                                                    padding: '5px 10px',
                                                    borderRadius: 4,
                                                    cursor: 'pointer',
                                                    color: '#007bff',
                                                }}
                                            >
                                                + Thêm cặp
                                            </button>
                                        </div>
                                    )}

                                    {}
                                    {q.type === 'ordering' && q.content_data?.items && (
                                        <div className="ordering-builder">
                                            <label
                                                style={{
                                                    display: 'block',
                                                    marginBottom: 5,
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                Các đoạn văn/câu cần sắp xếp (Theo đúng thứ tự):
                                            </label>
                                            {q.content_data.items.map((item: any, iIdx: number) => (
                                                <div key={iIdx}>
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            gap: 10,
                                                            marginBottom: 5,
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                alignSelf: 'center',
                                                                fontWeight: 'bold',
                                                                width: 20,
                                                            }}
                                                        >
                                                            {iIdx + 1}.
                                                        </span>
                                                        <input
                                                            value={item.text}
                                                            onChange={(e) =>
                                                                updateOrderItem(
                                                                    sIdx,
                                                                    qIdx,
                                                                    iIdx,
                                                                    e.target.value
                                                                )
                                                            }
                                                            placeholder={`Đoạn văn/Câu thứ ${iIdx + 1}`}
                                                            style={{
                                                                flex: 1,
                                                                padding: 5,
                                                                borderColor:
                                                                    showErrors && !item.text.trim()
                                                                        ? 'red'
                                                                        : undefined,
                                                            }}
                                                        />
                                                        <button
                                                            onClick={() =>
                                                                removeOrderItem(sIdx, qIdx, iIdx)
                                                            }
                                                            className="btn-icon danger"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                    {showErrors && !item.text.trim() && (
                                                        <ErrorText text="Nội dung mục sắp xếp trống" />
                                                    )}
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => addOrderItem(sIdx, qIdx)}
                                                style={{
                                                    marginTop: 5,
                                                    background: '#eef',
                                                    border: '1px solid #ccf',
                                                    padding: '5px 10px',
                                                    borderRadius: 4,
                                                    cursor: 'pointer',
                                                    color: '#007bff',
                                                }}
                                            >
                                                + Thêm đoạn/câu
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div className="sec-footer">
                            <button className="btn-add-q" onClick={() => addQuestion(sIdx)}>
                                <FaPlus /> Thêm câu hỏi
                            </button>
                        </div>
                    </div>
                ))}
                <button className="btn-add-sec" onClick={addSection}>
                    Thêm Phần Thi Mới
                </button>
            </div>
        </div>
    );
};

export default ExamBuilder;
