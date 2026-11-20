export type FileCategory = 'all' | 'image' | 'video' | 'audio' | 'document' | 'code' | 'archive' | 'other';

export interface FileItem {
  id: string;
  name: string;
  stored_name: string;
  size: number;
  category: FileCategory;
  extension: string;
  created_at: string;
  starred: boolean;
  folder: string;
}

export interface StorageStats {
  used_bytes: number;
  quota_bytes: number;
  percent: number;
  total_files: number;
  breakdown: Record<string, number>;
}
