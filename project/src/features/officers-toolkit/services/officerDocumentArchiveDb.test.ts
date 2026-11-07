import { describe, it, expect } from 'vitest';
import type { OfficerDocumentArchiveRecord } from '../types/officerArchiveTypes';
import fs from 'node:fs';
import path from 'node:path';

describe('officer_document_archive SQL Migration', () => {
  const migrationPath = path.resolve(
    __dirname,
    '../../../../../supabase/migrations/20261107120000_create_officer_document_archive.sql'
  );

  it('contains the migration file on disk', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  it('defines all required schema columns and constraints', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    const expectedColumns = [
      'id UUID PRIMARY KEY',
      'user_id UUID NOT NULL',
      'document_name TEXT NOT NULL',
      'document_category TEXT NOT NULL',
      'document_number TEXT',
      'document_date DATE NOT NULL',
      'source_module TEXT NOT NULL',
      'object_key TEXT NOT NULL',
      'file_format TEXT NOT NULL',
      'mime_type TEXT NOT NULL',
      'original_size BIGINT NOT NULL',
      'stored_size BIGINT NOT NULL',
      'compression_status TEXT NOT NULL',
      'content_hash TEXT NOT NULL',
      'upload_status TEXT NOT NULL',
      'version_number INTEGER NOT NULL',
      'parent_document_id UUID',
      'metadata_json JSONB NOT NULL',
      'created_at TIMESTAMPTZ',
      'updated_at TIMESTAMPTZ',
    ];

    expectedColumns.forEach((col) => {
      expect(sql).toContain(col);
    });
  });

  it('configures required performance indexes for user_id, document_category, created_at, and hashes', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    expect(sql).toContain('idx_officer_doc_archive_user');
    expect(sql).toContain('idx_officer_doc_archive_category');
    expect(sql).toContain('idx_officer_doc_archive_created');
    expect(sql).toContain('idx_officer_doc_archive_user_hash');
    expect(sql).toContain('idx_officer_doc_archive_doc_num');
  });

  it('enforces strict Row Level Security (RLS) with portal admin override', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    expect(sql).toContain('ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('Officers can read their own archived documents');
    expect(sql).toContain('Officers can insert their own archived documents');
    expect(sql).toContain('Officers can update their own archived documents');
    expect(sql).toContain('Officers can delete their own archived documents');
    expect(sql).toContain('auth.uid() = user_id OR public.is_portal_admin()');
  });

  it('validates TypeScript interface compatibility', () => {
    const record: OfficerDocumentArchiveRecord = {
      id: '11111111-2222-3333-4444-555555555555',
      user_id: 'user-abc',
      document_name: 'Stop_Sale_Fertilizer_101.pdf',
      document_category: 'order',
      document_number: 'SSO/2026/01',
      document_date: '2026-11-07',
      source_module: 'stop_sale',
      object_key: 'officers/user-abc/11111111/Stop_Sale_Fertilizer_101.pdf',
      file_format: 'pdf',
      mime_type: 'application/pdf',
      original_size: 154200,
      stored_size: 112000,
      compression_status: 'compressed',
      content_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      upload_status: 'saved_to_cloud',
      version_number: 1,
      parent_document_id: null,
      metadata_json: { mandi: 'Tiryani' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    expect(record.file_format).toBe('pdf');
    expect(record.upload_status).toBe('saved_to_cloud');
    expect(record.stored_size).toBeLessThan(record.original_size);
  });
});
