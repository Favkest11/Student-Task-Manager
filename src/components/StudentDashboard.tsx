import { supabase } from '../lib/supabase';
import { useState,useEffect} from 'react'
    export interface StudentTask{
    id: string;
    title: string;
    description: string;
    deadline: string;
    subjects: {
     title: string;
    } | null; 
}
function StudentDashboard()
{

    const[tasks,setTasks]=useState<StudentTask[]>([]);
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
     useEffect(() => {
    fetchTasks();
    }, []);
    return(
        <div>
        <ul>
            {tasks.map(task=>
                <li key={task.id}>{task.title}description:{task.description}deadline{task.deadline}+++++{task.subjects?.title}</li>
            )}
        </ul>
        <button onClick={() => supabase.auth.signOut()}>Sign Out</button>

        </div>
    )
}

export default StudentDashboard;