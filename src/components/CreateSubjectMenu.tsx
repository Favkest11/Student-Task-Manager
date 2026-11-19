import { useState, type FormEvent} from 'react'
import { api } from '../lib/api';
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
        try{
            await api.subjects.create({
                title,
                description,
            })
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
            <button type='submit' disabled={loading}>Create Subject</button>
            </form>
        </div>
    )
}
export default CreateSubjectMenu;