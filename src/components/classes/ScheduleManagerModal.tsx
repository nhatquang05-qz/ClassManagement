import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaMagic } from 'react-icons/fa';
import api from '../../utils/api';
import '../../assets/styles/ClassManagerModal.css';

interface ScheduleItem {
    week: number;
    startDate: string;
    title?: string;
    isBreak?: boolean;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    classId: number;
    className: string;
    schoolYear: string;
    startDateStr: string;
    initialConfig?: ScheduleItem[] | null;
}

const ScheduleManagerModal: React.FC<Props> = ({
    isOpen,
    onClose,
    classId,
    className,
    schoolYear,
    startDateStr,
    initialConfig
}) => {
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [loading, setLoading] = useState(false);

    const generateSchedule = (start: string, currentConfig?: ScheduleItem[]) => {
        const weeks = [];
        const startDate = new Date(start);
        
        const day = startDate.getDay();
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(startDate.setDate(diff));

        let academicWeekCounter = 1;

        for (let i = 0; i < 52; i++) {
            const currentWeekDate = new Date(monday);
            currentWeekDate.setDate(monday.getDate() + (i * 7));
            
            const y = currentWeekDate.getFullYear();
            const m = String(currentWeekDate.getMonth() + 1).padStart(2, '0');
            const d = String(currentWeekDate.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${d}`;

            const existing = currentConfig?.find(c => c.startDate === dateStr);
            const isBreak = existing ? existing.isBreak : false;
            
            weeks.push({
                startDate: dateStr,
                isBreak: isBreak,
                week: isBreak ? 0 : academicWeekCounter++,
                title: isBreak ? 'Nghỉ' : `Tuần ${academicWeekCounter - 1}`
            });
            
            if (isBreak) academicWeekCounter--;
        }
        return weeks;
    };

    useEffect(() => {
        if (isOpen && startDateStr) {
            const initialList = initialConfig && initialConfig.length > 0 
                ? generateSchedule(startDateStr, initialConfig) 
                : generateSchedule(startDateStr);
            setSchedule(initialList);
        }
    }, [isOpen, startDateStr, initialConfig]);

    const toggleBreak = (index: number) => {
        const newSchedule = [...schedule];
        newSchedule[index].isBreak = !newSchedule[index].isBreak;

        let counter = 1;
        for (let i = 0; i < newSchedule.length; i++) {
            if (newSchedule[i].isBreak) {
                newSchedule[i].week = 0;
                newSchedule[i].title = 'Nghỉ';
            } else {
                newSchedule[i].week = counter;
                newSchedule[i].title = `Tuần ${counter}`;
                counter++;
            }
        }
        setSchedule(newSchedule);
    };

    const handleSave = async () => {
        try {
            setLoading(true);

            
            
            const d = new Date(startDateStr);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const formattedStartDate = `${y}-${m}-${day}`;

            await api.put(`/classes/${classId}`, {
                name: className,
                school_year: schoolYear,
                start_date: formattedStartDate, 
                schedule_config: schedule
            });
            alert('Đã cập nhật lịch học thành công!');
            onClose();
            window.location.reload();
        } catch (error: any) {
            alert('Lỗi khi lưu lịch học: ' + (error.response?.data?.message || error.message));
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="cm-overlay" style={{zIndex: 10000}}>
            <div className="cm-modal" style={{width: '600px', maxWidth: '95%'}}>
                <div className="cm-header">
                    <h2>Cấu Hình Lịch Học - {className} ({schoolYear})</h2>
                    <button className="cm-close-btn" onClick={onClose}><FaTimes /></button>
                </div>
                
                <div className="cm-body" style={{maxHeight: '70vh', overflowY: 'auto'}}>
                    <div style={{marginBottom: 15, fontStyle: 'italic', color: '#666'}}>
                        <FaMagic style={{marginRight: 5}}/>
                        Tick vào ô "Nghỉ" để đánh dấu tuần nghỉ lễ/Tết. Số tuần học sẽ tự động nhảy số.
                    </div>

                    <table className="trk-table" style={{width: '100%'}}>
                        <thead>
                            <tr>
                                <th>Thời gian (T2)</th>
                                <th>Tuần học</th>
                                <th style={{textAlign: 'center'}}>Nghỉ?</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schedule.map((item, index) => (
                                <tr key={item.startDate} style={{backgroundColor: item.isBreak ? '#fff3cd' : 'transparent'}}>
                                    <td>{new Date(item.startDate).toLocaleDateString('vi-VN')}</td>
                                    <td>
                                        <strong>{item.isBreak ? '---' : item.week}</strong>
                                    </td>
                                    <td style={{textAlign: 'center'}}>
                                        <input 
                                            type="checkbox" 
                                            checked={!!item.isBreak} 
                                            onChange={() => toggleBreak(index)}
                                            style={{transform: 'scale(1.5)', cursor: 'pointer'}}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="cm-form-actions" style={{padding: 20, borderTop: '1px solid #eee'}}>
                     <button className="cm-btn cancel" onClick={onClose}>Hủy</button>
                     <button className="cm-btn submit" onClick={handleSave} disabled={loading}>
                        <FaSave /> {loading ? 'Đang lưu...' : 'Lưu Cấu Hình'}
                     </button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleManagerModal;