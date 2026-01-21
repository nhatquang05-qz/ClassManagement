import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useClass } from '../contexts/ClassContext';
import { ReportItem, Student, StudentSummary, GroupDetail } from '../types/rankingTypes';
import { getWeekNumberFromStart, getWeekDatesFromStart, WeekSchedule } from '../utils/dateUtils';
import '../assets/styles/RankingPage.css';
import GroupDetailsGrid from '../components/ranking/GroupDetailsGrid';
import { FaArrowLeft, FaTrophy, FaCrown } from 'react-icons/fa';

interface ExtendedGroupDetail extends GroupDetail {
    total_plus: number;
    total_minus: number;
}

const RankingPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { selectedClass } = useClass();

    const [showIntro, setShowIntro] = useState(true);
    const [isFadingOut, setIsFadingOut] = useState(false);

    const [animationStep, setAnimationStep] = useState(0);
    const [showFireworks, setShowFireworks] = useState(false);

    useEffect(() => {
        setShowIntro(true);
        setIsFadingOut(false);
        setAnimationStep(0);
        setShowFireworks(false);
    }, []);

    const handleUnlock = () => {
        setIsFadingOut(true);
        setTimeout(() => {
            setShowIntro(false);

            setAnimationStep(1);
            setTimeout(() => setAnimationStep(2), 800);
            setTimeout(() => {
                setAnimationStep(3);
                setShowFireworks(true);
            }, 1600);

            setTimeout(() => setAnimationStep(4), 2400);
            setTimeout(() => setAnimationStep(5), 3200);
            setTimeout(() => setAnimationStep(6), 4000);

            setTimeout(() => setAnimationStep(7), 4800);
        }, 800);
    };

    const [fetchedStartDate, setFetchedStartDate] = useState<string | undefined>(
        selectedClass?.start_date
    );
    const [scheduleConfig, setScheduleConfig] = useState<WeekSchedule[] | null>(null);
    const classStartDate = fetchedStartDate || selectedClass?.start_date;

    const currentRealWeek = useMemo(() => {
        if (!classStartDate) return 1;
        return getWeekNumberFromStart(new Date(), classStartDate, scheduleConfig);
    }, [classStartDate, scheduleConfig]);

    const [selectedWeek, setSelectedWeek] = useState<number>(1);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [reportData, setReportData] = useState<ReportItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchClassInfo = async () => {
            const selectedClassId = selectedClass?.id || localStorage.getItem('selectedClassId');
            if (selectedClassId) {
                try {
                    const res = await api.get(`/classes/${selectedClassId}`);
                    if (res.data) {
                        if (res.data.start_date) setFetchedStartDate(res.data.start_date);
                        if (res.data.schedule_config) {
                            const config =
                                typeof res.data.schedule_config === 'string'
                                    ? JSON.parse(res.data.schedule_config)
                                    : res.data.schedule_config;
                            setScheduleConfig(config);
                        }
                    }
                } catch (error) {
                    console.error('Lỗi lấy thông tin lớp:', error);
                }
            }
        };
        fetchClassInfo();
    }, [selectedClass?.id]);

    useEffect(() => {
        if (currentRealWeek > 0) setSelectedWeek(currentRealWeek);
    }, [currentRealWeek]);

    const weekOptions = useMemo(() => {
        if (!classStartDate) return [];
        const options = [];
        for (let i = 1; i <= 45; i++) {
            const dates = getWeekDatesFromStart(i, classStartDate, scheduleConfig);
            if (dates && dates.length > 0) {
                const sDate = new Date(dates[0]);
                const eDate = new Date(dates[6]);
                options.push({
                    value: i,
                    label: `Tuần ${i} (${sDate.getDate()}/${sDate.getMonth() + 1} - ${eDate.getDate()}/${eDate.getMonth() + 1})`,
                });
            }
        }
        return options;
    }, [classStartDate, scheduleConfig]);

    useEffect(() => {
        const fetchData = async () => {
            const classId = localStorage.getItem('selectedClassId') || (user as any)?.class_id;
            if (!classId || !classStartDate) return;
            const dates = getWeekDatesFromStart(selectedWeek, classStartDate, scheduleConfig);
            if (!dates || dates.length === 0) return;

            setLoading(true);
            try {
                const [studentsRes, reportRes] = await Promise.all([
                    api.get(`/users?class_id=${classId}`),
                    api.get('/reports/detailed', {
                        params: { class_id: classId, startDate: dates[0], endDate: dates[6] },
                    }),
                ]);
                setAllStudents(studentsRes.data || []);
                setReportData(reportRes.data || []);
            } catch (error) {
                console.error('Failed to fetch data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user, selectedWeek, classStartDate, scheduleConfig]);

    const { rankings, top3Students, detailedGroups, sortedGroupsForTable } = useMemo(() => {
        const groupPoints: Record<string, number> = {};
        const studentStats: Record<string, StudentSummary> = {};
        const groupsDetailTemp: Record<string, ExtendedGroupDetail> = {};

        const initGroup = (groupNum: number) => {
            const gKey = groupNum.toString();
            if (!groupsDetailTemp[gKey]) {
                groupsDetailTemp[gKey] = {
                    group_number: groupNum,
                    members: {},
                    total_group_points: 0,
                    total_plus: 0,
                    total_minus: 0,
                };
            }
            if (groupPoints[gKey] === undefined) groupPoints[gKey] = 0;
        };

        allStudents.forEach((stu) => {
            if (stu.group_number) initGroup(stu.group_number);
            if (stu.group_number && stu.full_name) {
                const gKey = stu.group_number.toString();
                groupsDetailTemp[gKey].members[stu.full_name] = {
                    name: stu.full_name,
                    plus: 0,
                    minus: 0,
                    total: 0,
                };
                studentStats[stu.full_name] = {
                    name: stu.full_name,
                    group: stu.group_number,
                    total: 0,
                };
            }
        });

        reportData.forEach((item) => {
            if (item.group_number) initGroup(item.group_number);
            const total = (item.points || 0) * (item.quantity || 0);
            const gKey = item.group_number?.toString();
            const sName = item.student_name;

            if (gKey && sName) {
                groupPoints[gKey] = (groupPoints[gKey] || 0) + total;
                if (!studentStats[sName])
                    studentStats[sName] = { name: sName, group: item.group_number, total: 0 };
                studentStats[sName].total += total;

                if (groupsDetailTemp[gKey]) {
                    groupsDetailTemp[gKey].total_group_points += total;

                    if (total > 0) groupsDetailTemp[gKey].total_plus += total;
                    else groupsDetailTemp[gKey].total_minus += total;

                    if (!groupsDetailTemp[gKey].members[sName])
                        groupsDetailTemp[gKey].members[sName] = {
                            name: sName,
                            plus: 0,
                            minus: 0,
                            total: 0,
                        };
                    if (total > 0) groupsDetailTemp[gKey].members[sName].plus += total;
                    else groupsDetailTemp[gKey].members[sName].minus += total;
                    groupsDetailTemp[gKey].members[sName].total += total;
                }
            }
        });

        const groupsArray = Object.values(groupsDetailTemp);

        return {
            rankings: Object.keys(groupPoints)
                .map((k) => ({ group_number: parseInt(k), total_points: groupPoints[k] }))
                .sort((a, b) => b.total_points - a.total_points),
            top3Students: Object.values(studentStats)
                .sort((a, b) => b.total - a.total)
                .slice(0, 3),
            detailedGroups: groupsArray.sort((a, b) => a.group_number - b.group_number),
            sortedGroupsForTable: [...groupsArray].sort(
                (a, b) => b.total_group_points - a.total_group_points
            ),
        };
    }, [reportData, allStudents]);

    const Fireworks = () => (
        <div className="firework-container">
            {[...Array(6)].map((_, i) => (
                <div
                    key={i}
                    className="firework"
                    style={{
                        left: `${Math.random() * 80 + 10}%`,
                        top: `${Math.random() * 50}%`,
                        animationDelay: `${Math.random()}s`,
                        backgroundColor: ['#ff0', '#f0f', '#0ff', '#0f0'][i % 4],
                    }}
                />
            ))}
        </div>
    );

    return (
        <div className="ranking-page-container">
            {showIntro && (
                <div
                    className={`ranking-intro-overlay ${isFadingOut ? 'fade-out' : ''}`}
                    onClick={handleUnlock}
                >
                    <div className="intro-content">
                        <FaTrophy className="intro-trophy" />
                        <div className="intro-text">CHẠM ĐỂ VINH DANH</div>
                        <div className="intro-hint">(Nhấn vào màn hình để mở khóa)</div>
                    </div>
                </div>
            )}

            <div className="ranking-header-controls">
                <button onClick={() => navigate('/')} className="btn-back">
                    <FaArrowLeft /> Trang chủ
                </button>
                <div className="week-selector">
                    <label style={{ fontWeight: 'bold', marginRight: 10 }}>Tuần:</label>
                    <select
                        value={selectedWeek}
                        onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                        style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
                    >
                        {weekOptions.length > 0 ? (
                            weekOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))
                        ) : (
                            <option value={1}>Đang tải lịch...</option>
                        )}
                    </select>
                </div>
            </div>

            <h1 className="r-page-title">BẢNG XẾP HẠNG THI ĐUA TUẦN {selectedWeek}</h1>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>Đang tải dữ liệu...</div>
            ) : (
                <>
                    {}
                    <div className="podium-container">
                        {}
                        <div
                            className={`podium-item podium-rank-2 ${animationStep >= 2 ? 'show' : ''}`}
                        >
                            {rankings[1] && (
                                <div className="podium-info">
                                    <div className="group-badge">Tổ {rankings[1].group_number}</div>
                                    <div className="group-score-display">
                                        {rankings[1].total_points}
                                    </div>
                                </div>
                            )}
                            <div className="podium-base">2</div>
                        </div>

                        {}
                        <div
                            className={`podium-item podium-rank-1 ${animationStep >= 3 ? 'show' : ''}`}
                        >
                            {showFireworks && <Fireworks />}
                            {rankings[0] && (
                                <div className="podium-info">
                                    <FaCrown className="crown-icon" />
                                    <div className="group-badge">Tổ {rankings[0].group_number}</div>
                                    <div className="group-score-display">
                                        {rankings[0].total_points}
                                    </div>
                                </div>
                            )}
                            <div className="podium-base">1</div>
                        </div>

                        {}
                        <div
                            className={`podium-item podium-rank-3 ${animationStep >= 1 ? 'show' : ''}`}
                        >
                            {rankings[2] && (
                                <div className="podium-info">
                                    <div className="group-badge">Tổ {rankings[2].group_number}</div>
                                    <div className="group-score-display">
                                        {rankings[2].total_points}
                                    </div>
                                </div>
                            )}
                            <div className="podium-base">3</div>
                        </div>
                    </div>

                    {}
                    {animationStep >= 4 && top3Students.length > 0 && (
                        <>
                            <h2 className="r-section-title fade-in-content">CÁ NHÂN XUẤT SẮC</h2>
                            <div className="podium-container small">
                                {top3Students[1] && (
                                    <div
                                        className={`podium-item podium-rank-2 ${animationStep >= 5 ? 'show' : ''}`}
                                    >
                                        <div className="podium-info">
                                            <div className="student-name">
                                                {top3Students[1].name}
                                            </div>
                                            <div className="student-score">
                                                +{top3Students[1].total}
                                            </div>
                                        </div>
                                        <div className="podium-base">2</div>
                                    </div>
                                )}
                                {top3Students[0] && (
                                    <div
                                        className={`podium-item podium-rank-1 ${animationStep >= 6 ? 'show' : ''}`}
                                    >
                                        <div className="podium-info">
                                            <FaCrown className="crown-icon" />
                                            <div className="student-name">
                                                {top3Students[0].name}
                                            </div>
                                            <div className="student-score">
                                                +{top3Students[0].total}
                                            </div>
                                        </div>
                                        <div className="podium-base">1</div>
                                    </div>
                                )}
                                {top3Students[2] && (
                                    <div
                                        className={`podium-item podium-rank-3 ${animationStep >= 4 ? 'show' : ''}`}
                                    >
                                        <div className="podium-info">
                                            <div className="student-name">
                                                {top3Students[2].name}
                                            </div>
                                            <div className="student-score">
                                                +{top3Students[2].total}
                                            </div>
                                        </div>
                                        <div className="podium-base">3</div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {}
                    {animationStep >= 7 && (
                        <div className="fade-in-content">
                            <h2 className="r-section-title" style={{ marginTop: 50 }}>
                                BẢNG TỔNG SẮP TỔ
                            </h2>
                            <div className="ranking-table-container">
                                <table className="ranking-table">
                                    <thead>
                                        <tr>
                                            <th>Hạng</th>
                                            <th style={{ textAlign: 'left' }}>Tên Tổ</th>
                                            <th>Điểm Cộng</th>
                                            <th>Điểm Trừ</th>
                                            <th>Tổng Điểm</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedGroupsForTable.map((group, index) => (
                                            <tr key={group.group_number}>
                                                <td>
                                                    {index === 0 && (
                                                        <span style={{ fontSize: '1.2rem' }}>
                                                            🥇
                                                        </span>
                                                    )}
                                                    {index === 1 && (
                                                        <span style={{ fontSize: '1.2rem' }}>
                                                            🥈
                                                        </span>
                                                    )}
                                                    {index === 2 && (
                                                        <span style={{ fontSize: '1.2rem' }}>
                                                            🥉
                                                        </span>
                                                    )}
                                                    {index > 2 && (
                                                        <span
                                                            style={{
                                                                fontWeight: 'bold',
                                                                color: '#777',
                                                            }}
                                                        >
                                                            {index + 1}
                                                        </span>
                                                    )}
                                                </td>
                                                <td
                                                    style={{ textAlign: 'left', fontWeight: '600' }}
                                                >
                                                    Tổ {group.group_number}
                                                </td>
                                                <td className="text-green">+{group.total_plus}</td>
                                                <td className="text-red">{group.total_minus}</td>
                                                <td className="text-bold">
                                                    {group.total_group_points}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {}
                            <h2 className="r-section-title" style={{ marginTop: 50 }}>
                                CHI TIẾT ĐIỂM THÀNH VIÊN
                            </h2>
                            <GroupDetailsGrid groups={detailedGroups} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default RankingPage;
