import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaBroom, FaCalendarAlt, FaCheck, FaUserEdit } from 'react-icons/fa';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useClass } from '../contexts/ClassContext';
import { getWeekNumberFromStart, getWeekDatesFromStart } from '../utils/dateUtils';
import DutyViolationModal from '../components/duty/DutyViolationModal';
import DutyHistoryTable from '../components/duty/DutyHistoryTable';
import '../assets/styles/TrackingPage.css';
import '../assets/styles/DutyTracking.css';

interface Schedule {
    id: number;
    day_of_week: number;
    group_number: number;
}
interface DutyViolation {
    id: number;
    date: string;
    group_number: number;
    violation_type: string;
    student_name?: string;
    note?: string;
}

const DutyTrackingPage: React.FC = () => {
    const { user } = useAuth();
    const { selectedClass } = useClass();
    const navigate = useNavigate();

    const [week, setWeek] = useState(1);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [violations, setViolations] = useState<DutyViolation[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [activeDayTab, setActiveDayTab] = useState(0);

    const [fetchedStartDate, setFetchedStartDate] = useState<string | undefined>(
        selectedClass?.start_date
    );
    const [scheduleConfig, setScheduleConfig] = useState<any>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState<any>(null);

    const canEdit = useMemo(() => {
        if (!user) return false;
        return user.role === 'teacher' || user.role === 'admin' || user.role === 'labor_deputy';
    }, [user]);

    const currentRealWeek = useMemo(() => {
        return getWeekNumberFromStart(new Date(), fetchedStartDate, scheduleConfig);
    }, [fetchedStartDate, scheduleConfig]);

    const weekDates = useMemo(
        () => getWeekDatesFromStart(week, fetchedStartDate, scheduleConfig),
        [week, fetchedStartDate, scheduleConfig]
    );

    useEffect(() => {
        if (currentRealWeek > 0) setWeek(currentRealWeek);
    }, [currentRealWeek]);

    useEffect(() => {
        const fetchData = async () => {
            if (!selectedClass?.id) return;
            try {
                const [classRes, usersRes] = await Promise.all([
                    api.get(`/classes/${selectedClass.id}`),
                    api.get('/users', { params: { class_id: selectedClass.id, role: 'student' } }),
                ]);

                if (classRes.data.start_date) setFetchedStartDate(classRes.data.start_date);
                if (classRes.data.schedule_config) {
                    setScheduleConfig(
                        typeof classRes.data.schedule_config === 'string'
                            ? JSON.parse(classRes.data.schedule_config)
                            : classRes.data.schedule_config
                    );
                }
                setStudents(usersRes.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, [selectedClass]);

    useEffect(() => {
        loadDutyData();
    }, [selectedClass, week]);

    const loadDutyData = async () => {
        if (!selectedClass?.id) return;
        try {
            const res = await api.get('/duty', { params: { class_id: selectedClass.id, week } });
            setSchedules(res.data.schedules);
            setViolations(res.data.violations);
        } catch (error) {
            console.error('Lỗi tải dữ liệu trực nhật', error);
        }
    };

    const handleToggleSchedule = async (day: number, group: number) => {
        if (!canEdit) return;
        const isAssigned = schedules.some((s) => s.day_of_week === day && s.group_number === group);

        const newSchedules = isAssigned
            ? schedules.filter((s) => !(s.day_of_week === day && s.group_number === group))
            : [...schedules, { id: Date.now(), day_of_week: day, group_number: group }];

        setSchedules(newSchedules);

        try {
            await api.post('/duty/schedule', {
                class_id: selectedClass?.id,
                week_number: week,
                day_of_week: day,
                group_number: group,
                assigned: !isAssigned,
            });
        } catch (error) {
            console.error('Save failed');
            loadDutyData();
        }
    };

    const handleOpenViolation = (group: number, type: string) => {
        if (!canEdit) return;
        setModalData({
            group,
            type,
            date: weekDates[activeDayTab],
            typeName:
                type === 'NO_DUTY'
                    ? 'Không trực nhật'
                    : type === 'DIRTY'
                      ? 'Không giữ vệ sinh'
                      : 'Không lao động',
        });
        setIsModalOpen(true);
    };

    const handleSaveViolation = async (studentId: string | null, note: string) => {
        if (!modalData) return;
        try {
            await api.post('/duty/violation', {
                class_id: selectedClass?.id,
                date: modalData.date,
                week_number: week,
                group_number: modalData.group,
                student_id: studentId,
                violation_type: modalData.type,
                note: note,
                reporter_id: user?.id,
            });
            setIsModalOpen(false);
            loadDutyData();
        } catch (error) {
            alert('Lỗi lưu vi phạm');
        }
    };

    const handleDeleteViolation = async (id: number) => {
        if (!canEdit || !window.confirm('Xóa ghi nhận này?')) return;
        try {
            await api.delete(`/duty/violation/${id}`);
            loadDutyData();
        } catch (e) {
            alert('Lỗi xóa');
        }
    };

    const uniqueGroups = useMemo(
        () => Array.from(new Set(students.map((s) => s.group_number))).sort((a, b) => a - b),
        [students]
    );

    const currentDayViolations = useMemo(() => {
        const dateStr = weekDates[activeDayTab];
        if (!dateStr) return [];
        return violations.filter((v) => v.date.startsWith(dateStr));
    }, [violations, activeDayTab, weekDates]);

    const getViolationCount = (group: number, type: string) => {
        return currentDayViolations.filter(
            (v) => v.group_number === group && v.violation_type === type
        ).length;
    };

    return (
        <div className="duty-container">
            <div className="tracking-header-modern">
                <div className="duty-header-top">
                    <button onClick={() => navigate(-1)} className="btn-back-modern">
                        <FaArrowLeft /> Quay lại
                    </button>
                    <h1 className="duty-page-title">
                        <FaBroom /> THEO DÕI TRỰC NHẬT - TUẦN {week}
                    </h1>
                </div>
                <div className="duty-week-display">
                    {weekDates[0]
                        ? `${new Date(weekDates[0]).toLocaleDateString('vi-VN')} - ${new Date(weekDates[6]).toLocaleDateString('vi-VN')}`
                        : ''}
                </div>
            </div>

            {}
            <div className="duty-section-card">
                <h3 className="duty-section-title">
                    <FaCalendarAlt color="#3498db" /> PHÂN CÔNG LỊCH TRỰC
                </h3>
                <div className="duty-table-wrapper">
                    <table className="trk-table">
                        <thead>
                            <tr>
                                <th>Tổ \ Thứ</th>
                                <th>Thứ 2</th>
                                <th>Thứ 3</th>
                                <th>Thứ 4</th>
                                <th>Thứ 5</th>
                                <th>Thứ 6</th>
                                <th>Thứ 7</th>
                            </tr>
                        </thead>
                        <tbody>
                            {uniqueGroups.map((g) => (
                                <tr key={g}>
                                    <td style={{ fontWeight: 'bold', textAlign: 'center' }}>
                                        Tổ {g}
                                    </td>
                                    {[2, 3, 4, 5, 6, 7].map((day) => {
                                        const isChecked = schedules.some(
                                            (s) => s.group_number === g && s.day_of_week === day
                                        );
                                        return (
                                            <td
                                                key={day}
                                                onClick={() => handleToggleSchedule(day, g)}
                                                className={`duty-cell-interactive ${isChecked ? 'duty-cell-checked' : ''}`}
                                                style={{
                                                    textAlign: 'center',
                                                    cursor: canEdit ? 'pointer' : 'default',
                                                }}
                                            >
                                                {isChecked ? (
                                                    <FaCheck color="green" size={18} />
                                                ) : null}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {}
            <div className="duty-section-card">
                <h3 className="duty-section-title">
                    <FaUserEdit color="#e67e22" /> GHI NHẬN VI PHẠM NGÀY
                </h3>

                <div className="trk-day-tabs">
                    {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'].map((d, i) => (
                        <button
                            key={i}
                            className={`trk-day-tab ${activeDayTab === i ? 'trk-active' : ''}`}
                            onClick={() => setActiveDayTab(i)}
                        >
                            {d}
                        </button>
                    ))}
                </div>

                <div className="duty-table-wrapper" style={{ marginTop: '15px' }}>
                    <table className="trk-table">
                        <thead>
                            <tr>
                                <th>Nội dung</th>
                                {uniqueGroups.map((g) => (
                                    <th key={g}>Tổ {g}</th>
                                ))}
                                <th>Tổng</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { code: 'NO_DUTY', label: 'Không trực nhật' },
                                { code: 'DIRTY', label: 'Không giữ vệ sinh' },
                                { code: 'NO_LABOR', label: 'Không lao động' },
                            ].map((type) => (
                                <tr key={type.code}>
                                    <td style={{ textAlign: 'left', paddingLeft: '15px' }}>
                                        {type.label}
                                    </td>
                                    {uniqueGroups.map((g) => {
                                        const count = getViolationCount(g, type.code);
                                        return (
                                            <td
                                                key={g}
                                                onClick={() => handleOpenViolation(g, type.code)}
                                                className={`duty-cell-interactive ${count > 0 ? 'trk-has-data' : ''}`}
                                                style={{ textAlign: 'center' }}
                                            >
                                                {count > 0 && (
                                                    <span className="duty-badge-count">
                                                        {count}
                                                    </span>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td style={{ fontWeight: 'bold', textAlign: 'center' }}>
                                        {
                                            currentDayViolations.filter(
                                                (v) => v.violation_type === type.code
                                            ).length
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {}
            <DutyHistoryTable
                violations={violations}
                week={week}
                canEdit={canEdit}
                onDelete={handleDeleteViolation}
            />

            {}
            <DutyViolationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveViolation}
                data={modalData}
                students={students}
            />
        </div>
    );
};

export default DutyTrackingPage;
