import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Cloud,
  HardDrive,
  Upload,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Code2,
  Archive,
  Star,
  Download,
  Trash2,
  Eye,
  Search,
  Folder,
  LayoutGrid,
  List as ListIcon,
  Sun,
  Moon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileQuestion,
  Share2,
  X,
  Server
} from 'lucide-react';
import type { FileItem, FileCategory, StorageStats } from './types';

export default function App() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [activeCategory, setActiveCategory] = useState<FileCategory>('all');
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [onlyStarred, setOnlyStarred] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [serverOnline, setServerOnline] = useState<boolean>(false);

  // Yuklash holati
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadFolder, setUploadFolder] = useState<string>('Bosh sahifa');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview modal
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const isDark = theme === 'dark';

  const API_URL = '/api';

  // Server holatini tekshirish
  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_URL}/health`);
      if (res.ok) {
        setServerOnline(true);
      } else {
        setServerOnline(false);
      }
    } catch {
      setServerOnline(false);
    }
  };

  // Fayllarni yuklab olish
  const fetchFiles = async () => {
    try {
      const res = await fetch(`${API_URL}/files`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
    } catch (e) {
      console.error('Fayllarni yuklashda xatolik:', e);
    }
  };

  // Xotira statistikasini olish
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/storage/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Statistika olishda xatolik:', e);
    }
  };

  useEffect(() => {
    checkHealth();
    fetchFiles();
    fetchStats();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  // Format bytes to human readable
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Fayl yuklash (Upload)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(25);

    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append('files', selectedFiles[i]);
    }
    formData.append('folder', uploadFolder);

    try {
      setUploadProgress(65);
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setUploadProgress(100);
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        await fetchFiles();
        await fetchStats();
      }
    } catch (err) {
      console.error('Yuklashda xato:', err);
      alert('Fayl yuklashda xatolik yuz berdi. Backend server ishlab turganini tekshiring!');
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 800);
    }
  };

  // Yulduzcha (Star) almashtirish
  const handleToggleStar = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_URL}/files/${id}/star`, { method: 'PATCH' });
      if (res.ok) {
        setFiles(prev =>
          prev.map(f => (f.id === id ? { ...f, starred: !f.starred } : f))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // O'chirish (Delete)
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Ushbu faylni butunlay o\'chirmoqchimisiz?')) return;

    try {
      const res = await fetch(`${API_URL}/files/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFiles(prev => prev.filter(f => f.id !== id));
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Yuklab olish (Download)
  const handleDownload = (file: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`${API_URL}/files/${file.id}/download`, '_blank');
  };

  // Ikonka aniqlash
  const getFileIcon = (cat: FileCategory) => {
    switch (cat) {
      case 'image': return <ImageIcon className="w-5 h-5 text-emerald-500" />;
      case 'video': return <Video className="w-5 h-5 text-purple-500" />;
      case 'audio': return <Music className="w-5 h-5 text-pink-500" />;
      case 'document': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'code': return <Code2 className="w-5 h-5 text-amber-500" />;
      case 'archive': return <Archive className="w-5 h-5 text-orange-500" />;
      default: return <FileQuestion className="w-5 h-5 text-slate-400" />;
    }
  };

  // Filtrlangan fayllar
  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      const matchCat = activeCategory === 'all' || f.category === activeCategory;
      const matchFolder = activeFolder === 'all' || f.folder === activeFolder;
      const matchStar = !onlyStarred || f.starred;
      const matchSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.folder.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchFolder && matchStar && matchSearch;
    });
  }, [files, activeCategory, activeFolder, onlyStarred, searchQuery]);

  const foldersList = ['Bosh sahifa', 'Hujjatlar', 'Dizayn', 'Dasturlash', 'Media', 'Shaxsiy'];

  const themeClasses = {
    appBg: isDark ? 'bg-[#0b0f17] text-slate-100' : 'bg-[#f8fafc] text-slate-900',
    headerBg: isDark ? 'bg-[#0b0f17]/90 border-slate-800' : 'bg-white/90 border-slate-200/80 shadow-xs',
    sidebarBg: isDark ? 'bg-[#121826] border-slate-800' : 'bg-white border-slate-200',
    card: isDark ? 'bg-[#161f30] border-slate-800 text-white hover:border-sky-500/40' : 'bg-white border-slate-200 text-slate-800 hover:border-sky-400 shadow-xs hover:shadow-md',
    input: isDark ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 shadow-xs',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    modalBg: isDark ? 'bg-[#121826] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-2xl',
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${themeClasses.appBg}`}>

      {/* TOP HEADER */}
      <header className={`sticky top-0 z-30 backdrop-blur-md border-b px-4 lg:px-8 py-3.5 transition-colors ${themeClasses.headerBg}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

          {/* Logo & Server status */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-sky-500 to-indigo-600 bg-clip-text text-transparent">
                  CloudVault
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 border border-sky-500/20 uppercase">
                  Drive Pro
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <Server className="w-3 h-3 text-slate-400" />
                <span className={themeClasses.textMuted}>FastAPI Python Backend:</span>
                <span className={`font-bold flex items-center gap-1 ${serverOnline ? 'text-emerald-500' : 'text-rose-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${serverOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  {serverOnline ? 'Ishlamoqda (Port 8000)' : 'Oflayn'}
                </span>
              </div>
            </div>
          </div>

          {/* Qidiruv */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Fayllar yoki papkalarni qidirish..."
                className={`w-full py-2 pl-10 pr-4 text-xs rounded-xl outline-none border transition-all ${themeClasses.input}`}
              />
            </div>
          </div>

          {/* Actions: Yuklash, Tema, ViewMode */}
          <div className="flex items-center gap-2.5">
            {/* Yashirin fayl tanlagich */}
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-sky-500/25 transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
            >
              <Upload className="w-4 h-4" />
              <span>{isUploading ? 'Yuklanmoqda...' : 'Fayl Yuklash'}</span>
            </button>

            {/* Tema almashtirish */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`p-2 rounded-xl border transition-all ${
                isDark ? 'bg-slate-900 border-slate-800 text-amber-400' : 'bg-white border-slate-200 text-slate-700 shadow-xs'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* YUKLASH JARAYONI (PROGRESS BAR) */}
      {isUploading && (
        <div className="w-full bg-sky-500/10 border-b border-sky-500/20 py-2 px-4 text-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <span className="font-bold text-sky-600 flex items-center gap-2">
              <Upload className="w-4 h-4 animate-bounce" />
              Fayllar diskka saqlanmoqda...
            </span>
            <div className="w-48 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-sky-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ASOSIY QISM: SIDEBAR VA FAYLLAR */}
      <div className="max-w-7xl mx-auto w-full flex-1 px-4 lg:px-8 py-6 flex flex-col md:flex-row gap-6">

        {/* SIDEBAR: Xotira kvotasi & Filtrlash */}
        <aside className="w-full md:w-64 shrink-0 space-y-6">

          {/* Xotira kartasi */}
          <div className={`${themeClasses.card} rounded-3xl p-5 border`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-sky-500" />
                <h3 className="font-extrabold text-sm">Bulut Xotirasi</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600">
                15 GB
              </span>
            </div>

            <div className="mb-2">
              <div className="flex justify-between text-xs mb-1.5 font-semibold">
                <span className={themeClasses.textMuted}>Ishlatilgan:</span>
                <span className="font-bold">{stats ? formatBytes(stats.used_bytes) : '0 B'}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sky-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats ? Math.min(stats.percent, 100) : 2}%` }}
                />
              </div>
            </div>

            <p className={`text-[11px] ${themeClasses.textMuted} mb-4`}>
              Jami <b>{stats ? stats.total_files : 0}</b> ta fayl saqlanmoqda
            </p>

            {/* Qaysi papkaga yuklash */}
            <div className="pt-3 border-t border-inherit">
              <label className={`block text-[11px] font-semibold mb-1 ${themeClasses.textMuted}`}>
                Yuklash papkasini tanlang:
              </label>
              <select
                value={uploadFolder}
                onChange={(e) => setUploadFolder(e.target.value)}
                className={`w-full text-xs font-semibold rounded-xl p-2 border outline-none ${themeClasses.input}`}
              >
                {foldersList.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Kategoriyalar bo'yicha filter */}
          <div className={`${themeClasses.card} rounded-3xl p-4 border space-y-1 text-xs font-semibold`}>
            {[
              { id: 'all', label: 'Barcha Fayllar', icon: Folder },
              { id: 'document', label: 'Hujjatlar (PDF, Word)', icon: FileText },
              { id: 'image', label: 'Rasmlar (PNG, JPG)', icon: ImageIcon },
              { id: 'video', label: 'Videolar (MP4, MKV)', icon: Video },
              { id: 'audio', label: 'Audolar (MP3, WAV)', icon: Music },
              { id: 'code', label: 'Dasturlash Kodi', icon: Code2 },
              { id: 'archive', label: 'Arxivlar (ZIP, RAR)', icon: Archive },
            ].map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id && !onlyStarred;

              return (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id as FileCategory); setOnlyStarred(false); }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-sky-500 text-white shadow-sm'
                      : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{cat.label}</span>
                  </div>
                </button>
              );
            })}

            {/* Sevimlilar */}
            <button
              onClick={() => setOnlyStarred(!onlyStarred)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all border-t border-inherit mt-2 ${
                onlyStarred
                  ? 'bg-amber-500 text-white shadow-sm'
                  : isDark ? 'text-amber-400 hover:bg-slate-800' : 'text-amber-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4 fill-current" />
                <span>Tanlanganlar (Starred)</span>
              </div>
            </button>
          </div>
        </aside>

        {/* ASOSIY MAYDON: PAPKALAR VA FAYLLAR */}
        <main className="flex-1 space-y-6">

          {/* Papkalar ro'yxati (Horizontal) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setActiveFolder('all')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                activeFolder === 'all'
                  ? 'bg-sky-500 text-white border-sky-400 shadow-sm'
                  : isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              Barcha Papkalar
            </button>

            {foldersList.map(folder => (
              <button
                key={folder}
                onClick={() => setActiveFolder(folder)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                  activeFolder === folder
                    ? 'bg-sky-500 text-white border-sky-400 shadow-sm'
                    : isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <Folder className="w-3.5 h-3.5 text-sky-400" />
                <span>{folder}</span>
              </button>
            ))}
          </div>

          {/* Yuqori boshqaruv: Fayllar soni va Ko'rinish almashtirish */}
          <div className="flex items-center justify-between text-xs">
            <p className={`font-bold ${themeClasses.textMuted}`}>
              Fayllar soni: <span className="text-sky-600 font-extrabold">{filteredFiles.length} ta</span>
            </p>

            <div className={`flex p-1 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-sky-500 text-white' : 'text-slate-400'}`}
                title="Katakchalar (Grid)"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-sky-500 text-white' : 'text-slate-400'}`}
                title="Ro'yxat (List)"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* FAYLLAR RO'YXATI (GRID VIEW) */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFiles.length === 0 ? (
                <div className="col-span-full py-20 text-center text-slate-400">
                  <Cloud className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-semibold">Bu yerda hech qanday fayl topilmadi.</p>
                  <p className="text-xs text-slate-500 mt-1">Yuqoridagi "Fayl Yuklash" orqali yangi fayllarni qo'shing!</p>
                </div>
              ) : (
                filteredFiles.map(file => (
                  <div
                    key={file.id}
                    onClick={() => setPreviewFile(file)}
                    className={`file-card ${themeClasses.card} rounded-3xl p-5 border flex flex-col justify-between cursor-pointer group`}
                  >
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/20">
                          {getFileIcon(file.category)}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleToggleStar(file.id, e)}
                            className="p-1 text-slate-400 hover:text-amber-400 transition-colors"
                          >
                            <Star className={`w-4 h-4 ${file.starred ? 'text-amber-400 fill-amber-400' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => handleDelete(file.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-bold text-sm truncate mb-1 group-hover:text-sky-600 transition-colors" title={file.name}>
                        {file.name}
                      </h4>
                      <p className={`text-[11px] ${themeClasses.textMuted} mb-3`}>
                        {file.folder} • {file.created_at}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-inherit flex items-center justify-between text-xs">
                      <span className="font-extrabold text-sky-600">
                        {formatBytes(file.size)}
                      </span>

                      <button
                        onClick={(e) => handleDownload(file, e)}
                        className="p-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500 hover:text-white text-sky-600 transition-all"
                        title="Yuklab olish"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* FAYLLAR RO'YXATI (LIST VIEW) */}
          {viewMode === 'list' && (
            <div className={`${themeClasses.card} rounded-3xl border overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className={`uppercase text-[10px] tracking-wider border-b ${isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600 font-bold'}`}>
                    <tr>
                      <th className="py-3 px-4">Fayl Nomi</th>
                      <th className="py-3 px-4">Papka</th>
                      <th className="py-3 px-4">Hajmi</th>
                      <th className="py-3 px-4">Yuklangan sana</th>
                      <th className="py-3 px-4 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-inherit">
                    {filteredFiles.map(file => (
                      <tr
                        key={file.id}
                        onClick={() => setPreviewFile(file)}
                        className="hover:bg-sky-500/5 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-bold flex items-center gap-3">
                          {getFileIcon(file.category)}
                          <span className="truncate max-w-xs">{file.name}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{file.folder}</td>
                        <td className="py-3 px-4 font-bold text-sky-600">{formatBytes(file.size)}</td>
                        <td className="py-3 px-4 text-slate-400 text-xs">{file.created_at}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => handleToggleStar(file.id, e)}
                              className="p-1.5 text-slate-400 hover:text-amber-400"
                            >
                              <Star className={`w-4 h-4 ${file.starred ? 'text-amber-400 fill-amber-400' : ''}`} />
                            </button>
                            <button
                              onClick={(e) => handleDownload(file, e)}
                              className="p-1.5 text-slate-400 hover:text-sky-500"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleDelete(file.id, e)}
                              className="p-1.5 text-slate-400 hover:text-rose-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* PREVIEW MODAL */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewFile(null)}>
          <div
            className={`${themeClasses.modalBg} rounded-3xl max-w-xl w-full p-6 sm:p-8 relative border`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewFile(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/40"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-500">
                {getFileIcon(previewFile.category)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-base truncate">{previewFile.name}</h3>
                <p className={`text-xs ${themeClasses.textMuted}`}>{previewFile.folder} • {formatBytes(previewFile.size)}</p>
              </div>
            </div>

            {/* Preview ko'rinishi */}
            <div className="rounded-2xl bg-slate-900/60 p-6 my-4 border border-slate-800 text-center">
              {previewFile.category === 'image' ? (
                <div className="space-y-3">
                  <p className="text-xs text-emerald-400 font-bold">Rasm fayli diskda saqlangan</p>
                  <div className="text-xs text-slate-400">Haqiqiy server manzili: <code>/api/files/{previewFile.id}/preview</code></div>
                </div>
              ) : (
                <div className="space-y-2 text-slate-400 text-xs">
                  <FileText className="w-12 h-12 mx-auto text-sky-500 mb-2 opacity-80" />
                  <p className="font-bold text-white text-sm">{previewFile.name}</p>
                  <p>Hajmi: {formatBytes(previewFile.size)}</p>
                  <p>Kategoriya: <b className="uppercase text-sky-400">{previewFile.category}</b></p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={(e) => handleDownload(previewFile, e)}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-500/25"
              >
                <Download className="w-4 h-4" />
                <span>Kompyuterga Yuklab Olish</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className={`border-t py-8 px-4 lg:px-8 text-xs transition-colors ${themeClasses.headerBg}`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-sky-500" />
            <span className="font-extrabold tracking-wider">CLOUDVAULT STORAGE</span>
            <span>• Full-Stack Python FastAPI + React TSX © 2026</span>
          </div>
          <div className={`flex items-center gap-6 ${themeClasses.textMuted}`}>
            <span>Xavfsiz Fayl Saqlash</span>
            <span>REST API</span>
            <span>Avtomatik Zaxira</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
