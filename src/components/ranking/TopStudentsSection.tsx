import React, { useMemo } from 'react';
import { StudentSummary } from '../../types/rankingTypes';

interface Props {
    students: StudentSummary[];
}

const TopStudentsSection: React.FC<Props> = ({ students }) => {
    if (students.length === 0) return null;

    
    const orderedStudents = useMemo(() => {
        
        const withRank = students.map((stu, index) => ({ ...stu, rankIndex: index }));

        if (withRank.length === 3) {
            
            return [withRank[1], withRank[0], withRank[2]];
        }
        if (withRank.length === 2) {
            
            return [withRank[1], withRank[0]];
        }
        
        return withRank;
    }, [students]);

    return (
        <section style={{ marginBottom: '30px', textAlign: 'center' }}>
            <h2 className="section-title" style={{ color: '#d97706' }}>
                🌟 Top 3 Học Sinh Xuất Sắc 🌟
            </h2>
            <div className="top-students-list">
                {orderedStudents.map((stu) => {
                    const isTop1 = stu.rankIndex === 0;
                    return (
                        <div
                            key={stu.rankIndex}
                            className={`student-card ${isTop1 ? 'top-1' : ''}`}
                        >
                            <div style={{ fontSize: '2rem' }}>
                                {stu.rankIndex === 0 ? '🥇' : stu.rankIndex === 1 ? '🥈' : '🥉'}
                            </div>
                            <div style={{ fontWeight: 'bold', margin: '5px 0' }}>{stu.name}</div>
                            <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                Tổ {stu.group}
                            </div>
                            <div
                                className={`student-score ${stu.total > 0 ? 'score-positive' : 'score-negative'}`}
                            >
                                {stu.total > 0 ? `+${stu.total}` : stu.total} đ
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default TopStudentsSection;