import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';
import '../assets/styles/StudentManager.css';

import { 
    FaSearch, FaFilter, FaSortAlphaDown, FaSortAlphaUp, 
    FaFileImport, FaUserPlus, FaTrash, FaEdit, FaKey, 
    FaLock, FaUnlock, FaUndo, FaCheck, FaUsersCog 
} from 'react-icons/fa';

const ROLES = [
    { id: 2, name: 'Lớp trưởng' },
    { id: 3, name: 'Lớp phó học tập' },
    { id: 4, name: 'Lớp phó lao động' },
    { id: 5, name: 'Tổ trưởng' },
    { id: 7, name: 'Tổ phó' },
    { id: 6, name: 'Học sinh' },
];

const StudentManagerPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const classId = localStorage.getItem('selectedClassId');
    const className = localStorage.getItem('selectedClassName');

    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState('');

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkGroupTarget, setBulkGroupTarget] = useState<string>('');

    const [searchTerm, setSearchTerm] = useState('');
    const [filterGroup, setFilterGroup] = useState<string>('all');
    const [sortOrder, setSortOrder] = useState<'default' | 'asc' | 'desc'>('default');

    const [showModal, setShowModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState<any>(null);
    const [formData, setFormData] = useState({ full_name: '', group_number: 1, role_id: 6 });

    const canEdit = user?.role !== 'student';

    useEffect(() => {
        if (classId) fetchStudents();
        else navigate('/');
    }, [classId]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/users?class_id=${classId}`);
            setStudents(res.data);
            setSelectedIds([]); 
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getFirstName = (fullName: string) => {
        if (!fullName) return '';
        const parts = fullName.trim().split(' ');
        return parts.length > 0 ? parts[parts.length - 1].toLowerCase() : '';
    };

    const processedStudents = useMemo(() => {
        let result = [...students];
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(s => (s.full_name || '').toLowerCase().includes(lowerTerm));
        }
        if (filterGroup !== 'all') {
            const gNum = parseInt(filterGroup);
            result = result.filter(s => (s.group_number || 0) === gNum);
        }
        if (sortOrder !== 'default') {
            result.sort((a, b) => {
                const nameA = getFirstName(a.full_name);
                const nameB = getFirstName(b.full_name);
                const compareName = nameA.localeCompare(nameB, 'vi');
                if (compareName !== 0) return sortOrder === 'asc' ? compareName : -compareName;
                return sortOrder === 'asc' 
                    ? a.full_name.localeCompare(b.full_name, 'vi')
                    : b.full_name.localeCompare(a.full_name, 'vi');
            });
        } else {
            result.sort((a, b) => {
                const groupA = a.group_number || 99;
                const groupB = b.group_number || 99;
                if (groupA !== groupB) return groupA - groupB;
                return getFirstName(a.full_name).localeCompare(getFirstName(b.full_name), 'vi');
            });
        }
        return result;
    }, [students, searchTerm, filterGroup, sortOrder]);

    const availableRoles = useMemo(() => {
        const currentStudentId = editingStudent?.id;
        const targetGroup = formData.group_number;
        const usedClassRoles = new Set<number>();
        const usedGroupRoles = new Set<number>();
        students.forEach((s) => {
            if (s.id === currentStudentId) return;
            if ([2, 3, 4].includes(s.role_id)) usedClassRoles.add(s.role_id);
            if (s.group_number === targetGroup && [5, 7].includes(s.role_id)) usedGroupRoles.add(s.role_id);
        });
        return ROLES.filter((role) => {
            if (role.id === 6) return true;
            if ([2, 3, 4].includes(role.id)) return !usedClassRoles.has(role.id);
            if ([5, 7].includes(role.id)) return !usedGroupRoles.has(role.id);
            return true;
        });
    }, [students, formData.group_number, editingStudent]);

    useEffect(() => {
        const isCurrentRoleValid = availableRoles.some((r) => r.id === formData.role_id);
        if (!isCurrentRoleValid) {
            setFormData((prev) => ({ ...prev, role_id: 6 }));
        }
    }, [availableRoles, formData.role_id]);

    const groupStats = useMemo(() => {
        const stats: { [key: string]: number } = {};
        students.forEach((s) => {
            const g = s.group_number || 0;
            stats[g] = (stats[g] || 0) + 1;
        });
        return stats;
    }, [students]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allIds = processedStudents.map(s => s.id);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectStudent = (id: number) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleBulkUpdateGroup = async () => {
        if (selectedIds.length === 0) return alert("Chưa chọn học sinh nào!");
        if (!bulkGroupTarget) return alert("Chưa nhập số tổ!");
        
        const groupNum = parseInt(bulkGroupTarget);
        if (isNaN(groupNum)) return alert("Số tổ không hợp lệ");

        if(!window.confirm(`Bạn có chắc muốn chuyển ${selectedIds.length} học sinh sang Tổ ${groupNum}?`)) return;

        try {
            await api.put('/users/bulk-group', {
                student_ids: selectedIds,
                group_number: groupNum
            });
            alert("Đã cập nhật tổ thành công!");
            setSelectedIds([]);
            setBulkGroupTarget('');
            fetchStudents();
        } catch (error) {
            console.error(error);
            alert("Lỗi khi cập nhật tổ.");
        }
    };

    
    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return alert("Chưa chọn học sinh nào để xóa!");

        if (!window.confirm(`CẢNH BÁO NGUY HIỂM!\n\nBạn đang xóa ${selectedIds.length} học sinh.\nTất cả dữ liệu điểm và vi phạm của họ cũng sẽ bị xóa vĩnh viễn.\n\nBạn có chắc chắn muốn tiếp tục?`)) {
            return;
        }

        setLoading(true);
        try {
            
            await api.post('/users/bulk-delete', {
                student_ids: selectedIds
            });
            
            alert(`Đã xóa thành công ${selectedIds.length} học sinh.`);
            setSelectedIds([]);
            fetchStudents();
        } catch (error) {
            console.error(error);
            alert("Lỗi khi xóa hàng loạt (kiểm tra lại backend).");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteStudent = async (student: any) => {
        if (!window.confirm(`CẢNH BÁO: Bạn có chắc muốn xóa học sinh "${student.full_name}"?\nHành động này không thể hoàn tác!`)) return;
        
        try {
            await api.delete(`/users/${student.id}`);
            alert("Đã xóa học sinh.");
            fetchStudents();
        } catch (error) {
            console.error(error);
            alert("Lỗi khi xóa học sinh.");
        }
    };

    const handleImportClick = () => fileInputRef.current?.click();

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !classId) return;
        if (fileInputRef.current) fileInputRef.current.value = '';
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = async (e) => {
             try {
                const arrayBuffer = e.target?.result;
                if (!arrayBuffer) return;
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                let headerIndex = -1, sttIndex = -1, nameIndex = -1;

                for (let i = 0; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row || row.length === 0) continue;
                    const rowDense = Array.from(row); 
                    const rowStr = rowDense.map(cell => String(cell || '').toLowerCase().trim());
                    const idxSTT = rowStr.findIndex(cell => cell === 'stt');
                    const idxName = rowStr.findIndex(cell => cell && (cell.includes('họ và tên') || cell.includes('họ tên')));
                    if (idxSTT !== -1 && idxName !== -1) { headerIndex = i; sttIndex = idxSTT; nameIndex = idxName; break; }
                }

                if (headerIndex === -1) { alert('Lỗi: Không tìm thấy dòng tiêu đề STT và Họ tên.'); return; }
                const candidates = [];
                for (let i = headerIndex + 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row) continue;
                    const sttRaw = row[sttIndex];
                    const fullName = row[nameIndex];
                    if (sttRaw != null && fullName) {
                        candidates.push({ full_name: String(fullName).trim(), class_id: parseInt(classId), role_id: 6, group_number: 0, password: '1' });
                    }
                }
                if (candidates.length === 0) { alert('Không có dữ liệu.'); return; }
                if (!window.confirm(`Tìm thấy ${candidates.length} HS. Đồng ý nhập?`)) return;

                setLoading(true);
                let count = 0;
                
                for (let i = 0; i < candidates.length; i++) {
                    setProgress(`Đang nhập ${i+1}/${candidates.length}`);
                    try { await api.post('/users/create', candidates[i]); count++; } catch (e) { console.error(e); }
                }
                alert(`Hoàn tất: ${count} HS.`);
                fetchStudents();
            } catch (err) { alert('Lỗi file'); } finally { setLoading(false); setProgress(''); }
        };
    };

    const handleEdit = (student: any) => {
        setEditingStudent(student);
        setFormData({ full_name: student.full_name, group_number: student.group_number, role_id: student.role_id });
        setShowModal(true);
    };

    const handleAddNew = () => {
        setEditingStudent(null);
        setFormData({ full_name: '', group_number: 1, role_id: 6 });
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            if (editingStudent) {
                await api.put(`/users/${editingStudent.id}`, formData);
                alert('Cập nhật thành công!');
            } else {
                await api.post('/users/create', { ...formData, class_id: classId });
                alert('Thêm mới thành công!');
            }
            setShowModal(false);
            fetchStudents();
        } catch (e) { alert('Lỗi khi lưu'); }
    };

    const getRoleClass = (roleId: number) => {
        if (roleId === 2) return 'monitor';
        if (roleId === 5) return 'group-leader';
        return 'student';
    };

    return (
        <div className="sm-container">
            {canEdit && (
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".xlsx, .xls, .csv" onChange={handleFileChange} />
            )}

            <div className="sm-header">
                <div className="sm-header-left">
                    <button className="sm-btn sm-btn-back" onClick={() => navigate('/')}>
                        <FaUndo /> Quay lại
                    </button>
                    <h2 className="sm-title">Lớp {className}</h2>
                </div>

                {canEdit && (
                    <div className="sm-header-actions">
                        <button className="sm-btn sm-btn-info" onClick={handleImportClick} title="Nhập từ Excel">
                            <FaFileImport /> Nhập File
                        </button>
                        <button className="sm-btn sm-btn-success" onClick={handleAddNew} title="Thêm học sinh mới">
                            <FaUserPlus /> Thêm HS
                        </button>
                    </div>
                )}
            </div>

            <div className="sm-stats-bar">
                <strong className="sm-stat-label">Thống kê:</strong>
                {Object.keys(groupStats).sort().map((g) => (
                    <span key={g} className="sm-stat-item">
                        {g == '0' ? 'Chưa xếp' : `Tổ ${g}`}: <b>{groupStats[g]}</b>
                    </span>
                ))}
                <span className="sm-stat-item sm-stat-total">Tổng: <b>{students.length}</b></span>
            </div>

            {}
            <div className="sm-toolbar">
                <div className="sm-search-box">
                    <FaSearch className="search-icon" />
                    <input type="text" placeholder="Tìm tên học sinh..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>

                <div className="sm-filter-box">
                    <FaFilter className="filter-icon" />
                    <select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)} className="sm-select">
                        <option value="all">Tất cả các tổ</option>
                        {Object.keys(groupStats).sort().map(g => (
                            <option key={g} value={g}>{g == '0' ? 'Chưa xếp' : `Tổ ${g}`}</option>
                        ))}
                    </select>
                </div>

                <div className="sm-sort-box">
                    <button className={`sm-sort-btn ${sortOrder === 'asc' ? 'active' : ''}`} onClick={() => setSortOrder('asc')} title="A-Z"><FaSortAlphaDown /></button>
                    <button className={`sm-sort-btn ${sortOrder === 'desc' ? 'active' : ''}`} onClick={() => setSortOrder('desc')} title="Z-A"><FaSortAlphaUp /></button>
                </div>
            </div>

            {}
            {canEdit && selectedIds.length > 0 && (
                <div className="sm-bulk-actions">
                    <div className="sm-bulk-left">
                        <span className="sm-selected-count">Đang chọn: <b>{selectedIds.length}</b> HS</span>
                        
                        {}
                        <button 
                            className="sm-btn sm-btn-danger sm-btn-sm" 
                            onClick={handleBulkDelete}
                            style={{marginLeft: '15px'}}
                            title="Xóa các học sinh đã chọn"
                        >
                            <FaTrash /> Xóa {selectedIds.length} HS
                        </button>
                    </div>

                    <div className="sm-bulk-group-control">
                        <FaUsersCog className="bulk-icon" />
                        <input 
                            type="number" 
                            placeholder="Nhập số tổ..." 
                            value={bulkGroupTarget}
                            onChange={(e) => setBulkGroupTarget(e.target.value)}
                            className="sm-bulk-input"
                        />
                        <button className="sm-btn sm-btn-primary sm-btn-sm" onClick={handleBulkUpdateGroup}>
                            <FaCheck /> Cập nhật Tổ
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="sm-loading">
                    <div className="spinner"></div>
                    <p>{progress || 'Đang xử lý dữ liệu...'}</p>
                </div>
            ) : (
                <div className="sm-table-container">
                    <table className="sm-table">
                        <thead>
                            <tr>
                                {canEdit && (
                                    <th style={{ width: 40, textAlign: 'center' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={processedStudents.length > 0 && selectedIds.length === processedStudents.length}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                )}
                                <th style={{ width: 50, textAlign: 'center' }}>STT</th>
                                <th>Họ và Tên</th>
                                <th style={{ width: 60, textAlign: 'center' }}>Tổ</th>
                                <th style={{ width: 150 }}>Vai Trò</th>
                                <th style={{ width: 120 }}>Trạng Thái</th>
                                {canEdit && <th style={{ textAlign: 'right', paddingRight: 20 }}>Thao tác</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {processedStudents.length === 0 ? (
                                <tr><td colSpan={canEdit ? 7 : 6} className="sm-empty-state">Không có dữ liệu.</td></tr>
                            ) : (
                                processedStudents.map((s, index) => (
                                    <tr key={s.id} className={selectedIds.includes(s.id) ? 'sm-row-selected' : ''}>
                                        {canEdit && (
                                            <td style={{ textAlign: 'center' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedIds.includes(s.id)}
                                                    onChange={() => handleSelectStudent(s.id)}
                                                />
                                            </td>
                                        )}
                                        <td style={{ textAlign: 'center', color: '#888' }}>{index + 1}</td>
                                        <td style={{ fontWeight: 500 }}>{s.full_name}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className="sm-group-number">{s.group_number || '-'}</span>
                                        </td>
                                        <td>
                                            <span className={`sm-role-badge ${getRoleClass(s.role_id)}`}>
                                                {s.role_name || 'Học sinh'}
                                            </span>
                                        </td>
                                        <td>
                                            {s.is_locked 
                                                ? <span className="sm-status locked"><FaLock /> Đã khóa</span> 
                                                : <span className="sm-status active"><FaUnlock /> Hoạt động</span>
                                            }
                                        </td>
                                        {canEdit && (
                                            <td className="sm-actions-cell">
                                                <button className="sm-icon-btn info" title="Reset Mật khẩu" onClick={async () => {
                                                    if(window.confirm(`Reset mật khẩu của ${s.full_name}?`)) {
                                                        await api.put(`/users/${s.id}/reset-password`);
                                                        alert('Đã reset!');
                                                    }
                                                }}>
                                                    <FaKey />
                                                </button>
                                                
                                                <button className="sm-icon-btn edit" title="Sửa thông tin" onClick={() => handleEdit(s)}>
                                                    <FaEdit />
                                                </button>
                                                
                                                <button 
                                                    className={`sm-icon-btn ${s.is_locked ? 'success' : 'warning'}`} 
                                                    title={s.is_locked ? "Mở khóa" : "Khóa tài khoản"}
                                                    onClick={async () => {
                                                        await api.put(`/users/${s.id}`, { is_locked: !s.is_locked });
                                                        fetchStudents();
                                                    }}
                                                >
                                                    {s.is_locked ? <FaUnlock /> : <FaLock />}
                                                </button>

                                                <button className="sm-icon-btn danger" title="Xóa học sinh" onClick={() => handleDeleteStudent(s)}>
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

             {showModal && canEdit && (
                <div className="sm-modal-overlay">
                    <div className="sm-modal-content">
                        <h3 className="sm-modal-title">{editingStudent ? 'Cập Nhật' : 'Thêm Mới'}</h3>
                        <div className="sm-form-group">
                            <label>Họ và Tên <span style={{color:'red'}}>*</span></label>
                            <input className="sm-form-control" value={formData.full_name} onChange={e=>setFormData({...formData, full_name: e.target.value})} />
                        </div>
                        <div className="sm-form-group">
                            <label>Tổ</label>
                            <input type="number" className="sm-form-control" value={formData.group_number} onChange={e=>setFormData({...formData, group_number: parseInt(e.target.value)||0})} />
                        </div>
                        <div className="sm-form-group">
                            <label>Vai Trò</label>
                            <select className="sm-form-control" value={formData.role_id} onChange={e=>setFormData({...formData, role_id: parseInt(e.target.value)})}>
                                {availableRoles.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div className="sm-modal-actions">
                            <button className="sm-btn sm-btn-secondary" onClick={()=>setShowModal(false)}>Hủy</button>
                            <button className="sm-btn sm-btn-primary" onClick={handleSave}>Lưu</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default StudentManagerPage;