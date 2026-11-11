import React, { useState } from 'react';
import {
  User,
  Database,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Pencil,
  X,
} from 'lucide-react';
import { supabase } from '../../../shared/lib/supabase';
import { useAuth } from '../../../shared/context/AuthContext';
import { safeStorage, clearUserStorage } from '../../../shared/lib/safeStorage';
import { Spinner } from '../../../shared/components/ui/Spinner';
import { DivisionPicker } from '../../../shared/components/ui/DivisionPicker';
import { getMandalsForDistrict, QUALIFICATION_OPTIONS } from '../../../shared/data/telanganaDistrictMandalData';
import {
  OFFICER_DESIGNATION_OPTIONS,
  OFFICER_DISTRICTS,
  OFFICER_DISTRICT_TO_MANDAL_KEY,
  officerShowsDivision,
  officerShowsMandal,
} from '../../auth/lib/officerProfileForm';

export function Settings() {
  const { isAdminUser, isOfficerUser, user, officerProfile, signOut, refreshOfficerProfile } = useAuth();
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Officer profile edit state
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    designation: 'AEO',
    qualification: '',
    hrmsId: '',
    district: '',
    mandal: '',
    division: '',
    phone: '',
  });

  const editMandals = getMandalsForDistrict(OFFICER_DISTRICT_TO_MANDAL_KEY[profileForm.district] || profileForm.district);
  const editShowsMandal = officerShowsMandal(profileForm.designation);
  const editShowsDivision = officerShowsDivision(profileForm.designation);
  const qualificationOptions = QUALIFICATION_OPTIONS.some((q) => q.value === profileForm.qualification)
    ? QUALIFICATION_OPTIONS
    : [{ label: profileForm.qualification, value: profileForm.qualification }, ...QUALIFICATION_OPTIONS];
  const mandalOptions = editMandals.includes(profileForm.mandal) || profileForm.mandal === 'District HQ'
    ? editMandals
    : [profileForm.mandal, ...editMandals];

  const startEditProfile = () => {
    if (!officerProfile) return;
    setProfileForm({
      fullName: officerProfile.full_name || '',
      designation: officerProfile.designation || 'AEO',
      qualification: officerProfile.qualification || '',
      hrmsId: officerProfile.hrms_id || '',
      district: officerProfile.district || '',
      mandal: officerProfile.mandal || '',
      division: officerProfile.division || '',
      phone: officerProfile.phone || '',
    });
    setProfileError(null);
    setEditingProfile(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !officerProfile) return;
    setProfileError(null);

    const fullName = profileForm.fullName.trim();
    const phone = profileForm.phone.trim().replace(/\D/g, '');
    const mandal = editShowsMandal ? profileForm.mandal.trim() : 'District HQ';
    const division = editShowsDivision ? profileForm.division.trim() : '';

    if (!fullName || !profileForm.district || !profileForm.designation || (editShowsMandal && !mandal) || (editShowsDivision && !division) || !phone) {
      setProfileError('Please fill in all mandatory fields.');
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      setProfileError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('officer_profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          designation: profileForm.designation,
          hrms_id: profileForm.hrmsId.trim() || null,
          qualification: profileForm.qualification || null,
          district: profileForm.district,
          mandal,
          division: division || null,
          phone,
          email: officerProfile.email || user.email || '',
          role: officerProfile.role || 'officer',
          status: officerProfile.status || 'active',
        }, { onConflict: 'id' });

      if (error) throw error;

      // Keep auth user_metadata in sync for the fallback profile path
      await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          designation: profileForm.designation,
          hrms_id: profileForm.hrmsId.trim(),
          qualification: profileForm.qualification,
          district: profileForm.district,
          mandal,
          division,
          phone,
        },
      });

      await refreshOfficerProfile();
      setEditingProfile(false);
      setActionSuccessMessage('Profile updated successfully.');
      setTimeout(() => setActionSuccessMessage(null), 6000);
    } catch (err) {
      console.error('Failed to update officer profile:', err);
      setProfileError((err as Error)?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (!user) return;
    const cleanConfirm = deleteConfirmEmail.trim().toLowerCase();
    const cleanUserEmail = (user.email || '').trim().toLowerCase();
    if (cleanConfirm !== cleanUserEmail) {
      alert('The confirmation email entered does not match your account email.');
      return;
    }

    setDeleting(true);
    try {
      let deleted = false;

      // 1. Try atomic database RPC function first (SECURITY DEFINER)
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('delete_officer_account', {
          p_user_id: user.id,
        });
        if (!rpcError && (rpcData as { success?: boolean })?.success) {
          deleted = true;
        } else if (rpcError) {
          console.warn('RPC delete_officer_account notice:', rpcError);
        }
      } catch (rpcEx) {
        console.warn('RPC delete_officer_account exception:', rpcEx);
      }

      // 2. If RPC not successful, fallback to Edge Function
      if (!deleted) {
        const { data: fnData, error: fnError } = await supabase.functions.invoke('delete-account', {
          body: { userId: user.id },
        });

        if (fnError) {
          console.warn('Edge function invocation notice:', fnError);
        } else if (fnData?.error) {
          throw new Error(fnData.error);
        } else if (fnData?.success) {
          deleted = true;
        }
      }

      // 3. Fallback client-side cleanup of records if needed
      if (!deleted) {
        try {
          await supabase.from('officer_inspections').delete().eq('officer_id', user.id);
          await supabase.from('officer_statutory_orders').delete().eq('officer_id', user.id);
          await supabase.from('officer_samples').delete().eq('officer_id', user.id);
          await supabase.from('officer_profiles').delete().eq('id', user.id);
          deleted = true;
        } catch (clientDelErr) {
          console.warn('Direct client cleanup fallback:', clientDelErr);
        }
      }

      // Clear local caches
      try {
        clearUserStorage(user.id);
        safeStorage.removeItem('tiryani_officer_records');
        safeStorage.removeItem('tiryani_officer_profile');
        safeStorage.removeItem('tiryani_cached_inspections');
        safeStorage.removeItem('tiryani_cached_samples');
        safeStorage.removeItem('tiryani_cached_orders');
        safeStorage.removeItem('tiryani_sample_targets_cache');
      } catch (storageErr) {
        console.warn('Storage cleanup warning:', storageErr);
      }

      // Sign out and redirect
      await signOut();
      window.location.href = '/login';
    } catch (error: unknown) {
      console.error('Error deleting account:', error);
      alert((error as Error)?.message || 'Failed to delete account. Please contact administrator.');
      setDeleting(false);
    }
  };

  const isEmailMatch =
    deleteConfirmEmail.trim().toLowerCase() === (user?.email || '').trim().toLowerCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-slate-300">Configure portal settings and preferences</p>
      </div>

      {/* Success Notification */}
      {actionSuccessMessage && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Officer Profile Card */}
      {isOfficerUser && officerProfile && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h2>
            </div>
            {!editingProfile && (
              <button
                type="button"
                onClick={startEditProfile}
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit Profile
              </button>
            )}
          </div>

          {editingProfile ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {profileError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {profileError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-bold text-gray-700 dark:text-slate-300">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-gray-700 dark:text-slate-300">Designation *</label>
                  <select
                    value={profileForm.designation}
                    onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none"
                  >
                    {OFFICER_DESIGNATION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-gray-700 dark:text-slate-300">Qualification</label>
                  <select
                    value={profileForm.qualification}
                    onChange={(e) => setProfileForm({ ...profileForm, qualification: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none"
                  >
                    <option value="">Select qualification</option>
                    {qualificationOptions.map((q) => (
                      <option key={q.value} value={q.value}>{q.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-gray-700 dark:text-slate-300">HRMS ID</label>
                  <input
                    type="text"
                    value={profileForm.hrmsId}
                    onChange={(e) => setProfileForm({ ...profileForm, hrmsId: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-gray-700 dark:text-slate-300">District *</label>
                  <select
                    value={profileForm.district}
                    onChange={(e) => {
                      const dist = e.target.value;
                      const distMandals = getMandalsForDistrict(OFFICER_DISTRICT_TO_MANDAL_KEY[dist] || dist);
                      setProfileForm({ ...profileForm, district: dist, mandal: distMandals[0] || profileForm.mandal, division: '' });
                    }}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none"
                  >
                    {OFFICER_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                {editShowsDivision && (
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-700 dark:text-slate-300">Division *</label>
                    <DivisionPicker
                      district={OFFICER_DISTRICT_TO_MANDAL_KEY[profileForm.district] || profileForm.district}
                      value={profileForm.division}
                      onChange={(v) => setProfileForm({ ...profileForm, division: v })}
                      selectClassName="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none"
                      inputClassName="mt-2 w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none"
                      inputPlaceholder="e.g. Asifabad / Bellampalli"
                    />
                  </div>
                )}
                {editShowsMandal && (
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-700 dark:text-slate-300">Mandal / Jurisdiction *</label>
                    <select
                      value={profileForm.mandal}
                      onChange={(e) => setProfileForm({ ...profileForm, mandal: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none"
                    >
                      {!mandalOptions.includes(profileForm.mandal) && profileForm.mandal && (
                        <option value={profileForm.mandal}>{profileForm.mandal}</option>
                      )}
                      {mandalOptions.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                      <option value="District HQ">District HQ / Others</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-xs font-bold text-gray-700 dark:text-slate-300">Mobile Number *</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    required
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="9949497506"
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-gray-700 dark:text-slate-300">Email</label>
                  <input
                    type="email"
                    value={officerProfile.email}
                    disabled
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 px-3 py-2.5 text-sm text-gray-500 dark:text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex items-center gap-2 bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-800 transition-colors disabled:opacity-50"
                >
                  {savingProfile ? <Spinner size="xs" className="text-white" label="Loading" /> : <CheckCircle2 className="w-4 h-4" />}
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProfile(false)}
                  disabled={savingProfile}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </form>
          ) : (
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
          )}
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
              Role: {isAdminUser ? 'Administrator' : 'Agriculture Officer'}
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
              Permissions: {isAdminUser ? 'Full administrative access (read, write, delete)' : 'Officer access (records, inspections, statutory actions)'}
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
            Permanently delete your account and all associated data including inspections, statutory orders, and sampling memos. This action cannot be undone.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setDeleteConfirmEmail('');
                setShowDeleteModal(true);
              }}
              className="flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold shadow-sm shadow-red-500/20"
            >
              <AlertTriangle className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Own Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-red-200 dark:border-red-900/40">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Account</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-2">
              This will permanently delete your officer account and all associated data. This action cannot be undone.
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
              Please enter your email <span className="font-semibold text-gray-800 dark:text-slate-200">{user?.email}</span> to confirm:
            </p>
            <div className="mb-4">
              <input
                type="email"
                value={deleteConfirmEmail}
                onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                placeholder="Enter your email address"
                autoFocus
                className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmEmail('');
                }}
                disabled={deleting}
                className="px-5 py-2 text-sm font-semibold text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting || !isEmailMatch}
                className="flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {deleting ? (
                  <>
                    <Spinner size="xs" className="text-white" label="Loading" />
                    Deleting...
                  </>
                ) : (
                  'Delete Permanently'
                )}
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
