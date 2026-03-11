import { useState,useEffect,type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import  { type Task }  from "./TeacherDashboard";
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
    return(
        <div>
            <button onClick={()=>setShowAddTaskMenu(!showAddTaskMenu)}>Add Task</button>
            {showAddTaskMenu ? 
            <div>  
                <form onSubmit={handleAddTask}>
                    <label>Task title</label>
                    <input required type='text' name='title'></input>
                    <label>Task Description</label>
                    <input  type='text' name='description'></input>
                    <label>Deadline</label>
                    <input required type='datetime-local' name='deadline'></input>
                    <button type='submit' disabled={loading}>Add task</button>
                </form>
            </div> 
            
            : null}
            {tasks.length===0 ? <h1>You have no tasks</h1> : 
            <ul>
            {tasks.map(task=>(
                <li key={task.id}>{task.title}- description:{task.description}-deadline:{task.deadline}
                <button onClick={()=>handleDeleteTask(task.id)}>Delete</button>
                <button onClick={()=>startEditing(task)}>Edit</button>
                {editingId===task.id ?(
                    <div>
                        <form onSubmit={(e) => handleEditTask(task.id,e)}>
                            <label>Task title</label>
                            <input required type='text' name='title' value={editTitle} onChange={(e)=>setEditTitle(e.target.value)}></input>
                            <label>Task Description</label>
                            <input  type='text' name='description' value={editDescription} onChange={(e)=>setEditDescription(e.target.value)}></input>
                            <label>Deadline</label>
                            <input required type='datetime-local' name='deadline' value={editDeadline} onChange={(e)=>setEditDeadline(e.target.value)}></input>
                            <button type='submit'>Save changes</button>
                            <button type="button" onClick={()=>setEditingId(null)}>Cancel</button>
                        </form>
                    </div>
                ):null}
                </li>
                
            ))}
                
            </ul>
            }
        </div>
    )
}
export default ManageTasks;