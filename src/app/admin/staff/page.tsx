'use client';

import React, { useState, useEffect, useCallback, useId } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  MessageSquare,
  Trash2,
  KeyRound,
  MoreVertical,
  X,
  Phone,
  Mail,
  Building,
  Clock,
  Sparkles,
  ShoppingBag,
  Truck,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Lock,
} from 'lucide-react';
import {
  getAdminSession,
  AdminUser,
  AdminRole,
  StaffMember,
  formatAdminRole,
} from '@/lib/adminAuth';

interface StaffStats {
  total: number;
  rolesCount: {
    super_admin: number;
    store_manager: number;
    dispatcher: number;
  };
  activeCount: number;
  suspendedCount: number;
}

function getDefaultAvatar(role: AdminRole): string {
  switch (role) {
    case 'super_admin':
      return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
    case 'store_manager':
      return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';
    case 'dispatcher':
      return 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80';
    default:
      return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80';
  }
}

export default function AdminStaffPage() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [stats, setStats] = useState<StaffStats>({
    total: 3,
    rolesCount: { super_admin: 1, store_manager: 1, dispatcher: 1 },
    activeCount: 3,
    suspendedCount: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLiveFromSupabase, setIsLiveFromSupabase] = useState<boolean>(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | AdminRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  // Creation Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<AdminRole>('store_manager');
  const [formDepartment, setFormDepartment] = useState('Merchandising & Catalog');
  const [formPhone, setFormPhone] = useState('');
  const [passwordMode, setPasswordMode] = useState<'auto' | 'custom'>('auto');
  const [customPassword, setCustomPassword] = useState('');
  const [showCustomPassword, setShowCustomPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Created Success Modal State (Shows temporary credentials slip)
  const [createdStaffSuccess, setCreatedStaffSuccess] = useState<{
    staff: StaffMember;
    temporaryPassword: string;
    waInviteUrl: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Edit / Action State
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Fetch live staff directory
  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/staff');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.staff)) {
          setStaffList(data.staff);
          setIsLiveFromSupabase(Boolean(data.isLiveFromSupabase));
          if (data.stats) {
            setStats(data.stats);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load staff list:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setCurrentUser(getAdminSession());
    fetchStaff();

    const handleAuthChange = (e: Event) => {
      const custom = e as CustomEvent<{ user: AdminUser | null }>;
      setCurrentUser(custom.detail?.user || null);
    };

    window.addEventListener('mc:admin-auth', handleAuthChange as EventListener);
    return () => {
      window.removeEventListener('mc:admin-auth', handleAuthChange as EventListener);
    };
  }, [fetchStaff]);

  // Lock body scroll for modals
  useEffect(() => {
    const hasOpenModal = isCreateOpen || !!createdStaffSuccess || isDeleteModalOpen || isResetPasswordModalOpen;
    if (hasOpenModal) {
      document.body.classList.add('locked');
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsCreateOpen(false);
          setCreatedStaffSuccess(null);
          setIsDeleteModalOpen(false);
          setIsResetPasswordModalOpen(false);
          setActionMenuId(null);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.classList.remove('locked');
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isCreateOpen, createdStaffSuccess, isDeleteModalOpen, isResetPasswordModalOpen]);

  // Auto-dismiss feedback toast
  useEffect(() => {
    if (!feedbackToast) return;
    const timer = setTimeout(() => setFeedbackToast(null), 4000);
    return () => clearTimeout(timer);
  }, [feedbackToast]);

  const isSuperAdmin = currentUser?.role === 'super_admin';

  // Handle department auto-fill when role changes in form
  const handleRoleChange = (newRole: AdminRole) => {
    setFormRole(newRole);
    if (newRole === 'super_admin') {
      setFormDepartment('Executive Operations');
    } else if (newRole === 'store_manager') {
      setFormDepartment('Merchandising & Catalog');
    } else if (newRole === 'dispatcher') {
      setFormDepartment('Abuja & Nationwide Logistics');
    }
  };

  // Submit staff creation
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim() || formName.trim().length < 2) {
      setFormError('Staff name must be at least 2 characters long.');
      return;
    }

    if (!formEmail.trim() || !formEmail.includes('@')) {
      setFormError('Please provide a valid administrative work email address.');
      return;
    }

    if (passwordMode === 'custom' && customPassword.length < 8) {
      setFormError('Custom initial password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        role: formRole,
        department: formDepartment.trim(),
        phone: formPhone.trim(),
      };

      if (passwordMode === 'custom' && customPassword) {
        payload.password = customPassword;
      }

      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFormError(data.error || 'Failed to create staff account.');
        return;
      }

      // Close create modal and open Success Credentials modal
      setIsCreateOpen(false);
      setCreatedStaffSuccess({
        staff: data.staff,
        temporaryPassword: data.temporaryPassword,
        waInviteUrl: data.waInviteUrl,
      });

      // Reset form
      setFormName('');
      setFormEmail('');
      setFormPhone('');
      setCustomPassword('');
      setPasswordMode('auto');

      // Refresh list
      fetchStaff();
    } catch (err: any) {
      setFormError(err.message || 'An unexpected error occurred while creating staff account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle staff member suspension status
  const handleToggleStatus = async (staff: StaffMember) => {
    const nextStatus = staff.status === 'active' ? 'suspended' : 'active';
    setIsActionLoading(true);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: staff.id, status: nextStatus }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbackToast({
          text: `Staff member ${staff.name} is now ${nextStatus.toUpperCase()}.`,
          type: 'success',
        });
        fetchStaff();
      } else {
        setFeedbackToast({ text: data.error || 'Failed to update status.', type: 'error' });
      }
    } catch (err: any) {
      setFeedbackToast({ text: err.message || 'Update request failed.', type: 'error' });
    } finally {
      setIsActionLoading(false);
      setActionMenuId(null);
    }
  };

  // Reset staff password
  const handleResetPassword = async () => {
    if (!selectedStaff) return;
    setIsActionLoading(true);

    const generatedPassword = newResetPassword || `MC!${Math.random().toString(36).substring(2, 6).toUpperCase()}#${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const res = await fetch('/api/admin/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedStaff.id,
          newPassword: generatedPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsResetPasswordModalOpen(false);
        setCreatedStaffSuccess({
          staff: selectedStaff,
          temporaryPassword: generatedPassword,
          waInviteUrl: `https://wa.me/?text=${encodeURIComponent(
            `Hello ${selectedStaff.name}, your MiCollections staff password has been reset.\n` +
            `Portal: https://micollection.vercel.app/admin/login\n` +
            `Email: ${selectedStaff.email}\n` +
            `New Temporary Password: ${generatedPassword}`
          )}`,
        });
        setNewResetPassword('');
      } else {
        setFeedbackToast({ text: data.error || 'Password reset failed.', type: 'error' });
      }
    } catch (err: any) {
      setFeedbackToast({ text: err.message || 'Password reset error.', type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Delete staff member
  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/admin/staff?id=${encodeURIComponent(selectedStaff.id)}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbackToast({
          text: `Staff access for ${selectedStaff.name} has been revoked and deleted.`,
          type: 'success',
        });
        setIsDeleteModalOpen(false);
        setSelectedStaff(null);
        fetchStaff();
      } else {
        setFeedbackToast({ text: data.error || 'Failed to revoke staff access.', type: 'error' });
      }
    } catch (err: any) {
      setFeedbackToast({ text: err.message || 'Delete request failed.', type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Filter staff list
  const filteredStaff = staffList.filter((s) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q)) ||
        formatAdminRole(s.role).toLowerCase().includes(q);
      if (!match) return false;
    }
    if (roleFilter !== 'all' && s.role !== roleFilter) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    return true;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const renderRoleBadge = (role: AdminRole) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-brand/20 to-orchid/20 text-brand border border-brand/30 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-brand" />
            Super Admin
          </span>
        );
      case 'store_manager':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-sm">
            <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />
            Store Manager
          </span>
        );
      case 'dispatcher':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm">
            <Truck className="w-3.5 h-3.5 text-emerald-500" />
            Dispatcher
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--surface2)] text-[var(--ink)] border border-[var(--line)]">
            Admin
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {feedbackToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-bottom-3 duration-200 border ${
            feedbackToast.type === 'success'
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
          }`}
        >
          {feedbackToast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          )}
          <span>{feedbackToast.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-brand-deep via-brand to-orchid p-6 sm:p-8 text-white shadow-xl shadow-brand/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white border border-white/20">
                <Shield className="w-3.5 h-3.5 text-yellow-300" />
                <span>Security & Team Access Control</span>
              </div>

              {isLiveFromSupabase && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/25 backdrop-blur-md text-xs font-bold text-emerald-200 border border-emerald-400/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Supabase Live Auth Sync</span>
                </div>
              )}
            </div>

            <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight">
              Staff & Role Management
            </h1>
            <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed">
              Provision administrative staff accounts, assign operational boundaries across catalog and dispatch, and control login security.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={fetchStaff}
              disabled={isLoading}
              className="px-3.5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs backdrop-blur-md border border-white/20 transition-all flex items-center gap-1.5"
              title="Refresh live staff directory"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {isSuperAdmin ? (
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-white text-brand font-bold text-xs shadow-lg hover:bg-purple-50 transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
              >
                <UserPlus className="w-4 h-4 text-orchid" />
                <span>Add Staff Member</span>
              </button>
            ) : (
              <div
                className="px-3.5 py-2 rounded-2xl bg-black/25 text-white/80 font-medium text-xs backdrop-blur-md border border-white/15 flex items-center gap-1.5"
                title="Super Admin required to add staff"
              >
                <Lock className="w-3.5 h-3.5 text-yellow-300" />
                <span>Super Admin Locked</span>
              </div>
            )}
          </div>
        </div>

        {/* Ambient background aura */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Staff */}
        <div className="rounded-2xl md:rounded-3xl p-5 backdrop-blur-xl bg-[var(--surface)] border border-[var(--line)] shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--mute)]">
              Total Staff
            </span>
            <span className="font-display font-extrabold text-2xl text-[var(--ink)] mt-1 block">
              {stats.total}
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              {stats.activeCount} active &bull; {stats.suspendedCount} suspended
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Super Admins */}
        <div className="rounded-2xl md:rounded-3xl p-5 backdrop-blur-xl bg-[var(--surface)] border border-[var(--line)] shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--mute)]">
              Super Admins
            </span>
            <span className="font-display font-extrabold text-2xl text-brand mt-1 block">
              {stats.rolesCount.super_admin}
            </span>
            <span className="text-[11px] text-[var(--mute)]">Executive privilege</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orchid/10 text-orchid flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Store Managers */}
        <div className="rounded-2xl md:rounded-3xl p-5 backdrop-blur-xl bg-[var(--surface)] border border-[var(--line)] shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--mute)]">
              Store Managers
            </span>
            <span className="font-display font-extrabold text-2xl text-blue-600 dark:text-blue-400 mt-1 block">
              {stats.rolesCount.store_manager}
            </span>
            <span className="text-[11px] text-[var(--mute)]">Catalog & orders desk</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Dispatchers */}
        <div className="rounded-2xl md:rounded-3xl p-5 backdrop-blur-xl bg-[var(--surface)] border border-[var(--line)] shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--mute)]">
              Dispatchers
            </span>
            <span className="font-display font-extrabold text-2xl text-emerald-600 dark:text-emerald-400 mt-1 block">
              {stats.rolesCount.dispatcher}
            </span>
            <span className="text-[11px] text-[var(--mute)]">Abuja courier & riders</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Role Permission Matrix Card */}
      <div className="p-5 rounded-3xl bg-[var(--surface)]/80 border border-[var(--line)] shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand" />
          <h3 className="font-display font-bold text-sm text-[var(--ink)]">
            Role Access Boundaries & Security Guidelines
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Super Admin */}
          <div className="p-4 rounded-2xl bg-brand/5 border border-brand/15 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-brand">Super Admin</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand/10 font-bold text-brand">
                Full Root
              </span>
            </div>
            <ul className="space-y-1 text-[var(--ink2)] text-[11px] list-disc list-inside">
              <li>Manage staff accounts & assign roles</li>
              <li>Financial analytics & executive GMV</li>
              <li>Store pause / 24-7 open control</li>
              <li>Direct database CRUD operations</li>
            </ul>
          </div>

          {/* Store Manager */}
          <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/15 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-600 dark:text-blue-400">Store Manager</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 font-bold text-blue-600">
                Merchandising
              </span>
            </div>
            <ul className="space-y-1 text-[var(--ink2)] text-[11px] list-disc list-inside">
              <li>Add and update product catalog</li>
              <li>Confirm orders & manage customer CRM</li>
              <li>Create promotional coupons & discounts</li>
              <li>Inventory restocking & low-stock alerts</li>
            </ul>
          </div>

          {/* Dispatcher */}
          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">Dispatcher</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 font-bold text-emerald-600">
                Fulfillment
              </span>
            </div>
            <ul className="space-y-1 text-[var(--ink2)] text-[11px] list-disc list-inside">
              <li>Access live dispatch & orders stream</li>
              <li>Mark orders dispatched or delivered</li>
              <li>Print packing slips & waybills</li>
              <li>Direct WhatsApp customer coordination</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Directory Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff by name, email, department..."
            className="w-full h-10 pl-10 pr-4 rounded-2xl bg-[var(--surface2)] border border-[var(--line)] text-xs text-[var(--ink)] placeholder:text-[var(--mute)] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-[var(--surface2)] border border-[var(--line)] text-xs font-semibold">
            {(['all', 'super_admin', 'store_manager', 'dispatcher'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1 rounded-xl transition-all ${
                  roleFilter === r
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-[var(--mute)] hover:text-[var(--ink)]'
                }`}
              >
                {r === 'all'
                  ? 'All Roles'
                  : r === 'super_admin'
                  ? 'Super Admins'
                  : r === 'store_manager'
                  ? 'Managers'
                  : 'Dispatchers'}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-10 px-3 rounded-2xl bg-[var(--surface2)] border border-[var(--line)] text-xs font-semibold text-[var(--ink)] outline-none focus:border-brand"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Staff Directory Table & Mobile Cards */}
      <div className="rounded-3xl bg-[var(--surface)] border border-[var(--line)] overflow-hidden shadow-sm">
        {/* Mobile View: Cards (< 768px) */}
        <div className="md:hidden divide-y divide-[var(--line)]">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-[var(--mute)]">
              <RefreshCw className="w-5 h-5 text-brand mx-auto mb-2 animate-spin" />
              <span>Loading staff directory...</span>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--mute)]">
              No staff members match the selected criteria.
            </div>
          ) : (
            filteredStaff.map((staff) => (
              <div key={staff.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={staff.avatar || getDefaultAvatar(staff.role)}
                      alt={staff.name}
                      className="w-10 h-10 rounded-2xl object-cover border border-[var(--line)] shadow-sm"
                    />
                    <div>
                      <div className="font-bold text-xs text-[var(--ink)] flex items-center gap-1.5">
                        <span>{staff.name}</span>
                        {currentUser?.id === staff.id && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-brand/10 text-brand font-bold">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[var(--mute)] flex items-center gap-1">
                        <Mail className="w-3 h-3 text-[var(--mute)]" /> {staff.email}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      staff.status === 'active'
                        ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        staff.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                      }`}
                    />
                    {staff.status === 'active' ? 'Active' : 'Suspended'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--line)]/60 text-xs">
                  <div>{renderRoleBadge(staff.role)}</div>
                  <span className="text-[11px] text-[var(--mute)]">{staff.department}</span>
                </div>

                {isSuperAdmin && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--line)]/40">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(staff)}
                      disabled={currentUser?.id === staff.id}
                      className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-[var(--surface2)] hover:bg-[var(--surface2)]/80 text-[var(--ink)] transition-colors disabled:opacity-40"
                    >
                      {staff.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStaff(staff);
                        setIsResetPasswordModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-brand/10 text-brand hover:bg-brand/20 transition-colors"
                    >
                      Reset Key
                    </button>

                    {currentUser?.id !== staff.id && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStaff(staff);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Delete staff"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table (>= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--surface2)]/60 text-[var(--mute)] font-bold uppercase tracking-wider text-[11px]">
                <th className="py-4 px-6">Staff Member</th>
                <th className="py-4 px-4">Role & Access</th>
                <th className="py-4 px-4">Department</th>
                <th className="py-4 px-4">Contact Phone</th>
                <th className="py-4 px-4">Account Status</th>
                <th className="py-4 px-4">Created Date</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] text-[var(--ink)]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[var(--mute)]">
                    <RefreshCw className="w-6 h-6 text-brand mx-auto mb-2 animate-spin" />
                    <span>Synchronizing staff directory with live Supabase Auth...</span>
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[var(--mute)]">
                    No staff members match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const isCurrent = currentUser?.id === staff.id;
                  return (
                    <tr
                      key={staff.id}
                      className="hover:bg-[var(--surface2)]/40 transition-colors group"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={staff.avatar || getDefaultAvatar(staff.role)}
                            alt={staff.name}
                            className="w-9 h-9 rounded-2xl object-cover border border-[var(--line)] shadow-sm flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-[var(--ink)] flex items-center gap-1.5">
                              <span className="truncate">{staff.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-brand/10 text-brand font-bold">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[var(--mute)] truncate block">
                              {staff.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderRoleBadge(staff.role)}
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 text-xs text-[var(--ink2)] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-[var(--mute)]" />
                          <span>{staff.department}</span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 text-xs text-[var(--ink2)] whitespace-nowrap">
                        {staff.phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-brand" />
                            <span>{staff.phone}</span>
                          </div>
                        ) : (
                          <span className="text-[var(--mute)] italic">None</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            staff.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              staff.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                            }`}
                          />
                          {staff.status === 'active' ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-[11px] text-[var(--mute)] whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[var(--mute)]" />
                          <span>{new Date(staff.createdAt).toLocaleDateString('en-GB')}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {staff.phone && (
                            <a
                              href={`https://wa.me/${staff.phone.replace(/^0/, '234').replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-xl text-[var(--mute)] hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </a>
                          )}

                          {isSuperAdmin && (
                            <>
                              {/* Toggle active / suspend */}
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(staff)}
                                disabled={isCurrent || isActionLoading}
                                className={`p-1.5 rounded-xl transition-colors ${
                                  staff.status === 'active'
                                    ? 'text-[var(--mute)] hover:text-amber-500 hover:bg-amber-500/10'
                                    : 'text-emerald-500 hover:bg-emerald-500/10'
                                } disabled:opacity-30`}
                                title={staff.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
                              >
                                {staff.status === 'active' ? (
                                  <UserX className="w-4 h-4" />
                                ) : (
                                  <UserCheck className="w-4 h-4" />
                                )}
                              </button>

                              {/* Reset password */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStaff(staff);
                                  setIsResetPasswordModalOpen(true);
                                }}
                                className="p-1.5 rounded-xl text-[var(--mute)] hover:text-brand hover:bg-brand/10 transition-colors"
                                title="Reset Temporary Password"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>

                              {/* Delete staff */}
                              {!isCurrent && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedStaff(staff);
                                    setIsDeleteModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-xl text-[var(--mute)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                  title="Revoke & Delete Staff Access"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ====================================================================
          1. CREATE STAFF MODAL
          ==================================================================== */}
      {isCreateOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add New Staff Member"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreateOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-2xl p-6 sm:p-7 relative overflow-hidden animate-in zoom-in-95 duration-200"
            style={{ boxShadow: 'var(--shadow)' }}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--line)]">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <h3 className="font-display font-black text-xl text-[var(--ink)]">
                    Provision New Staff Member
                  </h3>
                </div>
                <p className="text-xs text-[var(--mute)] mt-1">
                  Creates an authorized administrative staff user with operational role boundaries.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-full hover:bg-[var(--surface2)] text-[var(--mute)] hover:text-[var(--ink)] transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error alert */}
            {formError && (
              <div className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleCreateStaff} className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--mute)] mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Aisha Garba"
                  className="w-full h-11 px-4 rounded-2xl bg-[var(--surface2)] border border-[var(--line)] text-xs text-[var(--ink)] placeholder:text-[var(--mute)] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                />
              </div>

              {/* Work Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--mute)] mb-1.5">
                  Administrative Email *
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="e.g. aisha@micollections.com"
                  className="w-full h-11 px-4 rounded-2xl bg-[var(--surface2)] border border-[var(--line)] text-xs text-[var(--ink)] placeholder:text-[var(--mute)] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                />
              </div>

              {/* Role Selection Cards */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--mute)] mb-2">
                  Select Role & Operational Boundaries *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Super Admin */}
                  <div
                    onClick={() => handleRoleChange('super_admin')}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      formRole === 'super_admin'
                        ? 'bg-brand/10 border-brand shadow-sm ring-2 ring-brand/20'
                        : 'bg-[var(--surface2)]/50 border-[var(--line)] hover:border-brand/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <ShieldCheck className="w-4 h-4 text-brand" />
                      <input
                        type="radio"
                        checked={formRole === 'super_admin'}
                        onChange={() => handleRoleChange('super_admin')}
                        className="accent-brand"
                      />
                    </div>
                    <div className="font-bold text-xs text-[var(--ink)]">Super Admin</div>
                    <div className="text-[10px] text-[var(--mute)] mt-0.5 leading-tight">
                      Full Root & Staff Management
                    </div>
                  </div>

                  {/* Store Manager */}
                  <div
                    onClick={() => handleRoleChange('store_manager')}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      formRole === 'store_manager'
                        ? 'bg-blue-500/10 border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                        : 'bg-[var(--surface2)]/50 border-[var(--line)] hover:border-blue-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <ShoppingBag className="w-4 h-4 text-blue-500" />
                      <input
                        type="radio"
                        checked={formRole === 'store_manager'}
                        onChange={() => handleRoleChange('store_manager')}
                        className="accent-blue-500"
                      />
                    </div>
                    <div className="font-bold text-xs text-[var(--ink)]">Store Manager</div>
                    <div className="text-[10px] text-[var(--mute)] mt-0.5 leading-tight">
                      Catalog, CRM & Orders
                    </div>
                  </div>

                  {/* Dispatcher */}
                  <div
                    onClick={() => handleRoleChange('dispatcher')}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      formRole === 'dispatcher'
                        ? 'bg-emerald-500/10 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                        : 'bg-[var(--surface2)]/50 border-[var(--line)] hover:border-emerald-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Truck className="w-4 h-4 text-emerald-500" />
                      <input
                        type="radio"
                        checked={formRole === 'dispatcher'}
                        onChange={() => handleRoleChange('dispatcher')}
                        className="accent-emerald-500"
                      />
                    </div>
                    <div className="font-bold text-xs text-[var(--ink)]">Dispatcher</div>
                    <div className="text-[10px] text-[var(--mute)] mt-0.5 leading-tight">
                      Logistics & Doorstep Delivery
                    </div>
                  </div>
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--mute)] mb-1.5">
                  Department / Office
                </label>
                <input
                  type="text"
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                  placeholder="e.g. Merchandising & Catalog"
                  className="w-full h-11 px-4 rounded-2xl bg-[var(--surface2)] border border-[var(--line)] text-xs text-[var(--ink)] placeholder:text-[var(--mute)] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                />
              </div>

              {/* Phone (WhatsApp) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--mute)] mb-1.5">
                  Phone Number (for WhatsApp Invite)
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="e.g. 0812 345 6789"
                  className="w-full h-11 px-4 rounded-2xl bg-[var(--surface2)] border border-[var(--line)] text-xs text-[var(--ink)] placeholder:text-[var(--mute)] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                />
              </div>

              {/* Initial Password Configuration */}
              <div className="pt-2 border-t border-[var(--line)] space-y-2.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--mute)]">
                  Initial Authentication Password
                </label>

                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[var(--ink)]">
                    <input
                      type="radio"
                      name="passwordMode"
                      checked={passwordMode === 'auto'}
                      onChange={() => setPasswordMode('auto')}
                      className="accent-brand"
                    />
                    <span>Auto-generate secure key (Recommended)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[var(--ink)]">
                    <input
                      type="radio"
                      name="passwordMode"
                      checked={passwordMode === 'custom'}
                      onChange={() => setPasswordMode('custom')}
                      className="accent-brand"
                    />
                    <span>Set manual initial key</span>
                  </label>
                </div>

                {passwordMode === 'custom' && (
                  <div className="relative mt-2">
                    <input
                      type={showCustomPassword ? 'text' : 'password'}
                      value={customPassword}
                      onChange={(e) => setCustomPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full h-11 pl-4 pr-10 rounded-2xl bg-[var(--surface2)] border border-[var(--line)] text-xs text-[var(--ink)] placeholder:text-[var(--mute)] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCustomPassword(!showCustomPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)]"
                    >
                      {showCustomPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-[var(--line)] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-[var(--mute)] hover:bg-[var(--surface2)] hover:text-[var(--ink)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-2xl bg-brand hover:bg-brand-deep text-white font-bold text-xs shadow-md shadow-brand/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Provisioning Staff...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Confirm & Provision Staff</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          2. CREATED SUCCESS CREDENTIALS MODAL (1-Click Copy & WhatsApp Share)
          ==================================================================== */}
      {createdStaffSuccess && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Staff Credentials Slip"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCreatedStaffSuccess(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            className="w-full max-w-md rounded-3xl bg-[var(--surface)] border border-brand/30 shadow-2xl p-6 sm:p-7 relative overflow-hidden animate-in zoom-in-95 duration-200 text-center"
            style={{ boxShadow: 'var(--shadow)' }}
          >
            {/* Header Badge */}
            <div className="w-14 h-14 rounded-3xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="font-display font-black text-xl text-[var(--ink)]">
              Staff Account Ready!
            </h3>
            <p className="text-xs text-[var(--mute)] mt-1 max-w-xs mx-auto">
              Account has been provisioned in live Supabase Auth with operational role credentials.
            </p>

            {/* Credentials Card */}
            <div className="my-5 p-4 rounded-2xl bg-[var(--surface2)] border border-[var(--line)] text-left space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5">
                <span className="text-[11px] text-[var(--mute)] font-medium">Staff Member</span>
                <span className="text-xs font-bold text-[var(--ink)]">
                  {createdStaffSuccess.staff.name}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5">
                <span className="text-[11px] text-[var(--mute)] font-medium">Login Email</span>
                <span className="text-xs font-mono font-bold text-brand">
                  {createdStaffSuccess.staff.email}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5">
                <span className="text-[11px] text-[var(--mute)] font-medium">Assigned Role</span>
                {renderRoleBadge(createdStaffSuccess.staff.role)}
              </div>

              {/* Temporary Password Highlight Box */}
              <div className="pt-1">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--mute)] mb-1">
                  Temporary Key (One-Time Display)
                </span>
                <div className="p-3 rounded-xl bg-brand/10 border border-brand/25 flex items-center justify-between">
                  <span className="font-mono font-black text-sm text-brand tracking-wider select-all">
                    {createdStaffSuccess.temporaryPassword}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdStaffSuccess.temporaryPassword)}
                    className="p-1.5 rounded-lg bg-white/80 dark:bg-black/50 text-[var(--ink)] hover:text-brand transition-colors flex items-center gap-1 text-[11px] font-semibold"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <a
                href={createdStaffSuccess.waInviteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <MessageSquare className="w-4 h-4 fill-white" />
                <span>Send Credentials via WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => setCreatedStaffSuccess(null)}
                className="w-full py-2.5 px-4 rounded-2xl text-xs font-semibold text-[var(--mute)] hover:bg-[var(--surface2)] hover:text-[var(--ink)] transition-colors"
              >
                Done / Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          3. RESET PASSWORD MODAL
          ==================================================================== */}
      {isResetPasswordModalOpen && selectedStaff && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Reset Staff Password"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsResetPasswordModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            className="w-full max-w-md rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-2xl p-6 relative overflow-hidden animate-in zoom-in-95 duration-200"
            style={{ boxShadow: 'var(--shadow)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[var(--ink)]">
                  Reset Password for {selectedStaff.name}
                </h3>
                <span className="text-[11px] text-[var(--mute)]">{selectedStaff.email}</span>
              </div>
            </div>

            <p className="text-xs text-[var(--ink2)] mb-4 leading-relaxed">
              Generate a new temporary authentication key. The staff member will use this key to regain portal access.
            </p>

            <div className="mb-5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--mute)] mb-1.5">
                New Custom Password (Optional)
              </label>
              <input
                type="text"
                value={newResetPassword}
                onChange={(e) => setNewResetPassword(e.target.value)}
                placeholder="Leave blank to auto-generate secure key"
                className="w-full h-11 px-4 rounded-2xl bg-[var(--surface2)] border border-[var(--line)] text-xs text-[var(--ink)] placeholder:text-[var(--mute)] outline-none focus:border-brand"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => setIsResetPasswordModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--mute)] hover:bg-[var(--surface2)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={isActionLoading}
                className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-deep text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isActionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Generate New Key</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          4. DELETE / REVOKE CONFIRMATION MODAL
          ==================================================================== */}
      {isDeleteModalOpen && selectedStaff && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Revoke Staff Access"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDeleteModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            className="w-full max-w-md rounded-3xl bg-[var(--surface)] border border-rose-500/30 shadow-2xl p-6 relative overflow-hidden animate-in zoom-in-95 duration-200"
            style={{ boxShadow: 'var(--shadow)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[var(--ink)]">
                  Revoke Staff Access?
                </h3>
                <span className="text-[11px] text-[var(--mute)]">{selectedStaff.email}</span>
              </div>
            </div>

            <p className="text-xs text-[var(--ink2)] mb-4 leading-relaxed">
              Are you sure you want to revoke administrative access for <strong>{selectedStaff.name}</strong> ({formatAdminRole(selectedStaff.role)})? This permanently deletes their authentication credentials from live Supabase Auth.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--mute)] hover:bg-[var(--surface2)]"
              >
                Keep Staff
              </button>
              <button
                type="button"
                onClick={handleDeleteStaff}
                disabled={isActionLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isActionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Revoke & Delete Access</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
