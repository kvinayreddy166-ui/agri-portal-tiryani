import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, User, Database } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsType } from '../types/database';

export function Settings() {
  const { isAdminUser, user } = useAuth();
  const [settings, setSettings] = useState<SettingsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('settings')
        .update({ setting_value: value, updated_at: new Date().toISOString() })
        .eq('setting_key', key);

      if (error) throw error;
      fetchSettings();
    } catch (error) {
      console.error('Error updating setting:', error);
      alert('Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const getSetting = (key: string) => {
    return settings.find(s => s.setting_key === key)?.setting_value || '';
  };

  const setSettingValue = (key: string, value: string) => {
    setSettings(prev => prev.map(s =>
      s.setting_key === key ? { ...s, setting_value: value } : s
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Configure portal settings and preferences</p>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <User className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-gray-900">Current User</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-emerald-600">
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{user?.email}</p>
            <p className="text-sm text-gray-500">
              Role: {isAdminUser ? 'Administrator' : 'Guest User'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Permissions: {isAdminUser ? 'Full access (read, write, delete)' : 'Read-only access'}
            </p>
          </div>
        </div>
      </div>

      {/* Admin Settings */}
      {isAdminUser ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <SettingsIcon className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Portal Configuration</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Name
              </label>
              <input
                type="text"
                value={getSetting('site_name')}
                onChange={(e) => setSettingValue('site_name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                District
              </label>
              <input
                type="text"
                value={getSetting('district')}
                onChange={(e) => setSettingValue('district', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Division
              </label>
              <input
                type="text"
                value={getSetting('division')}
                onChange={(e) => setSettingValue('division', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mandal
              </label>
              <input
                type="text"
                value={getSetting('mandal')}
                onChange={(e) => setSettingValue('mandal', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          <button
            onClick={() => {
              settings.forEach(s => updateSetting(s.setting_key, s.setting_value));
            }}
            disabled={saving}
            className="mt-6 flex items-center gap-2 bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <SettingsIcon className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Portal Configuration</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settings.map((setting) => (
              <div key={setting.id} className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">{setting.setting_key.replace(/_/g, ' ')}</p>
                <p className="font-medium text-gray-900">{setting.setting_value}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Only administrators can modify these settings.
          </p>
        </div>
      )}

      {/* Database Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Database className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-gray-900">System Information</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Database</p>
            <p className="font-medium text-gray-900">Supabase PostgreSQL</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Authentication</p>
            <p className="font-medium text-gray-900">Supabase Auth</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Storage</p>
            <p className="font-medium text-gray-900">Supabase Storage</p>
          </div>
        </div>
      </div>
    </div>
  );
}
