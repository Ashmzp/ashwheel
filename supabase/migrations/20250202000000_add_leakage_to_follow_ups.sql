-- Add leakage column to workshop_follow_ups table
ALTER TABLE public.workshop_follow_ups 
ADD COLUMN IF NOT EXISTS leakage TEXT;

-- Add comment
COMMENT ON COLUMN public.workshop_follow_ups.leakage IS 
'Leakage details - if filled, follow-up is marked as leakage and moved to separate tab';
