import { useState, type FormEvent} from 'react'
import { supabase } from '../lib/supabase';
import { GraduationCap } from 'lucide-react';
import styles from '../styles/RegisterForm.module.css'
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
      <div className={styles.container}>
        <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <GraduationCap size={24}/>
          </div>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Join Student Task Manager to organize your academic life</p>
          </div>
          <form onSubmit={handleRegister} >
            <div className={styles.formGroup}>
        <label className={styles.label}>Email
          <input required name='email' type='email' placeholder='example@gmail.com' className={styles.input}></input>
        </label>
        </div>
            <div className={styles.formGroup}>
        <label className={styles.label}>Password
          <input required name='password' type='password' placeholder='passwordexample123' minLength={9} className={styles.input}></input>
        </label>
        </div>
       <label>
         <select name='role' defaultValue={'student'}>
            <option value={'student'}>Student</option>
            <option value={'teacher'}>Teacher</option>
         </select>
        </label>
        <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        
      </form>
      </div>
      </div>

    )
      
    
  }
  export default RegisterForm
