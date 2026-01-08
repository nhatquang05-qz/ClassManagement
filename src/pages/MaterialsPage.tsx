import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useClass } from '../contexts/ClassContext';
import api from '../utils/api';
import { useNavigate, useParams } from 'react-router-dom';
import '../assets/styles/MaterialsPage.css';
import {
    FaFolder,
    FaFileAlt,
    FaVideo,
    FaLink,
    FaSearch,
    FaTrash,
    FaFilePdf,
    FaFileWord,
    FaFileExcel,
    FaImage,
    FaTimes,
    FaCloudUploadAlt,
    FaSpinner,
    FaCheckCircle,
    FaExclamationCircle,
    FaArrowLeft,
    FaCopy,
    FaCut,
    FaPaste,
    FaEdit,
    FaArrowsAlt,
    FaShareAlt,
    FaUndo,
} from 'react-icons/fa';

interface Material {
    id: number;
    parent_id: number | null;
    type: 'folder' | 'file' | 'link' | 'video';
    title: string;
    description?: string;
    url?: string;
    file_mime?: string;
    created_at?: string;
}

interface ToastMessage {
    id: number;
    type: 'loading' | 'success' | 'error';
    title: string;
    message: string;
}

interface ClipboardItem {
    action: 'copy' | 'cut';
    item: Material;
    sourceParentId: number | null;
}

type HistoryAction =
    | { type: 'delete'; data: Material }
    | { type: 'move'; id: number; oldParentId: number | null; newParentId: number | null }
    | {
          type: 'rename';
          id: number;
          oldTitle: string;
          newTitle: string;
          oldDesc?: string;
          newDesc?: string;
      }
    | { type: 'create'; id: number }
    | { type: 'copy'; newId: number };

const MaterialsPage: React.FC = () => {
    const { user } = useAuth();
    const { selectedClass } = useClass();
    const navigate = useNavigate();
    const { folderId } = useParams<{ folderId: string }>();

    const [materials, setMaterials] = useState<Material[]>([]);
    const [breadcrumbsList, setBreadcrumbsList] = useState<{ id: number; title: string }[]>([]);
    const [loading, setLoading] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const [selectedItem, setSelectedItem] = useState<Material | null>(null);
    const [clipboard, setClipboard] = useState<ClipboardItem | null>(null);
    const [historyStack, setHistoryStack] = useState<HistoryAction[]>([]);

    const [draggedItem, setDraggedItem] = useState<Material | null>(null);
    const [dragOverFolderId, setDragOverFolderId] = useState<number | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [modalType, setModalType] = useState<'folder' | 'file' | 'link' | 'video'>('folder');
    const [formData, setFormData] = useState({
        id: 0,
        title: '',
        description: '',
        url: '',
        file: null as File | null,
    });
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        item: Material | null;
    } | null>(null);

    const contextMenuRef = useRef<HTMLDivElement>(null);
    const isTeacherOrAdmin =
        user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'group_leader';

    const fetchMaterials = useCallback(async () => {
        if (!selectedClass) return;
        setLoading(true);
        try {
            const parentId = folderId ? parseInt(folderId) : null;
            const listPromise = api.get(`/materials/${selectedClass.id}`, { params: { parentId } });
            let detailPromise = null;
            if (parentId) {
                detailPromise = api.get(`/materials/detail/${parentId}`);
            }

            const [listRes, detailRes] = await Promise.all([
                listPromise,
                detailPromise ? detailPromise : Promise.resolve(null),
            ]);

            setMaterials(listRes.data);

            if (detailRes && detailRes.data.path) {
                setBreadcrumbsList(detailRes.data.path);
            } else {
                setBreadcrumbsList([]);
            }
        } catch (error: any) {
            if (error.response?.status === 401) navigate('/login');
        } finally {
            setLoading(false);
        }
    }, [selectedClass, folderId, navigate]);

    useEffect(() => {
        fetchMaterials();
        setSelectedItem(null);
    }, [fetchMaterials]);

    const addToast = (type: 'loading' | 'success' | 'error', title: string, message: string) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, type, title, message }]);
        return id;
    };
    const updateToast = (id: number, type: 'success' | 'error', title: string, message: string) => {
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, type, title, message } : t)));
        setTimeout(() => removeToast(id), 3000);
    };
    const removeToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

    const handleUndo = async () => {
        if (historyStack.length === 0) return;
        const action = historyStack[historyStack.length - 1];
        const newStack = historyStack.slice(0, -1);
        setHistoryStack(newStack);

        const toastId = addToast('loading', 'Đang hoàn tác...', 'Đang khôi phục trạng thái cũ...');

        try {
            switch (action.type) {
                case 'delete':
                    const restoreData = new FormData();
                    restoreData.append('type', action.data.type);
                    restoreData.append('title', action.data.title);
                    restoreData.append('description', action.data.description || '');
                    restoreData.append(
                        'parentId',
                        action.data.parent_id ? action.data.parent_id.toString() : ''
                    );
                    if (action.data.url) restoreData.append('url', action.data.url);

                    await api.post(`/materials/${selectedClass?.id}`, restoreData);
                    break;

                case 'move':
                    await api.put(`/materials/move/${action.id}`, {
                        newParentId: action.oldParentId,
                    });
                    break;

                case 'rename':
                    await api.put(`/materials/${action.id}`, {
                        title: action.oldTitle,
                        description: action.oldDesc,
                    });
                    break;

                case 'create':
                case 'copy':
                    const idToDelete = action.type === 'create' ? action.id : action.newId;
                    await api.delete(`/materials/${idToDelete}`);
                    break;
            }
            updateToast(toastId, 'success', 'Đã hoàn tác', 'Thao tác đã được khôi phục');
            fetchMaterials();
        } catch (error) {
            updateToast(toastId, 'error', 'Lỗi hoàn tác', 'Không thể khôi phục');
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                handleUndo();
            } else if (e.ctrlKey && e.key === 'c') {
                e.preventDefault();
                if (selectedItem && isTeacherOrAdmin) handleCopyCut('copy', selectedItem);
            } else if (e.ctrlKey && e.key === 'x') {
                e.preventDefault();
                if (selectedItem && isTeacherOrAdmin) handleCopyCut('cut', selectedItem);
            } else if (e.ctrlKey && e.key === 'v') {
                e.preventDefault();
                if (clipboard && isTeacherOrAdmin) handlePaste();
            } else if (e.key === 'Delete') {
                e.preventDefault();
                if (selectedItem && isTeacherOrAdmin) handleDelete(selectedItem);
            } else if (e.key === 'F2') {
                e.preventDefault();
                if (selectedItem && isTeacherOrAdmin) openEditModal(selectedItem);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedItem, clipboard, historyStack, isTeacherOrAdmin]);

    const handleCreate = async () => {
        if (!formData.title) return alert('Vui lòng nhập tên');
        setIsModalOpen(false);
        const toastId = addToast(
            'loading',
            'Đang xử lý...',
            modalMode === 'create' ? 'Đang tạo mới...' : 'Đang cập nhật...'
        );

        try {
            if (modalMode === 'create') {
                const data = new FormData();
                data.append('type', modalType);
                data.append('title', formData.title);
                data.append('description', formData.description);
                data.append('parentId', folderId ? folderId : '');
                if (formData.url) data.append('url', formData.url);
                if (formData.file) data.append('file', formData.file);

                await api.post(`/materials/${selectedClass?.id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                updateToast(toastId, 'success', 'Thành công', 'Đã tạo mới');
            } else {
                const oldItem = materials.find((m) => m.id === formData.id);
                await api.put(`/materials/${formData.id}`, {
                    title: formData.title,
                    description: formData.description,
                });

                if (oldItem) {
                    setHistoryStack((prev) => [
                        ...prev,
                        {
                            type: 'rename',
                            id: oldItem.id,
                            oldTitle: oldItem.title,
                            newTitle: formData.title,
                            oldDesc: oldItem.description,
                            newDesc: formData.description,
                        },
                    ]);
                }
                updateToast(toastId, 'success', 'Thành công', 'Đã cập nhật');
            }
            fetchMaterials();
        } catch (error: any) {
            updateToast(toastId, 'error', 'Lỗi', error.response?.data?.message || 'Lỗi');
        }
    };

    const handleDelete = async (item: Material) => {
        if (!window.confirm(`Xóa "${item.title}"?`)) return;
        try {
            await api.delete(`/materials/${item.id}`);
            setHistoryStack((prev) => [...prev, { type: 'delete', data: item }]);
            fetchMaterials();
            setSelectedItem(null);
            addToast('success', 'Đã xóa', 'Nhấn Ctrl+Z để hoàn tác');
        } catch (error) {
            addToast('error', 'Lỗi', 'Không thể xóa');
        }
    };

    const handleCopyCut = (action: 'copy' | 'cut', item: Material) => {
        setClipboard({ action, item, sourceParentId: item.parent_id });
        addToast('success', 'Đã lưu', `${action === 'copy' ? 'Sao chép' : 'Cắt'} "${item.title}"`);
        setContextMenu(null);
    };

    const handlePaste = async () => {
        if (!clipboard) return;
        const targetParentId = folderId ? parseInt(folderId) : null;

        if (clipboard.action === 'cut' && clipboard.sourceParentId === targetParentId) {
            addToast('error', 'Lỗi', 'Tệp đã ở trong thư mục này');
            return;
        }

        const toastId = addToast(
            'loading',
            'Đang xử lý...',
            `${clipboard.action === 'copy' ? 'Đang sao chép' : 'Đang di chuyển'}...`
        );

        try {
            if (clipboard.action === 'copy') {
                await api.post(`/materials/copy/${clipboard.item.id}`, { targetParentId });
            } else {
                await api.put(`/materials/move/${clipboard.item.id}`, {
                    newParentId: targetParentId,
                });
                setHistoryStack((prev) => [
                    ...prev,
                    {
                        type: 'move',
                        id: clipboard.item.id,
                        oldParentId: clipboard.sourceParentId,
                        newParentId: targetParentId,
                    },
                ]);
                setClipboard(null);
            }
            updateToast(toastId, 'success', 'Thành công', 'Hoàn tất');
            fetchMaterials();
        } catch (error: any) {
            updateToast(toastId, 'error', 'Lỗi', error.response?.data?.message || 'Lỗi xử lý');
        }
    };

    const handleDragStart = (e: React.DragEvent, item: Material) => {
        if (!isTeacherOrAdmin) return;
        setDraggedItem(item);
        setSelectedItem(item);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, targetItem: Material) => {
        e.preventDefault();
        if (!isTeacherOrAdmin || !draggedItem) return;

        if (targetItem.type !== 'folder') {
            e.dataTransfer.dropEffect = 'none';
            return;
        }
        if (draggedItem.id === targetItem.id) return;

        setDragOverFolderId(targetItem.id);
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, targetItem: Material) => {
        e.preventDefault();
        setDragOverFolderId(null);
        if (!draggedItem || targetItem.type !== 'folder' || draggedItem.id === targetItem.id) {
            setDraggedItem(null);
            return;
        }

        const toastId = addToast(
            'loading',
            'Đang di chuyển...',
            `Đang chuyển vào "${targetItem.title}"`
        );
        try {
            await api.put(`/materials/move/${draggedItem.id}`, { newParentId: targetItem.id });
            setHistoryStack((prev) => [
                ...prev,
                {
                    type: 'move',
                    id: draggedItem.id,
                    oldParentId: draggedItem.parent_id,
                    newParentId: targetItem.id,
                },
            ]);
            updateToast(toastId, 'success', 'Thành công', 'Đã di chuyển');
            fetchMaterials();
        } catch (error: any) {
            updateToast(toastId, 'error', 'Lỗi', error.response?.data?.message || 'Lỗi di chuyển');
        }
        setDraggedItem(null);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setDragOverFolderId(null);
    };

    const openMaterial = (item: Material) => {
        if (item.type === 'folder') {
            setSearchTerm('');
            navigate(`/materials/${item.id}`);
        } else if (item.url) {
            const link = document.createElement('a');
            link.href = item.url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert('File này không có đường dẫn (Lỗi upload)');
        }
    };

    const handleItemClick = (e: React.MouseEvent, item: Material) => {
        e.stopPropagation();
        if (window.innerWidth < 768) {
            openMaterial(item);
        } else {
            setSelectedItem(item);
        }
    };

    const handleItemDoubleClick = (item: Material) => {
        openMaterial(item);
    };

    const handleBackgroundClick = () => {
        setSelectedItem(null);
        setContextMenu(null);
    };

    const openCreateModal = (type: any) => {
        setModalMode('create');
        setModalType(type);
        setFormData({ id: 0, title: '', description: '', url: '', file: null });
        setIsModalOpen(true);
    };
    const openEditModal = (item: Material) => {
        setModalMode('edit');
        setModalType(item.type);
        setFormData({
            id: item.id,
            title: item.title,
            description: item.description || '',
            url: item.url || '',
            file: null,
        });
        setIsModalOpen(true);
        setContextMenu(null);
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

    return (
        <div
            className="materials-container"
            onClick={handleBackgroundClick}
            onContextMenu={(e) => {
                if (isTeacherOrAdmin && clipboard) {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, item: null });
                }
            }}
        >
            <div className="materials-header-bar" onClick={(e) => e.stopPropagation()}>
                {folderId && (
                    <button
                        className="btn-back"
                        onClick={() => {
                            if (breadcrumbsList.length > 1) {
                                navigate(
                                    `/materials/${breadcrumbsList[breadcrumbsList.length - 2].id}`
                                );
                            } else {
                                navigate('/materials');
                            }
                        }}
                        title="Quay lại"
                    >
                        <FaArrowLeft /> Quay lại
                    </button>
                )}
                <div className="mat-search-box">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            if (e.target.value.length > 0)
                                api.get(
                                    `/materials/${selectedClass?.id}/search?q=${e.target.value}`
                                ).then((res) => setMaterials(res.data));
                            else fetchMaterials();
                        }}
                    />
                </div>
                {isTeacherOrAdmin && (
                    <div className="mat-actions-group">
                        {historyStack.length > 0 && (
                            <button
                                className="btn-mat-create outline"
                                onClick={handleUndo}
                                title="Hoàn tác (Ctrl+Z)"
                            >
                                <FaUndo />
                            </button>
                        )}
                        <button
                            className="btn-mat-create"
                            onClick={() => openCreateModal('folder')}
                        >
                            <FaFolder /> Thư mục
                        </button>
                        <button
                            className="btn-mat-create outline"
                            onClick={() => openCreateModal('file')}
                        >
                            <FaCloudUploadAlt /> Upload
                        </button>
                        <button
                            className="btn-mat-create outline"
                            onClick={() => openCreateModal('link')}
                        >
                            <FaLink /> Link
                        </button>
                    </div>
                )}
            </div>

            <div className="mat-breadcrumb-bar" onClick={(e) => e.stopPropagation()}>
                <span
                    className={`crumb-item ${!folderId ? 'active' : ''}`}
                    onClick={() => navigate('/materials')}
                >
                    <FaFolder /> Gốc
                </span>
                {breadcrumbsList.map((crumb) => (
                    <React.Fragment key={crumb.id}>
                        <span className="crumb-separator">/</span>
                        <span
                            className="crumb-item active"
                            onClick={() => navigate(`/materials/${crumb.id}`)}
                        >
                            {crumb.title}
                        </span>
                    </React.Fragment>
                ))}
            </div>

            <div className="materials-grid">
                {materials.map((item) => {
                    const isCut = clipboard?.action === 'cut' && clipboard.item.id === item.id;
                    const isSelected = selectedItem?.id === item.id;

                    return (
                        <div
                            key={item.id}
                            className={`mat-card ${isSelected ? 'selected' : ''} ${isCut ? 'cut-dimmed' : ''} ${draggedItem?.id === item.id ? 'dragging' : ''} ${dragOverFolderId === item.id ? 'drag-over' : ''}`}
                            onClick={(e) => handleItemClick(e, item)}
                            onDoubleClick={() => handleItemDoubleClick(item)}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedItem(item);
                                setContextMenu({ x: e.clientX, y: e.clientY, item });
                            }}
                            draggable={isTeacherOrAdmin}
                            onDragStart={(e) => handleDragStart(e, item)}
                            onDragOver={(e) => handleDragOver(e, item)}
                            onDragLeave={() => setDragOverFolderId(null)}
                            onDragEnd={handleDragEnd}
                            onDrop={(e) => handleDrop(e, item)}
                            title={item.description || item.title}
                        >
                            <div className="mat-card-icon">{getIcon(item)}</div>
                            <div className="mat-card-info">
                                <div className="mat-card-title">{item.title}</div>
                                {item.description && (
                                    <div className="mat-card-meta">{item.description}</div>
                                )}
                            </div>
                            {isTeacherOrAdmin && (
                                <div className="mat-card-actions">
                                    <button
                                        className="action-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setContextMenu({ x: e.clientX, y: e.clientY, item });
                                        }}
                                    >
                                        <FaArrowsAlt style={{ fontSize: 10 }} />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {contextMenu && (
                <div
                    className="context-menu"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    ref={contextMenuRef}
                    onClick={(e) => e.stopPropagation()}
                >
                    {contextMenu.item ? (
                        <>
                            <div
                                className="context-menu-item"
                                onClick={() => handleItemDoubleClick(contextMenu.item!)}
                            >
                                <FaFolder /> Mở
                            </div>
                            <div
                                className="context-menu-item"
                                onClick={() => {
                                    const link =
                                        contextMenu.item?.type === 'folder'
                                            ? `${window.location.origin}/materials/${contextMenu.item.id}`
                                            : contextMenu.item?.url || '';
                                    if (link) {
                                        navigator.clipboard.writeText(link);
                                        addToast('success', 'Đã copy', 'Link đã lưu vào clipboard');
                                    }
                                    setContextMenu(null);
                                }}
                            >
                                <FaShareAlt /> Copy Link
                            </div>
                            {isTeacherOrAdmin && (
                                <>
                                    <div className="context-separator"></div>
                                    <div
                                        className="context-menu-item"
                                        onClick={() => openEditModal(contextMenu.item!)}
                                    >
                                        <FaEdit /> Đổi tên / Mô tả{' '}
                                        <span className="shortcut">F2</span>
                                    </div>
                                    <div
                                        className="context-menu-item"
                                        onClick={() => handleCopyCut('copy', contextMenu.item!)}
                                    >
                                        <FaCopy /> Sao chép <span className="shortcut">Ctrl+C</span>
                                    </div>
                                    <div
                                        className="context-menu-item"
                                        onClick={() => handleCopyCut('cut', contextMenu.item!)}
                                    >
                                        <FaCut /> Cắt <span className="shortcut">Ctrl+X</span>
                                    </div>
                                    <div className="context-separator"></div>
                                    <div
                                        className="context-menu-item danger"
                                        onClick={() => handleDelete(contextMenu.item!)}
                                    >
                                        <FaTrash /> Xóa <span className="shortcut">Del</span>
                                    </div>
                                </>
                            )}
                        </>
                    ) : clipboard && isTeacherOrAdmin ? (
                        <div className="context-menu-item" onClick={handlePaste}>
                            <FaPaste /> Dán tại đây <span className="shortcut">Ctrl+V</span>
                        </div>
                    ) : null}
                </div>
            )}

            {isModalOpen && (
                <div className="mat-modal-overlay" onClick={(e) => e.stopPropagation()}>
                    <div className="mat-modal-container">
                        <div className="mat-modal-header">
                            <h3>{modalMode === 'create' ? 'Tạo mới' : 'Chỉnh sửa'}</h3>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                <FaTimes />
                            </button>
                        </div>
                        <div className="mat-modal-body">
                            <div className="form-group">
                                <label>
                                    Tiêu đề <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="mat-input"
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData({ ...formData, title: e.target.value })
                                    }
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label>Mô tả</label>
                                <textarea
                                    className="mat-input"
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                />
                            </div>
                            {modalMode === 'create' &&
                                (modalType === 'link' || modalType === 'video') && (
                                    <div className="form-group">
                                        <label>URL</label>
                                        <input
                                            type="text"
                                            className="mat-input"
                                            value={formData.url}
                                            onChange={(e) =>
                                                setFormData({ ...formData, url: e.target.value })
                                            }
                                        />
                                    </div>
                                )}
                            {modalMode === 'create' && modalType === 'file' && (
                                <div className="form-group">
                                    <label>File</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                file: e.target.files ? e.target.files[0] : null,
                                            })
                                        }
                                    />
                                </div>
                            )}
                        </div>
                        <div className="mat-modal-footer">
                            <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                                Hủy
                            </button>
                            <button className="btn-submit" onClick={handleCreate}>
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="toast-container">
                {toasts.map((t) => (
                    <div key={t.id} className={`toast-item ${t.type}`}>
                        <div className="toast-icon">
                            {t.type === 'loading' ? (
                                <FaSpinner className="spin" />
                            ) : t.type === 'success' ? (
                                <FaCheckCircle color="#4caf50" />
                            ) : (
                                <FaExclamationCircle color="#f44336" />
                            )}
                        </div>
                        <div className="toast-content">
                            <span className="toast-title">{t.title}</span>
                            <span className="toast-message">{t.message}</span>
                        </div>
                        <button className="toast-close" onClick={() => removeToast(t.id)}>
                            <FaTimes />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MaterialsPage;
