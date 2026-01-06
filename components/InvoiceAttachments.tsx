// components/InvoiceAttachments.tsx
import { useState, useRef, useEffect } from 'react';
import { Upload, X, FileText, Lock, Download } from 'lucide-react';
import { supabase } from "@/lib/supabase";

interface Attachment {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_path: string;
  visibility_type: 'always_viewable' | 'locked_until_paid';
}

interface InvoiceAttachmentsProps {
  invoiceId?: string;
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
}

export function InvoiceAttachments({ invoiceId, attachments, onAttachmentsChange }: InvoiceAttachmentsProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const alwaysViewableInputRef = useRef<HTMLInputElement>(null);
  const lockedInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 100 * 1024 * 1024;

  const alwaysViewableFiles = attachments.filter(a => a.visibility_type === 'always_viewable');
  const lockedFiles = attachments.filter(a => a.visibility_type === 'locked_until_paid');

  function isUuid(id: string | null | undefined): boolean {
    if (!id) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  }

  useEffect(() => {
    if (invoiceId && isUuid(invoiceId)) {
      loadExistingAttachments();
    }
  }, [invoiceId]);

  async function loadExistingAttachments() {
    if (!invoiceId) return;

    try {
      const { data, error } = await supabase
        .from('invoice_attachments')
        .select('*')
        .eq('invoice_id', invoiceId);

      if (error) {
        console.error('Error loading attachments:', error);
        return;
      }

      if (data) {
        onAttachmentsChange(data);
      }
    } catch (error) {
      console.error('Error loading attachments:', error);
    }
  }

  async function handleFileUpload(files: FileList | null, visibilityType: 'always_viewable' | 'locked_until_paid') {
    if (!files || files.length === 0) return;

    setUploadError('');
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'anonymous';

      const newAttachments: Attachment[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.size > MAX_FILE_SIZE) {
          setUploadError(`File "${file.name}" exceeds 100MB limit`);
          continue;
        }

        const fileExt = file.name.split('.').pop() || 'bin';
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const fileName = `${timestamp}-${randomStr}.${fileExt}`;
        const filePath = `${userId}/${invoiceId || 'temp'}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('invoice-attachments')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          setUploadError(`Failed to upload "${file.name}": ${uploadError.message}`);
          continue;
        }

        if (invoiceId) {
          const { data, error: dbError } = await supabase
            .from('invoice_attachments')
            .insert({
              invoice_id: invoiceId,
              file_name: file.name,
              file_path: filePath,
              file_size: file.size,
              file_type: file.type || 'application/octet-stream',
              visibility_type: visibilityType,
              created_by: user?.id || null
            })
            .select()
            .single();

          if (dbError) {
            console.error('Database error:', dbError);
            await supabase.storage.from('invoice-attachments').remove([filePath]);
            setUploadError(`Failed to save "${file.name}": ${dbError.message}`);
            continue;
          }

          newAttachments.push(data);
        } else {
          newAttachments.push({
            id: `temp-${timestamp}-${i}`,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: file.type || 'application/octet-stream',
            visibility_type: visibilityType,
          });
        }
      }

      if (newAttachments.length > 0) {
        onAttachmentsChange([...attachments, ...newAttachments]);
      }
    } catch (error: any) {
      console.error('Error uploading files:', error);
      setUploadError(`An error occurred: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
      if (alwaysViewableInputRef.current) alwaysViewableInputRef.current.value = '';
      if (lockedInputRef.current) lockedInputRef.current.value = '';
    }
  }

  async function handleRemoveFile(attachment: Attachment) {
    if (!confirm(`Are you sure you want to remove "${attachment.file_name}"?`)) {
      return;
    }

    try {
      if (invoiceId && !attachment.id.startsWith('temp-')) {
        const { error: dbError } = await supabase
          .from('invoice_attachments')
          .delete()
          .eq('id', attachment.id);

        if (dbError) {
          console.error('Error deleting from database:', dbError);
          setUploadError(`Failed to delete file: ${dbError.message}`);
          return;
        }
      }

      const { error: storageError } = await supabase.storage
        .from('invoice-attachments')
        .remove([attachment.file_path]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
      }

      onAttachmentsChange(attachments.filter(a => a.id !== attachment.id));
    } catch (error: any) {
      console.error('Error removing file:', error);
      setUploadError(`Error removing file: ${error.message || 'Unknown error'}`);
    }
  }

  async function handleDownloadFile(attachment: Attachment) {
    try {
      const { data, error } = await supabase.storage
        .from('invoice-attachments')
        .download(attachment.file_path);

      if (error) {
        console.error('Download error:', error);
        setUploadError(`Failed to download file: ${error.message}`);
        return;
      }

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading file:', error);
      setUploadError(`Error downloading file: ${error.message || 'Unknown error'}`);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function renderAttachmentList(files: Attachment[], visibilityType: 'always_viewable' | 'locked_until_paid') {
    if (files.length === 0) {
      return (
        <div className="text-center py-8 text-sm text-slate-500">
          No files attached
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-200"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 truncate">
                  {file.file_name}
                </div>
                <div className="text-xs text-slate-500">
                  {formatFileSize(file.file_size)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => handleDownloadFile(file)}
                className="p-1.5 hover:bg-slate-200 rounded transition-colors"
                title="Download file"
              >
                <Download className="w-4 h-4 text-slate-600" />
              </button>
              <button
                type="button"
                onClick={() => handleRemoveFile(file)}
                className="p-1.5 hover:bg-red-100 rounded transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="border-t border-slate-200 pt-6 space-y-8">
      <h2 className="text-lg font-semibold text-slate-900">Attachments</h2>

      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
          {uploadError}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Always Viewable Files</h3>
              <p className="text-xs text-slate-500 mt-0.5">Files that are always accessible to clients</p>
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-lg">
            <input
              ref={alwaysViewableInputRef}
              type="file"
              multiple
              onChange={(e) => handleFileUpload(e.target.files, 'always_viewable')}
              className="hidden"
              id="always-viewable-upload"
              disabled={uploading}
            />

            {alwaysViewableFiles.length === 0 ? (
              <label
                htmlFor="always-viewable-upload"
                className="flex flex-col items-center justify-center py-8 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-sm font-medium text-slate-700">Add an attachment</span>
                <span className="text-xs text-slate-500 mt-1">Max file size: 100MB</span>
              </label>
            ) : (
              <div className="p-4">
                {renderAttachmentList(alwaysViewableFiles, 'always_viewable')}
                <label
                  htmlFor="always-viewable-upload"
                  className="mt-3 flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Add more files
                </label>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-semibold text-slate-900">Locked Until Paid Files</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Files only accessible after invoice is fully paid</p>
            </div>
          </div>

          <div className="border-2 border-dashed border-amber-300 rounded-lg bg-amber-50/30">
            <input
              ref={lockedInputRef}
              type="file"
              multiple
              onChange={(e) => handleFileUpload(e.target.files, 'locked_until_paid')}
              className="hidden"
              id="locked-upload"
              disabled={uploading}
            />

            {lockedFiles.length === 0 ? (
              <label
                htmlFor="locked-upload"
                className="flex flex-col items-center justify-center py-8 cursor-pointer hover:bg-amber-50 transition-colors"
              >
                <Lock className="w-8 h-8 text-amber-500 mb-2" />
                <span className="text-sm font-medium text-slate-700">Add protected attachment</span>
                <span className="text-xs text-slate-500 mt-1">Max file size: 100MB</span>
              </label>
            ) : (
              <div className="p-4">
                {renderAttachmentList(lockedFiles, 'locked_until_paid')}
                <label
                  htmlFor="locked-upload"
                  className="mt-3 flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium text-amber-700 hover:text-amber-800 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Add more files
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {uploading && (
        <div className="text-center text-sm text-slate-600">
          Uploading files...
        </div>
      )}
    </div>
  );
}
