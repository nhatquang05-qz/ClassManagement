import React, { useState, useEffect, useRef } from 'react';
import { useClass } from '../contexts/ClassContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import {
    FaSearch,
    FaPlus,
    FaTrash,
    FaFilePdf,
    FaFileWord,
    FaFileExcel,
    FaFileImage,
    FaFileAlt,
    FaDownload,
    FaBullhorn,
    FaPaperclip,
    FaClock,
} from 'react-icons/fa';
import '../assets/styles/ClassInfoPage.css';

interface Announcement {
    id: number;
    title: string;
    content: string;
    file_url?: string;
    file_name?: string;
    file_type?: string;
    author_name: string;
    created_at: string;
    is_pinned: boolean;
}

const ClassInfoPage: React.FC = () => {
    const { selectedClass } = useClass();
    const { user } = useAuth();
    const [posts, setPosts] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const canEdit = user?.role === 'teacher' || user?.role === 'admin';

    useEffect(() => {
        if (selectedClass?.id) {
            fetchPosts();
        }
    }, [selectedClass, searchTerm]);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/info', {
                params: { class_id: selectedClass?.id, search: searchTerm },
            });
            setPosts(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClass?.id) return;

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('class_id', selectedClass.id.toString());
        formData.append('title', newTitle);
        formData.append('content', newContent);
        if (file) {
            formData.append('file', file);
        }

        try {
            await api.post('/info', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            alert('Đăng thông báo thành công!');
            setIsModalOpen(false);
            setNewTitle('');
            setNewContent('');
            setFile(null);
            fetchPosts();
        } catch (error) {
            console.error(error);
            alert('Lỗi khi đăng bài.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Bạn chắc chắn muốn xóa thông báo này?')) return;
        try {
            await api.delete(`/info/${id}`);
            fetchPosts();
        } catch (error) {
            alert('Không thể xóa.');
        }
    };

    const getFileIcon = (type?: string) => {
        if (!type) return <FaFileAlt className="text-gray-500" />;
        const t = type.toLowerCase();
        if (t.includes('pdf')) return <FaFilePdf color="#e74c3c" />;
        if (t.includes('doc') || t.includes('word')) return <FaFileWord color="#3498db" />;
        if (t.includes('xls') || t.includes('sheet')) return <FaFileExcel color="#27ae60" />;
        if (t.includes('jpg') || t.includes('png') || t.includes('img'))
            return <FaFileImage color="#f39c12" />;
        return <FaFileAlt color="#7f8c8d" />;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="class-info-page">
            <div className="info-header">
                <h2>
                    <FaBullhorn /> {selectedClass?.name}
                </h2>
                <div className="info-actions">
                    <div className="search-box">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm thông báo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {canEdit && (
                        <button className="btn-add-post" onClick={() => setIsModalOpen(true)}>
                            <FaPlus /> <span className="btn-text">Tạo thông báo</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="posts-container">
                {loading ? (
                    <div className="loading">Đang tải...</div>
                ) : posts.length > 0 ? (
                    posts.map((post) => (
                        <div
                            key={post.id}
                            className={`post-card ${post.is_pinned ? 'pinned' : ''}`}
                        >
                            <div className="post-header">
                                <h3 className="post-title">{post.title}</h3>
                                <div className="post-meta">
                                    <span className="author-name">{post.author_name}</span>
                                    <span>•</span>
                                    <span
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                        }}
                                    >
                                        <FaClock size={12} /> {formatDate(post.created_at)}
                                    </span>
                                </div>
                                {canEdit && (
                                    <button
                                        className="btn-delete-post"
                                        onClick={() => handleDelete(post.id)}
                                        title="Xóa bài viết"
                                    >
                                        <FaTrash />
                                    </button>
                                )}
                            </div>
                            <div className="post-content">
                                {post.content.split('\n').map((line, i) => (
                                    <p key={i}>{line}</p>
                                ))}
                            </div>
                            {post.file_url && (
                                <div className="post-attachment">
                                    <div className="file-icon">{getFileIcon(post.file_type)}</div>
                                    <div className="file-info">
                                        <span className="file-name">
                                            {post.file_name || 'Tài liệu đính kèm'}
                                        </span>
                                        <a
                                            href={post.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-download"
                                        >
                                            <FaDownload /> Tải xuống / Xem
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="empty-state">Chưa có thông báo nào.</div>
                )}
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content info-modal">
                        <h3>Tạo thông báo mới</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Tiêu đề</label>
                                <input
                                    required
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="Nhập tiêu đề thông báo..."
                                />
                            </div>
                            <div className="form-group">
                                <label>Nội dung</label>
                                <textarea
                                    rows={5}
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                    placeholder="Nhập nội dung chi tiết..."
                                />
                            </div>
                            <div className="form-group">
                                <label>Đính kèm tệp</label>
                                <div
                                    className="file-upload-wrapper"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <FaPaperclip />{' '}
                                    {file ? file.name : 'Chọn file (PDF, Word, Ảnh...)'}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        hidden
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="btn-submit"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Đang đăng...' : 'Đăng thông báo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassInfoPage;
