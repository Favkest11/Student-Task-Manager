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
const [createSubject,setCreateSubject]=useState<boolean>(false);
    return(
        <div>
            <h1>Teacher</h1>
        <button onClick={() => supabase.auth.signOut()}>Sign Out</button>
        <button onClick={()=> setCreateSubject(!createSubject)}>Add Subject</button>
        {createSubject ? <CreateSubjectMenu/> : null}
        </div>
    )
}

export default TeacherDashboard;