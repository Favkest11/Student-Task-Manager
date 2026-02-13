import { useState,useEffect, type FormEvent} from 'react'
import './App.css'
import { supabase } from './lib/supabase'
import { GraduationCap } from 'lucide-react';
import RegisterForm from './componetns/RegisterForm';
import LoginForm from './componetns/LoginForm';
function App() {
  const [isLogin,setIsLogin]=useState<boolean>(true);
  return (
    <div>
      <div id='logo-wrapper-graduation-cap'>
        <GraduationCap className='logo-graduation-cap'/>
      </div>
      {isLogin? <LoginForm/> : <RegisterForm/>}
      <button onClick={()=>(setIsLogin(!isLogin))}>{isLogin? 'U have dont have an account sign Up' : 'Already have an account?'}</button>
    </div>
    
  )
}

export default App
