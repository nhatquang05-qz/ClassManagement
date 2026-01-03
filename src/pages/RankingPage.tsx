import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

import { ReportItem, Student, StudentSummary, GroupDetail } from '../types/rankingTypes';

import '../assets/styles/RankingPage.css';
import RankingSection from '../components/ranking/RankingSection';
import TopStudentsSection from '../components/ranking/TopStudentsSection';
import GroupDetailsGrid from '../components/ranking/GroupDetailsGrid';

const getCurrentWeek = () => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
    const week1 = new Date(date.getFullYear(), 0, 4);
    const weekNumber =
        1 +
        Math.round(
            ((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
        );
    return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
};

const getWeekRange = (weekValue: string) => {
    const [year, week] = weekValue.split('-W').map(Number);
    const simpleDate = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simpleDate.getDay();
    const ISOweekStart = simpleDate;
    if (dow <= 4) ISOweekStart.setDate(simpleDate.getDate() - simpleDate.getDay() + 1);
    else ISOweekStart.setDate(simpleDate.getDate() + 8 - simpleDate.getDay());

    const startDate = new Date(ISOweekStart);
    const endDate = new Date(ISOweekStart);
    endDate.setDate(endDate.getDate() + 6);

    return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
    };
};

const RankingPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());

    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [reportData, setReportData] = useState<ReportItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const classId = localStorage.getItem('selectedClassId') || (user as any)?.class_id;

            if (!classId) {
                setLoading(false);
                return;
            }

            const { start, end } = getWeekRange(selectedWeek);

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
    }, [user, selectedWeek]);

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
                <button onClick={() => navigate('/')} className="btn-back">
                    ⬅ Quay lại
                </button>
                <div className="week-selector">
                    <label style={{ fontWeight: 'bold' }}>Chọn tuần:</label>
                    <input
                        type="week"
                        value={selectedWeek}
                        onChange={(e) => setSelectedWeek(e.target.value)}
                        style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
                    />
                </div>
            </div>

            <h1 className="page-title">Bảng Xếp Hạng Tuần {selectedWeek.split('-W')[1]}</h1>

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