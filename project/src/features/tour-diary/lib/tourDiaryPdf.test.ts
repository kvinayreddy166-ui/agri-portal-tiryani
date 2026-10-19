import { describe, expect, it } from 'vitest';
import { jsPDF } from 'jspdf';
import { splitTitleSegments, type TitleSegment } from './tourDiaryPdf';

describe('splitTitleSegments', () => {
  it('keeps short titles on a single line when within maxWidth', () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const segments: TitleSegment[] = [
      { text: 'Tour Diary of ', bold: false },
      { text: 'V. REDDY', bold: true },
      { text: ', ', bold: false },
      { text: 'MAO', bold: true },
      { text: ', ', bold: false },
      { text: 'Tiryani', bold: true },
      { text: ', Dist: ', bold: false },
      { text: 'Asifabad', bold: true },
      { text: ' for the Month of ', bold: false },
      { text: 'Oct-2026', bold: true },
      { text: '.', bold: false },
    ];

    const lines = splitTitleSegments(doc, segments, 260);
    expect(lines).toHaveLength(1);

    const fullText = lines[0].map((t) => t.text).join('');
    expect(fullText).toBe('Tour Diary of V. REDDY, MAO, Tiryani, Dist: Asifabad for the Month of Oct-2026.');

    const totalWidth = lines[0].reduce((sum, t) => sum + t.width, 0);
    expect(totalWidth).toBeLessThanOrEqual(260);
  });

  it('wraps long officer heading into 2 balanced lines without overflowing maxWidth', () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    // User's exact scenario from the screenshot:
    // Name: KUTHURU VINAY REDDY KUMRAM
    // Desig: Mandal Agriculture Officer
    // Mandal: Chintalamanepally
    // Division: Kagaznagar
    // District: Kumrambheem Asifabad
    // Month: October-2026
    const segments: TitleSegment[] = [
      { text: 'Tour Diary of ', bold: false },
      { text: 'KUTHURU VINAY REDDY KUMRAM', bold: true },
      { text: ', ', bold: false },
      { text: 'Mandal Agriculture Officer', bold: true },
      { text: ', ', bold: false },
      { text: 'Chintalamanepally', bold: true },
      { text: ', Division: ', bold: false },
      { text: 'Kagaznagar', bold: true },
      { text: ', Dist: ', bold: false },
      { text: 'Kumrambheem Asifabad', bold: true },
      { text: ' for the Month of ', bold: false },
      { text: 'October-2026', bold: true },
      { text: '.', bold: false },
    ];

    const lines = splitTitleSegments(doc, segments, 260);
    expect(lines).toHaveLength(2);

    const line1Text = lines[0].map((t) => t.text).join('');
    const line2Text = lines[1].map((t) => t.text).join('');

    // Line 1 should cleanly break at the comma after the mandal
    expect(line1Text).toBe('Tour Diary of KUTHURU VINAY REDDY KUMRAM, Mandal Agriculture Officer, Chintalamanepally,');
    expect(line2Text).toBe('Division: Kagaznagar, Dist: Kumrambheem Asifabad for the Month of October-2026.');

    // Both lines must fit within printable table width (260 mm)
    const line1Width = lines[0].reduce((sum, t) => sum + t.width, 0);
    const line2Width = lines[1].reduce((sum, t) => sum + t.width, 0);

    expect(line1Width).toBeLessThanOrEqual(260);
    expect(line2Width).toBeLessThanOrEqual(260);

    // No leading or trailing spaces on lines
    expect(lines[0][0].isSpace).toBe(false);
    expect(lines[0][lines[0].length - 1].isSpace).toBe(false);
    expect(lines[1][0].isSpace).toBe(false);
    expect(lines[1][lines[1].length - 1].isSpace).toBe(false);
  });

  it('gracefully handles extra-long headings by wrapping every line within maxWidth', () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const segments: TitleSegment[] = [
      { text: 'Tour Diary of ', bold: false },
      { text: 'SRI KUTHURU VEERA VENKATA SATYANARAYANA REDDY', bold: true },
      { text: ', ', bold: false },
      { text: 'Agricultural Extension Officer', bold: true },
      { text: ', ', bold: false },
      { text: 'Chintalamanepally Mandal', bold: true },
      { text: ', Division: ', bold: false },
      { text: 'Kagaznagar Division', bold: true },
      { text: ', Dist: ', bold: false },
      { text: 'Kumrambheem Asifabad District', bold: true },
      { text: ' for the Month of ', bold: false },
      { text: 'October-2026', bold: true },
      { text: '.', bold: false },
    ];

    const lines = splitTitleSegments(doc, segments, 260);
    expect(lines.length).toBeGreaterThan(1);

    for (const line of lines) {
      const lineWidth = line.reduce((sum, t) => sum + t.width, 0);
      expect(lineWidth).toBeLessThanOrEqual(260);
      expect(line[0].isSpace).toBe(false);
      expect(line[line.length - 1].isSpace).toBe(false);
    }
  });
});
