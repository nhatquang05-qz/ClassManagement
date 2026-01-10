import React, { useState } from 'react';
import ExamList from '../components/exam/teacher/ExamList';
import ExamBuilder from '../components/exam/create/ExamBuilder';
// Import ExamBuilder từ câu trả lời trước
// Import ExamDetail nếu có

const TeacherExamPage = () => {
    const [view, setView] = useState<'list' | 'create'>('list');

    return (
        <div className="teacher-exam-page" style={{ padding: 20 }}>
            {view === 'list' && (
                <ExamList
                    onCreate={() => setView('create')}
                    onViewDetail={(id: number) =>
                        alert(`Chức năng xem chi tiết bài #${id} đang phát triển`)
                    }
                />
            )}

            {view === 'create' && <ExamBuilder onBack={() => setView('list')} />}
        </div>
    );
};

export default TeacherExamPage;
