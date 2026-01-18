import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

import { useClass } from '../contexts/ClassContext';

import { ReportItem, Student, StudentSummary, GroupDetail } from '../types/rankingTypes';

import { getWeekNumberFromStart, getWeekDatesFromStart, WeekSchedule } from '../utils/dateUtils';

import '../assets/styles/RankingPage.css';
import RankingSection from '../components/ranking/RankingSection';
import TopStudentsSection from '../components/ranking/TopStudentsSection';
import GroupDetailsGrid from '../components/ranking/GroupDetailsGrid';
import { FaArrowLeft } from 'react-icons/fa';

const RankingPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const { selectedClass } = useClass();

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
                        if (res.data.start_date) {
                            setFetchedStartDate(res.data.start_date);
                        }
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
        if (currentRealWeek > 0) {
            setSelectedWeek(currentRealWeek);
        }
    }, [currentRealWeek]);

    const weekOptions = useMemo(() => {
        if (!classStartDate) return [];
        const options = [];
        for (let i = 1; i <= 45; i++) {
            const dates = getWeekDatesFromStart(i, classStartDate, scheduleConfig);
            if (dates && dates.length > 0) {
                const sDate = new Date(dates[0]);
                const eDate = new Date(dates[6]);
                const label = `Tuần ${i} (${sDate.getDate()}/${sDate.getMonth() + 1} - ${eDate.getDate()}/${eDate.getMonth() + 1})`;
                options.push({ value: i, label });
            }
        }
        return options;
    }, [classStartDate, scheduleConfig]);

    useEffect(() => {
        const fetchData = async () => {
            const classId = localStorage.getItem('selectedClassId') || (user as any)?.class_id;

            if (!classId || !classStartDate) {
                return;
            }

            const dates = getWeekDatesFromStart(selectedWeek, classStartDate, scheduleConfig);
            if (!dates || dates.length === 0) return;

            const start = dates[0];
            const end = dates[6];

            setLoading(true);
            try {
                const [studentsRes, reportRes] = await Promise.all([
                    api.get(`/users?class_id=${classId}`),
                    api.get('/reports/detailed', {
                        params: { class_id: classId, startDate: start, endDate: end },
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

    const { rankings, top3Students, detailedGroups } = useMemo(() => {
        const groupPoints: Record<string, number> = {};
        const studentStats: Record<string, StudentSummary> = {};
        const groupsDetailTemp: Record<string, GroupDetail> = {};

        const initGroup = (groupNum: number) => {
            const gKey = groupNum.toString();
            if (!groupsDetailTemp[gKey]) {
                groupsDetailTemp[gKey] = {
                    group_number: groupNum,
                    members: {},
                    total_group_points: 0,
                };
            }
            if (groupPoints[gKey] === undefined) {
                groupPoints[gKey] = 0;
            }
        };

        allStudents.forEach((stu) => {
            const gNum = stu.group_number;
            const sName = stu.full_name;

            if (gNum) initGroup(gNum);

            const gKey = gNum?.toString();

            if (gKey && groupsDetailTemp[gKey] && sName) {
                groupsDetailTemp[gKey].members[sName] = {
                    name: sName,
                    plus: 0,
                    minus: 0,
                    total: 0,
                };

                studentStats[sName] = { name: sName, group: gNum, total: 0 };
            }
        });

        reportData.forEach((item) => {
            if (item.group_number) initGroup(item.group_number);

            const totalPoints = (item.points || 0) * (item.quantity || 0);
            const gKey = item.group_number?.toString();
            const sName = item.student_name;

            if (!gKey || !sName) return;

            if (groupPoints[gKey] !== undefined) groupPoints[gKey] += totalPoints;

            if (!studentStats[sName]) {
                studentStats[sName] = { name: sName, group: item.group_number, total: 0 };
            }
            studentStats[sName].total += totalPoints;

            if (groupsDetailTemp[gKey]) {
                groupsDetailTemp[gKey].total_group_points += totalPoints;

                if (!groupsDetailTemp[gKey].members[sName]) {
                    groupsDetailTemp[gKey].members[sName] = {
                        name: sName,
                        plus: 0,
                        minus: 0,
                        total: 0,
                    };
                }

                if (totalPoints > 0) {
                    groupsDetailTemp[gKey].members[sName].plus += totalPoints;
                } else {
                    groupsDetailTemp[gKey].members[sName].minus += totalPoints;
                }
                groupsDetailTemp[gKey].members[sName].total += totalPoints;
            }
        });

        return {
            rankings: Object.keys(groupPoints)
                .map((key) => ({
                    group_number: parseInt(key),
                    total_points: groupPoints[key],
                }))
                .sort((a, b) => b.total_points - a.total_points),

            top3Students: Object.values(studentStats)
                .sort((a, b) => b.total - a.total)
                .slice(0, 3),

            detailedGroups: Object.values(groupsDetailTemp).sort(
                (a, b) => a.group_number - b.group_number
            ),
        };
    }, [reportData, allStudents]);

    return (
        <div className="ranking-page-container">
            <div className="ranking-header-controls">
                <button
                    onClick={() => navigate('/')}
                    className="btn-back"
                    style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                >
                    <FaArrowLeft /> Quay lại
                </button>
                <div className="week-selector">
                    <label style={{ fontWeight: 'bold', marginRight: 10 }}>Chọn tuần:</label>
                    {}
                    {!classStartDate ? (
                        <span style={{ color: 'red', fontStyle: 'italic' }}>
                            Chưa cấu hình lịch
                        </span>
                    ) : (
                        <select
                            value={selectedWeek}
                            onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                            style={{
                                padding: '8px',
                                borderRadius: '5px',
                                border: '1px solid #ccc',
                                minWidth: '200px',
                            }}
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
                    )}
                </div>
            </div>

            <h1 className="page-title">Bảng Xếp Hạng Tuần {selectedWeek}</h1>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>Đang tải dữ liệu...</div>
            ) : (
                <>
                    <RankingSection rankings={rankings} />
                    <TopStudentsSection students={top3Students} />
                    <GroupDetailsGrid groups={detailedGroups} />
                </>
            )}
        </div>
    );
};

export default RankingPage;
