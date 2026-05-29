# 📚 Student Task Manager

🔗 **[Live Demo](https://crudstudenttaskmanager.netlify.app/)**

A full-stack web application for academic task management with role-based access control. The platform allows teachers to manage subjects and assign tasks, while students can track their progress through a centralized dashboard with advanced filtering options.

---

## 📸 Screenshots
<img width="1918" height="808" alt="image" src="https://github.com/user-attachments/assets/3b8452bd-efcf-4f20-8ffb-a085c0498659" />
<img width="1916" height="773" alt="image" src="https://github.com/user-attachments/assets/ba359f9b-1da0-4aed-a61f-ce325a7af8fc" />



---

## 🔑 Demo Access (No registration required)
To quickly explore the application's features without registering, you can use these pre-verified accounts:

**👨‍🏫 Teacher Account (Manage subjects & tasks):**
* **Email:** teacher@demo.com
* **Password:** demo123456

**👨‍🎓 Student Account (View & track tasks):**
* **Email:** student@demo.com
* **Password:** demo123456

  ---
  
## ✨ Core Features

*   **Role-Based Authentication (RBAC):** Separate, secure interfaces for Teachers and Students using Supabase Auth.
*   **Teacher Dashboard:** Full CRUD operations for creating, editing, and deleting subjects and tasks via an intuitive, modal-driven UI.
*   **Student Dashboard:** Task tracking with a robust client-side filtering engine (by subject, status, and deadlines).
*   **Status Tracking:** Interactive task completion toggles and automatic overdue deadline detection.

## 🛠 Tech Stack

*   **Frontend:** React, TypeScript, Vite
*   **Backend:** Supabase (PostgreSQL, Auth, Row-Level Security)
*   **UI/UX:** Custom CSS (Clean SaaS-inspired UI), Lucide Icons

## 🚀 Getting Started & Authentication

**Important Note for New Users:** 
To test the application, you need to register a new account. **After registration, please check your inbox and click the confirmation link sent to your email.** You will only be able to log in after confirming your email address.

## 💻 Local Installation

1. Clone the repository:
```bash
   git clone [https://github.com/Favkest11/Student-Task-Manager.git](https://github.com/Favkest11/Student-Task-Manager.git)
2. Navigate to the project directory and install dependencies:
npm install
3. Create a .env.local file in the root directory and add your Supabase credentials:
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
4. Start the development server:
npm run dev
