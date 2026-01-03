import React, { useState, useEffect, useMemo } from 'react';
import '../assets/styles/ReportPage.css';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSearch } from 'react-icons/fa';

import api from '../utils/api';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

interface ReportItem {
    id: number;
    log_date: string;
    student_name: string;
    group_number: number;
    violation_name: string;
    category: string;
    points: number;
    quantity: number;
    note: string;
}

interface ViolationType {
    id: number;
    name: string;
}

const getWeekRange = (weekValue: string) => {
    if (!weekValue) return { start: '', end: '' };
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

const ReportPage = () => {
    const navigate = useNavigate();

    const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());
    const [startDate, setStartDate] = useState(() => getWeekRange(getCurrentWeek()).start);
    const [endDate, setEndDate] = useState(() => getWeekRange(getCurrentWeek()).end);

    const [studentName, setStudentName] = useState('');
    const [violationTypeId, setViolationTypeId] = useState('');
    const [groupId, setGroupId] = useState('');

    const [reportData, setReportData] = useState<ReportItem[]>([]);
    const [violationsList, setViolationsList] = useState<ViolationType[]>([]);

    const [availableGroups, setAvailableGroups] = useState<number[]>([]);

    const [loading, setLoading] = useState(false);

    const weekOptions = useMemo(() => {
        const options = [];
        const today = new Date();
        const currentYear = today.getFullYear();
        const totalWeeks = 52;

        for (let i = 1; i <= totalWeeks; i++) {
            const weekValue = `${currentYear}-W${i.toString().padStart(2, '0')}`;
            const { start, end } = getWeekRange(weekValue);
            const label = `Tuần ${i} (${start.split('-').reverse().join('/')} - ${end.split('-').reverse().join('/')})`;
            options.push({ value: weekValue, label });
        }
        return options;
    }, []);

    const handleWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setSelectedWeek(val);
        if (val) {
            const { start, end } = getWeekRange(val);
            setStartDate(start);
            setEndDate(end);
        }
    };

    useEffect(() => {
        const fetchViolations = async () => {
            try {
                const res = await api.get('/violations');
                if (Array.isArray(res.data)) setViolationsList(res.data);
            } catch (err) {
                console.error('Lỗi tải danh sách vi phạm:', err);
            }
        };
        fetchViolations();
    }, []);

    useEffect(() => {
        const fetchGroups = async () => {
            const selectedClassId = localStorage.getItem('selectedClassId');
            if (!selectedClassId) return;

            try {
                const res = await api.get('/users', {
                    params: { class_id: selectedClassId },
                });

                const data = res.data;
                if (Array.isArray(data)) {
                    const groups = Array.from(new Set(data.map((u: any) => u.group_number)))
                        .filter((g: any) => g != null)
                        .sort((a: any, b: any) => a - b);
                    setAvailableGroups(groups as number[]);
                }
            } catch (err) {
                console.error('Lỗi tải danh sách tổ:', err);
            }
        };
        fetchGroups();
    }, []);

    const fetchReport = async () => {
        const selectedClassId = localStorage.getItem('selectedClassId');
        if (!selectedClassId) {
            alert('Vui lòng chọn lớp trước khi xem báo cáo.');
            navigate('/classes');
            return;
        }

        setLoading(true);
        try {
            const res = await api.get('/reports/detailed', {
                params: {
                    startDate,
                    endDate,
                    studentName,
                    violationTypeId,
                    groupId,
                    class_id: selectedClassId,
                },
            });

            setReportData(res.data);
        } catch (error) {
            console.error('Lỗi tải báo cáo:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [startDate, endDate]);

    const chartGroupStats = useMemo(() => {
        const stats: Record<
            string,
            { name: string; penaltyRaw: number; bonus: number; violationCount: number }
        > = {};

        availableGroups.forEach((g) => {
            stats[g.toString()] = { name: `Tổ ${g}`, penaltyRaw: 0, bonus: 0, violationCount: 0 };
        });

        reportData.forEach((item) => {
            const groupKey = item.group_number.toString();

            if (!stats[groupKey]) {
                stats[groupKey] = {
                    name: `Tổ ${item.group_number}`,
                    penaltyRaw: 0,
                    bonus: 0,
                    violationCount: 0,
                };
            }

            if (stats[groupKey]) {
                const totalPoints = item.points * item.quantity;

                stats[groupKey].violationCount += item.quantity;

                if (totalPoints > 0) {
                    stats[groupKey].bonus += totalPoints;
                } else {
                    stats[groupKey].penaltyRaw += totalPoints;
                }
            }
        });

        return Object.values(stats)
            .sort((a, b) => {
                const numA = parseInt(a.name.replace('Tổ ', '')) || 0;
                const numB = parseInt(b.name.replace('Tổ ', '')) || 0;
                return numA - numB;
            })
            .map((item) => ({
                ...item,
                penalty: Math.abs(item.penaltyRaw),
            }));
    }, [reportData, availableGroups]);

    const chartDataByCategory = useMemo(() => {
        const counts: Record<string, number> = {};
        reportData.forEach((item) => {
            counts[item.violation_name] = (counts[item.violation_name] || 0) + item.quantity;
        });
        return Object.keys(counts).map((key) => ({ name: key, value: counts[key] }));
    }, [reportData]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];

    const totalViolations = reportData.reduce((acc, curr) => acc + curr.quantity, 0);

    const totalPointsLost = reportData.reduce((acc, curr) => {
        const p = curr.points * curr.quantity;
        return p < 0 ? acc + p : acc;
    }, 0);

    const uniqueStudents = new Set(reportData.map((r) => r.student_name)).size;

    return (
        <div className="report-page-container">
            <div
                className="r-page-header"
                style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}
            >
                <button
                    onClick={() => navigate(-1)}
                    className="btn-back"
                    style={{
                        marginRight: '15px',
                        padding: '8px 15px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                    }}
                >
                    <FaArrowLeft /> Quay lại
                </button>
                <h2 className="r-page-title" style={{ margin: 0 }}>
                    Báo Cáo Chi Tiết & Thống Kê
                </h2>
            </div>

            <div className="filter-section">
                <div className="filter-group">
                    <label>Chọn tuần:</label>
                    <select value={selectedWeek} onChange={handleWeekChange}>
                        {weekOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label>Tên học sinh:</label>
                    <input
                        type="text"
                        placeholder="Nhập tên..."
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <label>Loại vi phạm:</label>
                    <select
                        value={violationTypeId}
                        onChange={(e) => setViolationTypeId(e.target.value)}
                    >
                        <option value="">-- Tất cả --</option>
                        {violationsList.map((v) => (
                            <option key={v.id} value={v.id}>
                                {v.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label>Nhóm/Tổ:</label>
                    <select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                        <option value="">-- Tất cả --</option>
                        {availableGroups.map((g) => (
                            <option key={g} value={g}>
                                Tổ {g}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    className="btn-search"
                    onClick={fetchReport}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        justifyContent: 'center',
                    }}
                >
                    {loading ? (
                        'Đang tải...'
                    ) : (
                        <>
                            <FaSearch /> Tìm kiếm
                        </>
                    )}
                </button>
            </div>

            <div className="stats-cards">
                <div className="card red-card">
                    <h3>{totalViolations}</h3>
                    <p>Lượt vi phạm</p>
                </div>
                <div className="card orange-card">
                    <h3>{totalPointsLost}</h3>
                    <p>Tổng điểm trừ</p>
                </div>
                <div className="card blue-card">
                    <h3>{uniqueStudents}</h3>
                    <p>Học sinh vi phạm</p>
                </div>
            </div>

            <div className="table-wrapper">
                <table className="report-table">
                    <thead>
                        <tr>
                            <th>Ngày</th>
                            <th>Tổ</th>
                            <th>Học sinh</th>
                            <th>Lỗi vi phạm</th>
                            <th>Điểm trừ</th>
                            <th>SL</th>
                            <th>Ghi chú</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.length > 0 ? (
                            reportData.map((row) => (
                                <tr key={row.id}>
                                    <td>{row.log_date}</td>
                                    <td style={{ textAlign: 'center' }}>{row.group_number}</td>
                                    <td style={{ fontWeight: 'bold' }}>{row.student_name}</td>
                                    <td>
                                        <span
                                            className={`badge category-${row.category ? row.category.toLowerCase() : 'other'}`}
                                        >
                                            {row.violation_name}
                                        </span>
                                    </td>
                                    <td className="text-danger">{row.points * row.quantity}</td>
                                    <td style={{ textAlign: 'center' }}>{row.quantity}</td>
                                    <td className="note-cell">{row.note || '-'}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>
                                    Không tìm thấy dữ liệu phù hợp.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {reportData.length > 0 && (
                <div
                    className="charts-container"
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '20px',
                        marginTop: '40px',
                        justifyContent: 'center',
                    }}
                >
                    <div
                        style={{
                            flex: '1 1 45%',
                            background: '#fff',
                            padding: '20px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }}
                    >
                        <h3 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '18px' }}>
                            So sánh Điểm Cộng vs Điểm Trừ
                        </h3>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={chartGroupStats}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Legend verticalAlign="top" height={36} />
                                <Bar dataKey="bonus" name="Điểm Cộng" fill="#00C49F" barSize={30} />
                                <Bar
                                    dataKey="penalty"
                                    name="Điểm Trừ"
                                    fill="#FF4560"
                                    barSize={30}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div
                        style={{
                            flex: '1 1 45%',
                            background: '#fff',
                            padding: '20px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }}
                    >
                        <h3 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '18px' }}>
                            Số Lần Vi Phạm Theo Tổ
                        </h3>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={chartGroupStats}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Legend verticalAlign="top" height={36} />
                                <Bar
                                    dataKey="violationCount"
                                    name="Số lần vi phạm"
                                    fill="#FFBB28"
                                    barSize={50}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div
                        style={{
                            flex: '1 1 45%',
                            background: '#fff',
                            padding: '20px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }}
                    >
                        <h3 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '18px' }}>
                            Tỉ lệ các loại lỗi
                        </h3>
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie
                                    data={chartDataByCategory}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ percent }: { percent?: number }) =>
                                        `${((percent || 0) * 100).toFixed(0)}%`
                                    }
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {chartDataByCategory.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportPage;
