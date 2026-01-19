import React, { useState, useEffect } from 'react';
import { useClass } from '../contexts/ClassContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ExamList from '../components/exam/teacher/ExamList';
import ExamBuilder from '../components/exam/create/ExamBuilder';

const TeacherExamPage: React.FC = () => {
    const { selectedClass } = useClass();
    const navigate = useNavigate();

    const [view, setView] = useState<'list' | 'create'>('list');
    const [exams, setExams] = useState<any[]>([]);

    const [editingExamData, setEditingExamData] = useState<any>(null);

    useEffect(() => {
        if (selectedClass && view === 'list') {
            fetchExams();
        }
    }, [selectedClass, view]);

    const fetchExams = async () => {
        if (!selectedClass) return;
        try {
            const res = await api.get(`/exams/class/${selectedClass.id}`);
            setExams(res.data);
        } catch (error) {
            console.error('Lỗi tải danh sách thi:', error);
        }
    };

    const handleCreate = () => {
        setEditingExamData(null);
        setView('create');
    };

    const handleEdit = async (exam: any) => {
        try {
            const res = await api.get(`/exams/${exam.id}`);
            setEditingExamData(res.data);
            setView('create');
        } catch (error) {
            alert('Lỗi tải dữ liệu bài thi');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa bài thi này?')) return;
        try {
            await api.delete(`/exams/${id}`);
            fetchExams();
        } catch (error) {
            alert('Lỗi xóa bài thi');
        }
    };

    const handleViewDetail = (id: number) => {
        navigate(`/teacher/exams/${id}`);
    };

    return (
        <div className="teacher-exam-page">
            {view === 'list' && (
                <ExamList
                    exams={exams}
                    onCreate={handleCreate}
                    onViewDetail={handleViewDetail}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}

            {view === 'create' && selectedClass && (
                <ExamBuilder
                    classId={selectedClass.id}
                    onBack={() => {
                        setView('list');
                        fetchExams();
                    }}
                    examId={editingExamData?.id}
                    initialData={editingExamData}
                />
            )}

            {}
        </div>
    );
};

export default TeacherExamPage;
