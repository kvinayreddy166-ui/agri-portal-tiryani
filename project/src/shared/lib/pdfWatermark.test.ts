import { describe, expect, it, vi } from 'vitest';
import { addEmblemImageWatermark, addGovernmentEmblemWatermark } from './pdfWatermark';

describe('pdfWatermark', () => {
  it('does nothing when enabled is false', async () => {
    const mockDoc = {
      internal: {
        pageSize: { getWidth: () => 210, getHeight: () => 297 },
        pages: [null, {}, {}],
      },
      setPage: vi.fn(),
      saveGraphicsState: vi.fn(),
      setGState: vi.fn(),
      GState: vi.fn(),
      addImage: vi.fn(),
      restoreGraphicsState: vi.fn(),
    } as any;

    await addEmblemImageWatermark(mockDoc, false);
    expect(mockDoc.setPage).not.toHaveBeenCalled();
    expect(mockDoc.addImage).not.toHaveBeenCalled();
  });

  it('addGovernmentEmblemWatermark stamps text watermark on each page', () => {
    const mockDoc = {
      internal: {
        pageSize: { getWidth: () => 210, getHeight: () => 297 },
        pages: [null, {}, {}], // 2 pages
      },
      setPage: vi.fn(),
      saveGraphicsState: vi.fn(),
      setTextColor: vi.fn(),
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      setGState: vi.fn(),
      GState: vi.fn().mockReturnValue({}),
      text: vi.fn(),
      restoreGraphicsState: vi.fn(),
    } as any;

    addGovernmentEmblemWatermark(mockDoc, true);
    expect(mockDoc.setPage).toHaveBeenCalledWith(1);
    expect(mockDoc.setPage).toHaveBeenCalledWith(2);
    expect(mockDoc.text).toHaveBeenCalledTimes(4); // 2 text calls per page * 2 pages
  });
});
