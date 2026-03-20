NETLIFY:https://crudstudenttaskmanager.netlify.app/

# Student Task Manager

A full-stack web application for academic task management with role-based access control.

## Overview
The platform allows teachers to manage subjects and assign tasks, while students can track their progress through a centralized dashboard with advanced filtering options.

## Core Features
- Role-Based Authentication: Separate interfaces for Teachers and Students via Supabase Auth.
- Teacher Dashboard: CRUD operations for subjects and tasks using modal-driven UI.
- Student Dashboard: Task tracking with filtering by subject, status, and deadlines.
- Status Tracking: Interactive task completion and automatic overdue detection.

## Tech Stack
- Frontend: React, TypeScript, Vite.
- Backend: Supabase (PostgreSQL, Auth, RLS).
- UI: Custom CSS (Clean UI approach), Lucide Icons.

## Installation
1. Clone the repository.
2. Install dependencies: npm install.
3. Configure .env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
4. Start development server: npm run dev.
