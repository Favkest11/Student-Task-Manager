import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase';
import styles from '../styles/LoginForm.module.css'
import { GraduationCap } from 'lucide-react';
interface LoginFormProps {
    onSwitchToRegister: () => void;
}

function LoginForm({ onSwitchToRegister }: LoginFormProps) {
    const [loading, setLoading] = useState<boolean>(false);

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
        } catch (error: any) {
            alert('Ошибка входа: ' + error.message);
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
                    <h1 className={styles.title}>Welcome Back</h1>
                    <p className={styles.subtitle}>Sign in to your account</p>
                </div>
                <form onSubmit={handleLogin}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Email</label>
                        <input className={styles.input} required name="email" type="email" placeholder="example@university.edu" />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Password</label>
                        <input className={styles.input} required name="password" type="password" placeholder="••••••••" />
                    </div>
                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
                    Don't have an account?{' '}
                    <button type="button" onClick={onSwitchToRegister} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: '600', padding: 0 }}>
                        Sign Up
                    </button>
                </div>
            </div>
        </div>
    );
}
export default LoginForm;