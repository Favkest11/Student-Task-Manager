import { useState,useEffect} from 'react'
import { supabase } from '../lib/supabase';
import CreateSubjectMenu from './CreateSubjectMenu';
export interface Task{
    id: string;
    title:string;
    description:string;
    deadline:string;
    teacher_id:string;
}
export interface Subject{
    id:string;
    title:string;
    description:string;
}
function TeacherDashboard()
{
    const [showCreateSubject,setShowCreateSubject]=useState<boolean>(false);
    const [subjects,setSubjects]=useState<Subject[]>([]);
    const fetchSubjects=async ()=> 
    {
        const{data:{user}}=await supabase.auth.getUser();
        if(!user)return;
        const{data,error}=await supabase
        .from('subjects')
        .select('*')
        .eq('teacher_id',user.id)
        .order('created_at', { ascending: false });
        if(error){
            console.error("error");
        }
        else{
            setSubjects(data||[])
        }
    }
    useEffect(() => {
    fetchSubjects();
    }, []);
    const handleDeleteSubject=async(id:string)=>{
        const isConfirmed = window.confirm("Are you sure you want to delete this subject");
    if (!isConfirmed) return;
    const {error}=await supabase
    .from('subjects')
    .delete()
    .eq('id',id);
    if(error){
        alert("something went wrong")
    }
    else{
        fetchSubjects();
    }
    }
    return(
        <div>
            <h1>Teacher</h1>
        <button onClick={() => supabase.auth.signOut()}>Sign Out</button>
        <button onClick={()=> setShowCreateSubject(!showCreateSubject)}>Add Subject</button>
        {showCreateSubject && (
                <CreateSubjectMenu onRequestUpdate={fetchSubjects} />
            )}
            <ul>
                {subjects.map(subject=>(
                    <li key={subject.id}>{subject.title} - {subject.description}
                    <button onClick={()=>handleDeleteSubject(subject.id)}>Delete</button>
                    <button>Edit</button>
                    <button>Manage Tasks</button>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default TeacherDashboard;