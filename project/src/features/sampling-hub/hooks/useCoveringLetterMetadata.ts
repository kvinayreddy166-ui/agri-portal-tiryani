import { useState, useEffect, useRef } from 'react';
import { localTodayDate } from '../../../shared/utils/dateUtils';
import { safeStorage } from '../../../shared/lib/safeStorage';
import { supabase } from '../../../shared/lib/supabase';
import { useAuth } from '../../../shared/context/AuthContext';

export interface BaseCoveringLetterMetadata {
  year: string;
  letterNumber: string;
  letterDate: string;
  authorityType: 'DAO' | 'ADA';
  daoMemoNumber: string;
  daoMemoDate: string;
  cdaMemoNumber: string;
  cdaMemoDate: string;
  division: string;
  officePhone: string;
}

export interface InputCoveringLetterDetails {
  financialYear?: string;
  year?: string;
  letterNumber?: string;
  letterDate?: string;
  authorityType?: 'DAO' | 'ADA';
  memoNumber?: string;
  daoMemoNumber?: string;
  memoDate?: string;
  daoMemoDate?: string;
  cdaMemoNumber?: string;
  cdaMemoDate?: string;
  division?: string;
  officerPhone?: string;
  officePhone?: string;
}

// C&DA memo details are managed once by admin and shared across all covering
// letters (fertilizer, pesticide, seed) via a dedicated storage key.
export const COVERING_LETTER_CDA_STORAGE_KEY = 'tiryani-covering-letter-cda-details';
export const COVERING_LETTER_CDA_SETTINGS_KEY = 'covering_letter_cda_memo';

function readSharedCdaDetails(): { cdaMemoNumber?: string; cdaMemoDate?: string } | null {
  try {
    const saved = safeStorage.getItem(COVERING_LETTER_CDA_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export const COVERING_LETTER_FINANCIAL_YEARS = [
  '2025-26',
  '2026-27',
  '2027-28',
  '2028-29',
  '2029-30',
  '2030-31',
] as const;

export type CoveringLetterFinancialYear = (typeof COVERING_LETTER_FINANCIAL_YEARS)[number];

export function getDefaultCoveringLetterFinancialYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed: 0 = Jan, 3 = Apr
  const startYear = month >= 3 ? year : year - 1;
  const currentFy = `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
  if ((COVERING_LETTER_FINANCIAL_YEARS as readonly string[]).includes(currentFy)) {
    return currentFy;
  }
  if (startYear < 2025) {
    return COVERING_LETTER_FINANCIAL_YEARS[0];
  }
  return COVERING_LETTER_FINANCIAL_YEARS[COVERING_LETTER_FINANCIAL_YEARS.length - 1];
}

export const defaultFinancialYears = [...COVERING_LETTER_FINANCIAL_YEARS];

export function useCoveringLetterMetadata<T extends BaseCoveringLetterMetadata = BaseCoveringLetterMetadata>(
  storageKey: string,
  initialPropsDetails?: InputCoveringLetterDetails,
  isOpen: boolean = false,
  onMetadataChange?: (metadata: T) => void
) {
  const { isAdminUser } = useAuth();
  const [metadata, setMetadata] = useState<T>(() => {
    let storageData: any = null;
    try {
      const saved = safeStorage.getItem(storageKey);
      if (saved) storageData = JSON.parse(saved);
    } catch {}
    const sharedCda = readSharedCdaDetails();

    const resolved: BaseCoveringLetterMetadata = {
      year: initialPropsDetails?.financialYear || initialPropsDetails?.year || storageData?.financialYear || storageData?.year || getDefaultCoveringLetterFinancialYear(),
      letterNumber: initialPropsDetails?.letterNumber ?? storageData?.letterNumber ?? '',
      letterDate: initialPropsDetails?.letterDate || storageData?.letterDate || localTodayDate(),
      authorityType: initialPropsDetails?.authorityType || storageData?.authorityType || 'DAO',
      daoMemoNumber: initialPropsDetails?.memoNumber ?? initialPropsDetails?.daoMemoNumber ?? storageData?.memoNumber ?? storageData?.daoMemoNumber ?? '',
      daoMemoDate: initialPropsDetails?.memoDate ?? initialPropsDetails?.daoMemoDate ?? storageData?.memoDate ?? storageData?.daoMemoDate ?? '',
      cdaMemoNumber: sharedCda?.cdaMemoNumber ?? initialPropsDetails?.cdaMemoNumber ?? storageData?.cdaMemoNumber ?? '',
      cdaMemoDate: sharedCda?.cdaMemoDate ?? initialPropsDetails?.cdaMemoDate ?? storageData?.cdaMemoDate ?? '',
      division: initialPropsDetails?.division ?? storageData?.division ?? '',
      officePhone: initialPropsDetails?.officerPhone ?? initialPropsDetails?.officePhone ?? storageData?.officerPhone ?? storageData?.officePhone ?? '',
    };
    return resolved as T;
  });

  const lastPropagatedMetadata = useRef<T | null>(null);
  const prevIsOpenRef = useRef(isOpen);
  const lastCdaSyncRef = useRef<{ n: string; d: string } | null>(null);

  // Auto-save to localStorage only when modal is open
  useEffect(() => {
    if (isOpen) {
      safeStorage.setItem(storageKey, JSON.stringify(metadata));
      safeStorage.setItem(
        COVERING_LETTER_CDA_STORAGE_KEY,
        JSON.stringify({
          cdaMemoNumber: (metadata as BaseCoveringLetterMetadata).cdaMemoNumber ?? '',
          cdaMemoDate: (metadata as BaseCoveringLetterMetadata).cdaMemoDate ?? '',
        })
      );
    }
  }, [metadata, isOpen, storageKey]);

  // Load admin-managed C&DA memo details from Supabase when the modal opens.
  // Remote values win over localStorage so officers on any device see the
  // latest admin entries; localStorage remains the offline fallback.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('setting_value')
          .eq('setting_key', COVERING_LETTER_CDA_SETTINGS_KEY)
          .maybeSingle();
        if (cancelled || error || !data?.setting_value) return;
        const remote = JSON.parse(data.setting_value) as { cdaMemoNumber?: string; cdaMemoDate?: string };
        const n = remote?.cdaMemoNumber ?? '';
        const d = remote?.cdaMemoDate ?? '';
        lastCdaSyncRef.current = { n, d };
        safeStorage.setItem(
          COVERING_LETTER_CDA_STORAGE_KEY,
          JSON.stringify({ cdaMemoNumber: n, cdaMemoDate: d })
        );
        setMetadata(prev => {
          const p = prev as BaseCoveringLetterMetadata;
          if (p.cdaMemoNumber === n && p.cdaMemoDate === d) return prev;
          return { ...prev, cdaMemoNumber: n, cdaMemoDate: d } as T;
        });
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [isOpen]);

  // Persist C&DA memo details to Supabase — admin only (RLS enforces this too).
  useEffect(() => {
    if (!isOpen || !isAdminUser) return;
    const m = metadata as BaseCoveringLetterMetadata;
    const n = m.cdaMemoNumber ?? '';
    const d = m.cdaMemoDate ?? '';
    const last = lastCdaSyncRef.current;
    if (last && last.n === n && last.d === d) return;
    lastCdaSyncRef.current = { n, d };
    void supabase
      .from('settings')
      .upsert(
        {
          setting_key: COVERING_LETTER_CDA_SETTINGS_KEY,
          setting_value: JSON.stringify({ cdaMemoNumber: n, cdaMemoDate: d }),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'setting_key' }
      )
      .then(({ error }) => {
        if (error) console.error('Failed to sync C&DA memo details:', error);
      });
  }, [metadata, isOpen, isAdminUser]);

  // Propagate to parent when modal is open and values changed
  useEffect(() => {
    if (onMetadataChange && isOpen) {
      const last = lastPropagatedMetadata.current;
      const hasChanged = !last ||
        last.year !== metadata.year ||
        last.letterNumber !== metadata.letterNumber ||
        last.letterDate !== metadata.letterDate ||
        last.authorityType !== metadata.authorityType ||
        last.daoMemoNumber !== metadata.daoMemoNumber ||
        last.daoMemoDate !== metadata.daoMemoDate ||
        (last as BaseCoveringLetterMetadata).cdaMemoNumber !== (metadata as BaseCoveringLetterMetadata).cdaMemoNumber ||
        (last as BaseCoveringLetterMetadata).cdaMemoDate !== (metadata as BaseCoveringLetterMetadata).cdaMemoDate ||
        last.division !== metadata.division ||
        last.officePhone !== metadata.officePhone;

      if (hasChanged) {
        lastPropagatedMetadata.current = metadata;
        onMetadataChange(metadata);
      }
    }
  }, [metadata, onMetadataChange, isOpen]);

  // Sync on transition to open
  useEffect(() => {
    if (isOpen) {
      if (!prevIsOpenRef.current) {
        let storageData: any = null;
        try {
          const saved = safeStorage.getItem(storageKey);
          if (saved) storageData = JSON.parse(saved);
        } catch {}
        const sharedCda = readSharedCdaDetails();

        setMetadata(prev => {
          const resolved: BaseCoveringLetterMetadata = {
            year: initialPropsDetails?.financialYear || initialPropsDetails?.year || storageData?.financialYear || storageData?.year || prev.year || getDefaultCoveringLetterFinancialYear(),
            letterNumber: initialPropsDetails?.letterNumber ?? storageData?.letterNumber ?? prev.letterNumber ?? '',
            letterDate: initialPropsDetails?.letterDate || storageData?.letterDate || prev.letterDate || localTodayDate(),
            authorityType: initialPropsDetails?.authorityType || storageData?.authorityType || prev.authorityType || 'DAO',
            daoMemoNumber: initialPropsDetails?.memoNumber ?? initialPropsDetails?.daoMemoNumber ?? storageData?.memoNumber ?? storageData?.daoMemoNumber ?? prev.daoMemoNumber ?? '',
            daoMemoDate: initialPropsDetails?.memoDate ?? initialPropsDetails?.daoMemoDate ?? storageData?.memoDate ?? storageData?.daoMemoDate ?? prev.daoMemoDate ?? '',
            cdaMemoNumber: sharedCda?.cdaMemoNumber ?? initialPropsDetails?.cdaMemoNumber ?? storageData?.cdaMemoNumber ?? (prev as BaseCoveringLetterMetadata).cdaMemoNumber ?? '',
            cdaMemoDate: sharedCda?.cdaMemoDate ?? initialPropsDetails?.cdaMemoDate ?? storageData?.cdaMemoDate ?? (prev as BaseCoveringLetterMetadata).cdaMemoDate ?? '',
            division: initialPropsDetails?.division ?? storageData?.division ?? prev.division ?? '',
            officePhone: initialPropsDetails?.officerPhone ?? initialPropsDetails?.officePhone ?? storageData?.officerPhone ?? storageData?.officePhone ?? prev.officePhone ?? '',
          };
          return resolved as T;
        });
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, storageKey, initialPropsDetails]);

  return [metadata, setMetadata] as const;
}
