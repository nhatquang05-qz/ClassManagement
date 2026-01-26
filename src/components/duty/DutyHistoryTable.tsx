import React from 'react';
import { FaTrash, FaHistory } from 'react-icons/fa';
import '../../assets/styles/DutyTracking.css';
import '../../assets/styles/TrackingTable.css';

interface GroupedViolation {
    key: string;
    ids: number[];
    date: string;
    group_number: number;
    violation_type: string;
    student_names: string[];
    note?: string;
}

interface Props {
    groupedViolations: GroupedViolation[];
    week: number;
    canEdit: boolean;
    onDelete: (ids: number[]) => void;
}

const DutyHistoryTable: React.FC<Props> = ({ groupedViolations, week, canEdit, onDelete }) => {
    const getViolationLabel = (code: string) => {
        switch (code) {
            case 'NO_DUTY':
                return 'Không trực nhật';
            case 'DIRTY':
                return 'Không giữ vệ sinh';
            case 'NO_LABOR':
                return 'Không lao động';

            case 'NO_HOMEWORK':
                return 'Không làm bài tập';
            case 'NO_PREP':
                return 'Không chuẩn bị bài';
            case 'NO_LESSON':
                return 'Không thuộc bài';
            case 'SCORE_1_4':
                return 'Điểm 1-4';
            case 'SCORE_5_7':
                return 'Điểm 5-7';
            case 'SCORE_8_10':
                return 'Điểm 8-10';

            case 'LATE':
                return 'Đi trễ';
            case 'SKIP':
                return 'Bỏ tiết';
            case 'DISORDER':
                return 'Gây mất trật tự';
            case 'UNIFORM':
                return 'Không đồng phục';
            case 'SWEARING':
                return 'Nói tục - Chửi thề';
            case 'FIGHTING':
                return 'Đánh nhau';
            case 'DISRESPECT':
                return 'Vô lễ';

            default:
                return code;
        }
    };

    return (
        <div className="duty-section-card">
            <h3 className="duty-section-title">
                <FaHistory color="#9b59b6" /> LỊCH SỬ GHI NHẬN (TUẦN {week})
            </h3>
            <div className="duty-table-wrapper">
                <table className="history-table">
                    <thead>
                        <tr>
                            <th style={{ width: '100px' }}>Ngày</th>
                            <th style={{ width: '60px', textAlign: 'center' }}>Tổ</th>
                            <th>Nội dung</th>
                            <th>Học sinh</th>
                            <th>Ghi chú</th>
                            <th style={{ width: '50px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupedViolations.length === 0 ? (
                            <tr>
                                <td colSpan={6}>
                                    <div className="duty-history-empty">
                                        Chưa có ghi nhận nào trong tuần này
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            groupedViolations.map((v) => (
                                <tr key={v.key}>
                                    <td>{new Date(v.date).toLocaleDateString('vi-VN')}</td>
                                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                        {v.group_number}
                                    </td>
                                    <td>
                                        <span className="badge-violation negative">
                                            {}
                                            {getViolationLabel(v.violation_type)}
                                        </span>
                                    </td>
                                    <td>
                                        {v.student_names.length > 0 ? (
                                            <div style={{ fontWeight: 500, lineHeight: '1.4' }}>
                                                {v.student_names.join(', ')}
                                                {v.student_names.length > 3 && (
                                                    <span
                                                        style={{ color: '#888', fontSize: '0.8em' }}
                                                    >
                                                        {' '}
                                                        (Tổng {v.student_names.length} bạn)
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span
                                                style={{
                                                    fontStyle: 'italic',
                                                    color: '#888',
                                                    fontSize: '0.9em',
                                                }}
                                            >
                                                -- Cả tổ --
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ whiteSpace: 'pre-wrap' }}>{v.note}</td>
                                    <td>
                                        {canEdit && (
                                            <button
                                                className="trk-btn-delete-icon"
                                                onClick={() => onDelete(v.ids)}
                                                title="Xóa lần ghi nhận này"
                                            >
                                                <FaTrash />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DutyHistoryTable;
