import { describe, expect, it } from 'vitest';
import { missingRequiredFields, requiredFieldsErrorMessage } from './statutoryRequiredFields';

describe('missingRequiredFields', () => {
  it('returns labels for empty, whitespace, null and undefined values', () => {
    const missing = missingRequiredFields([
      ['TRADE NAME', 'Coragen'],
      ['TECHNICAL NAME', '   '],
      ['ACTIVE INGREDIENT', ''],
      ['FORMULATION TYPE', null],
      ['DEALER / LICENSEE NAME', undefined],
    ]);
    expect(missing).toEqual(['TECHNICAL NAME', 'ACTIVE INGREDIENT', 'FORMULATION TYPE', 'DEALER / LICENSEE NAME']);
  });

  it('returns empty array when all fields are filled', () => {
    expect(
      missingRequiredFields([
        ['NAME AND GRADE OF FERTILIZER', 'Urea'],
        ['DEALER / PARTY NAME', 'Sri Balaji Fertilizers'],
      ]),
    ).toEqual([]);
  });
});

describe('requiredFieldsErrorMessage', () => {
  it('lists the missing field labels', () => {
    expect(requiredFieldsErrorMessage(['TRADE NAME', 'FORMULATION TYPE'])).toBe(
      'Please fill the required fields before previewing or downloading: TRADE NAME, FORMULATION TYPE.',
    );
  });
});
