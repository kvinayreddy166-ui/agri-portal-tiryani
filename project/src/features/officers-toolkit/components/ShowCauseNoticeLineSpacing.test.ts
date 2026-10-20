import { describe, expect, it } from 'vitest';
import {
  noticeBlocksHtml,
  noticeDocumentHtml,
  renderNoticePdfDocument,
  type NoticeBlock,
} from './ShowCauseNoticeEntry';

describe('Legal Documents (Stop Sale, Seizure, SCN & Memos) 1.15 Line Spacing', () => {
  const sampleBlocks: NoticeBlock[] = [
    { kind: 'center', text: 'GOVERNMENT OF TELANGANA', bold: true },
    {
      kind: 'memoRow',
      left: [{ text: 'From: Mandal Agriculture Officer' }],
      right: [{ text: 'To: M/s Farmers Agro Agencies' }],
    },
    {
      kind: 'para',
      segments: [
        { text: 'It is hereby informed that during inspection of the premises, certain discrepancies were observed.' },
      ],
    },
    {
      kind: 'labelPara',
      label: 'Ref:',
      segments: [{ text: '1. Inspection report dated 10-10-2026.' }],
    },
    { kind: 'heading', text: 'ORDER OF STOP SALE' },
    {
      kind: 'lines',
      items: [[{ text: 'Mandal Agriculture Officer, Tiryani' }]],
    },
  ];

  it('renders all on-screen preview HTML blocks with line-height: 1.15 and no 1.25', () => {
    const html = noticeBlocksHtml(sampleBlocks);
    expect(html).toContain('line-height:1.15;');
    expect(html).not.toContain('line-height:1.25;');
  });

  it('renders print HTML document with line-height: 1.15 in body styling', () => {
    const docHtml = noticeDocumentHtml(sampleBlocks);
    expect(docHtml).toContain('line-height:1.15;');
    expect(docHtml).not.toContain('line-height:1.25;');
  });

  it('initializes PDF document with 1.15 line height factor', async () => {
    const doc = await renderNoticePdfDocument(sampleBlocks, 'Test Notice');
    expect(doc.getLineHeightFactor()).toBeCloseTo(1.15, 2);
  });

  it('keeps multi-line numbered item together on the next page instead of splitting', async () => {
    const blocks: NoticeBlock[] = [
      { kind: 'gap', mm: 260 },
      {
        kind: 'labelPara',
        label: '2.',
        segments: [
          { text: 'The Mandal Agriculture Officer concerned, for information and to serve the notice on the dealer under proper dated acknowledgement.' },
        ],
      },
    ];
    const doc = await renderNoticePdfDocument(blocks, 'Test Keep Together');
    expect(doc.getNumberOfPages()).toBe(2);
  });
});
