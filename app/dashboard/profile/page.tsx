'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Camera, CheckCircle, Loader2, Pencil, User as UserIcon, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getProfile, updateProfile, uploadProfilePhoto } from '@/lib/supabase/profileService';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    matricNumber: '',
    department: 'Mathematics',
    level: '100',
    phone: '',
    address: '',
    photoURL: '',
  });
  const [tempProfile, setTempProfile] = useState({ ...profile });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const data = await getProfile(currentUser.uid);
        if (data) {
          const loadedProfile = {
            firstName: data.firstName,
            lastName: data.lastName,
            email: currentUser.email || data.email,
            matricNumber: data.matricNumber,
            department: data.department || 'Mathematics',
            level: data.level || '100',
            phone: data.phone,
            address: data.address,
            photoURL: data.photoURL,
          };
          setProfile(loadedProfile);
          setTempProfile(loadedProfile);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser]);

  const handleEdit = () => {
    setTempProfile({ ...profile });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!currentUser) {
      toast.error('You must be logged in to update your profile');
      return;
    }

    setSaving(true);
    try {
      await updateProfile(currentUser.uid, {
        firstName: tempProfile.firstName,
        lastName: tempProfile.lastName,
        matricNumber: tempProfile.matricNumber,
        department: tempProfile.department,
        level: tempProfile.level,
        phone: tempProfile.phone,
        address: tempProfile.address,
      });

      setProfile({ ...tempProfile });
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTempProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !currentUser) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    if (file.size > MAX_PHOTO_SIZE) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setUploadingPhoto(true);
    const toastId = toast.loading('Uploading photo...');

    try {
      const photoURL = await uploadProfilePhoto(currentUser.uid, file);
      await updateProfile(currentUser.uid, { photoURL });

      setProfile((prev) => ({ ...prev, photoURL }));
      setTempProfile((prev) => ({ ...prev, photoURL }));
      toast.success('Profile photo updated!', { id: toastId });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo. Please try again.', { id: toastId });
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your personal information and account settings.
          </p>
        </div>
        {!isEditing ? (
          <Button variant="outline" onClick={handleEdit}>
            <Pencil className="h-4 w-4" /> Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              <XCircle className="h-4 w-4" /> Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-5">
          <h2 className="font-display text-base font-semibold text-foreground">Personal Information</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your personal details and information.</p>
        </div>
        <dl className="divide-y divide-border">
          <div className="grid grid-cols-1 gap-1 px-6 py-5 sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-muted-foreground">Profile Photo</dt>
            <dd className="sm:col-span-2">
              <div className="relative h-16 w-16">
                {profile.photoURL ? (
                  <Image
                    src={profile.photoURL}
                    alt="Profile"
                    fill
                    className="rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                    <UserIcon className="h-8 w-8" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  title="Change profile photo"
                  aria-label="Change profile photo"
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-muted disabled:opacity-50"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  ) : (
                    <Camera className="h-3.5 w-3.5 text-secondary" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
            </dd>
          </div>

          {isEditing ? (
            <div className="grid grid-cols-1 gap-1 px-6 py-5 sm:grid-cols-3 sm:gap-4">
              <dt className="pt-2 text-sm font-medium text-muted-foreground">Full name</dt>
              <dd className="sm:col-span-2">
                <div className="flex gap-4">
                  <Input name="firstName" value={tempProfile.firstName} onChange={handleChange} placeholder="First name" />
                  <Input name="lastName" value={tempProfile.lastName} onChange={handleChange} placeholder="Last name" />
                </div>
              </dd>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-1 px-6 py-5 sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-muted-foreground">Full name</dt>
              <dd className="text-sm text-foreground sm:col-span-2">
                {`${profile.firstName} ${profile.lastName}`.trim() || 'Not set'}
              </dd>
            </div>
          )}

          <div className="grid grid-cols-1 gap-1 px-6 py-5 sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-muted-foreground">Email address</dt>
            <dd className="break-words text-sm text-foreground sm:col-span-2">{profile.email}</dd>
          </div>

          <div className="grid grid-cols-1 gap-1 px-6 py-5 sm:grid-cols-3 sm:gap-4">
            <dt className="pt-2 text-sm font-medium text-muted-foreground sm:pt-0">Matric Number</dt>
            <dd className="sm:col-span-2">
              {isEditing ? (
                <Input
                  name="matricNumber"
                  value={tempProfile.matricNumber}
                  onChange={handleChange}
                  placeholder="e.g. 20CS/12345"
                />
              ) : (
                <span className="text-sm text-foreground">{profile.matricNumber || 'Not set'}</span>
              )}
            </dd>
          </div>

          <div className="grid grid-cols-1 gap-1 px-6 py-5 sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-muted-foreground">Department</dt>
            <dd className="text-sm text-foreground sm:col-span-2">{profile.department}</dd>
          </div>

          <div className="grid grid-cols-1 gap-1 px-6 py-5 sm:grid-cols-3 sm:gap-4">
            <dt className="pt-2 text-sm font-medium text-muted-foreground sm:pt-0">Level</dt>
            <dd className="sm:col-span-2">
              {isEditing ? (
                <Select
                  value={tempProfile.level}
                  onValueChange={(value) => setTempProfile((prev) => ({ ...prev, level: value }))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100 Level</SelectItem>
                    <SelectItem value="200">200 Level</SelectItem>
                    <SelectItem value="300">300 Level</SelectItem>
                    <SelectItem value="400">400 Level</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-sm text-foreground">{`Level ${profile.level}`}</span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      {/* Account Settings */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-5">
          <h2 className="font-display text-base font-semibold text-foreground">Account Settings</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage your account security and preferences.</p>
        </div>
        <dl className="divide-y divide-border">
          <div className="grid grid-cols-1 gap-1 px-6 py-5 sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-muted-foreground">Change Password</dt>
            <dd className="sm:col-span-2">
              <span className="text-sm text-muted-foreground">Coming soon</span>
            </dd>
          </div>
          <div className="grid grid-cols-1 gap-1 px-6 py-5 sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-muted-foreground">Two-Factor Authentication</dt>
            <dd className="sm:col-span-2">
              <span className="bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                Coming soon
              </span>
            </dd>
          </div>
          <div className="grid grid-cols-1 gap-1 px-6 py-5 sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-muted-foreground">Delete Account</dt>
            <dd className="sm:col-span-2">
              <span className="text-sm text-muted-foreground">Coming soon</span>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
