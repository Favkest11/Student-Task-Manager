import { supabase } from '../lib/supabase';
import { useState, useEffect, type FormEvent } from 'react';
import ManageTasks from './ManageTasks';
import './TeacherDashboard.css';

export interface Subject { id: string; title: string; description: string; created_at: string; }

function TeacherDashboard() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [managingSubject, setManagingSubject] = useState<Subject | null>(null);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [isCreatingSubject, setIsCreatingSubject] = useState<boolean>(false); 
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const fetchSubjects = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase.from('subjects').select('*').eq('teacher_id', user.id);
        if (error) alert(error.message);
        else setSubjects(data || []);
    }
 useEffect(() => { fetchSubjects(); }, []);
    const handleCreateSubject = async (e: FormEvent) => {
        e.preventDefault();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('subjects').insert([
            { title: editTitle, description: editDescription, teacher_id: user.id }
        ]);

        if (error) {
            alert(error.message);
        } else {
            setIsCreatingSubject(false); 
            setEditTitle('');      
            setEditDescription('');
            fetchSubjects();             
        }
    }

    const saveEditSubject = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingSubject) return;
        const { error } = await supabase.from('subjects').update({ title: editTitle, description: editDescription }).eq('id', editingSubject.id);
        if (error) alert(error.message);
        else {
            setEditingSubject(null);
            fetchSubjects();
        }
    }

    const handleDeleteSubject = async (id: string) => {
        if (!window.confirm("Delete subject?")) return;
        const { error } = await supabase.from('subjects').delete().eq('id', id);
        if (error) alert(error.message);
        else fetchSubjects();
    }

    const startEditing = (subject: Subject) => {
        setEditingSubject(subject);
        setEditTitle(subject.title);
        setEditDescription(subject.description);
    }
    const startCreating = () => {
        setEditTitle(''); 
        setEditDescription('');
        setIsCreatingSubject(true);
    }

    return (
        <div className="dashboard-container">
            
            <div className="dashboard-header">
                 <h1>My Subjects</h1>
                    <div className="user-profile">
                        <strong>teacher</strong>
                        <button 
                            onClick={() => supabase.auth.signOut()} 
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', padding: 0, marginTop: '4px' }}
                        >
                            Sign Out
                        </button>
                    </div>
            </div>

            <div className="sub-header">
                <div>
                    <h2>Subject Management</h2>
                    <p>Create and manage your subjects and assignments</p>
                </div>
                <button className="btn-primary" onClick={startCreating}>+ Add Subject</button>
            </div>

            <div className="subjects-grid">
                {subjects.map((subject, index) => {
                    const colors = ['icon-blue', 'icon-purple', 'icon-green'];
                    const iconClass = colors[index % colors.length];
                    return (
                        <div key={subject.id} className="subject-card">
                            <div className="card-top">
                                <div className={`subject-icon ${iconClass}`}>📖</div>
                                <div className="card-actions">
                                    <button onClick={() => startEditing(subject)}>✏️</button>
                                    <button onClick={() => handleDeleteSubject(subject.id)}>🗑️</button>
                                </div>
                            </div>
                            
                            <h3 className="card-title">{subject.title}</h3>
                            <p className="card-desc">{subject.description}</p>
                            
                            <button className="btn-manage" onClick={() => setManagingSubject(subject)}>
                                Manage Tasks
                            </button>
                        </div>
                    );
                })}
            </div>
            {isCreatingSubject && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="close-btn" onClick={() => setIsCreatingSubject(false)}>×</button>
                        <h2>Create New Subject</h2>
                        <form onSubmit={handleCreateSubject}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Title</label>
                            <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="e.g. Mathematics" required />
                            
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description</label>
                            <input value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="Short description" />
                            
                            <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>Create Subject</button>
                        </form>
                    </div>
                </div>
            )}
            {editingSubject && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="close-btn" onClick={() => setEditingSubject(null)}>×</button>
                        <h2>Edit Subject</h2>
                        <form onSubmit={saveEditSubject}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Title</label>
                            <input value={editTitle} onChange={e => setEditTitle(e.target.value)} required />
                            
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description</label>
                            <input value={editDescription} onChange={e => setEditDescription(e.target.value)} />
                            
                            <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>Save Changes</button>
                        </form>
                    </div>
                </div>
            )}
            {managingSubject && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '800px' }}>
                        <button className="close-btn" onClick={() => setManagingSubject(null)}>×</button>
                        <h2>{managingSubject.title} - Tasks</h2>
                        <ManageTasks subjectId={managingSubject.id} onClose={() => setManagingSubject(null)} />
                    </div>
                </div>
            )}

        </div>
    );
}
export default TeacherDashboard;