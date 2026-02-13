import { useState, type FormEvent} from 'react'
import { supabase } from '../lib/supabase';
function LoginForm()
{
  const [loading,setLoading]=useState<boolean>(false);
      const handleLogin=async(e:FormEvent<HTMLFormElement>)=>
      {
        e.preventDefault();
        setLoading(true);
        const formData=new FormData(e.currentTarget);
        const email=formData.get('email') as string;
        const password=formData.get('password') as string;
        
        try
        {
          const{data,error}=await supabase.auth.signInWithPassword
          ({
            email,
            password,
            
          })
          if (error) throw error;
          alert('You logged in');
  
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
            <form onSubmit={handleLogin}>
                <label>Email
                    <input required name='email' type='email' placeholder='example@gmail.com'></input>
                </label>
                <label>Password
                    <input required name='password' type='password' placeholder='********'></input>
                </label>
                <button type='submit'>Log in</button>
            </form>
        </div>
        )
  }

export default LoginForm