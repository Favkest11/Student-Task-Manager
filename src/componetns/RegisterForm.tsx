import { useState, type FormEvent} from 'react'
import { supabase } from '../lib/supabase';
 type UserRole='student' |'teacher';

   function RegisterForm(){
    
    const [loading,setLoading]=useState<boolean>(false);
    const handleRegister=async(e:FormEvent<HTMLFormElement>)=>
    {
      e.preventDefault();
      setLoading(true);
      const formData=new FormData(e.currentTarget);
      const email=formData.get('email') as string;
      const password=formData.get('password') as string;
      const role=formData.get('role') as UserRole;
      try
      {
        const{data,error}=await supabase.auth.signUp
        ({
          email,
          password,
          options:{
            data:{
              role,
            },
          },
        })
        if (error) throw error;
        alert('Successful,check your email');

      }
      catch(error:any)
      {
        alert('Something went wrong,try again')
      }
      finally
      {
        setLoading(false);
      }
    }
    return(
      <div>
          <form onSubmit={handleRegister} >
        <label>Email
          <input required name='email' type='email' placeholder='example@gmail.com'></input>
        </label>
        <label>Password
          <input required name='password' type='password' placeholder='passwordexample123' minLength={9}></input>
        </label>
       <label>
         <select name='role' defaultValue={'student'}>
            <option value={'student'}>Student</option>
            <option value={'teacher'}>Teacher</option>
         </select>
        </label>
        <button type='submit' disabled={loading}>Create Acc</button>
      </form>
      </div>
    )
      
    
  }
  export default RegisterForm
