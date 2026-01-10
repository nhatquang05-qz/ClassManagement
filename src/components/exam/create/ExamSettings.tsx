import React from 'react';

interface ExamSettingsProps {
    settings: any;
    onChange: (field: string, value: any) => void;
}

const ExamSettings: React.FC<ExamSettingsProps> = ({ settings, onChange }) => {
    return (
        <div className="create-exam-settings">
            <h3 className="create-exam-settings__group-title">Cấu hình bài thi</h3>

            <div className="create-exam-settings__group">
                <label className="create-exam-settings__label">Tiêu đề bài kiểm tra</label>
                <input
                    type="text"
                    className="create-exam-input"
                    value={settings.title}
                    onChange={(e) => onChange('title', e.target.value)}
                    placeholder="Ví dụ: Kiểm tra 15 phút..."
                />
            </div>

            <div className="create-exam-settings__group">
                <label className="create-exam-settings__label">Thời gian làm bài (phút)</label>
                <input
                    type="number"
                    className="create-exam-input"
                    value={settings.duration}
                    onChange={(e) => onChange('duration', parseInt(e.target.value))}
                />
            </div>

            <div className="create-exam-settings__group">
                <label className="create-exam-settings__label">Thời gian bắt đầu</label>
                <input
                    type="datetime-local"
                    className="create-exam-input"
                    value={settings.startDate}
                    onChange={(e) => onChange('startDate', e.target.value)}
                />
            </div>

            <div className="create-exam-settings__group">
                <label className="create-exam-settings__label">Thời gian kết thúc</label>
                <input
                    type="datetime-local"
                    className="create-exam-input"
                    value={settings.endDate}
                    onChange={(e) => onChange('endDate', e.target.value)}
                />
            </div>

            <div className="create-exam-settings__group">
                <label className="create-exam-settings__label">Số lượt làm bài</label>
                <select
                    className="create-exam-input"
                    value={settings.attempts}
                    onChange={(e) => onChange('attempts', e.target.value)}
                >
                    <option value="unlimited">Không giới hạn</option>
                    <option value="1">1 lần</option>
                    <option value="2">2 lần</option>
                    <option value="3">3 lần</option>
                </select>
            </div>

            <div className="create-exam-settings__group">
                <label className="create-exam-settings__label">Xem đáp án</label>
                <select
                    className="create-exam-input"
                    value={settings.viewAnswersMode}
                    onChange={(e) => onChange('viewAnswersMode', e.target.value)}
                >
                    <option value="immediately">Ngay sau khi nộp bài</option>
                    <option value="after_deadline">Sau khi hết hạn làm bài</option>
                    <option value="never">Không cho xem</option>
                </select>
                <small
                    style={{
                        display: 'block',
                        marginTop: '5px',
                        color: '#666',
                        fontSize: '0.8rem',
                    }}
                >
                    *Nếu chọn "Sau khi hết hạn", học sinh chỉ xem được khi qua ngày kết thúc.
                </small>
            </div>

            <div className="create-exam-settings__group">
                <label className="create-exam-switch">
                    <input
                        type="checkbox"
                        checked={settings.shuffleQuestions}
                        onChange={(e) => onChange('shuffleQuestions', e.target.checked)}
                    />
                    Trộn câu hỏi (trong cùng Section)
                </label>
            </div>
        </div>
    );
};

export default ExamSettings;
