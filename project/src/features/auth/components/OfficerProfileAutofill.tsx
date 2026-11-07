import { useEffect, useRef } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import { applyOfficerProfileDefaults } from '../lib/officerInspectorDefaults';

/**
 * Seeds the signed-in officer's profile details into locally persisted form
 * drafts (statutory sampling forms, dealer inspections, covering letter
 * metadata) so inspectors open modules with their details prefilled.
 * Renders nothing.
 */
export function OfficerProfileAutofill() {
  const { officerProfile } = useAuth();
  const appliedKeyRef = useRef('');

  useEffect(() => {
    if (!officerProfile?.id) return;
    const key = `${officerProfile.id}:${officerProfile.updated_at || officerProfile.created_at || 'v1'}`;
    if (appliedKeyRef.current === key) return;
    appliedKeyRef.current = key;
    applyOfficerProfileDefaults(officerProfile);
  }, [officerProfile]);

  return null;
}
