-- Fix remaining dealer name typos on the two Jagdevpur rows that were
-- excluded from the bulk name-cleanup import.
UPDATE public.dealers SET dealer_name = 'Sri Ramanjaneya Fertilizers, Pesticides and Seeds', updated_at = now()
WHERE id = '7a456d5c-c59b-4000-88c5-4941ba891b8d';

UPDATE public.dealers SET dealer_name = 'Sri Veerabhadra Fertilizers, Pesticides and Seeds', updated_at = now()
WHERE id = 'f2cd5460-7dad-4131-a978-c736f375d84d';
