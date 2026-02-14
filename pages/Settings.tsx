
import React, { useState, useEffect, useRef } from 'react';
import { Camera, Save, CheckCircle, Loader2, AlertCircle, Upload } from 'lucide-react';
import { db } from '../lib/supabase';
import { Profile } from '../types';

const SettingsPage: React.FC<{ user: any }> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    db.profiles.get(user.id).then(p => {
      if (p) {
        setFullName(p.full_name || '');
        setAvatarUrl(p.avatar_url || '');
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [user.id]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const publicUrl = await db.profiles.uploadAvatar(user.id, file);
      setAvatarUrl(publicUrl);
    } catch (err: any) {
      console.error("Upload error details:", err);
      // Show the actual error message from Supabase to help debugging
      setError(err.message || "Upload failed. Check if you've added Storage RLS policies for the 'avatars' bucket.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      await db.profiles.update(user.id, { full_name: fullName, avatar_url: avatarUrl });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save profile changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-8 tracking-tight">Profile Settings</h1>
      
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <form onSubmit={handleSave}>
          <div className="p-8 space-y-10">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="relative group">
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-slate-50 shadow-md relative bg-slate-100">
                  <img 
                    src={avatarUrl || `https://picsum.photos/seed/${user.id}/200`} 
                    alt="Avatar" 
                    className={`w-full h-full object-cover transition-opacity ${isUploading ? 'opacity-30' : 'opacity-100'}`} 
                  />
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    </div>
                  )}
                </div>
                <button 
                  type="button" 
                  onClick={handleAvatarClick} 
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 p-2.5 bg-indigo-600 text-white border-2 border-white rounded-full shadow-lg hover:bg-indigo-700 transition-all transform hover:scale-110 disabled:bg-slate-300"
                  title="Upload from gallery"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="font-bold text-slate-900 text-lg">Profile Photo</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-[240px]">
                  Click the camera icon to upload a picture from your device. Recommended size: 400x400px.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                <input 
                  type="text" 
                  required 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                <input 
                  type="email" 
                  disabled 
                  value={user.email} 
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 cursor-not-allowed font-medium" 
                />
                <p className="mt-1.5 text-xs text-slate-400">Email addresses are verified and cannot be changed.</p>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="flex-1">{error}</span>
              </div>
            )}
          </div>

          <div className="px-8 py-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center h-5">
              {success && (
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold animate-in fade-in slide-in-from-left-2">
                  <CheckCircle className="w-4 h-4" /> Changes saved successfully!
                </div>
              )}
            </div>
            <button 
              type="submit" 
              disabled={saving || isUploading} 
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-[0.98] disabled:bg-slate-400 transition-all shadow-lg shadow-indigo-100"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
