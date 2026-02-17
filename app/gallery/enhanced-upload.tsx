'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface FileUpload {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export function EnhancedPhotoUpload({ onUploadComplete }: { onUploadComplete: () => void }) {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    caption: '',
    date: new Date().toISOString().split('T')[0],
  });

  const validateFile = (file: File): string | null => {
    if (file.size > 10 * 1024 * 1024) {
      return 'File size must be less than 10MB';
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      return 'Please upload a valid image file (JPG, PNG, HEIC, WebP, or GIF)';
    }

    return null;
  };

  const handleFileSelect = (selectedFiles: FileList) => {
    const newFiles: FileUpload[] = [];

    Array.from(selectedFiles).forEach((file) => {
      const error = validateFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const fileUpload: FileUpload = {
          id: `${Date.now()}-${Math.random()}`,
          file,
          preview: reader.result as string,
          progress: 0,
          status: error ? 'error' : 'pending',
          error: error || undefined
        };
        newFiles.push(fileUpload);
        
        if (newFiles.length === selectedFiles.length) {
          setFiles(prev => [...prev, ...newFiles]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const uploadFile = async (fileUpload: FileUpload, index: number) => {
    const { file } = fileUpload;

    // Update status to uploading
    setFiles(prev => prev.map(f => 
      f.id === fileUpload.id ? { ...f, status: 'uploading' } : f
    ));

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${timestamp}_${index}_${sanitizedName}`;

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => 
          f.id === fileUpload.id ? { ...f, progress: Math.min(f.progress + 20, 90) } : f
        ));
      }, 200);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('bailey-photos')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);

      if (error) {
        throw new Error(error.message);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('bailey-photos')
        .getPublicUrl(filename);

      // Save to database
      await supabase.from('bailey_photos').insert([{
        url: urlData.publicUrl,
        caption: formData.caption,
        date: formData.date
      }]);

      // Update status to success
      setFiles(prev => prev.map(f => 
        f.id === fileUpload.id ? { ...f, status: 'success', progress: 100 } : f
      ));

    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === fileUpload.id ? { 
          ...f, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Upload failed' 
        } : f
      ));
    }
  };

  const handleUploadAll = async () => {
    setUploading(true);
    
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    // Upload files in parallel (max 3 at a time)
    const batchSize = 3;
    for (let i = 0; i < pendingFiles.length; i += batchSize) {
      const batch = pendingFiles.slice(i, i + batchSize);
      await Promise.all(batch.map((file, index) => uploadFile(file, i + index)));
    }

    setUploading(false);
    
    // If all successful, reset and notify parent
    if (files.every(f => f.status === 'success')) {
      setTimeout(() => {
        setFiles([]);
        setFormData({
          caption: '',
          date: new Date().toISOString().split('T')[0],
        });
        onUploadComplete();
      }, 1000);
    }
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const canUpload = pendingCount > 0 && !uploading;

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div>
        <label className="block text-sm font-medium mb-2">Photos</label>
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-[var(--primary)] bg-[var(--accent)]'
              : 'border-gray-300 hover:border-[var(--primary)]'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/heic,image/heif,image/webp,image/gif"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileSelect(e.target.files);
              }
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="space-y-4">
            <Upload className="w-12 h-12 mx-auto text-gray-400" />
            <div>
              <p className="text-lg font-medium text-gray-700">
                Drop photos here, or click to browse
              </p>
              <p className="text-sm text-gray-500 mt-2">
                You can select multiple photos at once (max 10MB each)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* File Previews */}
      {files.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Selected Photos ({files.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {files.map((file) => (
              <div key={file.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={file.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Status Overlay */}
                  {file.status === 'uploading' && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="mb-2">{file.progress}%</div>
                        <div className="w-20 h-1 bg-white/30 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-white transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {file.status === 'success' && (
                    <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center">
                      <span className="text-white text-lg">✓</span>
                    </div>
                  )}
                  
                  {file.status === 'error' && (
                    <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center p-2">
                      <span className="text-white text-xs text-center">{file.error}</span>
                    </div>
                  )}
                  
                  {/* Remove button */}
                  {file.status === 'pending' && (
                    <button
                      onClick={() => removeFile(file.id)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 mx-auto" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-600 truncate mt-1">
                  {(file.file.size / 1024 / 1024).toFixed(1)}MB
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Common fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Caption (optional)</label>
          <input
            type="text"
            value={formData.caption}
            onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none"
            placeholder="What's happening in these photos?"
          />
          <p className="text-xs text-gray-500 mt-1">
            This caption will be applied to all photos
          </p>
        </div>
      </div>

      {/* Upload button */}
      {canUpload && (
        <button
          onClick={handleUploadAll}
          className="w-full bg-[var(--primary)] text-white px-6 py-3 rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
        >
          Upload {pendingCount} Photo{pendingCount !== 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
}