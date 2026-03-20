import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { GraduationCap } from 'lucide-react';
import styles from '../styles/RegisterForm.module.css';
type UserRole = 'student' | 'teacher';
interface RegisterFormProps {
    onSwitchToLogin: () => void;
}
function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
    const [loading, setLoading] = useState<boolean>(false);

    const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const role = formData.get('role') as UserRole;

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        role,
                    },
                },
            });
            if (error) throw error;
            alert('Successful, check your email');
            onSwitchToLogin(); 
        } catch (error: any) {
            alert('Something went wrong, try again: ' + error.message);
        } finally {
            setLoading(false);
        }
    }
    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.iconWrapper}>
                        <GraduationCap size={24} />
                    </div>
                    <h1 className={styles.title}>Create Account</h1>
                    <p className={styles.subtitle}>Join Student Task Manager to organize your academic life</p>
                </div>

                <form onSubmit={handleRegister}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Email
                            <input required name='email' type='email' placeholder='example@gmail.com' className={styles.input} />
                        </label>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Password
                            <input required name='password' type='password' placeholder='passwordexample123' minLength={9} className={styles.input} />
                        </label>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Role
                            <select name='role' defaultValue={'student'} className={styles.input}>
                                <option value={'student'}>Student</option>
                                <option value={'teacher'}>Teacher</option>
                            </select>
                        </label>
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? 'Creating...' : 'Create Account'}
                    </button>
                </form>
                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
                    Already have an account?{' '}
                    <button
                        type="button"
                        onClick={onSwitchToLogin}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#2563eb',
                            cursor: 'pointer',
                            fontWeight: '600',
                            padding: 0,
                            fontSize: '14px'
                        }}
                    >
                        Sign In
                    </button>
                </div>

            </div>
        </div>
    );
}
export default RegisterForm;