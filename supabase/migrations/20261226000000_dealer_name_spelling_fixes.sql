-- Fix misspelled agri-input words in dealer names (word-boundary, case-insensitive).

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mFerilizer\M', 'Fertilizer', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mFerilizer\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mFrertilizer\M', 'Fertilizer', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mFrertilizer\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mFetilizer\M', 'Fertilizer', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mFetilizer\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mFertilzer\M', 'Fertilizer', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mFertilzer\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mFertliser\M', 'Fertilizer', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mFertliser\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mFertilises\M', 'Fertilizer', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mFertilises\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mFerilizers\M', 'Fertilizers', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mFerilizers\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mFertiizers\M', 'Fertilizers', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mFertiizers\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mFertilziers\M', 'Fertilizers', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mFertilziers\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mFetilizers\M', 'Fertilizers', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mFetilizers\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mFrtilizers\M', 'Fertilizers', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mFrtilizers\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mFertiliers\M', 'Fertilizers', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mFertiliers\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mFerrtilizers\M', 'Fertilizers', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mFerrtilizers\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mFertiilizers\M', 'Fertilizers', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mFertiilizers\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mFetrilizers\M', 'Fertilizers', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mFetrilizers\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mFretilizers\M', 'Fertilizers', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mFretilizers\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mFertilsiers\M', 'Fertilizers', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mFertilsiers\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mFertsilizers\M', 'Fertilizers', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mFertsilizers\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mFeetilizers\M', 'Fertilizers', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mFeetilizers\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mFertyilizers\M', 'Fertilizers', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mFertyilizers\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mFeritilizers\M', 'Fertilizers', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mFeritilizers\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mFertiisers\M', 'Fertilizers', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mFertiisers\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mFerttilizers\M', 'Fertilizers', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mFerttilizers\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mFeriliers\M', 'Fertilizers', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mFeriliers\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mFerlizers\M', 'Fertilizers', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mFerlizers\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mFefrtilizers\M', 'Fertilizers', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mFefrtilizers\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mFertilizerss\M', 'Fertilizers', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mFertilizerss\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mFertilizeres\M', 'Fertilizers', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mFertilizeres\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mPessticides\M', 'Pesticides', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mPessticides\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mPsticides\M', 'Pesticides', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mPsticides\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mPerticides\M', 'Pesticides', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mPerticides\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mSedds\M', 'Seeds', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mSedds\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mSeds\M', 'Seeds', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mSeds\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mAndseds\M', 'And Seeds', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mAndseds\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mSeeva\M', 'Seva', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mSeeva\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mSltd\M', 'Ltd', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mSltd\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mKend\M', 'Kendram', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mKend\M';

UPDATE public.dealers SET dealer_name='Sri Venkateswara Fertilizers and Pesticides', updated_at=now() WHERE dealer_name IN ('Sri Venkateswara Fertilizersandp');
UPDATE public.dealers SET dealer_name='Maa Arppmms Ltd', updated_at=now() WHERE dealer_name='Maa Arppmmsltd';
