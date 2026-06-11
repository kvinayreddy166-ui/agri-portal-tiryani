/**
 * DOCX helper utilities using docx library
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

export async function createDocxFromText(text: string, title?: string): Promise<Blob> {
  const paragraphs: Paragraph[] = [];
  
  if (title) {
    paragraphs.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: {
          after: 200,
        },
      })
    );
  }
  
  // Split text into paragraphs
  const textParagraphs = text.split('\n\n');
  
  textParagraphs.forEach((para) => {
    if (para.trim()) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: para.trim(),
              size: 24, // 12pt
            }),
          ],
          spacing: {
            after: 120,
          },
        })
      );
    }
  });
  
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });
  
  return Packer.toBlob(doc);
}

export async function createDocxFromStructuredText(
  text: string,
  metadata?: {
    title?: string;
    author?: string;
    date?: string;
  }
): Promise<Blob> {
  const paragraphs: Paragraph[] = [];
  
  if (metadata?.title) {
    paragraphs.push(
      new Paragraph({
        text: metadata.title,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: {
          after: 200,
        },
      })
    );
  }
  
  if (metadata?.author || metadata?.date) {
    const metaText = [metadata.author, metadata.date].filter(Boolean).join(' | ');
    if (metaText) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: metaText,
              italics: true,
              size: 20, // 10pt
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 300,
          },
        })
      );
    }
  }
  
  // Split text into paragraphs and preserve structure
  const lines = text.split('\n');
  let currentParagraph = '';
  
  lines.forEach((line) => {
    if (line.trim() === '') {
      if (currentParagraph.trim()) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: currentParagraph.trim(),
                size: 24, // 12pt
              }),
            ],
            spacing: {
              after: 120,
            },
          })
        );
        currentParagraph = '';
      }
    } else {
      currentParagraph += line + ' ';
    }
  });
  
  // Add remaining paragraph
  if (currentParagraph.trim()) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: currentParagraph.trim(),
            size: 24, // 12pt
          }),
        ],
        spacing: {
          after: 120,
        },
      })
    );
  }
  
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });
  
  return Packer.toBlob(doc);
}

export function downloadDocx(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
