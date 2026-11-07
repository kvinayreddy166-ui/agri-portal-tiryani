import { describe, it, expect } from 'vitest';
import {
  EnforcementTrackerService,
  getStatutoryNonComplianceInfo,
  type SampleRow,
} from './enforcementTrackerService';

describe('Statutory Sample Non-Compliance Marking', () => {
  it('returns statutory terminology for each commodity', () => {
    const pesticideInfo = getStatutoryNonComplianceInfo('pesticide');
    expect(pesticideInfo.label).toBe('Misbranded');
    expect(pesticideInfo.shortLabel).toBe('Misbranded');
    expect(pesticideInfo.actRef).toContain('Insecticides Act, 1968');

    const fertilizerInfo = getStatutoryNonComplianceInfo('fertilizer');
    expect(fertilizerInfo.label).toBe('Not according to Specifications');
    expect(fertilizerInfo.shortLabel).toBe('Not to Spec');
    expect(fertilizerInfo.actRef).toContain('FCO, 1985');

    const seedInfo = getStatutoryNonComplianceInfo('seed');
    expect(seedInfo.label).toBe('Substandard');
    expect(seedInfo.shortLabel).toBe('Substandard');
    expect(seedInfo.actRef).toContain('Seeds Act, 1966');
  });

  it('buildSamplePipeline resolves statutory failureFinding correctly for failed samples', () => {
    const mockSamples: SampleRow[] = [
      {
        id: 'smp-1',
        officer_id: 'off-1',
        commodity: 'pesticide',
        sample_code: 'PEST-001',
        firm_name: 'Sri Krishna Fertilizers & Pesticides',
        date_of_sampling: '2026-11-01',
        covering_letter_json: {},
        lab_status: 'DISPATCHED',
      },
      {
        id: 'smp-2',
        officer_id: 'off-1',
        commodity: 'fertilizer',
        sample_code: 'FERT-002',
        firm_name: 'Balaji Agro Agency',
        date_of_sampling: '2026-11-02',
        covering_letter_json: {},
        lab_status: 'TEST_FAILED',
      },
      {
        id: 'smp-3',
        officer_id: 'off-1',
        commodity: 'seed',
        sample_code: 'SEED-003',
        firm_name: 'Raithu Seva Kendra',
        date_of_sampling: '2026-11-03',
        covering_letter_json: { failureFinding: 'Substandard' },
        lab_report_ref: 'Substandard: CTL/SEED/2026/08',
        lab_status: 'TEST_FAILED',
      },
      {
        id: 'smp-4',
        officer_id: 'off-1',
        commodity: 'pesticide',
        sample_code: 'PEST-004',
        firm_name: 'Kisan Pesticides',
        date_of_sampling: '2026-11-04',
        covering_letter_json: { failureFinding: 'Misbranded' },
        lab_report_ref: 'Misbranded: CTL/INSP/2026/99',
        lab_status: 'TEST_FAILED',
      },
    ];

    const pipeline = EnforcementTrackerService.buildSamplePipeline(mockSamples);

    expect(pipeline).toHaveLength(4);

    // Dispatched sample should not have failureFinding
    expect(pipeline[0].labStatus).toBe('DISPATCHED');
    expect(pipeline[0].failureFinding).toBeNull();

    // Fertilizer failed sample defaults to "Not according to Specifications"
    expect(pipeline[1].labStatus).toBe('TEST_FAILED');
    expect(pipeline[1].failureFinding).toBe('Not according to Specifications');

    // Seed failed sample has "Substandard"
    expect(pipeline[2].labStatus).toBe('TEST_FAILED');
    expect(pipeline[2].failureFinding).toBe('Substandard');
    expect(pipeline[2].labReportRef).toBe('Substandard: CTL/SEED/2026/08');

    // Pesticide failed sample has "Misbranded"
    expect(pipeline[3].labStatus).toBe('TEST_FAILED');
    expect(pipeline[3].failureFinding).toBe('Misbranded');
    expect(pipeline[3].labReportRef).toBe('Misbranded: CTL/INSP/2026/99');
  });
});
