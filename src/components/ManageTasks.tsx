import { useState,useEffect,type FormEvent } from "react";
import { supabase } from "../lib/supabase";
interface Task{
id:string;
title:string;
description:string;
deadline:string;
}
interface ManageTasksProps {
    subjectId: string;
    onClose: () => void;
    
}
function ManageTasks({ subjectId, onClose }: ManageTasksProps){
    const[loading,setLoading]=useState<boolean>(false)
    const[showAddTaskMenu,setShowAddTaskMenu]=useState<boolean>(false);
    const[tasks,setTasks]=useState<Task[]>([])
    const[editTitle,setEditTitle]=useState('');
    const[editDescription,setEditDescription]=useState('');
    const[editDeadline,setEditDeadline]=useState('');
    const[editingId,setEditingId]=useState<string |null>(null);
    const handleAddTask=async(e:FormEvent<HTMLFormElement>)=>{
        e.preventDefault();
        setLoading(true);
        const formData=new FormData(e.currentTarget);
        const title=formData.get('title')as string;
        const description=formData.get('description')as string;
        const deadline=formData.get('deadline') as string;
        try{
            const {error}=await supabase
            .from('tasks')
            .insert({
              title,
              description,
              deadline,
              subject_id: subjectId  
            });
            if(error) throw error;
            setShowAddTaskMenu(false);
            fetchTasks();
        }
        catch(error:any){
            alert(error.message);
        }
        finally{
            setLoading(false);
        }
       
     }
     const fetchTasks=async()=>{
        const{data,error}=await supabase
        .from("tasks")
        .select("*")
        .eq('subject_id',subjectId)
        .order('created_at', { ascending: false });
        if(error){
            alert(error.message)
        }
        else{
            setTasks(data||[])
        }
     }
     useEffect(() => {
        fetchTasks();
    }, []);
    const handleDeleteTask=async(id:string)=>{
         const isConfirmed = window.confirm("Are you sure you want to delete this task");
        if (!isConfirmed) return;
        const{error}=await supabase
        .from('tasks')
        .delete()
        .eq('id',id);
        if(error){
            alert(error.message);
        }
        else{
            fetchTasks();
        }
    }
    const startEditing=(task:Task)=>{
        setEditingId(task.id);
        setEditTitle(task.title);
        setEditDescription(task.description);
        setEditDeadline(task.deadline);

    }
    const handleEditTask=async(id:string,e:FormEvent<HTMLFormElement>)=>{
        e.preventDefault();
        const{error}=await supabase
        .from('tasks')
        .update({
            title:editTitle,
            description:editDescription,
            deadline:editDeadline
        })
        .eq('id',id)
        if(error){
            alert(error.message);
        }
        else{
            fetchTasks();
            setEditingId(null);
        }
    }
    return (
        <div className="manage-tasks-container">
            {!showAddTaskMenu && (
                <button className="btn-add-task" onClick={() => setShowAddTaskMenu(true)}>
                    <i className="fa-solid fa-plus"></i> Add Task
                </button>
            )}
            {showAddTaskMenu && (
                <div className="task-form">
                    <h4 style={{ marginTop: 0 }}>Create New Task</h4>
                    <form onSubmit={handleAddTask}>
                        <label>Task Title</label>
                        <input required type='text' name='title' placeholder="e.g. Complete Calculus Assignment" />
                        
                        <label>Description</label>
                        <input type='text' name='description' placeholder="e.g. Solve problems 1-20" />
                        
                        <label>Deadline</label>
                        <input required type='datetime-local' name='deadline' />
                        
                        <div className="task-form-actions">
                            <button type='button' className="btn-manage" onClick={() => setShowAddTaskMenu(false)}>Cancel</button>
                            <button type='submit' className="btn-primary" disabled={loading}>Save Task</button>
                        </div>
                    </form>
                </div>
            )}
            <div className="tasks-count">
                Tasks ({tasks.length})
            </div>
            {tasks.length === 0 ? (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px 0' }}>No tasks assigned yet.</p>
            ) : (
                <ul className="tasks-list">
                    {tasks.map(task => (
                        <li key={task.id} className="task-card">
                            {editingId === task.id ? (
                                <form onSubmit={(e) => handleEditTask(task.id, e)} style={{ width: '100%' }}>
                                    <input required type='text' name='title' value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                                    <input type='text' name='description' value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                                    <input required type='datetime-local' name='deadline' value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} />
                                    <div className="task-form-actions">
                                        <button type="button" className="btn-manage" onClick={() => setEditingId(null)}>Cancel</button>
                                        <button type='submit' className="btn-primary">Save changes</button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div className="task-info">
                                        <h4>{task.title}</h4>
                                        <p>{task.description}</p>
                                        <div className="task-deadline">
                                            <i className="fa-regular fa-calendar"></i> 
                                            Due: {new Date(task.deadline).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="task-actions">
                                        <button onClick={() => startEditing(task)}><i className="fa-solid fa-pencil"></i></button>
                                        <button className="delete-btn" onClick={() => handleDeleteTask(task.id)}><i className="fa-solid fa-trash"></i></button>
                                    </div>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                <button className="btn-manage" style={{ width: 'auto', padding: '8px 24px' }} onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
    )
}
export default ManageTasks;