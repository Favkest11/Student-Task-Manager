import { useState,useEffect, type FormEvent} from 'react'
import './App.css'
import { supabase } from './lib/supabase'
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
function App() {
  const [isLogin,setIsLogin]=useState<boolean>(true);
  const[user,setUser]=useState<any>(null);
  useEffect(() => {
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])
  if(user)
  {
    const role=user.user_metadata.role;
    if(role=="teacher")
    {
      return <TeacherDashboard/>
    }
    if(role=="student")
    {
      return <StudentDashboard/>
    }


  }
  return (
    <div>
      {isLogin? <LoginForm/> : <RegisterForm/>}
      <button className='btnswitch-signup-signin' onClick={()=>(setIsLogin(!isLogin))}>{isLogin? 'U have dont have an account sign Up' : 'Already have an account?'}</button>

    </div>
    
  )
}

export default App
