import React, { useState, useEffect } from 'react';
import { CheckCircle2, FileSpreadsheet, Plus, RefreshCw, Search, Trash2, Upload, Phone, User, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type OfficerType = 'AEO' | 'MAO' | 'ADA' | 'DAO';

interface OfficerContact {
  id: string;
  officer_type: OfficerType;
  name: string | null;
  district: string;
  division: string | null;
  mandal: string | null;
  cluster: string | null;
  phone: string;
  email: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

const OFFICER_TYPES: OfficerType[] = ['AEO', 'MAO', 'ADA', 'DAO'];

const TELANGANA_DISTRICTS = [
  'Adilabad', 'Bhadradri Kothagudem', 'Hanamkonda', 'Jagtial', 'Jangaon',
  'Jayashankar Bhupalpally', 'Jogulamba Gadwal', 'Kamareddy', 'Karimnagar',
  'Khammam', 'Kumrambheem Asifabad', 'Hyderabad', 'Mahabubabad', 'Mahabubnagar',
  'Mancherial', 'Medak', 'Medchal-Malkajgiri', 'Mulugu', 'Nagarkurnool',
  'Nalgonda', 'Narayanpet', 'Nirmal', 'Nizamabad', 'Peddapalli',
  'Rajanna Sircilla', 'Rangareddy', 'Sangareddy', 'Siddipet', 'Suryapet',
  'Vikarabad', 'Wanaparthy', 'Warangal', 'Yadadri Bhuvanagiri',
];

export function OfficerContactsAdmin() {
  const [contacts, setContacts] = useState<OfficerContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<OfficerType | ''>('');
  const [editing, setEditing] = useState<OfficerContact | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [importData, setImportData] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    loadContacts();
  }, [selectedType]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('officer_contacts')
        .select('*')
        .order('district', { ascending: true });

      if (selectedType) {
        query = query.eq('officer_type', selectedType);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    if (!search.trim()) return true;
    const needle = search.toLowerCase();
    return (
      contact.name?.toLowerCase().includes(needle) ||
      contact.phone.includes(needle) ||
      contact.district.toLowerCase().includes(needle) ||
      contact.division?.toLowerCase().includes(needle) ||
      contact.mandal?.toLowerCase().includes(needle) ||
      contact.cluster?.toLowerCase().includes(needle)
    );
  });

  const startAdd = () => {
    setEditing({
      id: '',
      officer_type: 'AEO',
      name: '',
      district: '',
      division: '',
      mandal: '',
      cluster: '',
      phone: '',
      email: '',
      active: true,
      created_at: '',
      updated_at: '',
    });
    setErrorMessage('');
    setStatusMessage('');
  };

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      // Validate required fields
      if (!editing.officer_type || !editing.district || !editing.phone) {
        throw new Error('Officer type, district, and phone are required');
      }

      // Validate phone number (10 digits)
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(editing.phone)) {
        throw new Error('Phone number must be 10 digits');
      }

      const payload = {
        officer_type: editing.officer_type,
        name: editing.name || null,
        district: editing.district,
        division: editing.division || null,
        mandal: editing.mandal || null,
        cluster: editing.cluster || null,
        phone: editing.phone,
        email: editing.email || null,
        active: editing.active,
      };

      if (editing.id) {
        const { error } = await supabase
          .from('officer_contacts')
          .update(payload)
          .eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('officer_contacts')
          .insert(payload);
        if (error) throw error;
      }

      setEditing(null);
      setStatusMessage('Contact saved successfully');
      await loadContacts();
    } catch (error) {
      setErrorMessage(error.message || 'Failed to save contact');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (contact: OfficerContact) => {
    if (!confirm(`Delete ${contact.officer_type} contact for ${contact.district}?`)) return;
    try {
      const { error } = await supabase
        .from('officer_contacts')
        .delete()
        .eq('id', contact.id);
      if (error) throw error;
      setStatusMessage('Contact deleted successfully');
      await loadContacts();
    } catch (error) {
      setErrorMessage(error.message || 'Failed to delete contact');
    }
  };

  const handleImport = async () => {
    setBusy(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      const lines = importData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const records: any[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const record: any = {};
        
        headers.forEach((header, index) => {
          record[header] = values[index] || '';
        });
        
        // Map CSV headers to database fields
        const payload = {
          officer_type: record.officer_type || record.type?.toUpperCase(),
          name: record.name || null,
          district: record.district,
          division: record.division || null,
          mandal: record.mandal || null,
          cluster: record.cluster || null,
          phone: record.phone,
          email: record.email || null,
          active: true,
        };

        // Validate
        if (!payload.officer_type || !OFFICER_TYPES.includes(payload.officer_type)) {
          throw new Error(`Invalid officer type at line ${i + 1}: ${payload.officer_type}`);
        }
        if (!payload.district) {
          throw new Error(`District required at line ${i + 1}`);
        }
        if (!payload.phone || !/^[0-9]{10}$/.test(payload.phone)) {
          throw new Error(`Invalid phone number at line ${i + 1}: ${payload.phone}`);
        }

        records.push(payload);
      }

      // Bulk insert
      const { error } = await supabase
        .from('officer_contacts')
        .insert(records);
      
      if (error) throw error;

      setStatusMessage(`Successfully imported ${records.length} contacts`);
      setImportData('');
      setShowImportModal(false);
      await loadContacts();
    } catch (error) {
      setErrorMessage(error.message || 'Failed to import contacts');
    } finally {
      setBusy(false);
    }
  };

  const getOfficerIcon = (type: OfficerType) => {
    return type === 'DAO' || type === 'ADA' ? Building2 : User;
  };

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-950 dark:text-white">Officer Contacts Admin</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">Manage AEO, MAO, ADA, and DAO contact information</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as OfficerType | '')}
              className="min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="">All Types</option>
              {OFFICER_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <button
              onClick={loadContacts}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-black dark:border-slate-700 dark:text-white"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
            >
              <Upload className="h-4 w-4" />
              Import CSV
            </button>
            <button
              onClick={startAdd}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-black text-white"
            >
              <Plus className="h-4 w-4" />
              Add Contact
            </button>
          </div>
        </div>
        {(statusMessage || errorMessage) && (
          <div className={`mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm font-bold ${
            errorMessage
              ? 'border-amber-200 bg-amber-50 text-amber-900'
              : 'border-emerald-200 bg-emerald-50 text-emerald-900'
          }`}>
            {!errorMessage && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>{errorMessage || statusMessage}</span>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {loading ? (
          <div className="p-6 text-sm font-semibold text-slate-500">Loading contacts...</div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-6 text-sm font-semibold text-slate-500">No contacts found</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredContacts.map((contact) => {
              const Icon = getOfficerIcon(contact.officer_type);
              return (
                <article key={contact.id} className="grid gap-3 p-4 lg:grid-cols-[1fr_auto]">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          {contact.officer_type}
                        </span>
                        {!contact.active && (
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            Inactive
                          </span>
                        )}
                      </div>
                      {contact.name && (
                        <h3 className="mt-2 text-base font-black text-slate-950 dark:text-white">
                          {contact.name}
                        </h3>
                      )}
                      <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5" />
                          <span className="font-mono font-bold">{contact.phone}</span>
                        </div>
                        <div>District: {contact.district}</div>
                        {contact.division && <div>Division: {contact.division}</div>}
                        {contact.mandal && <div>Mandal: {contact.mandal}</div>}
                        {contact.cluster && <div>Cluster: {contact.cluster}</div>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 lg:flex-col">
                    <button
                      onClick={() => setEditing(contact)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-black dark:border-slate-700 dark:text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(contact)}
                      className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-black text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
              <h2 className="text-xl font-black text-slate-950 dark:text-white">
                {editing.id ? 'Edit Contact' : 'Add Contact'}
              </h2>
              <button
                onClick={() => setEditing(null)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-black dark:border-slate-700 dark:text-white"
              >
                Cancel
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid gap-4">
                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">
                    Officer Type *
                  </label>
                  <select
                    value={editing.officer_type}
                    onChange={(e) => setEditing({ ...editing, officer_type: e.target.value as OfficerType })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    {OFFICER_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">
                    Name {editing.officer_type === 'ADA' ? '(optional - will show designation)' : ''}
                  </label>
                  <input
                    value={editing.name || ''}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    placeholder={editing.officer_type === 'ADA' ? 'Leave blank for ADA' : 'Officer name'}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">
                    District *
                  </label>
                  <select
                    value={editing.district}
                    onChange={(e) => setEditing({ ...editing, district: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="">Select District</option>
                    {TELANGANA_DISTRICTS.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">
                    Division
                  </label>
                  <input
                    value={editing.division || ''}
                    onChange={(e) => setEditing({ ...editing, division: e.target.value })}
                    placeholder="Division name"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">
                    Mandal
                  </label>
                  <input
                    value={editing.mandal || ''}
                    onChange={(e) => setEditing({ ...editing, mandal: e.target.value })}
                    placeholder="Mandal name"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">
                    Cluster
                  </label>
                  <input
                    value={editing.cluster || ''}
                    onChange={(e) => setEditing({ ...editing, cluster: e.target.value })}
                    placeholder="Cluster name"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">
                    Phone *
                  </label>
                  <input
                    value={editing.phone}
                    onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                    placeholder="10-digit phone number"
                    maxLength={10}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">
                    Email
                  </label>
                  <input
                    value={editing.email || ''}
                    onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                    placeholder="Email address"
                    type="email"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={editing.active}
                    onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <label htmlFor="active" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Active
                  </label>
                </div>
              </div>
            </div>
            {errorMessage && (
              <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900">
                {errorMessage}
              </div>
            )}
            <div className="flex gap-2 border-t border-slate-200 p-4 dark:border-slate-700">
              <button
                onClick={() => setEditing(null)}
                className="min-h-11 flex-1 rounded-lg border border-slate-200 px-3 py-2 font-black dark:border-slate-700 dark:text-white"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={busy}
                className="min-h-11 flex-1 rounded-lg bg-emerald-700 px-3 py-2 font-black text-white disabled:opacity-50"
              >
                {busy ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
              <h2 className="text-xl font-black text-slate-950 dark:text-white">
                Import Contacts from CSV
              </h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-black dark:border-slate-700 dark:text-white"
              >
                Cancel
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                  <h3 className="text-sm font-black text-slate-950 dark:text-white mb-2">CSV Format</h3>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                    First row must contain headers. Required fields: officer_type, district, phone
                  </p>
                  <pre className="text-xs font-mono text-slate-700 dark:text-slate-300 bg-white p-2 rounded dark:bg-slate-900">
officer_type,name,district,division,mandal,cluster,phone,email
AEO,John Doe,Adilabad,Adilabad Rural,Adilabad,Cluster1,9876543210,john@example.com
MAO,Jane Smith,Karimnagar,Karimnagar,Karimnagar,,9876543211,jane@example.com
                  </pre>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">
                    CSV Data
                  </label>
                  <textarea
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    placeholder="Paste CSV data here..."
                    rows={10}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>
            </div>
            {errorMessage && (
              <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900">
                {errorMessage}
              </div>
            )}
            <div className="flex gap-2 border-t border-slate-200 p-4 dark:border-slate-700">
              <button
                onClick={() => setShowImportModal(false)}
                className="min-h-11 flex-1 rounded-lg border border-slate-200 px-3 py-2 font-black dark:border-slate-700 dark:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={busy || !importData.trim()}
                className="min-h-11 flex-1 rounded-lg bg-emerald-700 px-3 py-2 font-black text-white disabled:opacity-50"
              >
                {busy ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
