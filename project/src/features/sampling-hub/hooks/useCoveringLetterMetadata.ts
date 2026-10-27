import { useState, useEffect, useRef } from 'react';
import { localTodayDate } from '../../../shared/utils/dateUtils';
import { safeStorage } from '../../../shared/lib/safeStorage';

export interface BaseCoveringLetterMetadata {
  year: string;
  letterNumber: string;
  letterDate: string;
  authorityType: 'DAO' | 'ADA';
  daoMemoNumber: string;
  daoMemoDate: string;
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
  division?: string;
  officerPhone?: string;
  officePhone?: string;
}

const currentYear = new Date().getFullYear();
export const defaultFinancialYears = [
  `${currentYear}-${(currentYear + 1).toString().slice(-2)}`,
  `${currentYear - 1}-${currentYear.toString().slice(-2)}`,
  `${currentYear + 1}-${(currentYear + 2).toString().slice(-2)}`,
];

export function useCoveringLetterMetadata<T extends BaseCoveringLetterMetadata = BaseCoveringLetterMetadata>(
  storageKey: string,
  initialPropsDetails?: InputCoveringLetterDetails,
  isOpen: boolean = false,
  onMetadataChange?: (metadata: T) => void
) {
  const [metadata, setMetadata] = useState<T>(() => {
    let storageData: any = null;
    try {
      const saved = safeStorage.getItem(storageKey);
      if (saved) storageData = JSON.parse(saved);
    } catch {}

    const resolved: BaseCoveringLetterMetadata = {
      year: initialPropsDetails?.financialYear || initialPropsDetails?.year || storageData?.financialYear || storageData?.year || defaultFinancialYears[0],
      letterNumber: initialPropsDetails?.letterNumber ?? storageData?.letterNumber ?? '',
      letterDate: initialPropsDetails?.letterDate || storageData?.letterDate || localTodayDate(),
      authorityType: initialPropsDetails?.authorityType || storageData?.authorityType || 'DAO',
      daoMemoNumber: initialPropsDetails?.memoNumber ?? initialPropsDetails?.daoMemoNumber ?? storageData?.memoNumber ?? storageData?.daoMemoNumber ?? '',
      daoMemoDate: initialPropsDetails?.memoDate ?? initialPropsDetails?.daoMemoDate ?? storageData?.memoDate ?? storageData?.daoMemoDate ?? '',
      division: initialPropsDetails?.division ?? storageData?.division ?? '',
      officePhone: initialPropsDetails?.officerPhone ?? initialPropsDetails?.officePhone ?? storageData?.officerPhone ?? storageData?.officePhone ?? '',
    };
    return resolved as T;
  });

  const lastPropagatedMetadata = useRef<T | null>(null);
  const prevIsOpenRef = useRef(isOpen);

  // Auto-save to localStorage only when modal is open
  useEffect(() => {
    if (isOpen) {
      safeStorage.setItem(storageKey, JSON.stringify(metadata));
    }
  }, [metadata, isOpen, storageKey]);

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

        setMetadata(prev => {
          const resolved: BaseCoveringLetterMetadata = {
            year: initialPropsDetails?.financialYear || initialPropsDetails?.year || storageData?.financialYear || storageData?.year || prev.year || defaultFinancialYears[0],
            letterNumber: initialPropsDetails?.letterNumber ?? storageData?.letterNumber ?? prev.letterNumber ?? '',
            letterDate: initialPropsDetails?.letterDate || storageData?.letterDate || prev.letterDate || localTodayDate(),
            authorityType: initialPropsDetails?.authorityType || storageData?.authorityType || prev.authorityType || 'DAO',
            daoMemoNumber: initialPropsDetails?.memoNumber ?? initialPropsDetails?.daoMemoNumber ?? storageData?.memoNumber ?? storageData?.daoMemoNumber ?? prev.daoMemoNumber ?? '',
            daoMemoDate: initialPropsDetails?.memoDate ?? initialPropsDetails?.daoMemoDate ?? storageData?.memoDate ?? storageData?.daoMemoDate ?? prev.daoMemoDate ?? '',
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
