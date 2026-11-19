import { useState, useEffect } from 'react';
import { api, auth, type Subject, type Task } from '../lib/api';
import { Search, Calendar, CheckCircle2, Circle } from 'lucide-react';
import './StudentDashboard.css';
export type StudentTask = Task;
export type { Subject };
function StudentDashboard() {
    const [tasks, setTasks] = useState<StudentTask[]>([]);
    const [subjectList, setSubjectList] = useState<Subject[]>([]);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('All Subjects');
    const [selectedStatus, setSelectedStatus] = useState('All Statuses');
    const [selectedDeadline, setSelectedDeadline] = useState('All Deadlines');

    const fetchTasks = async () => {
        try {
            setTasks(await api.tasks.list());
        } catch (error: any) {
            alert(error.message);
        }
    }

    const fetchSubjects = async () => {
        try {
            setSubjectList(await api.subjects.list());
        } catch (error: any) {
            alert(error.message);
        }
    }

    useEffect(() => {
        fetchTasks();
        fetchSubjects();
    }, []);
    const toggleTaskStatus = async (task: StudentTask) => {
        const newStatus = (task.status || 'To Do') === 'Done' ? 'To Do' : 'Done';
        try {
            // Saved for the current student only; other students keep their own status.
            await api.tasks.setStatus(task.id, newStatus);
            fetchTasks();
        } catch (error: any) {
            alert(error.message);
        }
    };
    const filteredTasks = tasks.filter(task => {
        const matchSearch = 
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            task.description.toLowerCase().includes(searchQuery.toLowerCase());
            
        const taskStatus = task.status || 'To Do';
        const matchStatus = selectedStatus === 'All Statuses' || taskStatus === selectedStatus;
        const matchSubject = selectedSubject === 'All Subjects' || selectedSubject === task.subjects?.title;

        let matchDeadline = true;
        if (selectedDeadline !== 'All Deadlines') {
            const now = new Date();
            const taskDate = new Date(task.deadline);
            const tomorrow = new Date(); 
            tomorrow.setDate(now.getDate() + 1);
            const nextWeek = new Date(); 
            nextWeek.setDate(now.getDate() + 7);

            if (selectedDeadline === 'Overdue') {
                matchDeadline = taskDate < now && taskStatus !== 'Done';
            } else if (selectedDeadline === 'Today') {
                matchDeadline = taskDate.toDateString() === now.toDateString();
            } else if (selectedDeadline === 'Tomorrow') {
                matchDeadline = taskDate.toDateString() === tomorrow.toDateString();
            } else if (selectedDeadline === 'This Week') {
                matchDeadline = taskDate >= now && taskDate <= nextWeek;
            }
        } 
        return matchSearch && matchSubject && matchStatus && matchDeadline;
    });

    return (
        <div className="student-layout">
            <main className="main-content">
                <header className="top-header">
                    <h1>My Tasks</h1>
                    <div className="user-profile">
                        <strong>student</strong>
                        <button 
                            onClick={() => auth.logout()}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', padding: 0, marginTop: '4px' }}
                        >
                            Sign Out
                        </button>
                    </div>
                </header>
                <div className="filter-section">
                    <h3>Filter & Search</h3>
                    <p>Find and organize your tasks</p>                 
                    <div className="filter-controls">
                        <div className="search-box">
                            <Search size={18} />
                            <input 
                                type='text' 
                                placeholder='Search tasks...' 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)} 
                            />
                        </div>   
                        <select className="filter-select" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                            <option value="All Subjects">All Subjects</option>
                            {subjectList.map(subj => (
                                <option key={subj.id} value={subj.title}>{subj.title}</option>
                            ))}
                        </select>
                        <select className="filter-select" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                            <option value="All Statuses">All Statuses</option>
                            <option value="To Do">To Do</option>
                            <option value="Done">Done</option>
                        </select>
                        <select className="filter-select" value={selectedDeadline} onChange={(e) => setSelectedDeadline(e.target.value)}>
                            <option value="All Deadlines">All Deadlines</option>
                            <option value="Overdue">Overdue</option>
                            <option value="Today">Today</option>
                            <option value="Tomorrow">Tomorrow</option>
                            <option value="This Week">This Week</option>
                        </select>
                    </div>
                </div>
                <div className="tasks-header">Tasks ({filteredTasks.length})</div>          
                <div className="task-list">
                    {filteredTasks.length === 0 ? (
                        <p style={{ color: '#6b7280' }}>Задач не найдено. Отличная работа!</p>
                    ) : (
                        filteredTasks.map((task, index) => {
                            const isDone = (task.status || 'To Do') === 'Done';
                            const isOverdue = new Date(task.deadline) < new Date() && !isDone;
                            const dotColors = ['#3b82f6', '#a855f7', '#22c55e', '#f59e0b'];
                            const dotColor = dotColors[index % dotColors.length];
                            return (
                                <div key={task.id} className="task-card">                                 
                                   <div className={`task-checkbox ${isDone ? 'checked' : ''}`} onClick={() => toggleTaskStatus(task)}>
                                        {isDone ? <CheckCircle2 size={24} color="#111827" /> : <Circle size={24} />}
                                    </div>
                                    <div className="task-content">
                                        <h4 className={`task-title ${isDone ? 'completed' : ''}`}>{task.title}</h4>
                                        <p className="task-desc">{task.description}</p>
                                        
                                        <div className="task-meta">
                                            <div className="meta-item">
                                                <div className="dot" style={{ backgroundColor: dotColor }}></div>
                                                <span>{task.subjects?.title || 'Без предмета'}</span>
                                            </div>
                                            
                                            <div className="meta-item">
                                                <Calendar size={14} />
                                                <span className={isOverdue ? 'text-overdue' : ''}>
                                                    {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    {isOverdue && ' (Overdue)'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`status-badge ${isDone ? 'status-done' : 'status-todo'}`}>
                                        {isDone ? 'Done' : 'To Do'}
                                    </div>
                                    
                                </div>
                            );
                        })
                    )}
                </div>
            </main>
        </div>
    );
}
export default StudentDashboard;