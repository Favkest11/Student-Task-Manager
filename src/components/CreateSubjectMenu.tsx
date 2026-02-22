import { useState, type FormEvent} from 'react'
import { supabase } from '../lib/supabase';
interface CreateSubjectMenuProps{
    onRequestUpdate:()=>void;
}
function CreateSubjectMenu({onRequestUpdate}:CreateSubjectMenuProps)
{
    const[loading,setLoading]=useState<boolean>(false);
    const handleCreateSubject=async(e:FormEvent<HTMLFormElement>)=>
    {
        e.preventDefault();
        setLoading(true);
        const formData= new FormData(e.currentTarget);
        const title=formData.get('title') as string;
        const description=formData.get('description') as string;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) 
        {
            alert('You r not logged in');
            setLoading(false);
            return;
        }
        try{
            const{error}=await supabase.from('subjects').insert({
                title,
                description,
                teacher_id:user.id,
            })
            if (error) throw error;
             onRequestUpdate();
        }
       
        catch(error:any){
            alert('Something went wrong,try again')
        }
        finally{setLoading(false)}

    }
    return(
        <div>
            <form onSubmit={handleCreateSubject}>
            <label>Subject Name</label>
            <input required type='text' name='title'></input>
            <label>Subject Description</label>
            <input  type='text' name='description'></input>
            <button type='submit'>Create Subject</button>
            </form>
        </div>
    )
}
export default CreateSubjectMenu;