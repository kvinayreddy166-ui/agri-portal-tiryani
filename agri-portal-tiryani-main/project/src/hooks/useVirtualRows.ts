import { useMemo, useState, type UIEvent } from 'react';

interface VirtualRowOptions {
  rowHeight?: number;
  viewportHeight?: number;
  overscan?: number;
}

export function useVirtualRows<T>(
  rows: T[],
  { rowHeight = 48, viewportHeight = 520, overscan = 8 }: VirtualRowOptions = {}
) {
  const [scrollTop, setScrollTop] = useState(0);
  const totalHeight = rows.length * rowHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(
    rows.length,
    Math.ceil((scrollTop + viewportHeight) / rowHeight) + overscan
  );

  const virtualRows = useMemo(
    () =>
      rows.slice(startIndex, endIndex).map((row, offset) => ({
        row,
        index: startIndex + offset,
      })),
    [endIndex, rows, startIndex]
  );

  const onScroll = (event: UIEvent<HTMLElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  };

  return {
    containerProps: {
      onScroll,
      style: {
        maxHeight: viewportHeight,
        overflowY: 'auto' as const,
      },
    },
    paddingTop: startIndex * rowHeight,
    paddingBottom: Math.max(0, totalHeight - endIndex * rowHeight),
    virtualRows,
  };
}
