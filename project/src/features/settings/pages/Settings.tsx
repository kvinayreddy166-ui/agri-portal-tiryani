import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Database,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Briefcase,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Users,
  CheckCircle2,
  ShieldAlert,
  Pencil,
  X,
} from 'lucide-react';
import { supabase } from '../../../shared/lib/supabase';
import { useAuth } from '../../../shared/context/AuthContext';
import { safeStorage, clearUserStorage } from '../../../shared/lib/safeStorage';
import { Spinner } from '../../../shared/components/ui/Spinner';
import { getMandalsForDistrict, QUALIFICATION_OPTIONS } from '../../../shared/data/telanganaDistrictMandalData';
import {
  OFFICER_DESIGNATION_OPTIONS,
  OFFICER_DISTRICTS,
  OFFICER_DISTRICT_TO_MANDAL_KEY,
  officerShowsDivision,
  officerShowsMandal,
} from '../../auth/lib/officerProfileForm';

interface OfficerRow {
  id: string;
  full_name: string;
  designation: string;
  qualification?: string;
  hrms_id?: string;
  district: string;
  mandal: string;
  division?: string;
  phone: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

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

  // Admin Officer Management state
  const [adminOfficers, setAdminOfficers] = useState<OfficerRow[]>([]);
  const [loadingOfficers, setLoadingOfficers] = useState(false);
  const [officerToDelete, setOfficerToDelete] = useState<OfficerRow | null>(null);
  const [adminDeleteConfirmText, setAdminDeleteConfirmText] = useState('');
  const [adminDeleting, setAdminDeleting] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const loadOfficerAccounts = useCallback(async () => {
    if (!isAdminUser) return;
    setLoadingOfficers(true);
    try {
      const { data, error } = await supabase
        .from('officer_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setAdminOfficers(data as OfficerRow[]);
      }
    } catch (e) {
      console.warn('Failed to load officer profiles:', e);
    } finally {
      setLoadingOfficers(false);
    }
  }, [isAdminUser]);

  useEffect(() => {
    if (isAdminUser) {
      loadOfficerAccounts();
    }
  }, [isAdminUser, loadOfficerAccounts]);

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

  const handleAdminDeleteOfficer = async () => {
    if (!officerToDelete) return;
    const confirmInput = adminDeleteConfirmText.trim().toLowerCase();
    const officerEmail = officerToDelete.email.trim().toLowerCase();

    if (confirmInput !== 'delete' && confirmInput !== officerEmail) {
      alert('Please type "DELETE" or the officer\'s email to confirm.');
      return;
    }

    setAdminDeleting(true);
    try {
      let deleted = false;

      // 1. Try RPC delete_officer_account
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('delete_officer_account', {
          p_user_id: officerToDelete.id,
        });
        if (!rpcError && (rpcData as { success?: boolean })?.success) {
          deleted = true;
        } else if (rpcError) {
          console.warn('Admin RPC notice:', rpcError);
        }
      } catch (rpcEx) {
        console.warn('Admin RPC exception:', rpcEx);
      }

      // 2. If RPC not successful, fallback to Edge Function
      if (!deleted) {
        const { data: fnData, error: fnError } = await supabase.functions.invoke('delete-account', {
          body: { userId: officerToDelete.id },
        });

        if (fnError) {
          throw new Error(fnError.message || 'Edge function call failed.');
        }
        if (fnData?.error) {
          throw new Error(fnData.error);
        }
      }

      const deletedName = officerToDelete.full_name || officerToDelete.email;
      setAdminOfficers((prev) => prev.filter((o) => o.id !== officerToDelete.id));
      setOfficerToDelete(null);
      setAdminDeleteConfirmText('');
      setActionSuccessMessage(`Officer account "${deletedName}" was permanently deleted.`);
      setTimeout(() => setActionSuccessMessage(null), 6000);
    } catch (err: unknown) {
      console.error('Admin officer deletion error:', err);
      alert((err as Error)?.message || 'Failed to delete officer account. Please verify database permissions.');
    } finally {
      setAdminDeleting(false);
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
                      setProfileForm({ ...profileForm, district: dist, mandal: distMandals[0] || profileForm.mandal });
                    }}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none"
                  >
                    {OFFICER_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
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
                {editShowsDivision && (
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-700 dark:text-slate-300">Division *</label>
                    <input
                      type="text"
                      required={editShowsDivision}
                      value={profileForm.division}
                      onChange={(e) => setProfileForm({ ...profileForm, division: e.target.value })}
                      placeholder="e.g. Asifabad / Bellampalli"
                      className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none"
                    />
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

      {/* Admin Section: Officer Accounts Management */}
      {isAdminUser && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Officer Accounts Management</h2>
            </div>
            <button
              type="button"
              onClick={loadOfficerAccounts}
              disabled={loadingOfficers}
              className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingOfficers ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
            As portal administrator, you can view and remove registered officer accounts upon administrative review or officer request.
          </p>

          {loadingOfficers ? (
            <div className="py-8 text-center text-gray-500 dark:text-slate-400 text-sm">
              <Spinner size="md" className="text-emerald-600 dark:text-emerald-400 mx-auto mb-2" label="Loading" />
              Loading officer accounts...
            </div>
          ) : adminOfficers.length === 0 ? (
            <div className="py-6 text-center text-gray-500 dark:text-slate-400 text-sm bg-gray-50 dark:bg-slate-800/40 rounded-lg">
              No registered officer accounts found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                    <th className="py-3 px-4">Officer Name</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">District / Mandal</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {adminOfficers.map((officer) => {
                    const isSelf = officer.id === user?.id;
                    return (
                      <tr key={officer.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900 dark:text-white">{officer.full_name}</div>
                          {officer.qualification && (
                            <div className="text-xs text-gray-500 dark:text-slate-400">{officer.qualification}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                            {officer.designation}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600 dark:text-slate-300">
                          <div>{officer.district}</div>
                          <div className="text-gray-400 dark:text-slate-500">{officer.mandal}</div>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600 dark:text-slate-300">
                          <div>{officer.email}</div>
                          <div className="text-gray-400 dark:text-slate-500">{officer.phone}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 uppercase">
                            {officer.status || 'Active'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setOfficerToDelete(officer);
                              setAdminDeleteConfirmText('');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 dark:text-red-400 transition-colors border border-red-200 dark:border-red-900/40"
                            title={isSelf ? 'Delete your own account' : `Delete ${officer.full_name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Admin Delete Officer Confirmation Modal */}
      {officerToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-red-200 dark:border-red-900/40">
            <div className="mb-4 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Officer Account</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-3">
              You are deleting the officer account for <strong className="text-gray-900 dark:text-white">{officerToDelete.full_name}</strong> (<code>{officerToDelete.email}</code>).
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg mb-4">
              This will permanently delete this officer&apos;s inspections, statutory orders, sampling memos, and auth account. This action cannot be reversed.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-200 mb-1.5">
                Type <span className="font-semibold text-red-600 dark:text-red-400">DELETE</span> or the officer&apos;s email to confirm:
              </label>
              <input
                type="text"
                value={adminDeleteConfirmText}
                onChange={(e) => setAdminDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                autoFocus
                className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setOfficerToDelete(null);
                  setAdminDeleteConfirmText('');
                }}
                disabled={adminDeleting}
                className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdminDeleteOfficer}
                disabled={
                  adminDeleting ||
                  (adminDeleteConfirmText.trim().toLowerCase() !== 'delete' &&
                    adminDeleteConfirmText.trim().toLowerCase() !== officerToDelete.email.trim().toLowerCase())
                }
                className="flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {adminDeleting ? (
                  <>
                    <Spinner size="xs" className="text-white" label="Loading" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Officer Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
