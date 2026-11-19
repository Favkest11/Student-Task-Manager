import { useState, useEffect } from 'react'
import { auth, type User } from './lib/api'
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
function App() {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  // false until the saved session has been checked, so the login form does not flash on reload
  const [ready, setReady] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = auth.onChange(setUser)
    auth.restore().finally(() => setReady(true))
    return unsubscribe
  }, [])
  if (!ready) {
    return null
  }
  if (user) {
    if (user.role === "teacher") {
      return <TeacherDashboard />
    }
    return <StudentDashboard />
  }

  return (
    <div>
      {isLogin ? (
        <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
      ) : (
        <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
      )}
    </div>
  )
}

export default App