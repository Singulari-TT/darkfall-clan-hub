-- Phase 13: Operations Hub & Event RSVPs
CREATE TABLE public."Clan_Operations" (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    title text NOT NULL,
    description text NOT NULL,
    event_date timestamp with time zone NOT NULL,
    op_type text NOT NULL, -- e.g., 'Siege', 'PvE', 'Roaming', 'Meeting'
    status text NOT NULL DEFAULT 'Scheduled', -- 'Scheduled', 'Active', 'Completed', 'Cancelled'
    created_by uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "Clan_Operations_pkey" PRIMARY KEY (id),
    CONSTRAINT "Clan_Operations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public."Users"(id) ON DELETE CASCADE
);

CREATE TABLE public."Operation_RSVPs" (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    operation_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status text NOT NULL, -- 'Attending', 'Maybe', 'Absent'
    character_id uuid, -- Which alt they are bringing
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "Operation_RSVPs_pkey" PRIMARY KEY (id),
    CONSTRAINT "Operation_RSVPs_operation_fkey" FOREIGN KEY (operation_id) REFERENCES public."Clan_Operations"(id) ON DELETE CASCADE,
    CONSTRAINT "Operation_RSVPs_user_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id) ON DELETE CASCADE,
    CONSTRAINT "Operation_RSVPs_char_fkey" FOREIGN KEY (character_id) REFERENCES public."Characters"(id) ON DELETE SET NULL,
    CONSTRAINT "Operation_RSVPs_unique" UNIQUE (operation_id, user_id)
);

ALTER TABLE public."Clan_Operations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Operation_RSVPs" ENABLE ROW LEVEL SECURITY;

-- Admins can create Ops
CREATE POLICY "Admins can create ops" ON public."Clan_Operations" FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public."Users" WHERE id = auth.uid() AND role IN ('Admin', 'Leader', 'Officer'))
);
-- Everyone can view Ops
CREATE POLICY "Everyone can view ops" ON public."Clan_Operations" FOR SELECT USING (true);
-- Admins can update Ops
CREATE POLICY "Admins can update ops" ON public."Clan_Operations" FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public."Users" WHERE id = auth.uid() AND role IN ('Admin', 'Leader', 'Officer'))
);

-- Everyone can view RSVPs
CREATE POLICY "Everyone can view rsvps" ON public."Operation_RSVPs" FOR SELECT USING (true);
-- Users can RSVP for themselves
CREATE POLICY "Users can insert rsvps" ON public."Operation_RSVPs" FOR INSERT WITH CHECK (
    user_id = (SELECT id FROM public."Users" WHERE discord_id = auth.jwt()->>'sub')
);
CREATE POLICY "Users can update their rsvps" ON public."Operation_RSVPs" FOR UPDATE USING (
    user_id = (SELECT id FROM public."Users" WHERE discord_id = auth.jwt()->>'sub')
);
