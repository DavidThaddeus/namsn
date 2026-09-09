'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  ArrowLeft,
  FileText,
  Folder,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  createMaterial,
  deleteMaterial,
  getAllMaterials,
  getMaterialsByFolder,
  updateMaterial,
} from '@/lib/supabase/materialService';
import {
  createFolder,
  deleteFolder,
  getFoldersByLevel,
} from '@/lib/supabase/materialFolderService';
import { Material, MaterialLevel, MaterialType } from '@/types/material';
import { MaterialFolder } from '@/types/materialFolder';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';

const LEVELS: MaterialLevel[] = ['100', '200', '300', '400'];

type PendingFile = { id: string; file: File; title: string };

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);

export default function AdminMaterialsPage() {
  const { currentUser } = useAuth();

  const [level, setLevel] = useState<MaterialLevel | null>(null);
  const [folders, setFolders] = useState<MaterialFolder[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderType, setNewFolderType] = useState<MaterialType>('material');
  const [creatingFolder, setCreatingFolder] = useState(false);

  const [selectedFolder, setSelectedFolder] = useState<MaterialFolder | null>(null);
  const [folderMaterials, setFolderMaterials] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [orphanedMaterials, setOrphanedMaterials] = useState<Material[]>([]);
  const [migrating, setMigrating] = useState(false);
  const [folderDeleteTarget, setFolderDeleteTarget] = useState<MaterialFolder | null>(null);
  const [materialDeleteTarget, setMaterialDeleteTarget] = useState<Material | null>(null);
  const [deletingFolder, setDeletingFolder] = useState(false);
  const [deletingMaterial, setDeletingMaterial] = useState(false);

  const loadFolders = (lvl: MaterialLevel) => {
    setLoadingFolders(true);
    getFoldersByLevel(lvl)
      .then(setFolders)
      .catch((err) => {
        console.error('Error loading folders:', err);
        toast.error('Failed to load folders');
      })
      .finally(() => setLoadingFolders(false));
  };

  // Materials uploaded before folders existed have no folderId, so they
  // never show up under any folder here — surface them so they can be
  // organized instead of silently disappearing.
  const checkOrphans = (lvl: MaterialLevel) => {
    getAllMaterials()
      .then((all) => setOrphanedMaterials(all.filter((m) => m.level === lvl && !m.folderId)))
      .catch((err) => console.error('Error checking for orphaned materials:', err));
  };

  useEffect(() => {
    if (level) {
      loadFolders(level);
      checkOrphans(level);
    }
  }, [level]);

  const handleImportOrphans = async () => {
    if (!currentUser || !level || orphanedMaterials.length === 0) return;
    setMigrating(true);
    try {
      const groups = new Map<string, Material[]>();
      for (const material of orphanedMaterials) {
        const key = material.courseCode || material.courseName || 'Uncategorized';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(material);
      }

      for (const [name, items] of groups) {
        const type: MaterialType = items[0].type === 'past_question' || name.toLowerCase().includes('past question')
          ? 'past_question'
          : 'material';
        const folderId = await createFolder({ name, level, type }, currentUser.uid);
        for (const item of items) {
          await updateMaterial(item.id, { folderId });
        }
      }

      toast.success(`Organized ${orphanedMaterials.length} existing file(s) into ${groups.size} folder(s)`);
      setOrphanedMaterials([]);
      loadFolders(level);
    } catch (error) {
      console.error('Error importing orphaned materials:', error);
      toast.error('Failed to organize existing materials');
    } finally {
      setMigrating(false);
    }
  };

  const loadFolderMaterials = (folderId: string) => {
    setLoadingMaterials(true);
    getMaterialsByFolder(folderId)
      .then(setFolderMaterials)
      .catch((err) => {
        console.error('Error loading materials:', err);
        toast.error('Failed to load materials');
      })
      .finally(() => setLoadingMaterials(false));
  };

  const openFolder = (folder: MaterialFolder) => {
    setSelectedFolder(folder);
    loadFolderMaterials(folder.id);
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !level) return;
    const name = newFolderType === 'past_question' ? 'Past Questions' : newFolderName.trim();
    if (!name) {
      toast.error('Please enter a course name');
      return;
    }

    setCreatingFolder(true);
    try {
      await createFolder({ name, level, type: newFolderType }, currentUser.uid);
      toast.success('Folder created');
      setNewFolderName('');
      setShowNewFolder(false);
      loadFolders(level);
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
    } finally {
      setCreatingFolder(false);
    }
  };

  const confirmDeleteFolder = async () => {
    if (!folderDeleteTarget) return;
    setDeletingFolder(true);
    try {
      await deleteFolder(folderDeleteTarget.id);
      toast.success('Folder deleted');
      setFolderDeleteTarget(null);
      if (level) {
        loadFolders(level);
        checkOrphans(level);
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error('Failed to delete folder');
    } finally {
      setDeletingFolder(false);
    }
  };

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList) return;
    const newPending: PendingFile[] = Array.from(fileList).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      title: file.name,
    }));
    setPendingFiles((prev) => [...prev, ...newPending]);
  };

  const removePendingFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUploadAll = async () => {
    if (!currentUser || !selectedFolder || pendingFiles.length === 0) return;

    setUploading(true);
    const toastId = toast.loading(`Uploading ${pendingFiles.length} file(s)...`);
    try {
      for (const pending of pendingFiles) {
        const objectName = `${Date.now()}-${pending.file.name}`;
        const { error: uploadError } = await withTimeout(
          supabase.storage.from('materials').upload(objectName, pending.file),
          30000
        );
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('materials').getPublicUrl(objectName);
        const fileUrl = publicUrlData.publicUrl;
        const fileType = pending.file.name.split('.').pop()?.toUpperCase() || 'FILE';

        await createMaterial(
          {
            title: pending.title || pending.file.name,
            courseCode: selectedFolder.name,
            courseName: selectedFolder.name,
            fileUrl,
            fileType,
            fileSize: formatFileSize(pending.file.size),
            level: selectedFolder.level,
            type: selectedFolder.type,
            folderId: selectedFolder.id,
          },
          currentUser.uid,
          currentUser.displayName || 'Admin'
        );
      }

      toast.success('Uploaded!', { id: toastId });
      setPendingFiles([]);
      loadFolderMaterials(selectedFolder.id);
    } catch (error) {
      const err = error as { message?: string };
      console.error('Error uploading materials:', error);
      if (err.message === 'timeout') {
        toast.error('Upload timed out. Check your Supabase Storage setup.', { id: toastId, duration: 6000 });
      } else {
        toast.error('Failed to upload. Please try again.', { id: toastId });
      }
    } finally {
      setUploading(false);
    }
  };

  const startEditTitle = (material: Material) => {
    setEditingMaterialId(material.id);
    setEditingTitle(material.title);
  };

  const saveEditTitle = async (materialId: string) => {
    try {
      await updateMaterial(materialId, { title: editingTitle });
      toast.success('Renamed');
      setEditingMaterialId(null);
      if (selectedFolder) loadFolderMaterials(selectedFolder.id);
    } catch (error) {
      console.error('Error renaming material:', error);
      toast.error('Failed to rename');
    }
  };

  const confirmDeleteMaterial = async () => {
    if (!materialDeleteTarget) return;
    setDeletingMaterial(true);
    try {
      await deleteMaterial(materialDeleteTarget.id);
      toast.success('Deleted');
      setMaterialDeleteTarget(null);
      if (selectedFolder) loadFolderMaterials(selectedFolder.id);
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Failed to delete');
    } finally {
      setDeletingMaterial(false);
    }
  };

  // ---- Step 3: inside a folder ----
  if (selectedFolder) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => {
            setSelectedFolder(null);
            setPendingFiles([]);
          }}
          className="flex items-center gap-1 text-sm font-medium text-secondary hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to folders
        </button>

        <div className="flex flex-wrap items-center gap-3 border-b border-border pb-5">
          <h1 className="font-display text-2xl font-bold text-foreground">{selectedFolder.name}</h1>
          <Badge variant="outline">{selectedFolder.level} Level</Badge>
          {selectedFolder.type === 'past_question' && <Badge variant="secondary">Past Questions</Badge>}
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-foreground">Upload Files</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select one or more files. You can edit each name before uploading.
          </p>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 flex w-full items-center justify-center gap-2 border border-dashed border-border/40 px-4 py-6 text-sm text-muted-foreground hover:bg-muted/40"
          >
            <Upload className="h-4 w-4" /> Choose files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFilesSelected(e.target.files);
              e.target.value = '';
            }}
          />

          {pendingFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              {pendingFiles.map((pending) => (
                <div key={pending.id} className="flex items-center gap-2 border border-border bg-muted/30 p-3">
                  <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <Input
                    value={pending.title}
                    onChange={(e) =>
                      setPendingFiles((prev) =>
                        prev.map((p) => (p.id === pending.id ? { ...p, title: e.target.value } : p))
                      )
                    }
                    className="flex-1"
                  />
                  <span className="flex-shrink-0 text-xs text-muted-foreground">
                    {formatFileSize(pending.file.size)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removePendingFile(pending.id)}
                    className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <Button
                onClick={handleUploadAll}
                disabled={uploading}
                className="mt-2 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                Upload {pendingFiles.length} File{pendingFiles.length > 1 ? 's' : ''}
              </Button>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-6 py-5">
            <h2 className="font-display text-lg font-semibold text-foreground">Files in this folder</h2>
          </div>
          {loadingMaterials ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : folderMaterials.length === 0 ? (
            <div className="px-6 py-12 text-center text-muted-foreground">No files uploaded yet.</div>
          ) : (
            <ul className="divide-y divide-border">
              {folderMaterials.map((material) => (
                <li key={material.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <FileText className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    {editingMaterialId === material.id ? (
                      <Input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="flex-1"
                        autoFocus
                      />
                    ) : (
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{material.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {material.fileType} · {material.fileSize} ·{' '}
                          {material.uploadedAt && 'toDate' in material.uploadedAt
                            ? format(material.uploadedAt.toDate(), 'MMM d, yyyy')
                            : format(new Date(material.uploadedAt as Date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-shrink-0 gap-2">
                    {editingMaterialId === material.id ? (
                      <Button variant="outline" size="sm" onClick={() => saveEditTitle(material.id)}>
                        Save
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => startEditTitle(material)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMaterialDeleteTarget(material)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <ConfirmDialog
          open={!!materialDeleteTarget}
          title={`Delete "${materialDeleteTarget?.title}"?`}
          description="This cannot be undone."
          loading={deletingMaterial}
          onConfirm={confirmDeleteMaterial}
          onCancel={() => setMaterialDeleteTarget(null)}
        />
      </div>
    );
  }

  // ---- Step 2: folders for the selected level ----
  if (level) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => setLevel(null)}
          className="flex items-center gap-1 text-sm font-medium text-secondary hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to levels
        </button>

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
          <h1 className="font-display text-2xl font-bold text-foreground">{level} Level Materials</h1>
          <Button onClick={() => setShowNewFolder((v) => !v)} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="h-4 w-4" /> New Folder
          </Button>
        </div>

        {orphanedMaterials.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border border-dashed border-secondary/40 bg-secondary/5 p-4">
            <p className="text-sm text-foreground">
              Found {orphanedMaterials.length} existing {level} Level file(s) uploaded before folders existed —
              they won&apos;t show up in any folder until organized.
            </p>
            <Button variant="outline" onClick={handleImportOrphans} disabled={migrating}>
              {migrating && <Loader2 className="h-4 w-4 animate-spin" />}
              Import into Folders
            </Button>
          </div>
        )}

        {showNewFolder && (
          <form onSubmit={handleCreateFolder} className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="folderType">Folder Type</Label>
                <Select value={newFolderType} onValueChange={(v) => setNewFolderType(v as MaterialType)}>
                  <SelectTrigger id="folderType" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="material">Course</SelectItem>
                    <SelectItem value="past_question">Past Questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newFolderType === 'material' && (
                <div className="space-y-2">
                  <Label htmlFor="folderName">Course Name</Label>
                  <Input
                    id="folderName"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="e.g. Linear Algebra"
                    required
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={creatingFolder} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {creatingFolder && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Folder
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowNewFolder(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {loadingFolders ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : folders.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-6 py-12 text-center text-muted-foreground shadow-sm">
            No folders yet for {level} Level. Create one to start uploading materials.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {folders.map((folder) => (
              <div key={folder.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <button
                  type="button"
                  onClick={() => openFolder(folder)}
                  className="flex w-full flex-col items-start gap-3 text-left"
                >
                  <div className="flex h-11 w-11 items-center justify-center bg-primary text-primary-foreground">
                    <Folder className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{folder.name}</p>
                    {folder.type === 'past_question' && (
                      <Badge variant="secondary" className="mt-1">Past Questions</Badge>
                    )}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFolderDeleteTarget(folder)}
                  className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" /> Delete folder
                </button>
              </div>
            ))}
          </div>
        )}

        <ConfirmDialog
          open={!!folderDeleteTarget}
          title={`Delete "${folderDeleteTarget?.name}"?`}
          description="Any materials inside will be orphaned, not deleted — you can re-import them later."
          loading={deletingFolder}
          onConfirm={confirmDeleteFolder}
          onCancel={() => setFolderDeleteTarget(null)}
        />
      </div>
    );
  }

  // ---- Step 1: choose a level ----
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="font-display text-2xl font-bold text-foreground">Materials</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Select a level to manage its course folders and past questions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {LEVELS.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLevel(l)}
            className={cn(
              'flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md'
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center bg-primary text-primary-foreground">
              <Folder className="h-6 w-6" />
            </div>
            <span className="font-display text-lg font-semibold text-foreground">{l} Level</span>
          </button>
        ))}
      </div>
    </div>
  );
}
