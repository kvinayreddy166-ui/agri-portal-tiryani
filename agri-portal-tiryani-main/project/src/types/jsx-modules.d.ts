declare module '*.jsx' {
  import type { ComponentType } from 'react';

  const component: ComponentType<Record<string, unknown>>;
  export default component;
  export const CropAdminDashboard: ComponentType<Record<string, unknown>>;
  export const CropIntelligencePage: ComponentType<{ cropSlug?: string }>;
}
