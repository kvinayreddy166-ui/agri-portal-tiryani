import React, { useCallback, useEffect, useState } from 'react';
import type { CropProtectionCrop } from '../../services/cropProtectionService';
import { loadCropProtectionData } from '../../services/cropProtectionService';
import { CropProtectionDashboard } from './CropProtectionDashboard';

export function CropProtectionTool() {
  const [crops, setCrops] = useState<CropProtectionCrop[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCrops(await loadCropProtectionData());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="min-h-screen bg-[#eef6f0]">
      <div className="mx-auto max-w-7xl p-3 sm:p-4 lg:p-6">
        <CropProtectionDashboard crops={crops} loading={loading} onRefresh={load} />
      </div>
    </div>
  );
}
