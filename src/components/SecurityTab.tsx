import React, { useState } from 'react';
import {
  Shield,
  Lock,
  CheckCircle2,
  User,
  Store,
  Bike,
  ShieldAlert,
  Key,
  LogIn,
  UserPlus,
  MapPin,
  RefreshCw,
  LogOut,
  AlertCircle
} from 'lucide-react';
import { api, UserProfile, AddressRecord } from '../services/api';

const ROLES = [
  {
    role: 'customer',
    name: 'Customer',
    desc: 'Public ordering clients in Soshanguve',
    icon: User,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    permissions: [
      'Read active vendors & menu items',
      'Create and manage own delivery addresses',
      'Place single-vendor orders for self',
      'Track real-time status of own orders',
      'BLOCKED: Cannot read other customers orders or vendor financial data'
    ]
  },
  {
    role: 'vendor',
    name: 'Vendor Operator',
    desc: 'Township restaurant & spaza owners',
    icon: Store,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    permissions: [
      'Update own store profile & prep times',
      'Manage own menu categories & item availability (86 toggle)',
      'Receive live incoming order queue for own store',
      'Accept or reject orders with reasons',
      'BLOCKED: Cannot access other vendors or customer payment cards'
    ]
  },
  {
    role: 'driver',
    name: 'Bike Driver',
    desc: '2-bike fleet delivery riders',
    icon: Bike,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    permissions: [
      'Toggle availability status (online/offline)',
      'View assigned delivery tickets and pickup items',
      'Access customer landmark description & click-to-call',
      'Mark deliveries as picked up & completed',
      'Record physical cash collected on COD drops'
    ]
  },
  {
    role: 'admin',
    name: 'TMD Admin / Dispatcher',
    desc: 'Platform owner & central dispatcher',
    icon: ShieldAlert,
    color: 'text-[#FF6321] bg-orange-50 border-orange-200',
    permissions: [
      'Full administrative oversight across all 11 tables',
      'Manual driver assignment to active vendor orders',
      'Manual verification of bank EFT / PFTS payments',
      'Vendor onboarding approval & store activation',
      'Audit log inspection on order_status_history'
    ]
  }
];

export const SecurityTab: React.FC = () => {
  const [activeSubView, setActiveSubView] = useState<'rbac' | 'auth_console' | 'addresses'>('rbac');

  // Auth Console State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('customer@tmd.co.za');
  const [password, setPassword] = useState('Secret123!');
  const [fullName, setFullName] = useState('Kagiso Modise');
  const [phoneNumber, setPhoneNumber] = useState('+27 82 555 0199');
  const [selectedRole, setSelectedRole] = useState<'customer' | 'vendor' | 'driver' | 'admin'>('customer');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentToken, setCurrentToken] = useState<string | null>(api.getToken());
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'success' | 'error' | null>(null);

  // Address State
  const [addresses, setAddresses] = useState<AddressRecord[]>([]);
  const [addressBlock, setAddressBlock] = useState('Block L');
  const [addressLandmark, setAddressLandmark] = useState('Opposite Tsako Thabo High School, behind yellow tuckshop');
  const [addressLabel, setAddressLabel] = useState('Home');
  const [addressStreet, setAddressStreet] = useState('Stand 1044');
  const [addressLoading, setAddressLoading] = useState(false);

  // Load profile on initial token presence
  React.useEffect(() => {
    if (currentToken && !currentUser) {
      handleFetchMe();
    }
  }, [currentToken]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setApiResponse(null);
    setApiStatus(null);
    try {
      const res = await api.auth.login({ email, password });
      setCurrentToken(res.access_token);
      setCurrentUser(res.user);
      setApiResponse(JSON.stringify(res, null, 2));
      setApiStatus('success');
    } catch (err: unknown) {
      setApiResponse(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }, null, 2));
      setApiStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setApiResponse(null);
    setApiStatus(null);
    try {
      const res = await api.auth.register({
        email,
        password,
        full_name: fullName,
        phone_number: phoneNumber,
        role: selectedRole
      });
      setCurrentToken(res.access_token);
      setCurrentUser(res.user);
      setApiResponse(JSON.stringify(res, null, 2));
      setApiStatus('success');
    } catch (err: unknown) {
      setApiResponse(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }, null, 2));
      setApiStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchMe = async () => {
    setLoading(true);
    try {
      const res = await api.auth.getMe();
      setCurrentUser(res.user);
      setApiResponse(JSON.stringify(res, null, 2));
      setApiStatus('success');
    } catch (err: unknown) {
      setApiResponse(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }, null, 2));
      setApiStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    api.auth.logout();
    setCurrentToken(null);
    setCurrentUser(null);
    setApiResponse(JSON.stringify({ message: 'Logged out successfully, JWT cleared' }, null, 2));
    setApiStatus('success');
  };

  const handleFetchAddresses = async () => {
    setAddressLoading(true);
    try {
      const res = await api.addresses.list();
      setAddresses(res.addresses);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setAddressLoading(false);
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressLoading(true);
    try {
      const res = await api.addresses.create({
        township_block: addressBlock,
        landmark_description: addressLandmark,
        label: addressLabel,
        street_address: addressStreet,
        is_default: addresses.length === 0
      });
      setAddresses(prev => [res.address, ...prev]);
      setAddressLandmark('');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setAddressLoading(false);
    }
  };

  const setDemoRole = (role: 'customer' | 'vendor' | 'driver' | 'admin') => {
    setSelectedRole(role);
    setEmail(`${role}@tmd.co.za`);
    setPassword('Secret123!');
    if (role === 'customer') setFullName('Kagiso Modise');
    if (role === 'vendor') setFullName('Bafana Mokoena (Kota King)');
    if (role === 'driver') setFullName('Thabo Dlamini (Bike 1)');
    if (role === 'admin') setFullName('Keanu Derbyshire (Dispatcher)');
  };

  return (
    <div className="flex-1 p-6 md:p-8 flex flex-col overflow-y-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">Security Architecture & JWT Authentication (Phase 2)</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Stateless JWT authentication with Werkzeug password hashing and role-based decorator enforcement. Verified via Flask REST API endpoints <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">/api/auth/*</code> and <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">/api/users/addresses</code>.
            </p>
          </div>

          {/* Sub-view switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
            <button
              onClick={() => setActiveSubView('rbac')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeSubView === 'rbac'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              RBAC Matrix
            </button>
            <button
              onClick={() => setActiveSubView('auth_console')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                activeSubView === 'auth_console'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Key className="w-3.5 h-3.5 text-[#FF6321]" />
              Auth & JWT Console
            </button>
            <button
              onClick={() => {
                setActiveSubView('addresses');
                handleFetchAddresses();
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                activeSubView === 'addresses'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              Soshanguve Addresses
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: RBAC Matrix */}
      {activeSubView === 'rbac' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ROLES.map(role => {
            const Icon = role.icon;
            return (
              <div key={role.role} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${role.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">{role.name}</h3>
                        <span className="text-[10px] font-mono text-slate-400">role: {role.role}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      JWT Guarded
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    {role.permissions.map((perm, idx) => {
                      const isBlocked = perm.startsWith('BLOCKED:');
                      return (
                        <div key={idx} className="flex items-start gap-2 text-xs">
                          {isBlocked ? (
                            <Lock className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          )}
                          <span className={isBlocked ? 'text-rose-600 font-medium' : 'text-slate-600'}>
                            {perm}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>@role_required('{role.role}')</span>
                  <button
                    onClick={() => {
                      setDemoRole(role.role as any);
                      setActiveSubView('auth_console');
                    }}
                    className="text-[#FF6321] hover:underline font-sans font-bold"
                  >
                    Test as {role.name} →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: Interactive Auth & JWT Console */}
      {activeSubView === 'auth_console' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Login / Register */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {authMode === 'login' ? <LogIn className="w-4 h-4 text-[#FF6321]" /> : <UserPlus className="w-4 h-4 text-[#FF6321]" />}
                <h3 className="font-bold text-sm text-slate-900">
                  {authMode === 'login' ? 'Authenticate Profile (/api/auth/login)' : 'Register New Account (/api/auth/register)'}
                </h3>
              </div>
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-xs text-[#FF6321] hover:underline font-semibold"
              >
                Switch to {authMode === 'login' ? 'Register' : 'Login'}
              </button>
            </div>

            {/* Quick Demo Role Presets */}
            <div className="mb-4">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Load Demo Role Preset:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['customer', 'vendor', 'driver', 'admin'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setDemoRole(r)}
                    className={`text-[11px] py-1 px-2 rounded border font-semibold capitalize transition-all ${
                      selectedRole === r
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-3">
              {authMode === 'register' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#FF6321]/20 focus:border-[#FF6321]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number (SA)</label>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      placeholder="+27 82 555 0199"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#FF6321]/20 focus:border-[#FF6321]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Assigned Role</label>
                    <select
                      value={selectedRole}
                      onChange={e => setSelectedRole(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#FF6321]/20 focus:border-[#FF6321]"
                    >
                      <option value="customer">customer (Public Ordering Client)</option>
                      <option value="vendor">vendor (Township Restaurant Owner)</option>
                      <option value="driver">driver (2-Bike Fleet Rider)</option>
                      <option value="admin">admin (Platform Dispatcher)</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#FF6321]/20 focus:border-[#FF6321]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Password (min 6 characters)</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#FF6321]/20 focus:border-[#FF6321]"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#FF6321] hover:bg-[#E5571B] text-white py-2 px-4 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {loading ? 'Processing...' : authMode === 'login' ? 'Execute Login' : 'Create User Account'}
                </button>
                {currentToken && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Clear Token
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Right Console: Token & Live Inspection */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-900">Active JWT Token & Claims</h3>
                </div>
                {currentToken && (
                  <button
                    onClick={handleFetchMe}
                    disabled={loading}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh /me
                  </button>
                )}
              </div>

              {currentToken ? (
                <div className="space-y-4">
                  <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] overflow-x-auto break-all">
                    <span className="text-slate-400 block mb-1 font-sans text-[10px] uppercase tracking-wider font-bold">
                      Bearer Authorization Token (Saved):
                    </span>
                    {currentToken}
                  </div>

                  {currentUser && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <span className="text-slate-500 block mb-2 text-[10px] uppercase tracking-wider font-bold">
                        Decoded User Profile:
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Name:</span>
                          <span className="font-bold text-slate-900">{currentUser.full_name}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Role:</span>
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block uppercase text-[10px]">
                            {currentUser.role}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Email:</span>
                          <span className="text-slate-700">{currentUser.email}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Phone:</span>
                          <span className="text-slate-700">{currentUser.phone_number || 'None'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Key className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No active JWT access token.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Authenticate via the left panel or click a demo role preset.
                  </p>
                </div>
              )}
            </div>

            {/* API Response Log */}
            {apiResponse && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-1.5 mb-1.5">
                  {apiStatus === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Latest REST Response:
                  </span>
                </div>
                <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono text-[10px] overflow-x-auto max-h-44">
                  {apiResponse}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: Soshanguve Address Manager */}
      {activeSubView === 'addresses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Add Address Form */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">Add Soshanguve Delivery Address</h3>
            </div>

            <form onSubmit={handleCreateAddress} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Label</label>
                <input
                  type="text"
                  value={addressLabel}
                  onChange={e => setAddressLabel(e.target.value)}
                  placeholder="Home, Work, Relative"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#FF6321]/20 focus:border-[#FF6321]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Township Block <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={addressBlock}
                  onChange={e => setAddressBlock(e.target.value)}
                  placeholder="Block L, Block BB, Block TT, etc."
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#FF6321]/20 focus:border-[#FF6321]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Landmark Description (Mandatory for Riders) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={addressLandmark}
                  onChange={e => setAddressLandmark(e.target.value)}
                  placeholder="e.g. Opposite Tsako Thabo High School, behind yellow tuckshop, 3rd house with green gate"
                  rows={3}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#FF6321]/20 focus:border-[#FF6321]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Street Address or Stand (Optional)</label>
                <input
                  type="text"
                  value={addressStreet}
                  onChange={e => setAddressStreet(e.target.value)}
                  placeholder="Stand 1044"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#FF6321]/20 focus:border-[#FF6321]"
                />
              </div>

              <button
                type="submit"
                disabled={addressLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 px-4 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
              >
                {addressLoading ? 'Saving...' : 'Save Delivery Address (/api/users/addresses)'}
              </button>
            </form>
          </div>

          {/* Address List */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Saved Addresses ({addresses.length})</h3>
              </div>
              <button
                onClick={handleFetchAddresses}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${addressLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {addresses.length > 0 ? (
              <div className="space-y-3">
                {addresses.map(addr => (
                  <div key={addr.id} className="border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{addr.label}</span>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {addr.township_block}
                        </span>
                      </div>
                      {addr.is_default && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Default Address
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      {addr.landmark_description}
                    </p>
                    {addr.street_address && (
                      <p className="text-[11px] text-slate-400 mt-1 font-mono">
                        Stand / Street: {addr.street_address}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No addresses registered yet.</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Add an address with Soshanguve block and landmark to verify address management.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
