-- Phase 12: Admin Bank Ledger (Donations & Withdrawals)
CREATE TABLE public."Bank_Ledger" (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    item_name text NOT NULL,
    quantity integer NOT NULL, -- Positive for in (donations), Negative for out (withdrawals)
    logged_by uuid NOT NULL,
    source text, -- Optional: Who donated it, or who took it?
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "Bank_Ledger_pkey" PRIMARY KEY (id),
    CONSTRAINT "Bank_Ledger_logged_by_fkey" FOREIGN KEY (logged_by) REFERENCES public."Users"(id) ON DELETE CASCADE
);

ALTER TABLE public."Bank_Ledger" ENABLE ROW LEVEL SECURITY;

-- Admins can view the bank ledger
CREATE POLICY "Admins can view bank ledger" ON public."Bank_Ledger" FOR SELECT USING (
    EXISTS (SELECT 1 FROM public."Users" WHERE id = auth.uid() AND role IN ('Admin', 'Leader', 'Officer'))
);

-- Admins can insert into bank ledger
CREATE POLICY "Admins can insert into bank ledger" ON public."Bank_Ledger" FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public."Users" WHERE id = auth.uid() AND role IN ('Admin', 'Leader', 'Officer'))
);
