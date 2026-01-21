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

const ExamBuilder: React.FC<Props> = ({ classId, onBack, examId, initialData }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [durationMinutes, setDurationMinutes] = useState(45);

    const [maxAttempts, setMaxAttempts] = useState(1);
    const [viewAnswerMode, setViewAnswerMode] = useState('after_close');

    const [sections, setSections] = useState<any[]>([
        { title: 'Phần 1', description: '', questions: [] },
    ]);

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setDescription(initialData.description || '');
            setStartTime(initialData.start_time ? initialData.start_time.slice(0, 16) : '');
            setEndTime(initialData.end_time ? initialData.end_time.slice(0, 16) : '');
            setDurationMinutes(initialData.duration_minutes);

            setMaxAttempts(initialData.max_attempts || 1);
            setViewAnswerMode(initialData.view_answer_mode || 'after_close');

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
                    { id: 1, text: '' },
                    { id: 2, text: '' },
                    { id: 3, text: '' },
                    { id: 4, text: '' },
                ],
                correct_ids: [],
            },
        });
        setSections(newSections);
    };

    const updateQuestion = (secIndex: number, qIndex: number, field: string, value: any) => {
        const newSections = [...sections];
        newSections[secIndex].questions[qIndex][field] = value;
        setSections(newSections);
    };

    const toggleCorrectOption = (secIndex: number, qIndex: number, optId: number) => {
        const newSections = [...sections];
        const q = newSections[secIndex].questions[qIndex];
        const currentCorrect = q.content_data.correct_ids || [];

        if (currentCorrect.includes(optId)) {
            q.content_data.correct_ids = currentCorrect.filter((id: number) => id !== optId);
        } else {
            q.content_data.correct_ids = [...currentCorrect, optId];
        }
        setSections(newSections);
    };

    const handleSubmit = async () => {
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
            alert('Lỗi lưu đề thi');
        }
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
                    />
                </div>
                <div className="form-group">
                    <label>Mô tả / Ghi chú:</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Nhập mô tả đề thi..."
                    />
                </div>

                {/* Grid layout cho các input nhỏ */}
                <div className="form-row">
                    <div className="form-group">
                        <label>Bắt đầu:</label>
                        <input
                            type="datetime-local"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Kết thúc:</label>
                        <input
                            type="datetime-local"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
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
                            {/* Đã sửa value "ly" thành "" để khớp với Database ENUM */}
                            <option value="">Ngay sau khi nộp</option>
                            <option value="after_close">Sau khi đóng đề (Hết hạn)</option>
                            <option value="never">Không bao giờ</option>
                        </select>
                    </div>
                </div>
                {/* End grid layout */}
            </div>

            <div className="sections-container">
                {sections.map((sec, sIdx) => (
                    <div key={sIdx} className="section-card">
                        <div className="section-header">
                            <input
                                className="sec-title-input"
                                value={sec.title}
                                onChange={(e) => {
                                    const ns = [...sections];
                                    ns[sIdx].title = e.target.value;
                                    setSections(ns);
                                }}
                                placeholder="Tên phần thi..."
                            />
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
                                    />

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
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 10,
                                                    }}
                                                >
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
                                                            background: 'none',
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem',
                                                        }}
                                                    >
                                                        Xóa file
                                                    </button>
                                                </div>
                                            ) : (
                                                <span style={{ color: '#999', fontSize: '0.9rem' }}>
                                                    Chưa có file nào
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

                                    {q.type === 'multiple_choice' && (
                                        <div className="options-builder">
                                            {q.content_data.options.map(
                                                (opt: any, oIdx: number) => (
                                                    <div key={oIdx} className="option-row">
                                                        <input
                                                            type="checkbox"
                                                            checked={q.content_data.correct_ids?.includes(
                                                                opt.id
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
                                                                ].content_data.options[oIdx].text =
                                                                    e.target.value;
                                                                setSections(ns);
                                                            }}
                                                            placeholder={`Lựa chọn ${oIdx + 1}`}
                                                        />
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}

                                    {/* Điền từ hoặc điền khuyết */}
                                    {(q.type === 'fill_in_blank' || q.type === 'fill_blank') && (
                                        <div style={{ marginTop: 10 }}>
                                            <label>Đáp án đúng:</label>
                                            <input
                                                value={q.content_data.correct_answer || ''}
                                                onChange={(e) => {
                                                    const ns = [...sections];
                                                    if (!ns[sIdx].questions[qIdx].content_data)
                                                        ns[sIdx].questions[qIdx].content_data = {};
                                                    ns[sIdx].questions[
                                                        qIdx
                                                    ].content_data.correct_answer = e.target.value;
                                                    setSections(ns);
                                                }}
                                                placeholder="Nhập từ/câu trả lời chính xác..."
                                                style={{
                                                    width: '100%',
                                                    padding: 8,
                                                    marginTop: 5,
                                                    border: '1px solid #ddd',
                                                    borderRadius: 4,
                                                }}
                                            />
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
