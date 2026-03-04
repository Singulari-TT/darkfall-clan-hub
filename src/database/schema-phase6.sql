-- Phase 9: Admin Audit Log Schema

-- 1. Create the Audit Logs table
CREATE TABLE IF NOT EXISTS public."Audit_Logs" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public."Users"(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource TEXT,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add RLS Policies
ALTER TABLE public."Audit_Logs" ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own logs
CREATE POLICY "Users can insert their own audit logs"
    ON public."Audit_Logs" FOR INSERT
    WITH CHECK (true);

-- Allow Admins to read all audit logs
CREATE POLICY "Admins can view all audit logs"
    ON public."Audit_Logs" FOR SELECT
    USING (true);

-- 3. Create indexes for performance on common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public."Audit_Logs"(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public."Audit_Logs"(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public."Audit_Logs"(created_at DESC);
