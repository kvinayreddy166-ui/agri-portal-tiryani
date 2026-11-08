import React, { useState } from 'react';
import { User, Database, Phone, Mail, MapPin, GraduationCap, Briefcase, AlertTriangle } from 'lucide-react';
import { supabase } from '../../../shared/lib/supabase';
import { useAuth } from '../../../shared/context/AuthContext';

export function Settings() {
  const { isAdminUser, isOfficerUser, user, officerProfile, signOut } = useAuth();
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmEmail !== user.email) return;

    setDeleting(true);
    try {
      // Call edge function to delete user with service role
      const { error } = await supabase.functions.invoke('delete-account', {
        body: { userId: user.id },
      });

      if (error) throw error;

      // Sign out and redirect
      await signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please contact support.');
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-slate-300">Configure portal settings and preferences</p>
      </div>

      {/* Officer Profile Card */}
      {isOfficerUser && officerProfile && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
          <div className="flex items-center gap-2 mb-6">
            <User className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400">Full Name</p>
                <p className="font-medium text-gray-900 dark:text-white">{officerProfile.full_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Briefcase className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400">Designation</p>
                <p className="font-medium text-gray-900 dark:text-white">{officerProfile.designation}</p>
              </div>
            </div>
            {officerProfile.qualification && (
              <div className="flex items-start gap-3">
                <GraduationCap className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Qualification</p>
                  <p className="font-medium text-gray-900 dark:text-white">{officerProfile.qualification}</p>
                </div>
              </div>
            )}
            {officerProfile.hrms_id && (
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">HRMS ID</p>
                  <p className="font-medium text-gray-900 dark:text-white">{officerProfile.hrms_id}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400">District</p>
                <p className="font-medium text-gray-900 dark:text-white">{officerProfile.district}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400">Mandal</p>
                <p className="font-medium text-gray-900 dark:text-white">{officerProfile.mandal}</p>
              </div>
            </div>
            {officerProfile.division && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Division</p>
                  <p className="font-medium text-gray-900 dark:text-white">{officerProfile.division}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400">Phone</p>
                <p className="font-medium text-gray-900 dark:text-white">{officerProfile.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400">Email</p>
                <p className="font-medium text-gray-900 dark:text-white">{officerProfile.email}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Card with Delete Option */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
        <div className="flex items-center gap-2 mb-6">
          <User className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Account</h2>
        </div>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{user?.email}</p>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Role: {isAdminUser ? 'Administrator' : 'Guest User'}
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
              Permissions: {isAdminUser ? 'Full access (read, write, delete)' : 'Read-only access'}
            </p>
          </div>
        </div>

        {/* Delete Account Section */}
        <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="text-base font-semibold text-red-600 dark:text-red-400">Delete Account</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { setDeleteConfirmEmail(''); setShowDeleteModal(true); }}
              className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Account</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
              This will permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                Type your email address to confirm
              </label>
              <input
                type="email"
                value={deleteConfirmEmail}
                onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                placeholder="Enter your email address"
                autoFocus
                className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmEmail(''); }}
                disabled={deleting}
                className="px-5 py-2 text-sm font-semibold text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmEmail !== user?.email}
                className="flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System Information */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">System Information</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-slate-800/60 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Database</p>
            <p className="font-medium text-gray-900 dark:text-white mt-1">PostgreSQL 17</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Supabase Managed</p>
          </div>
          <div className="bg-gray-50 dark:bg-slate-800/60 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Authentication</p>
            <p className="font-medium text-gray-900 dark:text-white mt-1">Supabase Auth</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">JWT + RLS</p>
          </div>
          <div className="bg-gray-50 dark:bg-slate-800/60 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Storage</p>
            <p className="font-medium text-gray-900 dark:text-white mt-1">Supabase Storage</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Encrypted Buckets</p>
          </div>
        </div>
      </div>
    </div>
  );
}
