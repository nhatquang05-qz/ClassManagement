import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useClass } from '../contexts/ClassContext';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import '../assets/styles/MaterialsPage.css';
import {
    FaFolder,
    FaFileAlt,
    FaVideo,
    FaLink,
    FaPlus,
    FaSearch,
    FaTrash,
    FaPen,
    FaFilePdf,
    FaFileWord,
    FaFileExcel,
    FaImage,
    FaTimes,
    FaCloudUploadAlt,
} from 'react-icons/fa';

interface Material {
    id: number;
    parent_id: number | null;
    type: 'folder' | 'file' | 'link' | 'video';
    title: string;
    url?: string;
    file_mime?: string;
}

const MaterialsPage: React.FC = () => {
    const { user } = useAuth();
    const { selectedClass } = useClass();
    const navigate = useNavigate();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [currentFolder, setCurrentFolder] = useState<{ id: number; title: string } | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<{ id: number; title: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'folder' | 'file' | 'link' | 'video'>('folder');
    const [formData, setFormData] = useState({ title: '', url: '', file: null as File | null });

    const isTeacherOrAdmin =
        user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'group_leader';

    useEffect(() => {
        if (selectedClass) {
            fetchMaterials();
        }
    }, [selectedClass, currentFolder]);

    const fetchMaterials = async () => {
        if (!selectedClass) return;
        setLoading(true);
        try {
            const parentId = currentFolder ? currentFolder.id : null;
            const res = await api.get(`/materials/${selectedClass.id}`, {
                params: { parentId },
            });
            setMaterials(res.data);
        } catch (error: any) {
            console.error(error);
            if (
                error.response &&
                (error.response.status === 401 || error.response.status === 403)
            ) {
                alert('Phiên đăng nhập hết hạn hoặc bạn không có quyền truy cập.');
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSearchTerm(term);
        if (term.length > 1) {
            try {
                const res = await api.get(`/materials/${selectedClass?.id}/search?q=${term}`);
                setMaterials(res.data);
            } catch (error) {
                console.error(error);
            }
        } else if (term.length === 0) {
            fetchMaterials();
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (
            !window.confirm(
                'Bạn có chắc muốn xóa? Nếu là thư mục, toàn bộ nội dung bên trong sẽ bị xóa.'
            )
        )
            return;
        try {
            await api.delete(`/materials/${id}`);
            fetchMaterials();
        } catch (error) {
            alert('Lỗi khi xóa');
        }
    };

    const handleCreate = async () => {
        if (!formData.title) return alert('Vui lòng nhập tên tiêu đề');

        const data = new FormData();
        data.append('type', modalType);
        data.append('title', formData.title);
        data.append('parentId', currentFolder ? currentFolder.id.toString() : '');
        if (formData.url) data.append('url', formData.url);
        if (formData.file) data.append('file', formData.file);

        try {
            await api.post(`/materials/${selectedClass?.id}`, data);

            setIsModalOpen(false);
            setFormData({ title: '', url: '', file: null });
            fetchMaterials();
        } catch (error: any) {
            console.error('Create error:', error);
            alert(`Lỗi khi tạo mới: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleFolderClick = (folder: Material) => {
        setBreadcrumbs([...breadcrumbs, { id: folder.id, title: folder.title }]);
        setCurrentFolder({ id: folder.id, title: folder.title });
        setSearchTerm('');
    };

    const handleBreadcrumbClick = (index: number) => {
        if (index === -1) {
            setBreadcrumbs([]);
            setCurrentFolder(null);
        } else {
            const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
            setBreadcrumbs(newBreadcrumbs);
            setCurrentFolder(newBreadcrumbs[newBreadcrumbs.length - 1]);
        }
    };

    const openMaterial = (item: Material) => {
        if (item.type === 'folder') {
            handleFolderClick(item);
        } else if (item.url) {
            window.open(item.url, '_blank');
        }
    };

    const getIcon = (item: Material) => {
        if (item.type === 'folder') return <FaFolder className="mat-icon folder" />;
        if (item.type === 'video') return <FaVideo className="mat-icon video" />;
        if (item.type === 'link') return <FaLink className="mat-icon link" />;

        const mime = item.file_mime || '';
        if (mime.includes('pdf')) return <FaFilePdf className="mat-icon pdf" />;
        if (mime.includes('word') || mime.includes('document'))
            return <FaFileWord className="mat-icon word" />;
        if (mime.includes('sheet') || mime.includes('excel'))
            return <FaFileExcel className="mat-icon excel" />;
        if (mime.includes('image')) return <FaImage className="mat-icon image" />;
        return <FaFileAlt className="mat-icon" />;
    };

    const getModalTitle = () => {
        switch (modalType) {
            case 'folder':
                return 'Tạo thư mục mới';
            case 'file':
                return 'Tải tài liệu lên';
            case 'link':
                return 'Thêm đường dẫn liên kết';
            case 'video':
                return 'Thêm Video';
            default:
                return 'Tạo mới';
        }
    };

    return (
        <div className="materials-container">
            <div className="materials-header-bar">
                <div className="mat-search-box">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm tài liệu, thư mục..."
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                </div>

                {isTeacherOrAdmin && (
                    <div className="mat-actions-group">
                        <button
                            className="btn-mat-create"
                            onClick={() => {
                                setModalType('folder');
                                setIsModalOpen(true);
                            }}
                        >
                            <FaFolder /> Thư mục
                        </button>
                        <button
                            className="btn-mat-create outline"
                            onClick={() => {
                                setModalType('file');
                                setIsModalOpen(true);
                            }}
                        >
                            <FaCloudUploadAlt /> Upload
                        </button>
                        <button
                            className="btn-mat-create outline"
                            onClick={() => {
                                setModalType('link');
                                setIsModalOpen(true);
                            }}
                        >
                            <FaLink /> Link
                        </button>
                    </div>
                )}
            </div>

            <div className="mat-breadcrumb-bar">
                <span
                    className={`crumb-item ${breadcrumbs.length === 0 ? 'active' : ''}`}
                    onClick={() => handleBreadcrumbClick(-1)}
                >
                    <FaFolder /> Tài liệu gốc
                </span>
                {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb.id}>
                        <span className="crumb-separator">/</span>
                        <span
                            className={`crumb-item ${index === breadcrumbs.length - 1 ? 'active' : ''}`}
                            onClick={() => handleBreadcrumbClick(index)}
                        >
                            {crumb.title}
                        </span>
                    </React.Fragment>
                ))}
            </div>

            <div className="materials-grid">
                {materials.length === 0 && !loading && (
                    <div className="mat-empty-state">
                        <img
                            src="https://cdn-icons-png.flaticon.com/512/7486/7486747.png"
                            alt="Empty"
                            width="100"
                            style={{ opacity: 0.5, marginBottom: 15 }}
                        />
                        <p>Thư mục này đang trống</p>
                    </div>
                )}

                {materials.map((item) => (
                    <div key={item.id} className="mat-card" onClick={() => openMaterial(item)}>
                        <div className="mat-card-icon">{getIcon(item)}</div>
                        <div className="mat-card-info">
                            <div className="mat-card-title" title={item.title}>
                                {item.title}
                            </div>
                            <div className="mat-card-meta">
                                {new Date().toLocaleDateString('vi-VN')}
                            </div>
                        </div>
                        {isTeacherOrAdmin && (
                            <div className="mat-card-actions">
                                <button
                                    className="action-btn delete"
                                    onClick={(e) => handleDelete(e, item.id)}
                                    title="Xóa"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {}
            {isModalOpen && (
                <div className="mat-modal-overlay">
                    <div className="mat-modal-container">
                        <div className="mat-modal-header">
                            <h3>{getModalTitle()}</h3>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                <FaTimes />
                            </button>
                        </div>
                        <div className="mat-modal-body">
                            <div className="form-group">
                                <label>
                                    Tiêu đề / Tên hiển thị <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="mat-input"
                                    placeholder="Nhập tên..."
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData({ ...formData, title: e.target.value })
                                    }
                                    autoFocus
                                />
                            </div>

                            {(modalType === 'link' || modalType === 'video') && (
                                <div className="form-group">
                                    <label>Đường dẫn (URL)</label>
                                    <input
                                        type="text"
                                        className="mat-input"
                                        placeholder="https://..."
                                        value={formData.url}
                                        onChange={(e) =>
                                            setFormData({ ...formData, url: e.target.value })
                                        }
                                    />
                                </div>
                            )}

                            {modalType === 'file' && (
                                <div className="form-group">
                                    <label>Chọn file</label>
                                    <div className="file-upload-wrapper">
                                        <input
                                            type="file"
                                            id="file-upload"
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    file: e.target.files ? e.target.files[0] : null,
                                                })
                                            }
                                        />
                                        <label htmlFor="file-upload" className="file-upload-label">
                                            {formData.file
                                                ? formData.file.name
                                                : 'Nhấn để chọn file...'}
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="mat-modal-footer">
                            <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                                Hủy bỏ
                            </button>
                            <button className="btn-submit" onClick={handleCreate}>
                                Tạo mới
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MaterialsPage;
