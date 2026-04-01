# Deployment Guide: IELTS Management System

Follow these steps to deploy your IELTS Management System using Supabase (Backend) and Vercel (Frontend).

## Phase 1: Supabase Setup (The Engine)

### 1. Create a Supabase Project
1.  Go to [Supabase Dashboard](https://app.supabase.com/) and create a new project.
2.  Set a database password and choose the region closest to your users.

### 2. Initialize the Database
1.  In your Supabase project, go to the **SQL Editor** in the left sidebar.
2.  Click **New Query**.
3.  Copy and paste the entire content of your [00_initial_schema.sql](file:///c:/Users/cuong/Jaxtina%20Coding/ielts-student-progress-tracker-pro/supabase/migrations/00_initial_schema.sql) into the editor.
4.  Click **Run**.
5.  Wait for the "Success" message. This creates all your tables, enums, triggers, and RLS policies.

### 3. Get Your API Keys
1.  Go to **Project Settings** > **API**.
2.  Copy your **Project URL** and **anon public Key**.
3.  Keep these ready for the Vercel setup.

---

## Phase 2: Vercel Deployment (The UI)

### 1. Connect Your Repository
1.  Push your code to a GitHub repository if you haven't already.
2.  Log in to [Vercel](https://vercel.com/) and click **Add New** > **Project**.
3.  Import your GitHub repository.

### 2. Configure Environment Variables
In the **Environment Variables** section during project setup, add the following:

| Variable Name | Value |
| :--- | :--- |
| `VITE_SUPABASE_URL` | Your Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon public Key |

> [!IMPORTANT]
> Since this is a Vite project, the variables **must** start with `VITE_` otherwise they will not be accessible in the client-side code.

### 3. Deploy
1.  Click **Deploy**.
2.  Vercel will build your React application using the `npm run build` command and serve it globally.

---

## Phase 3: Final Verification

### 1. Test Authentication
1.  Open your deployed Vercel URL.
2.  Go to the login page and try to sign up/sign in.
3.  Verify that a corresponding row appears in the `public.profiles` table in Supabase.

### 2. Verify RLS (Security)
1.  Log in as a user with the **Teacher** role.
2.  Try to view classes you aren't assigned to (the UI should show an empty state or error).
3.  Log in as an **Admin** to verify full access to all KPIs.

---

## Phase 4: Migration (GSheets to Supabase)

If you have existing data in Google Sheets:
1.  **Export**: Export your sheets as CSV or JSON.
2.  **Import**: Use the Supabase **Table Editor** to import CSVs directly into the `students`, `classes`, and `profiles` tables.
3.  **Validate**: Ensure that `class_id` and `student_id` foreign keys match up correctly after import.

> [!TIP]
> **Realtime Updates**: If you want to enable live attendance or homework status updates, go to the **Database** > **Replication** section in Supabase and toggle "Enable" for the relevant tables.
