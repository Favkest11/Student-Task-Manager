// Client for the project's own backend (see the /server folder).
// In development Vite proxies /api to http://localhost:3001 (see vite.config.ts),
// in production set VITE_API_URL to the address of the deployed server.

const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').replace(/\/$/, '');
const TOKEN_KEY = 'stm_token';

export type UserRole = 'student' | 'teacher';

export interface User {
    id: string;
    email: string;
    role: UserRole;
}

export interface Subject {
    id: string;
    title: string;
    description: string;
    created_at: string;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    deadline: string;
    subject_id: string;
    created_at: string;
    /** Only present for students: this student's own status. */
    status?: 'To Do' | 'Done';
    subjects: { title: string } | null;
}

// ---------- token storage ----------

function readToken(): string | null {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch {
        return null; // storage can be blocked (private mode etc.)
    }
}

let token: string | null = readToken();

function saveToken(value: string | null) {
    token = value;
    try {
        if (value) localStorage.setItem(TOKEN_KEY, value);
        else localStorage.removeItem(TOKEN_KEY);
    } catch {
        // the token still works until the page is reloaded
    }
}

// ---------- auth state ----------

type AuthListener = (user: User | null) => void;
const listeners = new Set<AuthListener>();

function setUser(user: User | null) {
    listeners.forEach((listener) => listener(user));
}

// ---------- requests ----------

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    let response: Response;
    try {
        response = await fetch(API_URL + path, {
            method,
            headers: {
                ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    } catch {
        throw new Error('Cannot reach the server. Check that it is running.');
    }

    const text = await response.text();
    let data: any = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        // not JSON (e.g. an error page from a proxy)
    }

    if (!response.ok) {
        // The session expired or was removed: go back to the login screen.
        if (response.status === 401 && token) {
            saveToken(null);
            setUser(null);
        }
        throw new Error(data?.error ?? `Request failed (${response.status})`);
    }
    return data as T;
}

interface AuthResponse {
    user: User;
    token: string;
}

export const auth = {
    /** Calls the listener every time the user logs in or out. Returns an unsubscribe function. */
    onChange(listener: AuthListener) {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    },

    /** Checks the saved token when the page loads. */
    async restore(): Promise<User | null> {
        if (!token) return null;
        try {
            const { user } = await request<{ user: User }>('GET', '/api/auth/me');
            setUser(user);
            return user;
        } catch {
            return null;
        }
    },

    async login(email: string, password: string): Promise<User> {
        const data = await request<AuthResponse>('POST', '/api/auth/login', { email, password });
        saveToken(data.token);
        setUser(data.user);
        return data.user;
    },

    async register(email: string, password: string, role: UserRole): Promise<User> {
        const data = await request<AuthResponse>('POST', '/api/auth/register', { email, password, role });
        saveToken(data.token);
        setUser(data.user);
        return data.user;
    },

    async logout() {
        try {
            await request<null>('POST', '/api/auth/logout');
        } catch {
            // log out locally even if the server is unreachable
        }
        saveToken(null);
        setUser(null);
    },
};

export const api = {
    subjects: {
        /** Teachers get their own subjects, students get all subjects. */
        async list(): Promise<Subject[]> {
            return (await request<{ subjects: Subject[] }>('GET', '/api/subjects')).subjects;
        },
        async create(input: { title: string; description: string }): Promise<Subject> {
            return (await request<{ subject: Subject }>('POST', '/api/subjects', input)).subject;
        },
        async update(id: string, input: { title?: string; description?: string }): Promise<Subject> {
            return (await request<{ subject: Subject }>('PATCH', `/api/subjects/${encodeURIComponent(id)}`, input)).subject;
        },
        async remove(id: string): Promise<void> {
            await request<null>('DELETE', `/api/subjects/${encodeURIComponent(id)}`);
        },
    },

    tasks: {
        /** Newest first. Pass subjectId to get the tasks of one subject. */
        async list(subjectId?: string): Promise<Task[]> {
            const query = subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : '';
            return (await request<{ tasks: Task[] }>('GET', `/api/tasks${query}`)).tasks;
        },
        async create(input: { title: string; description: string; deadline: string; subjectId: string }): Promise<Task> {
            return (await request<{ task: Task }>('POST', '/api/tasks', input)).task;
        },
        async update(id: string, input: { title?: string; description?: string; deadline?: string }): Promise<Task> {
            return (await request<{ task: Task }>('PATCH', `/api/tasks/${encodeURIComponent(id)}`, input)).task;
        },
        async remove(id: string): Promise<void> {
            await request<null>('DELETE', `/api/tasks/${encodeURIComponent(id)}`);
        },
        /** Students only: mark a task as done / not done for the current student. */
        async setStatus(id: string, status: 'To Do' | 'Done'): Promise<void> {
            await request<unknown>('PUT', `/api/tasks/${encodeURIComponent(id)}/status`, { status });
        },
    },
};
