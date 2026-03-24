import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { adminService } from '../services/adminService';

const formatDateTime = (value) => {
  if (!value) {
    return 'Never';
  }

  try {
    return new Date(value).toLocaleString();
  } catch (_error) {
    return String(value);
  }
};

const formatAuditChanges = (changes) => {
  if (!changes) {
    return 'No audit payload';
  }

  if (typeof changes === 'string') {
    return changes;
  }

  return JSON.stringify(changes, null, 2);
};

const emptyFormState = {
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  subscriptionTier: 'free',
  emailVerified: false,
  deleted: false,
};

const getVisiblePageNumbers = (currentPage, totalPages) => {
  const maxButtons = 5;

  if (totalPages <= maxButtons) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const halfWindow = Math.floor(maxButtons / 2);
  let start = Math.max(1, currentPage - halfWindow);
  let end = Math.min(totalPages, start + maxButtons - 1);

  if (end - start + 1 < maxButtons) {
    start = Math.max(1, end - maxButtons + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

const AdminPage = () => {
  const currentUser = useAuthStore((state) => state.user);
  const updateCurrentUser = useAuthStore((state) => state.updateUser);

  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [formState, setFormState] = useState(emptyFormState);
  const [newPassword, setNewPassword] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [revokingSessions, setRevokingSessions] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const totalUsers = pagination?.total || 0;
  const totalPages = Math.max(1, pagination?.totalPages || 1);
  const activePage = pagination?.page || currentPage;
  const activePageSize = pagination?.pageSize || pageSize;
  const firstVisibleUserIndex = totalUsers === 0 ? 0 : ((activePage - 1) * activePageSize) + 1;
  const lastVisibleUserIndex = totalUsers === 0 ? 0 : Math.min(totalUsers, firstVisibleUserIndex + users.length - 1);

  const visiblePageNumbers = useMemo(
    () => getVisiblePageNumbers(activePage, totalPages),
    [activePage, totalPages]
  );

  const loadUsers = async ({
    searchValue = deferredSearch,
    preferredUserId = selectedUserId,
    pageValue = currentPage,
    pageSizeValue = pageSize,
  } = {}) => {
    setLoadingUsers(true);
    setErrorMessage('');

    try {
      const result = await adminService.listUsers({
        search: searchValue || undefined,
        page: pageValue,
        pageSize: pageSizeValue,
      });

      if (result.pagination && pageValue > result.pagination.totalPages) {
        setCurrentPage(result.pagination.totalPages);
        return;
      }

      setUsers(result.users);
      setPagination(result.pagination);

      const nextSelectedUserId = result.users.some((user) => user.id === preferredUserId)
        ? preferredUserId
        : result.users[0]?.id || null;

      setSelectedUserId(nextSelectedUserId);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load users.');
      setUsers([]);
      setPagination(null);
      setSelectedUserId(null);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadUserDetail = async (userId) => {
    if (!userId) {
      setUserDetail(null);
      setFormState(emptyFormState);
      return;
    }

    setLoadingUserDetail(true);
    setErrorMessage('');

    try {
      const detail = await adminService.getUser(userId);
      setUserDetail(detail);
      setFormState({
        email: detail.user.email || '',
        firstName: detail.user.firstName || '',
        lastName: detail.user.lastName || '',
        phone: detail.user.phone || '',
        subscriptionTier: detail.user.subscriptionTier || 'free',
        emailVerified: Boolean(detail.user.emailVerified),
        deleted: Boolean(detail.user.deletedAt),
      });
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load user details.');
      setUserDetail(null);
      setFormState(emptyFormState);
    } finally {
      setLoadingUserDetail(false);
    }
  };

  useEffect(() => {
    loadUsers({
      searchValue: deferredSearch,
      pageValue: currentPage,
      pageSizeValue: pageSize,
    });
  }, [deferredSearch, currentPage, pageSize]);

  useEffect(() => {
    loadUserDetail(selectedUserId);
  }, [selectedUserId]);

  const handleFieldChange = (field, value) => {
    setFormState((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === currentPage) {
      return;
    }

    setCurrentPage(nextPage);
  };

  const handlePageSizeChange = (event) => {
    const nextPageSize = Number(event.target.value) || 25;
    setPageSize(nextPageSize);
    setCurrentPage(1);
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    if (!selectedUserId) {
      return;
    }

    setSavingProfile(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const payload = {
        email: formState.email,
        firstName: formState.firstName || null,
        lastName: formState.lastName || null,
        phone: formState.phone || null,
        subscriptionTier: formState.subscriptionTier,
        emailVerified: formState.emailVerified,
        deleted: formState.deleted,
      };

      await adminService.updateUser(selectedUserId, payload);
      await loadUsers({
        searchValue: deferredSearch,
        preferredUserId: selectedUserId,
        pageValue: currentPage,
        pageSizeValue: pageSize,
      });
      await loadUserDetail(selectedUserId);

      if (selectedUserId === currentUser?.id) {
        updateCurrentUser({
          email: payload.email,
          firstName: payload.firstName,
          lastName: payload.lastName,
          subscriptionTier: payload.subscriptionTier,
        });
      }

      setSuccessMessage('User profile updated.');
    } catch (error) {
      setErrorMessage(error.message || 'Failed to update user.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();

    if (!selectedUserId) {
      return;
    }

    setUpdatingPassword(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result = await adminService.setUserPassword(selectedUserId, newPassword);
      setNewPassword('');
      await loadUserDetail(selectedUserId);
      setSuccessMessage(`Password updated and ${result.revokedSessions} session(s) revoked.`);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to update password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleRevokeSessions = async () => {
    if (!selectedUserId) {
      return;
    }

    setRevokingSessions(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result = await adminService.revokeUserSessions(selectedUserId);
      await loadUserDetail(selectedUserId);
      await loadUsers({
        searchValue: deferredSearch,
        preferredUserId: selectedUserId,
        pageValue: currentPage,
        pageSizeValue: pageSize,
      });
      setSuccessMessage(`${result.revokedSessions} active session(s) revoked.`);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to revoke sessions.');
    } finally {
      setRevokingSessions(false);
    }
  };

  return (
    <div className="min-h-screen animated-bg paper-texture relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 h-48 w-48 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-64 w-64 rounded-full bg-pink-400/15 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="glass-strong rounded-3xl p-6 mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Admin Console</p>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-pink-600 bg-clip-text text-transparent">
                User Operations
              </h1>
              <p className="mt-2 text-gray-700 dark:text-gray-300">
                Securely inspect users, revoke sessions, review activity, and perform controlled account changes.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="glass rounded-2xl px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                Signed in as <span className="font-semibold">{currentUser?.email || 'admin'}</span>
              </div>
              <Link
                to="/dashboard/analysis"
                className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Back To Dashboard
              </Link>
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="glass-strong rounded-3xl p-5">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200" htmlFor="admin-search">
              Search users
            </label>
            <input
              id="admin-search"
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Email, name, phone"
              className="mt-3 w-full rounded-2xl border border-white/20 bg-white/70 px-4 py-3 text-gray-900 outline-none ring-0 transition focus:border-cyan-400 dark:bg-slate-900/60 dark:text-white"
            />
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              {pagination
                ? totalUsers === 0
                  ? 'No users found'
                  : `Showing ${firstVisibleUserIndex}-${lastVisibleUserIndex} of ${totalUsers} user(s)`
                : 'Search the full user directory'}
            </p>

            <div className="mt-5 space-y-3">
              {loadingUsers && (
                <div className="rounded-2xl border border-dashed border-white/20 px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  Loading users...
                </div>
              )}

              {!loadingUsers && users.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/20 px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No users match this search.
                </div>
              )}

              {!loadingUsers && users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setSelectedUserId(user.id)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                    selectedUserId === user.id
                      ? 'border-cyan-500 bg-cyan-500/10 shadow-lg'
                      : 'border-white/15 bg-white/50 hover:border-cyan-300 hover:bg-white/70 dark:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {user.email}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'No name set'}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                      {user.subscriptionTier}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
                    <div>Analyses: {user.counts.analyses}</div>
                    <div>Sessions: {user.counts.refreshSessions}</div>
                    <div>Resumes: {user.counts.resumes}</div>
                    <div>AI Usage: {user.counts.aiUsage}</div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                    {user.deletedAt && <span className="rounded-full bg-red-500/15 px-2 py-1 text-red-700 dark:text-red-300">Deleted</span>}
                    {user.emailVerified && <span className="rounded-full bg-green-500/15 px-2 py-1 text-green-700 dark:text-green-300">Verified</span>}
                    <span>Last login: {formatDateTime(user.lastLoginAt)}</span>
                  </div>
                </button>
              ))}
            </div>

            {!loadingUsers && pagination && (
              <div className="mt-5 space-y-3 border-t border-white/15 pt-4">
                <div className="flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <span>Rows per page</span>
                    <select
                      value={pageSize}
                      onChange={handlePageSizeChange}
                      className="rounded-xl border border-white/20 bg-white/70 px-2 py-1 text-gray-900 outline-none transition focus:border-cyan-400 dark:bg-slate-900/60 dark:text-white"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  <span>Page {activePage} of {totalPages}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(activePage - 1)}
                    disabled={activePage <= 1}
                    className="rounded-xl border border-white/20 bg-white/60 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-cyan-300 hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-900/50 dark:text-gray-200"
                  >
                    Previous
                  </button>

                  {visiblePageNumbers.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => handlePageChange(pageNumber)}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                        pageNumber === activePage
                          ? 'border-cyan-500 bg-cyan-500/15 text-cyan-800 dark:text-cyan-200'
                          : 'border-white/20 bg-white/60 text-gray-700 hover:border-cyan-300 hover:bg-white/80 dark:bg-slate-900/50 dark:text-gray-200'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => handlePageChange(activePage + 1)}
                    disabled={activePage >= totalPages}
                    className="rounded-xl border border-white/20 bg-white/60 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-cyan-300 hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-900/50 dark:text-gray-200"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {errorMessage && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
                {successMessage}
              </div>
            )}

            {loadingUserDetail && (
              <div className="glass-strong rounded-3xl p-10 text-center text-sm text-gray-500 dark:text-gray-400">
                Loading selected user...
              </div>
            )}

            {!loadingUserDetail && !userDetail && (
              <div className="glass-strong rounded-3xl p-10 text-center text-sm text-gray-500 dark:text-gray-400">
                Select a user to inspect account details, sessions, usage, and audit activity.
              </div>
            )}

            {!loadingUserDetail && userDetail && (
              <>
                <div className="glass-strong rounded-3xl p-6">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {userDetail.user.email}
                      </h2>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        Created {formatDateTime(userDetail.user.createdAt)} • Last login {formatDateTime(userDetail.user.lastLoginAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                        {userDetail.user.subscriptionTier}
                      </span>
                      {userDetail.user.deletedAt && (
                        <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-700 dark:text-red-300">
                          Soft Deleted
                        </span>
                      )}
                      {userDetail.user.emailVerified && (
                        <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-300">
                          Email Verified
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                    <div className="rounded-2xl bg-white/70 p-4 dark:bg-slate-900/50">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Resumes</p>
                      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{userDetail.user.counts.resumes}</p>
                    </div>
                    <div className="rounded-2xl bg-white/70 p-4 dark:bg-slate-900/50">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Analyses</p>
                      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{userDetail.user.counts.analyses}</p>
                    </div>
                    <div className="rounded-2xl bg-white/70 p-4 dark:bg-slate-900/50">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Job Descriptions</p>
                      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{userDetail.user.counts.jobDescriptions}</p>
                    </div>
                    <div className="rounded-2xl bg-white/70 p-4 dark:bg-slate-900/50">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">AI Usage Records</p>
                      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{userDetail.user.counts.aiUsage}</p>
                    </div>
                    <div className="rounded-2xl bg-white/70 p-4 dark:bg-slate-900/50">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Sessions</p>
                      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{userDetail.user.counts.refreshSessions}</p>
                    </div>
                    <div className="rounded-2xl bg-white/70 p-4 dark:bg-slate-900/50">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Analyses Today</p>
                      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{userDetail.user.analysesRunToday}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                  <form onSubmit={handleSaveProfile} className="glass-strong rounded-3xl p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">User Profile</h3>
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="rounded-2xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingProfile ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Email
                        <input
                          type="email"
                          value={formState.email}
                          onChange={(event) => handleFieldChange('email', event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-white/20 bg-white/70 px-4 py-3 text-gray-900 outline-none transition focus:border-cyan-400 dark:bg-slate-900/60 dark:text-white"
                        />
                      </label>

                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Phone
                        <input
                          type="text"
                          value={formState.phone}
                          onChange={(event) => handleFieldChange('phone', event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-white/20 bg-white/70 px-4 py-3 text-gray-900 outline-none transition focus:border-cyan-400 dark:bg-slate-900/60 dark:text-white"
                        />
                      </label>

                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        First Name
                        <input
                          type="text"
                          value={formState.firstName}
                          onChange={(event) => handleFieldChange('firstName', event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-white/20 bg-white/70 px-4 py-3 text-gray-900 outline-none transition focus:border-cyan-400 dark:bg-slate-900/60 dark:text-white"
                        />
                      </label>

                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Last Name
                        <input
                          type="text"
                          value={formState.lastName}
                          onChange={(event) => handleFieldChange('lastName', event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-white/20 bg-white/70 px-4 py-3 text-gray-900 outline-none transition focus:border-cyan-400 dark:bg-slate-900/60 dark:text-white"
                        />
                      </label>

                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Subscription Tier
                        <select
                          value={formState.subscriptionTier}
                          onChange={(event) => handleFieldChange('subscriptionTier', event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-white/20 bg-white/70 px-4 py-3 text-gray-900 outline-none transition focus:border-cyan-400 dark:bg-slate-900/60 dark:text-white"
                        >
                          <option value="free">free</option>
                          <option value="pro">pro</option>
                          <option value="enterprise">enterprise</option>
                          <option value="admin">admin</option>
                        </select>
                      </label>

                      <div className="rounded-2xl border border-white/15 bg-white/60 p-4 dark:bg-slate-900/40">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Account State</p>
                        <label className="mt-4 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                          <input
                            type="checkbox"
                            checked={formState.emailVerified}
                            onChange={(event) => handleFieldChange('emailVerified', event.target.checked)}
                          />
                          Email verified
                        </label>
                        <label className="mt-3 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                          <input
                            type="checkbox"
                            checked={formState.deleted}
                            onChange={(event) => handleFieldChange('deleted', event.target.checked)}
                          />
                          Soft delete account
                        </label>
                      </div>
                    </div>
                  </form>

                  <div className="space-y-6">
                    <form onSubmit={handleResetPassword} className="glass-strong rounded-3xl p-6">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Password Reset</h3>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        Passwords remain non-recoverable. Admins can only set a new password and revoke sessions.
                      </p>
                      <label className="mt-4 block text-sm font-medium text-gray-700 dark:text-gray-200">
                        New Password
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(event) => setNewPassword(event.target.value)}
                          minLength={8}
                          autoComplete="new-password"
                          className="mt-2 w-full rounded-2xl border border-white/20 bg-white/70 px-4 py-3 text-gray-900 outline-none transition focus:border-cyan-400 dark:bg-slate-900/60 dark:text-white"
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={updatingPassword || !newPassword}
                        className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {updatingPassword ? 'Updating Password...' : 'Set New Password'}
                      </button>
                    </form>

                    <div className="glass-strong rounded-3xl p-6">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Sessions</h3>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        Force all active refresh sessions to expire and require the user to sign in again.
                      </p>
                      <button
                        type="button"
                        onClick={handleRevokeSessions}
                        disabled={revokingSessions}
                        className="mt-4 w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {revokingSessions ? 'Revoking Sessions...' : 'Revoke All Sessions'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="glass-strong rounded-3xl p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Analyses</h3>
                    <div className="mt-4 space-y-3">
                      {userDetail.recentAnalyses.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No analyses recorded.</p>
                      )}
                      {userDetail.recentAnalyses.map((analysis) => (
                        <div key={analysis.id} className="rounded-2xl bg-white/70 p-4 dark:bg-slate-900/50">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-gray-900 dark:text-white">{analysis.analysisType}</p>
                            <span className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">{analysis.status}</span>
                          </div>
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                            {analysis.aiProvider || 'Unknown provider'} / {analysis.modelUsed || 'Unknown model'}
                          </p>
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Created {formatDateTime(analysis.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-strong rounded-3xl p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Resume Activity</h3>
                    <div className="mt-4 space-y-3">
                      {userDetail.recentResumes.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No resumes recorded.</p>
                      )}
                      {userDetail.recentResumes.map((resume) => (
                        <div key={resume.id} className="rounded-2xl bg-white/70 p-4 dark:bg-slate-900/50">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-gray-900 dark:text-white">{resume.title}</p>
                            <span className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">{resume.status}</span>
                          </div>
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Updated {formatDateTime(resume.updatedAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-strong rounded-3xl p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Job Descriptions</h3>
                    <div className="mt-4 space-y-3">
                      {userDetail.recentJobDescriptions.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No job descriptions recorded.</p>
                      )}
                      {userDetail.recentJobDescriptions.map((jobDescription) => (
                        <div key={jobDescription.id} className="rounded-2xl bg-white/70 p-4 dark:bg-slate-900/50">
                          <p className="font-semibold text-gray-900 dark:text-white">{jobDescription.title}</p>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                            {jobDescription.company || 'No company'} • {jobDescription.location || 'No location'}
                          </p>
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Updated {formatDateTime(jobDescription.updatedAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-strong rounded-3xl p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Sessions And AI Usage</h3>
                    <div className="mt-4 space-y-3">
                      {userDetail.recentSessions.map((session) => (
                        <div key={session.id} className="rounded-2xl bg-white/70 p-4 dark:bg-slate-900/50">
                          <p className="font-semibold text-gray-900 dark:text-white">Session {session.id.slice(0, 8)}</p>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                            Created {formatDateTime(session.createdAt)} • Expires {formatDateTime(session.expiresAt)}
                          </p>
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {session.revokedAt ? `Revoked ${formatDateTime(session.revokedAt)}` : 'Active until revoked or expired'}
                          </p>
                        </div>
                      ))}
                      {userDetail.recentAiUsage.map((usage) => (
                        <div key={usage.id} className="rounded-2xl bg-white/70 p-4 dark:bg-slate-900/50">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-gray-900 dark:text-white">{usage.feature}</p>
                            <span className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">{usage.aiProvider}</span>
                          </div>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                            {usage.tokensUsed || 0} tokens • Cost {usage.estimatedCost || 'n/a'} • {usage.responseTimeMs || 0} ms
                          </p>
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Logged {formatDateTime(usage.createdAt)}
                          </p>
                        </div>
                      ))}
                      {userDetail.recentSessions.length === 0 && userDetail.recentAiUsage.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No recent sessions or AI usage recorded.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="glass-strong rounded-3xl p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Audit Trail</h3>
                  <div className="mt-4 space-y-4">
                    {userDetail.recentAuditLogs.length === 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No audit trail entries recorded yet.</p>
                    )}
                    {userDetail.recentAuditLogs.map((entry) => (
                      <div key={entry.id} className="rounded-2xl bg-white/70 p-4 dark:bg-slate-900/50">
                        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{entry.action}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Entity {entry.entityType || 'n/a'} / {entry.entityId || 'n/a'} • Actor {entry.userId || 'unknown'}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDateTime(entry.createdAt)}
                          </p>
                        </div>
                        <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-cyan-100">
                          {formatAuditChanges(entry.changes)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
