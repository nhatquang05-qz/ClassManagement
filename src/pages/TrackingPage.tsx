import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaArrowLeft, 
    FaChevronLeft, 
    FaChevronRight, 
    FaChartBar, 
    FaSave, 
    FaStickyNote 
} from 'react-icons/fa';
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

    const [fetchedStartDate, setFetchedStartDate] = useState<string | undefined>(
        selectedClass?.start_date
    );

    const currentYear = new Date().getFullYear();

    const selectedClassId =
        selectedClass?.id?.toString() || localStorage.getItem('selectedClassId');
    const selectedClassName = selectedClass?.name || localStorage.getItem('selectedClassName');

    const classStartDate = fetchedStartDate || selectedClass?.start_date;

    const currentRealWeek = useMemo(() => {
        return getWeekNumberFromStart(new Date(), classStartDate);
    }, [classStartDate]);

    const [selectedWeek, setSelectedWeek] = useState(1);
    const [activeDayIndex, setActiveDayIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [activeGroupTab, setActiveGroupTab] = useState<string>('all');

    
    const [dailyNote, setDailyNote] = useState('');
    const [isNoteSaving, setIsNoteSaving] = useState(false);

    const targetGroupNumber = useMemo(() => {
        if (user?.role === 'group_leader') {
            return user.monitoring_group ? user.monitoring_group : user.group_number;
        }
        return undefined;
    }, [user]);

    useEffect(() => {
        if (currentRealWeek > 0) {
            setSelectedWeek(currentRealWeek);
        }
    }, [currentRealWeek]);

    const weekDates = useMemo(
        () => getWeekDatesFromStart(selectedWeek, classStartDate),
        [selectedWeek, classStartDate]
    );

    
    const currentSelectedDate =
        weekDates.length > 0 ? weekDates[activeDayIndex < 6 ? activeDayIndex : 0] : undefined;

    
    
    
    const viewMode = activeDayIndex === 6 ? 'week' : 'day';

    const canEdit = useMemo(() => {
        if (user?.role === 'admin') return true;
        if (user?.role === 'teacher') return true;
        if (user?.role === 'group_leader') return selectedWeek === currentRealWeek;
        return false;
    }, [user, selectedWeek, currentRealWeek]);

    const displayedStudents = useMemo(() => {
        if (activeGroupTab === 'all') return students;
        return students.filter((s) => s.group_number === parseInt(activeGroupTab));
    }, [students, activeGroupTab]);

    const uniqueGroups = useMemo(() => {
        const groups = new Set(students.map((s) => s.group_number));
        return Array.from(groups)
            .filter((g) => g != null)
            .sort((a, b) => a - b);
    }, [students]);

    const currentNoteGroup = useMemo(() => {
        if (user?.role === 'group_leader') return targetGroupNumber;
        if (activeGroupTab !== 'all') return parseInt(activeGroupTab);
        return undefined;
    }, [user, targetGroupNumber, activeGroupTab]);

    useEffect(() => {
        if ((user?.role === 'teacher' || user?.role === 'admin') && !selectedClassId) {
            alert('Bạn chưa chọn lớp học!');
            navigate('/');
        }
    }, [user, navigate, selectedClassId]);

    useEffect(() => {
        if (selectedClass?.start_date) {
            setFetchedStartDate(selectedClass.start_date);
        }
    }, [selectedClass]);

    useEffect(() => {
        const fetchBaseData = async () => {
            if (!selectedClassId && user?.role !== 'student') return;
            try {
                if (selectedClassId) {
                    const classRes = await api.get(`/classes/${selectedClassId}`);
                    if (classRes.data && classRes.data.start_date) {
                        setFetchedStartDate(classRes.data.start_date);
                    }
                }

                const [vRes, sRes] = await Promise.all([
                    api.get('/violations'),
                    api.get('/users', {
                        params: {
                            class_id: selectedClassId || undefined,
                            group_number:
                                user?.role === 'group_leader' ? targetGroupNumber : undefined,
                        },
                    }),
                ]);
                setViolationTypes(vRes.data);
                setStudents(sRes.data);
            } catch (error) {
                console.error('Lỗi tải dữ liệu gốc:', error);
            }
        };
        fetchBaseData();
    }, [selectedClassId, user, targetGroupNumber]);

    useEffect(() => {
        const fetchWeekData = async () => {
            if (!selectedClassId && user?.role !== 'student') return;
            if (!weekDates || weekDates.length === 0) return;

            setLoading(true);
            try {
                const params: any = {
                    week: selectedWeek,
                    class_id: selectedClassId,
                    from_date: weekDates[0],
                    to_date: weekDates[6],
                };

                if (user?.role === 'group_leader' && targetGroupNumber) {
                    params.group_number = targetGroupNumber;
                }
                const res = await api.get('/reports/weekly', { params });
                setExistingLogs(res.data);
            } catch (error) {
                console.error('Lỗi tải dữ liệu tuần:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchWeekData();
    }, [selectedWeek, selectedClassId, weekDates, user, targetGroupNumber]);

    useEffect(() => {
        const fetchDailyNote = async () => {
            if (activeDayIndex === 6 || !currentSelectedDate || !selectedClassId) {
                setDailyNote('');
                return;
            }
            try {
                const res = await api.get('/reports/note', {
                    params: {
                        class_id: selectedClassId,
                        date: currentSelectedDate,
                        group_number: currentNoteGroup
                    }
                });
                setDailyNote(res.data.content || '');
            } catch (error) {
                console.error('Lỗi tải ghi chú:', error);
            }
        };
        fetchDailyNote();
    }, [currentSelectedDate, activeDayIndex, selectedClassId, currentNoteGroup]);

    const handleSaveNote = async () => {
        if (!currentSelectedDate || !selectedClassId) return;
        setIsNoteSaving(true);
        try {
            await api.post('/reports/note', {
                class_id: selectedClassId,
                date: currentSelectedDate,
                group_number: currentNoteGroup,
                content: dailyNote
            });
            alert('Đã lưu ghi chú thành công!');
        } catch (error) {
            console.error('Lỗi lưu ghi chú:', error);
            alert('Lỗi khi lưu ghi chú');
        } finally {
            setIsNoteSaving(false);
        }
    };

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
        if (!dateToSave) {
            alert('Lỗi: Ngày không hợp lệ.');
            return;
        }
        const [y, m, d] = dateToSave.split('-');
        const displayDate = `${d}/${m}/${y}`;
        if (!window.confirm(`Xác nhận lưu dữ liệu sổ cho ngày ${displayDate}?`)) return;
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
                from_date: weekDates[0],
                to_date: weekDates[6],
            };
            if (user?.role === 'group_leader') params.group_number = targetGroupNumber;
            const res = await api.get('/reports/weekly', { params });
            setExistingLogs(res.data);
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Lỗi khi lưu sổ.');
        }
    };

    const handleDeleteLog = async (logId: number) => {
        if (!canEdit) return;
        if (!window.confirm('Bạn có chắc chắn muốn xóa?')) return;
        try {
            await api.delete(`/reports/${logId}`);
            const params: any = {
                week: selectedWeek,
                class_id: selectedClassId,
                from_date: weekDates[0],
                to_date: weekDates[6],
            };
            if (user?.role === 'group_leader') params.group_number = targetGroupNumber;
            const res = await api.get('/reports/weekly', { params });
            setExistingLogs(res.data);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Không thể xóa.');
        }
    };

    const getScoreLabel = () => {
        if (user?.role === 'group_leader') {
            return `Tổng điểm Tổ ${targetGroupNumber} (Đang giám sát)`;
        }
        if (activeGroupTab === 'all') return 'Tổng điểm Lớp';
        return `Tổng điểm Tổ ${activeGroupTab}`;
    };

    return (
        <div className="tracking-page">
            <div className="tracking-header-modern">
                <div className="header-top">
                    <button onClick={() => navigate(-1)} className="btn-back-modern">
                        <FaArrowLeft /> Quay lại
                    </button>
                    <h1 className="page-title">
                        SỔ THEO DÕI {selectedClassName ? `- ${selectedClassName}` : ''}
                    </h1>
                </div>

                <div className="week-control-area">
                    <button
                        className="btn-nav"
                        disabled={selectedWeek <= 1}
                        onClick={() => setSelectedWeek((p) => p - 1)}
                    >
                        <FaChevronLeft />
                    </button>
                    <div className="week-display">
                        <span className="week-number">TUẦN {selectedWeek}</span>
                        {selectedWeek === currentRealWeek && (
                            <span className="badge-current">Hiện tại</span>
                        )}
                        {weekDates.length > 0 && (
                            <div style={{ fontSize: '0.9rem', color: '#4b5563', marginTop: '4px' }}>
                                {new Date(weekDates[0]).toLocaleDateString('vi-VN')} -{' '}
                                {new Date(weekDates[6]).toLocaleDateString('vi-VN')}
                            </div>
                        )}
                    </div>
                    <button className="btn-nav" onClick={() => setSelectedWeek((p) => p + 1)}>
                        <FaChevronRight />
                    </button>
                </div>

                <div className="info-bar">
                    <div className="info-card">
                        <div className="info-icon score-icon">
                            <FaChartBar />
                        </div>
                        <div className="info-content">
                            <span className="info-label">{getScoreLabel()}</span>
                            <span className={`info-value score-value ${groupTotalScore >= 0 ? 'positive' : 'negative'}`}>
                                {groupTotalScore > 0 ? `+${groupTotalScore}` : groupTotalScore}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {(user?.role === 'teacher' || user?.role === 'admin') && (
                <div className="group-filter-tabs">
                    <button
                        className={`group-tab ${activeGroupTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveGroupTab('all')}
                    >
                        Toàn bộ lớp
                    </button>
                    {uniqueGroups.map((gNum) => (
                        <button
                            key={gNum}
                            className={`group-tab ${activeGroupTab === String(gNum) ? 'active' : ''}`}
                            onClick={() => setActiveGroupTab(String(gNum))}
                        >
                            Tổ {gNum}
                        </button>
                    ))}
                </div>
            )}

            <div className="page-content">
                {!classStartDate && (
                    <div className="alert-warning" style={{marginBottom: 20, padding: 10, background: '#fff3cd', color: '#856404', borderRadius: 4, textAlign: 'center'}}>
                        ⚠ Lưu ý: Lớp học chưa được cấu hình "Ngày bắt đầu năm học".
                    </div>
                )}

                {loading ? (
                    <div className="loading-container">Đang tải dữ liệu...</div>
                ) : (
                    <>
                        <DailyTrackingTable
                            key={`table-${selectedWeek}-${existingLogs.length}-${displayedStudents.length}`}
                            students={displayedStudents}
                            violationTypes={violationTypes}
                            initialData={existingLogs}
                            isReadOnly={!canEdit}
                            weekDates={weekDates}
                            activeDayIndex={activeDayIndex}
                            setActiveDayIndex={setActiveDayIndex}
                            onSubmit={handleSubmit}
                        />

                        {activeDayIndex < 6 && (
                            <div className="daily-note-section">
                                <div className="daily-note-header">
                                    <h3 className="note-title">
                                        <FaStickyNote style={{ marginRight: '8px', color: '#f39c12' }} />
                                        Ghi chú {currentNoteGroup ? `Tổ ${currentNoteGroup}` : 'Chung'} 
                                        {' - '}{new Date(currentSelectedDate || '').toLocaleDateString('vi-VN')}
                                    </h3>
                                    {canEdit && (
                                        <button 
                                            className="btn-save-note" 
                                            onClick={handleSaveNote}
                                            disabled={isNoteSaving}
                                        >
                                            <FaSave /> {isNoteSaving ? 'Đang lưu...' : 'Lưu ghi chú'}
                                        </button>
                                    )}
                                </div>
                                <textarea
                                    className="daily-note-input"
                                    placeholder="Nhập ghi chú chung, các vi phạm khác hoặc nhắc nhở..."
                                    value={dailyNote}
                                    onChange={(e) => setDailyNote(e.target.value)}
                                    disabled={!canEdit}
                                    rows={3}
                                />
                            </div>
                        )}

                        <HistoryLogTable
                            logs={existingLogs}
                            onDelete={handleDeleteLog}
                            activeDate={currentSelectedDate}
                            viewMode={viewMode}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default TrackingPage;