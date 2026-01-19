import React, { useState, useEffect, useMemo } from 'react';
import { FaStickyNote } from 'react-icons/fa';
import '../../assets/styles/TrackingTable.css';
import {
    Student,
    ViolationType,
    DailyLogPayload,
    EditingCellData,
} from '../../types/trackingTypes';
import EditLogModal from './EditLogModal';

interface Props {
    students: Student[];
    violationTypes: ViolationType[];
    initialData: DailyLogPayload[];
    isReadOnly: boolean;
    weekDates: string[];
    activeDayIndex: number;
    setActiveDayIndex: (idx: number) => void;
    onSubmit: (logs: DailyLogPayload[], dateToSave: string) => void;
}

const COLUMNS_CONFIG = [
    { key: 'Vắng (P)', label: 'P', group: 'GIỜ GIẤC', subGroup: 'Vắng' },
    { key: 'Vắng (K)', label: 'K', group: 'GIỜ GIẤC', subGroup: 'Vắng' },
    { key: 'Đi trễ', label: 'Trễ', group: 'GIỜ GIẤC', subGroup: null },
    { key: 'Bỏ tiết', label: 'Bỏ tiết', group: 'GIỜ GIẤC', subGroup: null },
    { key: 'Không làm bài tập', label: 'Làm BT', group: 'HỌC TẬP', subGroup: 'KHÔNG' },
    { key: 'Không chuẩn bị bài', label: 'Soạn bài', group: 'HỌC TẬP', subGroup: 'KHÔNG' },
    { key: 'Không thuộc bài', label: 'Thuộc bài', group: 'HỌC TẬP', subGroup: 'KHÔNG' },
    { key: 'Trực nhật', label: 'Trực nhật', group: 'NỀ NẾP', subGroup: null },
    { key: 'Mất vệ sinh', label: 'Giữ vệ sinh', group: 'NỀ NẾP', subGroup: null },
    { key: 'Sai đồng phục', label: 'Đồng phục', group: 'NỀ NẾP', subGroup: null },
    { key: 'Mất trật tự', label: 'Giữ trật tự', group: 'NỀ NẾP', subGroup: null },
    { key: 'Đánh nhau', label: 'Đánh nhau', group: 'MẮC THÁI ĐỘ SAI', subGroup: null },
    { key: 'Nói tục', label: 'Nói tục', group: 'MẮC THÁI ĐỘ SAI', subGroup: null },
    { key: 'Vô lễ', label: 'Vô lễ', group: 'MẮC THÁI ĐỘ SAI', subGroup: null },
    { key: 'Điểm 1-4', label: '1-4', group: 'ĐIỂM TRẢ BÀI', subGroup: null },
    { key: 'Điểm kiểm tra 5-7', label: '5-7', group: 'ĐIỂM TRẢ BÀI', subGroup: null },
    { key: 'Điểm kiểm tra 8-10', label: '8-10', group: 'ĐIỂM TRẢ BÀI', subGroup: null },
    { key: 'Phát biểu', label: 'Tham gia', group: 'PHÁT BIỂU', subGroup: null },
    { key: 'Tham gia phong trào', label: 'Tham gia PT', group: 'PHONG TRÀO', subGroup: null },
    { key: 'Không tham gia phong trào', label: 'Không TG PT', group: 'PHONG TRÀO', subGroup: null },
];

const DAYS_LABEL = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Cả tuần'];

const DailyTrackingTable: React.FC<Props> = ({
    students,
    violationTypes,
    initialData,
    isReadOnly,
    weekDates,
    activeDayIndex,
    setActiveDayIndex,
    onSubmit,
}) => {
    const [logs, setLogs] = useState<DailyLogPayload[]>([]);
    const [editingCell, setEditingCell] = useState<EditingCellData | null>(null);

    const activeDate =
        activeDayIndex < 6 && weekDates.length > activeDayIndex ? weekDates[activeDayIndex] : '';

    useEffect(() => {
        if (initialData) setLogs(initialData);
    }, [initialData]);

    const violationMap = useMemo(() => {
        const map: Record<string, ViolationType> = {};
        violationTypes.forEach((v) => {
            map[v.name.toLowerCase()] = v;
        });
        return map;
    }, [violationTypes]);

    const getViolationIdByKey = (key: string) => {
        const lowerKey = key.toLowerCase();
        if (violationMap[lowerKey]) return violationMap[lowerKey].id;
        return Object.values(violationMap).find((v) => v.name.toLowerCase().includes(lowerKey))?.id;
    };

    const compareDates = (d1: string, d2: string) => {
        if (!d1 || !d2) return false;
        const date1 = new Date(d1);
        date1.setHours(0, 0, 0, 0);
        const date2 = new Date(d2);
        date2.setHours(0, 0, 0, 0);
        return date1.getTime() === date2.getTime();
    };

    const getCellData = (studentId: number, violationId: number) => {
        if (activeDayIndex === 6) {
            const relevantLogs = logs.filter(
                (l) => l.student_id === studentId && l.violation_type_id === violationId
            );
            const totalQty = relevantLogs.reduce((sum, l) => sum + (l.quantity || 0), 0);
            return { quantity: totalQty, hasNote: false };
        } else {
            const relevantLogs = logs.filter(
                (l) =>
                    l.student_id === studentId &&
                    l.violation_type_id === violationId &&
                    compareDates(l.log_date, activeDate)
            );
            const totalQty = relevantLogs.reduce((sum, l) => sum + (l.quantity || 0), 0);
            const hasNote = relevantLogs.some((l) => l.note && l.note.trim() !== '');
            return { quantity: totalQty, hasNote };
        }
    };

    const calculateStudentScore = (studentId: number) => {
        let total = 0;
        const studentLogs = logs.filter((l) => {
            if (l.student_id !== studentId) return false;
            if (activeDayIndex !== 6 && !compareDates(l.log_date, activeDate)) return false;
            return true;
        });
        studentLogs.forEach((log) => {
            const v = violationTypes.find((type) => type.id === log.violation_type_id);
            const points = log.points !== undefined ? log.points : v?.points || 0;
            total += points * (log.quantity || 1);
        });
        return total;
    };

    const handleCellClick = (student: Student, colKey: string, subGroup: string | null) => {
        if (isReadOnly || activeDayIndex === 6) return;
        if (!activeDate) return;

        const violationId = getViolationIdByKey(colKey);
        if (!violationId) return;

        const violationType = violationTypes.find((v) => v.id === violationId);

        if (colKey === 'Vắng (K)') {
            setLogs((prev) => {
                const absenceP_ID = getViolationIdByKey('Vắng (P)');
                const absenceK_ID = getViolationIdByKey('Vắng (K)');

                let newLogs = prev.filter((l) => {
                    const isTarget =
                        l.student_id === student.id && compareDates(l.log_date, activeDate);
                    if (!isTarget) return true;
                    if (
                        l.violation_type_id === absenceP_ID ||
                        l.violation_type_id === absenceK_ID
                    ) {
                        return false;
                    }
                    return true;
                });

                const exists = prev.find(
                    (l) =>
                        l.student_id === student.id &&
                        l.violation_type_id === violationId &&
                        compareDates(l.log_date, activeDate)
                );

                if (!exists) {
                    newLogs.push({
                        student_id: student.id,
                        violation_type_id: violationId,
                        quantity: 1,
                        log_date: activeDate,
                        note: '',
                    });
                }
                return newLogs;
            });
            return;
        }

        if (colKey === 'Vắng (P)') {
            const exists = logs.find(
                (l) =>
                    l.student_id === student.id &&
                    l.violation_type_id === violationId &&
                    compareDates(l.log_date, activeDate)
            );
            if (exists) {
                setLogs((prev) =>
                    prev.filter(
                        (l) =>
                            !(
                                l.student_id === student.id &&
                                l.violation_type_id === violationId &&
                                compareDates(l.log_date, activeDate)
                            )
                    )
                );
            } else {
                const absenceK_ID = getViolationIdByKey('Vắng (K)');
                setLogs((prev) => {
                    const cleanLogs = prev.filter(
                        (l) =>
                            !(
                                l.student_id === student.id &&
                                l.violation_type_id === absenceK_ID &&
                                compareDates(l.log_date, activeDate)
                            )
                    );
                    cleanLogs.push({
                        student_id: student.id,
                        violation_type_id: violationId,
                        quantity: 1,
                        log_date: activeDate,
                        note: '',
                    });
                    return cleanLogs;
                });
            }
            return;
        }

        const isAbsenceP = colKey === 'Vắng (P)';

        setEditingCell({
            studentId: student.id,
            violationId: violationId,
            violationName: colKey,
            studentName: student.full_name,
            isAbsence: isAbsenceP,
            isBonus: (violationType?.points || 0) > 0,
            currentQuantity: 1,
            currentNote: '',
        });
    };

    const handleSaveModal = (quantityToAdd: number, note: string) => {
        if (!editingCell || !activeDate) return;

        setLogs((prev) => {
            const newLogs = [...prev];

            if (editingCell.isAbsence) {
            }

            if (quantityToAdd > 0) {
                newLogs.push({
                    student_id: editingCell.studentId,
                    violation_type_id: editingCell.violationId,
                    quantity: quantityToAdd,
                    log_date: activeDate,
                    note: note,
                });
            }
            return newLogs;
        });
        setEditingCell(null);
    };

    const getPointDisplay = (key: string) => {
        const id = getViolationIdByKey(key);
        const violation = violationTypes.find((v) => v.id === id);
        if (!violation) return '';
        return violation.points > 0 ? `+${violation.points}` : violation.points;
    };

    const getDisplayDate = (idx: number) => {
        if (idx === 6) return 'Tổng kết';
        if (!weekDates || !weekDates[idx]) return '';
        const [y, m, d] = weekDates[idx].split('-');
        return `${d}/${m}`;
    };

    const handleSaveCurrentDay = () => {
        if (activeDayIndex === 6) return;
        if (!activeDate) {
            alert('Lỗi: Ngày không hợp lệ.');
            return;
        }
        const logsForToday = logs.filter((l) => compareDates(l.log_date, activeDate));
        onSubmit(logsForToday, activeDate);
    };

    return (
        <div className="trk-container">
            <div className="trk-day-tabs">
                {DAYS_LABEL.map((day, index) => (
                    <button
                        key={day}
                        className={`trk-day-tab ${activeDayIndex === index ? 'trk-active' : ''} ${index === 6 ? 'trk-weekly-tab' : ''}`}
                        onClick={() => setActiveDayIndex(index)}
                    >
                        {day} <span className="trk-date-small">({getDisplayDate(index)})</span>
                    </button>
                ))}
            </div>

            <div className="trk-table-wrapper">
                <table className="trk-table">
                    <thead>
                        <tr>
                            <th
                                rowSpan={4}
                                className="trk-sticky-col trk-stt-col"
                                style={{ left: 0 }}
                            >
                                STT
                            </th>
                            <th
                                rowSpan={4}
                                className="trk-sticky-col trk-name-col"
                                style={{ left: '40px' }}
                            >
                                Họ và tên
                            </th>
                            <th rowSpan={4} className="trk-total-col">
                                Tổng
                            </th>
                            <th colSpan={4} className="trk-group-header">
                                GIỜ GIẤC
                            </th>
                            <th colSpan={3} className="trk-group-header">
                                HỌC TẬP
                            </th>
                            <th colSpan={4} className="trk-group-header">
                                NỀ NẾP
                            </th>
                            <th colSpan={3} className="trk-group-header">
                                MẮC THÁI ĐỘ SAI
                            </th>
                            <th colSpan={3} className="trk-group-header">
                                ĐIỂM TRẢ BÀI
                            </th>
                            <th colSpan={1} className="trk-group-header">
                                PHÁT BIỂU
                            </th>
                            <th colSpan={2} className="trk-group-header">
                                PHONG TRÀO
                            </th>
                        </tr>
                        <tr>
                            <th colSpan={2} className="trk-sub-group-header">
                                Vắng
                            </th>
                            <th rowSpan={2} className="trk-th-rotate">
                                <div>
                                    <span>Trễ</span>
                                </div>
                            </th>
                            <th rowSpan={2} className="trk-th-rotate">
                                <div>
                                    <span>Bỏ tiết</span>
                                </div>
                            </th>
                            <th colSpan={3} className="trk-sub-group-header">
                                KHÔNG
                            </th>
                            <th rowSpan={2} className="trk-th-rotate">
                                <div>
                                    <span>Trực nhật</span>
                                </div>
                            </th>
                            <th rowSpan={2} className="trk-th-rotate">
                                <div>
                                    <span>Giữ vệ sinh</span>
                                </div>
                            </th>
                            <th rowSpan={2} className="trk-th-rotate">
                                <div>
                                    <span>Đồng phục</span>
                                </div>
                            </th>
                            <th rowSpan={2} className="trk-th-rotate">
                                <div>
                                    <span>Giữ trật tự</span>
                                </div>
                            </th>
                            <th rowSpan={2} className="trk-th-rotate">
                                <div>
                                    <span>Đánh nhau</span>
                                </div>
                            </th>
                            <th rowSpan={2} className="trk-th-rotate">
                                <div>
                                    <span>Nói tục</span>
                                </div>
                            </th>
                            <th rowSpan={2} className="trk-th-rotate">
                                <div>
                                    <span>Vô lễ</span>
                                </div>
                            </th>
                            <th rowSpan={2} className="trk-th-rotate">
                                <div>
                                    <span>1-4</span>
                                </div>
                            </th>
                            <th rowSpan={2} className="trk-th-rotate">
                                <div>
                                    <span>5-7</span>
                                </div>
                            </th>
                            <th rowSpan={2} className="trk-th-rotate">
                                <div>
                                    <span>8-10</span>
                                </div>
                            </th>
                            <th rowSpan={2} className="trk-th-rotate">
                                <div>
                                    <span>Tham gia</span>
                                </div>
                            </th>
                            <th rowSpan={2} className="trk-th-rotate">
                                <div>
                                    <span>Tham gia</span>
                                </div>
                            </th>
                            <th rowSpan={2} className="trk-th-rotate">
                                <div>
                                    <span>Không tham gia</span>
                                </div>
                            </th>
                        </tr>
                        <tr>
                            <th className="trk-th-rotate">
                                <div>
                                    <span>P</span>
                                </div>
                            </th>
                            <th className="trk-th-rotate">
                                <div>
                                    <span>K</span>
                                </div>
                            </th>
                            <th className="trk-th-rotate">
                                <div>
                                    <span>Làm BT</span>
                                </div>
                            </th>
                            <th className="trk-th-rotate">
                                <div>
                                    <span>Soạn bài</span>
                                </div>
                            </th>
                            <th className="trk-th-rotate">
                                <div>
                                    <span>Thuộc bài</span>
                                </div>
                            </th>
                        </tr>
                        <tr className="trk-points-row">
                            {COLUMNS_CONFIG.map((col, index) => (
                                <th key={`point-${index}`}>{getPointDisplay(col.key)}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((student, index) => {
                            const totalScore = calculateStudentScore(student.id);
                            return (
                                <tr key={student.id}>
                                    <td className="trk-sticky-col trk-stt-col" style={{ left: 0 }}>
                                        {index + 1}
                                    </td>
                                    <td
                                        className="trk-sticky-col trk-name-col"
                                        style={{ left: '40px' }}
                                    >
                                        <span className="name">{student.full_name}</span>
                                    </td>
                                    <td
                                        className="text-center font-bold"
                                        style={{ color: totalScore < 0 ? 'red' : 'blue' }}
                                    >
                                        {totalScore > 0 ? `+${totalScore}` : totalScore}
                                    </td>
                                    {COLUMNS_CONFIG.map((col, colIndex) => {
                                        const violationId = getViolationIdByKey(col.key);
                                        if (!violationId)
                                            return (
                                                <td
                                                    key={colIndex}
                                                    className="trk-checkbox-cell trk-disabled"
                                                ></td>
                                            );

                                        const { quantity, hasNote } = getCellData(
                                            student.id,
                                            violationId
                                        );
                                        const isBonus =
                                            (violationTypes.find((v) => v.id === violationId)
                                                ?.points || 0) > 0;

                                        return (
                                            <td
                                                key={`${student.id}-${colIndex}`}
                                                className={`trk-checkbox-cell ${isBonus ? 'trk-bonus-cell' : ''} ${quantity > 0 ? 'trk-has-data' : ''} ${activeDayIndex === 6 ? 'trk-readonly-cell' : ''}`}
                                                onClick={() =>
                                                    handleCellClick(student, col.key, col.subGroup)
                                                }
                                            >
                                                <div className="trk-cell-content">
                                                    {quantity > 0 &&
                                                        (col.subGroup === 'Vắng' ? (
                                                            <input
                                                                type="checkbox"
                                                                checked={true}
                                                                readOnly
                                                                style={{ pointerEvents: 'none' }}
                                                            />
                                                        ) : (
                                                            <span className="trk-quantity-badge">
                                                                {quantity}
                                                            </span>
                                                        ))}
                                                    {hasNote && activeDayIndex !== 6 && (
                                                        <span className="trk-note-indicator">
                                                            <FaStickyNote color="#f39c12" />
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {!isReadOnly && activeDayIndex !== 6 && (
                <div className="trk-action-bar">
                    <button className="trk-btn-submit" onClick={handleSaveCurrentDay}>
                        Lưu Sổ {DAYS_LABEL[activeDayIndex]} ({getDisplayDate(activeDayIndex)})
                    </button>
                </div>
            )}

            {editingCell && (
                <EditLogModal
                    data={editingCell}
                    onClose={() => setEditingCell(null)}
                    onSave={handleSaveModal}
                />
            )}
        </div>
    );
};

export default DailyTrackingTable;
