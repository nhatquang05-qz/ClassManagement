import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import DailyTrackingTable from '../components/tracking/DailyTrackingTable';
import HistoryLogTable from '../components/tracking/HistoryLogTable';
import { Student, ViolationType, DailyLogPayload } from '../types/trackingTypes';
import { useAuth } from '../contexts/AuthContext';
import { useClass } from '../contexts/ClassContext'; 
import { getWeekNumberFromStart, getWeekDatesFromStart } from '../utils/dateUtils'; 
import '../assets/styles/TrackingPage.css';

const TrackingPage: React.FC = () => {
    const { user } = useAuth();
    const { selectedClass } = useClass(); 
    const navigate = useNavigate();

    const [students, setStudents] = useState<Student[]>([]);
    const [violationTypes, setViolationTypes] = useState<ViolationType[]>([]);
    const [existingLogs, setExistingLogs] = useState<DailyLogPayload[]>([]);

    const currentYear = new Date().getFullYear();

    
    const currentRealWeek = useMemo(() => {
        return getWeekNumberFromStart(new Date(), selectedClass?.start_date);
    }, [selectedClass]);

    const [selectedWeek, setSelectedWeek] = useState(1);
    const [activeDayIndex, setActiveDayIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [activeGroupTab, setActiveGroupTab] = useState<string>('all');

    const selectedClassId = localStorage.getItem('selectedClassId');
    const selectedClassName = localStorage.getItem('selectedClassName');

    
    useEffect(() => {
        if (currentRealWeek > 0) {
            setSelectedWeek(currentRealWeek);
        }
    }, [currentRealWeek]);

    
    const weekDates = useMemo(
        () => getWeekDatesFromStart(selectedWeek, selectedClass?.start_date),
        [selectedWeek, selectedClass]
    );

    const currentSelectedDate = activeDayIndex < 6 ? weekDates[activeDayIndex] : undefined;

    const canEdit = useMemo(() => {
        if (user?.role === 'admin') return true;
        if (user?.role === 'teacher') return true;
        if (user?.role === 'group_leader') return selectedWeek === currentRealWeek;
        return false;
    }, [user, selectedWeek, currentRealWeek]);

    const displayedStudents = useMemo(() => {
        if (activeGroupTab === 'all') {
            return students;
        }
        return students.filter((s) => s.group_number === parseInt(activeGroupTab));
    }, [students, activeGroupTab]);

    const uniqueGroups = useMemo(() => {
        const groups = new Set(students.map((s) => s.group_number));

        return Array.from(groups)
            .filter((g) => g != null)
            .sort((a, b) => a - b);
    }, [students]);

    useEffect(() => {
        if (user?.role === 'teacher' || user?.role === 'admin') {
            if (!selectedClassId) {
                alert('Bạn chưa chọn lớp học!');
                navigate('/classes');
            }
        }
    }, [user, navigate, selectedClassId]);

    useEffect(() => {
        const fetchBaseData = async () => {
            if (!selectedClassId && user?.role !== 'student') return;

            try {
                const [vRes, sRes] = await Promise.all([
                    api.get('/violations'),
                    api.get('/users', {
                        params: {
                            class_id: selectedClassId || undefined,
                            group_number:
                                user?.role === 'group_leader' ? user.group_number : undefined,
                        },
                    }),
                ]);
                setViolationTypes(vRes.data);
                setStudents(sRes.data);
            } catch (error) {
                console.error('Lỗi tải dữ liệu gốc:', error);
            }
        };
        if (user) fetchBaseData();
    }, [user, selectedClassId]);

    useEffect(() => {
        const fetchWeekData = async () => {
            if (!selectedClassId && user?.role !== 'student') return;

            setLoading(true);
            try {
                const params: any = {
                    week: selectedWeek,
                    class_id: selectedClassId,
                };

                if (user?.role === 'group_leader' && user.group_number) {
                    params.group_number = user.group_number;
                }

                const res = await api.get('/reports/weekly', { params });
                setExistingLogs(res.data);
            } catch (error) {
                console.error('Lỗi tải dữ liệu tuần:', error);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchWeekData();
    }, [selectedWeek, user, selectedClassId]);

    const groupTotalScore = useMemo(() => {
        let total = 0;
        const displayedIds = displayedStudents.map((s) => s.id);
        existingLogs.forEach((log) => {
            if (displayedIds.includes(log.student_id)) {
                const points =
                    log.points !== undefined
                        ? log.points
                        : violationTypes.find((v) => v.id === log.violation_type_id)?.points || 0;
                total += points * (log.quantity || 1);
            }
        });
        return total;
    }, [existingLogs, displayedStudents, violationTypes]);

    const handleSubmit = async (logsToSave: DailyLogPayload[], dateToSave: string) => {
        if (!canEdit) {
            alert('Bạn không có quyền chỉnh sửa tuần này!');
            return;
        }

        const [y, m, d] = dateToSave.split('-');
        const displayDate = `${d}/${m}/${y}`;

        if (!window.confirm(`Xác nhận lưu dữ liệu cho ngày ${displayDate}?`)) return;

        try {
            await api.post('/reports/bulk', {
                reports: logsToSave,
                reporter_id: user?.id,
                week_number: selectedWeek,
                log_date: dateToSave,
                year: currentYear,

                class_id: selectedClassId,
            });
            alert('Lưu thành công!');

            const params: any = {
                week: selectedWeek,
                class_id: selectedClassId,
            };
            if (user?.role === 'group_leader') params.group_number = user.group_number;

            const res = await api.get('/reports/weekly', { params });
            setExistingLogs(res.data);
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Lỗi khi lưu sổ.');
        }
    };

    const handleDeleteLog = async (logId: number) => {
        if (!canEdit) {
            alert('Bạn không có quyền chỉnh sửa tuần này!');
            return;
        }
        if (!window.confirm('Bạn có chắc chắn muốn xóa dòng ghi nhận này?')) return;

        try {
            await api.delete(`/reports/${logId}`);

            const params: any = {
                week: selectedWeek,
                class_id: selectedClassId,
            };
            if (user?.role === 'group_leader') params.group_number = user.group_number;

            const res = await api.get('/reports/weekly', { params });
            setExistingLogs(res.data);
        } catch (error: any) {
            console.error('Lỗi xóa log:', error);
            alert(error.response?.data?.message || 'Không thể xóa.');
        }
    };

    return (
        <div className="tracking-page">
            <div className="tracking-header-modern">
                <div className="header-top">
                    <button onClick={() => navigate(-1)} className="btn-back-modern">
                        <span>←</span> Quay lại
                    </button>
                    <h1 className="page-title">
                        SỔ THEO DÕI {selectedClassName ? `- ${selectedClassName}` : ''}{' '}
                        {user?.group_number ? `(TỔ ${user.group_number})` : ''}
                    </h1>
                </div>

                <div className="week-control-area">
                    <button
                        className="btn-nav"
                        disabled={selectedWeek <= 1}
                        onClick={() => setSelectedWeek((p) => p - 1)}
                        title="Tuần trước"
                    >
                        ❮
                    </button>

                    <div className="week-display">
                        <span className="week-number">TUẦN {selectedWeek}</span>
                        {selectedWeek === currentRealWeek && (
                            <span className="badge-current">Tuần hiện tại</span>
                        )}
                        {}
                        {weekDates.length > 0 && (
                            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                                {new Date(weekDates[0]).getDate()}/
                                {new Date(weekDates[0]).getMonth() + 1}
                                {' - '}
                                {new Date(
                                    weekDates[6] || weekDates[weekDates.length - 1]
                                ).getDate()}
                                /
                                {new Date(
                                    weekDates[6] || weekDates[weekDates.length - 1]
                                ).getMonth() + 1}
                            </div>
                        )}
                    </div>

                    <button
                        className="btn-nav"
                        disabled={selectedWeek >= 52}
                        onClick={() => setSelectedWeek((p) => p + 1)}
                        title="Tuần sau"
                    >
                        ❯
                    </button>
                </div>

                <div className="info-bar">
                    <div className="info-card">
                        <div className="info-icon user-icon">👤</div>
                        <div className="info-content">
                            <span className="info-label">Người xem</span>
                            <span className="info-value">{user?.full_name}</span>
                        </div>
                    </div>

                    <div className="info-card">
                        <div className="info-icon score-icon">📊</div>
                        <div className="info-content">
                            <span className="info-label">
                                {activeGroupTab === 'all'
                                    ? 'Tổng điểm Lớp'
                                    : `Tổng điểm Tổ ${activeGroupTab}`}
                            </span>
                            <span
                                className={`info-value score-value ${groupTotalScore >= 0 ? 'positive' : 'negative'}`}
                            >
                                {groupTotalScore > 0 ? `+${groupTotalScore}` : groupTotalScore}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {}
            {(user?.role === 'teacher' || user?.role === 'admin') && (
                <div className="group-filter-tabs">
                    <button
                        className={`group-tab ${activeGroupTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveGroupTab('all')}
                    >
                        Toàn bộ lớp ({students.length})
                    </button>
                    {}
                    {uniqueGroups.map((gNum) => (
                        <button
                            key={gNum}
                            className={`group-tab ${activeGroupTab === String(gNum) ? 'active' : ''}`}
                            onClick={() => setActiveGroupTab(String(gNum))}
                        >
                            Tổ {gNum}
                        </button>
                    ))}
                    {}
                </div>
            )}

            <div className="page-content">
                {loading ? (
                    <div
                        className="loading-container"
                        style={{ textAlign: 'center', padding: '40px', color: '#666' }}
                    >
                        Đang tải dữ liệu tuần {selectedWeek}...
                    </div>
                ) : (
                    <>
                        <DailyTrackingTable
                            students={displayedStudents}
                            violationTypes={violationTypes}
                            initialData={existingLogs}
                            isReadOnly={!canEdit}
                            weekDates={weekDates}
                            activeDayIndex={activeDayIndex}
                            setActiveDayIndex={setActiveDayIndex}
                            onSubmit={handleSubmit}
                        />

                        {}
                        <HistoryLogTable
                            logs={
                                user?.role === 'student'
                                    ? existingLogs.filter((l) => l.student_id === user.id)
                                    : existingLogs
                            }
                            onDelete={handleDeleteLog}
                            activeDate={currentSelectedDate}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default TrackingPage;
