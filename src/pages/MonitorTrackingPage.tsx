import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUserTie, FaUserEdit, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useClass } from '../contexts/ClassContext';
import { getWeekNumberFromStart, getWeekDatesFromStart } from '../utils/dateUtils';
import DutyViolationModal from '../components/duty/DutyViolationModal';
import DutyHistoryTable from '../components/duty/DutyHistoryTable';
import '../assets/styles/TrackingPage.css';
import '../assets/styles/DutyTracking.css';

interface GroupedViolation {
    key: string;
    ids: number[];
    date: string;
    group_number: number;
    violation_type: string;
    student_names: string[];
    note?: string;
    created_at: string;
}

const MonitorTrackingPage: React.FC = () => {
    const { user } = useAuth();
    const { selectedClass } = useClass();
    const navigate = useNavigate();
    const [week, setWeek] = useState(1);
    const [violations, setViolations] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [activeDayTab, setActiveDayTab] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState<any>(null);
    const [fetchedStartDate, setFetchedStartDate] = useState<string | undefined>(
        selectedClass?.start_date
    );
    const [scheduleConfig, setScheduleConfig] = useState<any>(null);

    const currentRealWeek = useMemo(
        () => getWeekNumberFromStart(new Date(), fetchedStartDate, scheduleConfig),
        [fetchedStartDate, scheduleConfig]
    );
    const weekDates = useMemo(
        () => getWeekDatesFromStart(week, fetchedStartDate, scheduleConfig),
        [week, fetchedStartDate, scheduleConfig]
    );

    const canEdit = useMemo(() => {
        if (!user) return false;
        if (user.role === 'teacher' || user.role === 'admin') return true;
        if (user.role === 'monitor' || user.role === 'class_monitor')
            return week >= currentRealWeek;
        return false;
    }, [user, week, currentRealWeek]);

    useEffect(() => {
        if (currentRealWeek > 0) setWeek(currentRealWeek);
    }, [currentRealWeek]);

    useEffect(() => {
        const fetchData = async () => {
            if (!selectedClass?.id) return;
            const [uRes, cRes] = await Promise.all([
                api.get('/users', { params: { class_id: selectedClass.id, role: 'student' } }),
                api.get(`/classes/${selectedClass.id}`),
            ]);
            setStudents(uRes.data);
            if (cRes.data.start_date) setFetchedStartDate(cRes.data.start_date);
            if (cRes.data.schedule_config)
                setScheduleConfig(
                    typeof cRes.data.schedule_config === 'string'
                        ? JSON.parse(cRes.data.schedule_config)
                        : cRes.data.schedule_config
                );
        };
        fetchData();
    }, [selectedClass]);

    useEffect(() => {
        loadData();
    }, [selectedClass, week]);

    const loadData = async () => {
        if (!selectedClass?.id) return;
        try {
            const res = await api.get('/specialized', {
                params: { class_id: selectedClass.id, week, type: 'monitor' },
            });
            setViolations(res.data.violations);
        } catch (e) {
            console.error(e);
        }
    };

    const groupedViolations = useMemo(() => {
        if (!violations || violations.length === 0) return [];
        const groups: Record<string, GroupedViolation> = {};
        violations.forEach((v) => {
            const timeKey = v.created_at ? new Date(v.created_at).getTime() : v.id;
            const key = `${v.date}_${v.violation_type}_${v.group_number}_${timeKey}_${v.note?.trim()}`;
            if (!groups[key]) {
                groups[key] = {
                    key,
                    ids: [v.id],
                    date: v.date,
                    group_number: v.group_number,
                    violation_type: v.violation_type,
                    student_names: v.student_name ? [v.student_name] : [],
                    note: v.note,
                    created_at: v.created_at || '',
                };
            } else {
                groups[key].ids.push(v.id);
                if (v.student_name) groups[key].student_names.push(v.student_name);
            }
        });
        return Object.values(groups).sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }, [violations]);

    const currentDayViolations = useMemo(() => {
        const dateStr = weekDates[activeDayTab];
        if (!dateStr) return [];
        return groupedViolations.filter((v) => v.date.startsWith(dateStr));
    }, [groupedViolations, activeDayTab, weekDates]);

    const getCount = (group: number, type: string) =>
        currentDayViolations.filter((v) => v.group_number === group && v.violation_type === type)
            .length;
    const getGroupTotal = (group: number) =>
        currentDayViolations.filter((v) => v.group_number === group).length;
    const uniqueGroups = useMemo(
        () => Array.from(new Set(students.map((s) => s.group_number))).sort((a, b) => a - b),
        [students]
    );

    const MONITOR_VIOLATIONS = [
        { code: 'LATE', label: 'Đi trễ' },
        { code: 'SKIP', label: 'Bỏ tiết' },
        { code: 'DISORDER', label: 'Gây mất trật tự' },
        { code: 'UNIFORM', label: 'Không đồng phục' },
        { code: 'SWEARING', label: 'Nói tục - Chửi thề' },
        { code: 'FIGHTING', label: 'Đánh nhau' },
        { code: 'DISRESPECT', label: 'Vô lễ' },
    ];

    const handleOpenModal = (group: number, typeCode: string, typeName: string) => {
        if (!canEdit) return;
        setModalData({ group, type: typeCode, typeName, date: weekDates[activeDayTab] });
        setIsModalOpen(true);
    };

    const handleSave = async (studentIds: string[] | null, note: string) => {
        if (!modalData) return;
        try {
            await api.post('/specialized', {
                type: 'monitor',
                class_id: selectedClass?.id,
                date: modalData.date,
                week_number: week,
                group_number: modalData.group,
                student_ids: studentIds,
                violation_type: modalData.type,
                note,
                reporter_id: user?.id,
            });
            setIsModalOpen(false);
            loadData();
        } catch (e) {
            alert('Lỗi lưu');
        }
    };

    const handleDelete = async (ids: number[]) => {
        if (!canEdit || !window.confirm('Xóa?')) return;
        try {
            await api.delete(`/specialized/${ids.join(',')}`, { params: { type: 'monitor' } });
            loadData();
        } catch (e) {
            alert('Lỗi xóa');
        }
    };

    return (
        <div className="duty-container">
            <div className="tracking-header-modern">
                <div className="duty-header-top">
                    <button onClick={() => navigate(-1)} className="btn-back-modern">
                        <FaArrowLeft /> Quay lại
                    </button>
                    <h1 className="duty-page-title">
                        <FaUserTie /> THEO DÕI NỀ NẾP (LỚP TRƯỞNG)
                    </h1>
                </div>
                <div className="week-control-area">
                    <button
                        className="btn-nav"
                        disabled={week <= 1}
                        onClick={() => setWeek((p) => p - 1)}
                    >
                        <FaChevronLeft />
                    </button>
                    <div className="week-display">
                        <span className="week-number">TUẦN {week}</span>
                        {week === currentRealWeek && (
                            <span className="badge-current">Hiện tại</span>
                        )}
                        {weekDates[0] && (
                            <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                {new Date(weekDates[0]).toLocaleDateString('vi-VN')} -{' '}
                                {new Date(weekDates[6]).toLocaleDateString('vi-VN')}
                            </div>
                        )}
                    </div>
                    <button className="btn-nav" onClick={() => setWeek((p) => p + 1)}>
                        <FaChevronRight />
                    </button>
                </div>
            </div>

            <div className="duty-section-card">
                <h3 className="duty-section-title">
                    <FaUserEdit color="#3498db" /> GHI NHẬN HÀNG NGÀY
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
                            {MONITOR_VIOLATIONS.map((v) => (
                                <tr key={v.code}>
                                    <td style={{ textAlign: 'left', paddingLeft: '15px' }}>
                                        {v.label}
                                    </td>
                                    {uniqueGroups.map((g) => {
                                        const count = getCount(g, v.code);
                                        return (
                                            <td
                                                key={g}
                                                onClick={() => handleOpenModal(g, v.code, v.label)}
                                                className={`duty-cell-interactive ${count > 0 ? 'trk-has-data' : ''}`}
                                                style={{
                                                    textAlign: 'center',
                                                    cursor: canEdit ? 'pointer' : 'not-allowed',
                                                }}
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
                                                (x) => x.violation_type === v.code
                                            ).length
                                        }
                                    </td>
                                </tr>
                            ))}
                            <tr style={{ background: '#f9fafb', fontWeight: 'bold' }}>
                                <td style={{ textAlign: 'left', paddingLeft: '15px' }}>TỔNG</td>
                                {uniqueGroups.map((g) => (
                                    <td key={g} style={{ textAlign: 'center', color: '#e74c3c' }}>
                                        {getGroupTotal(g) || '-'}
                                    </td>
                                ))}
                                <td style={{ textAlign: 'center', color: '#c0392b' }}>
                                    {currentDayViolations.length}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <DutyHistoryTable
                groupedViolations={groupedViolations}
                week={week}
                canEdit={canEdit}
                onDelete={handleDelete}
            />

            <DutyViolationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                data={modalData}
                students={students}
                allowAllGroup={false}
            />
        </div>
    );
};

export default MonitorTrackingPage;
