import { supabase } from '../lib/supabaseClient';
import { ExcelUpload } from '../types/database';

export interface AdminUploadResult {
  success: boolean;
  message: string;
  upload?: ExcelUpload;
}

/**
 * Admin-only file upload service with validation
 */
export const adminUploadService = {
  /**
   * Upload file to Supabase storage (admin only)
   */
  uploadFile: async (
    file: File,
    adminEmail: string | undefined,
    uploadType: 'data' | 'report' = 'data'
  ): Promise<AdminUploadResult> => {
    // Verify admin access
    const isAdminRes = await supabase.auth.getSession();
    const userEmail = isAdminRes.data.session?.user?.email;

    if (userEmail?.toLowerCase() !== 'k.vinayreddy166@gmail.com') {
      return {
        success: false,
        message: 'Unauthorized: Only admins can upload files',
      };
    }

    // Validate file
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.xlsx', '.xls', '.csv'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedExtensions.includes(fileExt)) {
      return {
        success: false,
        message: `Invalid file type. Allowed: ${allowedExtensions.join(', ')}`,
      };
    }

    if (file.size > 50 * 1024 * 1024) {
      // 50MB limit
      return {
        success: false,
        message: 'File size exceeds 50MB limit',
      };
    }

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${timestamp}_${cleanName}`;
      const filePath = `office-files/${uploadType}/${fileName}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      // Save metadata to database
      const { data: dbData, error: dbError } = await supabase
        .from('excel_uploads')
        .insert([
          {
            file_name: file.name,
            file_url: publicUrl,
            upload_type: uploadType,
            created_by: userEmail,
          },
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      return {
        success: true,
        message: 'File uploaded successfully',
        upload: dbData,
      };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },

  /**
   * Batch upload multiple files
   */
  uploadBatch: async (
    files: File[],
    adminEmail: string | undefined,
    uploadType: 'data' | 'report' = 'data'
  ): Promise<AdminUploadResult[]> => {
    return Promise.all(
      files.map((file) => adminUploadService.uploadFile(file, adminEmail, uploadType))
    );
  },

  /**
   * Delete file (admin only)
   */
  deleteFile: async (fileId: string, adminEmail: string | undefined): Promise<AdminUploadResult> => {
    const isAdminRes = await supabase.auth.getSession();
    const userEmail = isAdminRes.data.session?.user?.email;

    if (userEmail?.toLowerCase() !== 'k.vinayreddy166@gmail.com') {
      return {
        success: false,
        message: 'Unauthorized: Only admins can delete files',
      };
    }

    try {
      // Get file info
      const { data: fileData, error: fetchError } = await supabase
        .from('excel_uploads')
        .select('file_url')
        .eq('id', fileId)
        .single();

      if (fetchError) throw fetchError;

      // Extract path from URL
      const url = new URL(fileData.file_url);
      const filePath = url.pathname.split('/storage/v1/object/public/uploads/')[1];

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('uploads')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('excel_uploads')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      return {
        success: true,
        message: 'File deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: `Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
};
