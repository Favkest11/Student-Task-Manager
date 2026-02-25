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
    const handleDeleteSubject=async(id:string)=>
    {
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
     const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const startEditing = (subject: Subject) => {
    setEditingId(subject.id); 
    setEditTitle(subject.title); 
    setEditDescription(subject.description); 
    }
    const handeEditSubject=async(e: React.FormEvent,id:string)=>{
        e.preventDefault();
        const{error}=await supabase
        .from("subjects")
        .update({
            title:editTitle,
            description:editDescription
        })
        .eq("id",id)
        if(error){
            alert(error.message);
        }
        else{
            setEditingId(null);
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
                    {editingId === subject.id ? (
                    <div>
                        <form onSubmit={(e) => handeEditSubject(e, subject.id)}>
                            <label>Subject Name</label>
                            <input required type='text' name='title' value={editTitle} onChange={(e) => setEditTitle(e.target.value)}></input>
                            <label>Subject Description</label>
                            <input  type='text' name='description' value={editDescription} onChange={(e) => setEditDescription(e.target.value)}></input>
                            <button type='submit'>Save Changes</button>
                            <button type='button' onClick={()=>setEditingId(null)}>Cancel</button>
                        </form>
                    </div> 
                    ): null}
                    <button onClick={()=>handleDeleteSubject(subject.id)}>Delete</button>
                    <button onClick={()=>startEditing(subject)}>Edit</button>
                    <button>Manage Tasks</button>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default TeacherDashboard;