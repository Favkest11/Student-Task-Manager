import { supabase } from '../lib/supabase';
import { useState,useEffect} from 'react'
import { type Subject } from './TeacherDashboard';
    export interface StudentTask{
    id: string;
    title: string;
    description: string;
    deadline: string;
    status:string;
    subjects: {
     title: string;
    } | null; 
}
function StudentDashboard()
{

    const[tasks,setTasks]=useState<StudentTask[]>([]);
    const[subjectname,setSubjectName]=useState<Subject[]>([]);
    const[searchQuery,setSearchQuery]=useState('');
    const[selectedSubject,setSelectedSubject]=useState('All Subjects');
    const[selectedStatus,setSelectedStatus]=useState('All Statuses');
    const fetchTasks=async()=>{
        const{data,error}=await supabase
        .from('tasks')
        .select('*,subjects(title)')
        .order('created_at', { ascending: false });
        if(error){
            alert(error.message);
        }
        else{
            setTasks(data||[]);
        }
    }
 
    const getSubjectName=async()=>{
        const{data,error}=await supabase
        .from('subjects')
        .select('*')
        if(error){
            alert(error.message);
        }
        else{
            setSubjectName(data||[]);
        }
    }
    useEffect(() => {
        fetchTasks();
    getSubjectName();
    }, []);
    const filteredTasks=tasks.filter(task=>{
        const matchSearch=
        task.title.toLowerCase().includes(searchQuery.toLowerCase())||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());
        const currentTaskStatus = task.status || 'To Do';
        const matchStatus = 
        selectedStatus === 'All Statuses' || currentTaskStatus === selectedStatus;
        const matchSubject=
        selectedSubject==='All Subjects'||selectedSubject===task.subjects?.title;
        return matchSearch && matchSubject && matchStatus;
    });
    const handleStatus=async(taskId: string, newStatus: string)=>{
        const{error}=await supabase
        .from('tasks')
        .update({status:newStatus})
        .eq('id', taskId);
        if(error){
            alert(error.message);
        }
        else{
            fetchTasks();
        }
    }
    return(
        <div>
            <div>
                <h3>Filter and Search</h3>
                <input type='text' placeholder='Search tasks...' value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)}>
                </input>
                <select value={selectedSubject} onChange={(e)=>setSelectedSubject(e.target.value)}>
                    <option>All Subjects</option>
                    {subjectname.map(name=>
                        <option key={name.id}>{name.title}</option>
                    )}
                </select>
                <select value={selectedStatus} onChange={(e)=>setSelectedStatus(e.target.value)}>
                    <option>All Statuses</option>
                    <option>To Do</option>
                    <option>Done</option>
                </select>
                <select>
                    <option>All Deadlines</option>
                    <option>Overdue</option>
                    <option>Today</option>
                    <option>Tomorrow</option>
                    <option>This Week</option>
                </select>
            </div>
            <ul>
                {filteredTasks.map(task=>
                    <li key={task.id}>{task.title}description:{task.description}deadline{task.deadline}+++++{task.subjects?.title}STATUS:{task.status}
                    {<button
                    onClick={() => {
            
            const currentStatus = task.status || 'To Do';
            
            
            const newStatus = currentStatus === 'Done' ? 'To Do' : 'Done';
            
            
            handleStatus(task.id, newStatus);
        }}
                    >Click</button>}
                    
                    
                    </li>
                    
                )}
            </ul>
            <button onClick={() => supabase.auth.signOut()}>Sign Out</button>

        </div>
    )
}

export default StudentDashboard;