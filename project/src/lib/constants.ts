export const FERTILIZER_TYPES = ['Urea', 'DAP', 'Potash', 'SSP', 'Complex'] as const;

export type FertilizerType = (typeof FERTILIZER_TYPES)[number];
