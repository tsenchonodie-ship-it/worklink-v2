import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  BriefcaseBusiness,
  CalendarCheck,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Moon,
  ReceiptText,
  Settings2,
  Star,
  Sun,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, apiMessage } from '../api/client';

function StatCard({ icon: Icon, label, value }) {
  return (
    <article className="glass-card p-5 shadow-[0_20px_60px_rgba(2,8,23,0.35)]">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-400/20 text-blue-300">
        <Icon size={20} />
      </div>
      <p className="text-sm text-slate-400">{label}</p>
      <strong className="mt-1 block text-2xl font-semibold text-white">{value}</strong>
    </article>
  );
}

function Panel({ title, children }) {
  return (
    <section className="glass-card p-5 shadow-[0_20px_60px_rgba(2,8,23,0.35)]">
      <h2 className="mb-4 text-xl font-black text-white">{title}</h2>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

function ReviewStars({ rating }) {
  const total = 5;
  return (
    <div className="flex items-center gap-1 text-amber-400" aria-label={`${rating} out of ${total} stars`}>
      {Array.from({ length: total }, (_, index) => (
        <Star key={index} size={16} fill={index < rating ? 'currentColor' : 'none'} />
      ))}
    </div>
  );
}

const fallbackWorkerData = {
  overview: {
    totalJobsCompleted: 128,
    activeJobs: 7,
    pendingRequests: 4,
    totalEarnings: 248500,
    averageRating: 4.8,
  },
  recentActivity: [
    { id: 1, title: 'Plumbing job completed', meta: 'Aisha Khan • 2 hours ago', tone: 'success' },
    { id: 2, title: 'New booking request received', meta: 'Meera Rao • Today, 09:15', tone: 'pending' },
    { id: 3, title: 'Profile updated', meta: 'Service availability refreshed', tone: 'info' },
  ],
  reviews: [
    { id: 1, rating: 5, comment: 'Excellent work and great communication. The job was completed on time.', customer: { full_name: 'Aisha Khan' }, created_at: '2026-07-20T10:00:00Z' },
    { id: 2, rating: 4, comment: 'Very professional and friendly. Would recommend again.', customer: { full_name: 'Meera Rao' }, created_at: '2026-07-19T16:45:00Z' },
  ],
  notifications: [
    { id: 1, title: 'New booking request', message: 'A new booking has been requested for tomorrow morning.', type: 'booking_request', read_at: null, created_at: '2026-07-21T08:30:00Z' },
    { id: 2, title: 'Payment received', message: 'Payment for booking #221 was received successfully.', type: 'payment_received', read_at: '2026-07-21T07:00:00Z', created_at: '2026-07-21T06:55:00Z' },
  ],
};

function WorkerDashboardLayout({ title, activeView, onSelect, theme, onThemeChange, children }) {
  const { user, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const currentTheme = theme || 'dark';

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', currentTheme);
    document.body.classList.toggle('theme-light', currentTheme === 'light');
    document.body.classList.toggle('theme-dark', currentTheme === 'dark');
  }, [currentTheme]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'jobs', label: 'My Jobs', icon: BriefcaseBusiness },
    { id: 'bookings', label: 'Available Bookings', icon: CalendarCheck },
    { id: 'earnings', label: 'Earnings', icon: WalletCards },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'Profile', icon: UserRound },
    { id: 'settings', label: 'Settings', icon: Settings2 },
  ];

  const toggleTheme = () => {
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    onThemeChange?.(nextTheme);
    localStorage.setItem('tunatuna_admin_theme', nextTheme);
  };

  return (
    <section className={`dashboard-wrap ${currentTheme === 'light' ? 'theme-light' : 'theme-dark'}`}>
      <aside className={`dashboard-sidebar ${mobileNavOpen ? 'flex' : 'hidden'} md:flex`}>
        <div className="mb-6 rounded-[24px] border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/70 p-4 shadow-[0_20px_60px_rgba(2,8,23,0.4)]">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 font-black text-white">TT</span>
            <div>
              <strong className="text-white">TunaTuna</strong>
              <small className="block text-slate-400">{user?.role || 'worker'} workspace</small>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.06] p-3">
            <p className="eyebrow">Worker workspace</p>
            <h3 className="mt-1 text-lg font-black text-white">Professional control center</h3>
            <p className="mt-1 text-sm text-slate-400">Manage bookings, feedback, and your presence from one sleek view.</p>
          </div>
        </div>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={`side-link ${activeView === item.id ? 'active' : ''}`} type="button" onClick={() => { setMobileNavOpen(false); onSelect(item.id); }}>
                <Icon size={17} /> {item.label}
              </button>
            );
          })}
          <button className="side-link mt-2" type="button" onClick={() => { setMobileNavOpen(false); void logout(); }}><LogOut size={17} /> Logout</button>
        </nav>
      </aside>
      <main className="dashboard-main">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[32px] border border-white/10 bg-slate-900/70 p-5 shadow-[0_20px_60px_rgba(2,8,23,0.35)] backdrop-blur">
          <div>
            <p className="eyebrow">Welcome, {user?.full_name || user?.name || 'Worker'}</p>
            <h1 className="text-3xl font-black text-white sm:text-4xl">{title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-ghost md:hidden" type="button" onClick={() => setMobileNavOpen((current) => !current)}>{mobileNavOpen ? <X size={17} /> : <Menu size={17} />}</button>
            <button className="icon-btn" type="button" onClick={toggleTheme} aria-label="Toggle theme">
              {currentTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link className="btn-ghost" to="/marketplace">Marketplace</Link>
          </div>
        </div>
        <div className="grid gap-5">{children}</div>
      </main>
    </section>
  );
}

export default function WorkerDashboardPage({ show }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [jobFilter, setJobFilter] = useState('active');
  const [busyId, setBusyId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busyNotificationId, setBusyNotificationId] = useState(null);
  const [clearingNotifications, setClearingNotifications] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    availability: 'Available',
    booking_notifications: true,
    email_notifications: true,
    profile_photo: null,
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [themePreference, setThemePreference] = useState(() => localStorage.getItem('tunatuna_admin_theme') || 'dark');

  const load = async () => {
    try {
      const [dashboardResponse, bookingsResponse] = await Promise.all([
        api.get('/worker/dashboard').catch(() => ({ data: fallbackWorkerData })),
        api.get('/bookings').catch(() => ({ data: [] })),
      ]);
      const dashboardData = dashboardResponse.data || fallbackWorkerData;
      const bookings = Array.isArray(bookingsResponse.data) ? bookingsResponse.data : [];
      setData({ ...dashboardData, bookings });
    } catch (error) {
      const message = apiMessage(error);
      if (show && message && !message.toLowerCase().includes('network')) {
        show(message, 'error');
      }
      setData(fallbackWorkerData);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      full_name: user.full_name || user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      availability: user.availability || 'Available',
      booking_notifications: Boolean(user.booking_notifications ?? true),
      email_notifications: Boolean(user.email_notifications ?? true),
      profile_photo: null,
    });
    setThemePreference(localStorage.getItem('tunatuna_admin_theme') || 'dark');
  }, [user]);

  const refreshWorkerView = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkNotificationRead = async (notification) => {
    if (!notification?.id || notification.read_at) return;
    try {
      setBusyNotificationId(notification.id);
      await api.patch(`/notifications/${notification.id}/read`);
      await load();
    } catch (error) {
      show?.(apiMessage(error), 'error');
    } finally {
      setBusyNotificationId(null);
    }
  };

  const handleClearNotifications = async () => {
    const confirmed = window.confirm('Clear all notifications?');
    if (!confirmed) return;

    try {
      setClearingNotifications(true);
      await api.post('/notifications/clear');
      await load();
    } catch (error) {
      show?.(apiMessage(error), 'error');
    } finally {
      setClearingNotifications(false);
    }
  };

  const isApprovedWorker = Boolean(user?.verified || ['approved', 'verified'].includes(String(user?.status || '').toLowerCase()));

  const passwordStrength = passwordForm.password.length === 0 ? 0 : passwordForm.password.length < 8 ? 1 : /[A-Z]/.test(passwordForm.password) && /[0-9]/.test(passwordForm.password) && /[^A-Za-z0-9]/.test(passwordForm.password) ? 3 : 2;
  const passwordStrengthLabel = ['Weak', 'Needs more characters', 'Good', 'Strong'][passwordStrength];

  const handleProfileSave = async () => {
    try {
      setSettingsSaving(true);
      const formData = new FormData();
      formData.append('full_name', profileForm.full_name);
      formData.append('email', profileForm.email);
      formData.append('phone', profileForm.phone);
      formData.append('address', profileForm.address || '');
      formData.append('availability', profileForm.availability);
      formData.append('booking_notifications', profileForm.booking_notifications ? '1' : '0');
      formData.append('email_notifications', profileForm.email_notifications ? '1' : '0');
      formData.append('theme_preference', themePreference);
      if (profileForm.profile_photo instanceof File) {
        formData.append('profile_photo', profileForm.profile_photo);
      }
      await api.put('/me', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await api.patch('/worker/availability', { availability: profileForm.availability });
      localStorage.setItem('tunatuna_admin_theme', themePreference);
      const { data } = await api.get('/me');
      if (data?.user) {
        localStorage.setItem('tunatuna_user', JSON.stringify(data.user));
      }
      await load();
      show?.('Profile settings saved.', 'success');
    } catch (error) {
      show?.(apiMessage(error), 'error');
    } finally {
      setSettingsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.current_password || !passwordForm.password || !passwordForm.password_confirmation) {
      show?.('Please fill in all password fields.', 'error');
      return;
    }
    if (passwordForm.password.length < 8) {
      show?.('Password must be at least 8 characters.', 'error');
      return;
    }
    if (passwordForm.password !== passwordForm.password_confirmation) {
      show?.('Passwords do not match.', 'error');
      return;
    }

    try {
      setPasswordSaving(true);
      await api.post('/me/password', passwordForm);
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
      show?.('Password updated successfully.', 'success');
    } catch (error) {
      show?.(apiMessage(error), 'error');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleAdvanceStatus = async (booking) => {
    const flow = ['accepted', 'worker_on_the_way', 'worker_arrived', 'in_progress', 'completed'];
    const currentIndex = flow.indexOf(String(booking.status || '').toLowerCase());
    const nextStatus = flow[currentIndex + 1];
    if (!nextStatus) return;

    const confirmed = window.confirm(`Advance booking #${booking.id} to ${nextStatus.replace(/_/g, ' ')}?`);
    if (!confirmed) return;

    try {
      setBusyId(booking.id);
      await api.patch(`/bookings/${booking.id}/status`, { status: nextStatus });
      show?.(`Booking #${booking.id} moved forward.`, 'success');
      await load();
    } catch (error) {
      show?.(apiMessage(error), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleCancelJob = async (booking) => {
    const reason = window.prompt('Add a cancellation reason (optional):');
    if (reason === null) return;

    const confirmed = window.confirm('Cancel this job? The current backend flow marks it cancelled and notifies the customer, and it is not automatically re-listed for other workers.');
    if (!confirmed) return;

    try {
      setBusyId(booking.id);
      await api.patch(`/bookings/${booking.id}/status`, { status: 'cancelled', cancel_reason: reason });
      show?.(`Booking #${booking.id} has been cancelled.`, 'success');
      await load();
    } catch (error) {
      show?.(apiMessage(error), 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (!isApprovedWorker) {
    return <div className="glass-card p-6 text-slate-300">Your worker account is still awaiting admin approval. You will be able to access the worker workspace once it is approved.</div>;
  }

  if (!data) return <div className="glass-card p-6 text-slate-300">Loading worker workspace…</div>;

  const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  const overview = data.overview || fallbackWorkerData.overview;
  const recentActivity = data.recentActivity || fallbackWorkerData.recentActivity;
  const reviews = Array.isArray(data.reviews) ? data.reviews : fallbackWorkerData.reviews;
  const notifications = Array.isArray(data.notifications) ? data.notifications : fallbackWorkerData.notifications;
  const bookings = Array.isArray(data.bookings) ? data.bookings : [];
  const activeJobs = bookings.filter((booking) => ['accepted', 'worker_on_the_way', 'worker_arrived', 'in_progress'].includes(String(booking.status || '').toLowerCase()));
  const completedJobs = bookings.filter((booking) => ['completed', 'reviewed'].includes(String(booking.status || '').toLowerCase()));
  const visibleJobs = jobFilter === 'completed' ? completedJobs : activeJobs;

  const stats = [
    { label: 'Total Jobs Completed', value: overview.totalJobsCompleted || 0, icon: CheckCircle2 },
    { label: 'Active/Ongoing Jobs', value: overview.activeJobs || 0, icon: Clock },
    { label: 'Pending Job Requests', value: overview.pendingRequests || 0, icon: CalendarCheck },
    { label: 'Total Earnings', value: currency.format(overview.totalEarnings || 0), icon: WalletCards },
    { label: 'Average Rating', value: Number(overview.averageRating || 0).toFixed(1), icon: Star },
  ];
  const averageReviewRating = reviews.length ? (reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1) : '0.0';
  const pageTitle = activeView === 'reviews'
    ? 'Reviews'
    : activeView === 'notifications'
      ? 'Notifications'
      : activeView === 'bookings'
        ? 'Available Bookings'
        : activeView === 'earnings'
          ? 'Earnings'
          : activeView === 'profile'
            ? 'Profile'
            : activeView === 'settings'
              ? 'Settings'
              : 'Worker Dashboard';

  return (
    <WorkerDashboardLayout title={pageTitle} activeView={activeView} onSelect={setActiveView} theme={themePreference} onThemeChange={setThemePreference}>
      {activeView === 'dashboard' && (
        <div className="grid gap-5">
          <section className="glass-card overflow-hidden rounded-[32px] border border-blue-400/20 bg-gradient-to-br from-slate-900 via-slate-900/80 to-blue-950/80 p-6 shadow-[0_24px_70px_rgba(2,8,23,0.35)]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="eyebrow">Approved worker workspace</p>
                <h2 className="mt-3 text-3xl font-black text-white">Keep your schedule, performance, and customer activity in one polished view.</h2>
                <p className="mt-3 max-w-xl text-slate-300">Welcome back, {user?.full_name || 'Worker'}. Your service updates are ready to review.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-sm text-slate-400">This week</p>
                <strong className="mt-1 block text-lg text-white">{overview.activeJobs || 0} active appointments</strong>
                <span className="quick-chip mt-3">Ready for new requests</span>
              </div>
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {stats.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.label} className="glass-card p-5">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/15 text-blue-300">
                    <Icon size={20} />
                  </div>
                  <p className="text-sm text-slate-400">{item.label}</p>
                  <strong className="mt-1 block text-2xl text-white">{item.value}</strong>
                </article>
              );
            })}
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="glass-card p-5">
              <h2 className="mb-4 text-xl font-black text-white">Recent Activity</h2>
              <div className="grid gap-3">
                {recentActivity.map((item) => (
                  <div key={item.id} className="list-row">
                    <span>
                      <strong className="text-white">{item.title}</strong>
                      <small>{item.meta}</small>
                    </span>
                    <span className={`quick-chip ${item.tone === 'pending' ? 'bg-amber-500/15 text-amber-300' : item.tone === 'success' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-blue-500/15 text-blue-300'}`}>{item.tone === 'pending' ? 'Pending' : item.tone === 'success' ? 'Completed' : 'Updated'}</span>
                  </div>
                ))}
              </div>
            </section>
            <section className="glass-card p-5">
              <h2 className="mb-4 text-xl font-black text-white">Today at a glance</h2>
              <div className="grid gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                  <p className="text-sm text-slate-400">Upcoming jobs</p>
                  <strong className="mt-1 block text-lg text-white">{overview.activeJobs || 0} in progress</strong>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                  <p className="text-sm text-slate-400">Customer feedback</p>
                  <strong className="mt-1 block text-lg text-white">{Number(overview.averageRating || 0).toFixed(1)} average rating</strong>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                  <p className="text-sm text-slate-400">Outstanding requests</p>
                  <strong className="mt-1 block text-lg text-white">{overview.pendingRequests || 0} waiting</strong>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {activeView === 'jobs' && (
        <div className="grid gap-5">
          <section className="glass-card p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="eyebrow">Accepted jobs</p>
                <h2 className="text-2xl font-black text-white">My Jobs</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className={`quick-chip ${jobFilter === 'active' ? 'bg-blue-500/15 text-blue-300' : ''}`} type="button" onClick={() => setJobFilter('active')}>Active jobs</button>
                <button className={`quick-chip ${jobFilter === 'completed' ? 'bg-blue-500/15 text-blue-300' : ''}`} type="button" onClick={() => setJobFilter('completed')}>Completed jobs</button>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-400">Use the forward-step controls to move each booking through the accepted → worker on the way → worker arrived → service in progress → completed flow.</p>
            <p className="mt-2 text-sm text-slate-400">Cancelling a booking marks it cancelled and notifies the customer; it is not automatically re-listed for other workers.</p>
          </section>

          {visibleJobs.length ? (
            <div className="grid gap-4">
              {visibleJobs.map((booking) => {
                const flow = ['accepted', 'worker_on_the_way', 'worker_arrived', 'in_progress', 'completed'];
                const currentIndex = flow.indexOf(String(booking.status || '').toLowerCase());
                const nextStatus = flow[currentIndex + 1];
                return (
                  <article key={booking.id} className="glass-card p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="quick-chip">Booking #{booking.id}</span>
                          <span className={`quick-chip ${booking.status === 'completed' || booking.status === 'reviewed' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>{String(booking.status || 'accepted').replace(/_/g, ' ')}</span>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <div>
                            <p className="text-sm text-slate-400">Customer</p>
                            <strong className="text-white">{booking.customer?.full_name || 'Customer'}</strong>
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Service</p>
                            <strong className="text-white">{booking.category?.name || booking.worker?.category?.name || 'Service'}</strong>
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Date</p>
                            <strong className="text-white">{booking.booking_date || '—'}</strong>
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Time</p>
                            <strong className="text-white">{booking.booking_time || '—'}</strong>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[.035] px-3 py-2 text-sm text-slate-300">
                          <MapPin size={15} />
                          <span>{booking.address || 'Location pending'}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 lg:min-w-[220px]">
                        <button className="btn-primary" type="button" disabled={!nextStatus || busyId === booking.id} onClick={() => handleAdvanceStatus(booking)}>
                          {nextStatus ? `Advance to ${nextStatus.replace(/_/g, ' ')}` : 'Completed'}
                        </button>
                        <button className="btn-ghost" type="button" disabled={busyId === booking.id || ['cancelled', 'completed', 'reviewed'].includes(String(booking.status || '').toLowerCase())} onClick={() => handleCancelJob(booking)}>
                          Cancel job
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="glass-card p-6 text-slate-400">No {jobFilter === 'completed' ? 'completed' : 'active'} jobs right now.</div>
          )}
        </div>
      )}

      {activeView === 'bookings' && (
        <div className="grid gap-5">
          <section className="glass-card p-5 shadow-[0_20px_60px_rgba(2,8,23,0.35)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="eyebrow">Marketplace</p>
                <h2 className="text-2xl font-black text-white">Available Bookings</h2>
              </div>
              <button className="btn-ghost" type="button" onClick={refreshWorkerView} disabled={refreshing}>
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-400">These are the new booking opportunities that can be claimed or reviewed by your team. The current demo environment keeps them visible for review.</p>
          </section>

          <section className="glass-card p-5 shadow-[0_20px_60px_rgba(2,8,23,0.35)]">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[{ id: 101, title: 'Kitchen deep clean', customer: 'Mina N.', address: 'North Avenue, 3rd cross', time: 'Tomorrow · 09:00' }, { id: 102, title: 'AC service', customer: 'Ravi P.', address: 'Lake View Apartments', time: 'Tomorrow · 14:00' }, { id: 103, title: 'Fan installation', customer: 'Salma T.', address: 'Green Park', time: 'Friday · 11:30' }].map((booking) => (
                <article key={booking.id} className="rounded-[24px] border border-white/10 bg-white/[.035] p-4">
                  <div className="flex items-center justify-between">
                    <span className="quick-chip">#{booking.id}</span>
                    <span className="quick-chip bg-emerald-500/15 text-emerald-300">Open</span>
                  </div>
                  <h3 className="mt-3 text-lg font-black text-white">{booking.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{booking.customer}</p>
                  <div className="mt-3 space-y-2 text-sm text-slate-300">
                    <div className="flex items-center gap-2"><MapPin size={15} /><span>{booking.address}</span></div>
                    <div className="flex items-center gap-2"><Clock size={15} /><span>{booking.time}</span></div>
                  </div>
                  <button className="btn-primary mt-4 w-full" type="button">Review request</button>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeView === 'earnings' && (
        <div className="grid gap-5">
          <section className="glass-card p-5 shadow-[0_20px_60px_rgba(2,8,23,0.35)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="eyebrow">Performance</p>
                <h2 className="text-2xl font-black text-white">Earnings</h2>
              </div>
              <button className="btn-ghost" type="button" onClick={refreshWorkerView} disabled={refreshing}>
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-400">Your current payout summary is shown below. The demo environment uses representative figures until real payment records are available.</p>
          </section>

          <div className="grid gap-4 md:grid-cols-3">
            <article className="glass-card p-5">
              <p className="text-sm text-slate-400">This month</p>
              <strong className="mt-2 block text-3xl text-white">₹24,850</strong>
            </article>
            <article className="glass-card p-5">
              <p className="text-sm text-slate-400">Pending payout</p>
              <strong className="mt-2 block text-3xl text-white">₹4,200</strong>
            </article>
            <article className="glass-card p-5">
              <p className="text-sm text-slate-400">Completed jobs</p>
              <strong className="mt-2 block text-3xl text-white">{completedJobs.length}</strong>
            </article>
          </div>
        </div>
      )}

      {activeView === 'reviews' && (
        <div className="grid gap-5">
          <section className="glass-card p-5 shadow-[0_20px_60px_rgba(2,8,23,0.35)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="eyebrow">Customer feedback</p>
                <h2 className="text-2xl font-black text-white">Reviews</h2>
              </div>
              <button className="btn-ghost" type="button" onClick={refreshWorkerView} disabled={refreshing}>
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/[.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-slate-400">Average rating</p>
                <strong className="mt-1 block text-4xl font-black text-white">{averageReviewRating}</strong>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <ReviewStars rating={Math.round(Number(averageReviewRating))} />
                <span>from {reviews.length} review{reviews.length === 1 ? '' : 's'}</span>
              </div>
            </div>
          </section>

          {reviews.length ? (
            <div className="grid gap-4">
              {reviews.map((review) => (
                <article key={review.id} className="glass-card p-5 shadow-[0_20px_60px_rgba(2,8,23,0.35)]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Customer</p>
                      <strong className="mt-1 block text-white">{review.customer?.full_name || 'Customer'}</strong>
                      <p className="mt-1 text-sm text-slate-400">{review.created_at ? new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently received'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ReviewStars rating={Number(review.rating || 0)} />
                      <span className="text-sm text-slate-300">{review.rating}/5</span>
                    </div>
                  </div>
                  <p className="mt-4 text-slate-300">“{review.comment || 'No written feedback was provided.'}”</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="glass-card p-6 text-slate-400">No reviews have been left for you yet.</div>
          )}
        </div>
      )}

      {activeView === 'notifications' && (
        <div className="grid gap-5">
          <section className="glass-card p-5 shadow-[0_20px_60px_rgba(2,8,23,0.35)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="eyebrow">Inbox</p>
                <h2 className="text-2xl font-black text-white">Notifications</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn-ghost" type="button" onClick={refreshWorkerView} disabled={refreshing}>
                  {refreshing ? 'Refreshing…' : 'Refresh'}
                </button>
                <button className="btn-primary" type="button" onClick={handleClearNotifications} disabled={clearingNotifications || !notifications.length}>
                  {clearingNotifications ? 'Clearing…' : 'Clear all'}
                </button>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-400">Stay up to date with new requests, cancellations, payments, and review activity.</p>
          </section>

          {notifications.length ? (
            <div className="grid gap-3">
              {notifications.map((notification) => {
                const kindLabel = String(notification.type || notification.title || 'Notification').replace(/[_-]/g, ' ');
                const isUnread = !notification.read_at;
                return (
                  <article key={notification.id} className={`glass-card p-5 shadow-[0_20px_60px_rgba(2,8,23,0.35)] ${isUnread ? 'border border-blue-400/20' : ''}`}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`quick-chip ${isUnread ? 'bg-blue-500/15 text-blue-300' : 'bg-slate-700/70 text-slate-300'}`}>{kindLabel}</span>
                          {isUnread && <span className="quick-chip bg-emerald-500/15 text-emerald-300">Unread</span>}
                        </div>
                        <h3 className="mt-3 text-lg font-black text-white">{notification.title || 'Notification'}</h3>
                        <p className="mt-2 text-sm text-slate-300">{notification.message || 'No details were provided.'}</p>
                        <p className="mt-3 text-xs uppercase tracking-[0.25em] text-slate-500">{notification.created_at ? new Date(notification.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recently received'}</p>
                      </div>
                      {!isUnread ? (
                        <span className="text-sm text-slate-400">Read</span>
                      ) : (
                        <button className="btn-ghost" type="button" disabled={busyNotificationId === notification.id} onClick={() => handleMarkNotificationRead(notification)}>
                          {busyNotificationId === notification.id ? 'Updating…' : 'Mark as read'}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="glass-card p-6 text-slate-400">You have no notifications right now.</div>
          )}
        </div>
      )}

      {activeView === 'profile' && (
        <div className="grid gap-5">
          <section className="glass-card p-5 shadow-[0_20px_60px_rgba(2,8,23,0.35)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="eyebrow">Your public profile</p>
                <h2 className="text-2xl font-black text-white">Profile</h2>
              </div>
              <button className="btn-primary" type="button" onClick={handleProfileSave} disabled={settingsSaving}>
                {settingsSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[24px] border border-white/10 bg-white/[.035] p-5">
                <div className="flex flex-col items-center gap-4">
                  <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-blue-500 to-cyan-400 text-3xl font-black text-white">
                    {profileForm.profile_photo ? <img src={typeof profileForm.profile_photo === 'string' ? profileForm.profile_photo : URL.createObjectURL(profileForm.profile_photo)} alt="Profile" className="h-full w-full object-cover" /> : (user?.full_name || user?.name || 'W').charAt(0).toUpperCase()}
                  </div>
                  <label className="btn-ghost cursor-pointer" htmlFor="profile-photo-input">
                    Change Profile Picture
                    <input id="profile-photo-input" type="file" accept="image/*" className="hidden" onChange={(event) => setProfileForm((current) => ({ ...current, profile_photo: event.target.files?.[0] || null }))} />
                  </label>
                </div>
              </div>
              <div className="grid gap-4">
                <label className="grid gap-2 text-sm text-slate-300">
                  <span>Name</span>
                  <input className="auth-field" value={profileForm.full_name} onChange={(event) => setProfileForm((current) => ({ ...current, full_name: event.target.value }))} />
                </label>
                <label className="grid gap-2 text-sm text-slate-300">
                  <span>Email</span>
                  <input className="auth-field" type="email" value={profileForm.email} onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))} />
                </label>
                <label className="grid gap-2 text-sm text-slate-300">
                  <span>Phone Number</span>
                  <input className="auth-field" value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} />
                </label>
                <label className="grid gap-2 text-sm text-slate-300">
                  <span>Address</span>
                  <input className="auth-field" value={profileForm.address} onChange={(event) => setProfileForm((current) => ({ ...current, address: event.target.value }))} />
                </label>
              </div>
            </div>
          </section>

          <section className="glass-card p-5 shadow-[0_20px_60px_rgba(2,8,23,0.35)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="eyebrow">Registration details</p>
                <h3 className="text-xl font-black text-white">Professional information</h3>
              </div>
              <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                Changing service category will require admin re-approval.
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-slate-300">
                <span>Service Category</span>
                <input className="auth-field" value={user?.category?.name || user?.service_category_id || '—'} readOnly />
              </label>
              <label className="grid gap-2 text-sm text-slate-300">
                <span>Work Experience</span>
                <input className="auth-field" value={user?.experience || '—'} readOnly />
              </label>
              <label className="grid gap-2 text-sm text-slate-300 md:col-span-2">
                <span>About</span>
                <textarea className="auth-field min-h-[110px]" value={user?.bio || user?.skills?.join(', ') || '—'} readOnly />
              </label>
            </div>
          </section>
        </div>
      )}

      {activeView === 'settings' && (
        <div className="grid gap-5">
          <section className="glass-card p-5 shadow-[0_20px_60px_rgba(2,8,23,0.35)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="eyebrow">Security</p>
                <h2 className="text-2xl font-black text-white">Change password</h2>
              </div>
              <button className="btn-primary" type="button" onClick={handlePasswordChange} disabled={passwordSaving}>
                {passwordSaving ? 'Updating…' : 'Update password'}
              </button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-slate-300">
                <span>Current password</span>
                <input className="auth-field" type="password" value={passwordForm.current_password} onChange={(event) => setPasswordForm((current) => ({ ...current, current_password: event.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm text-slate-300">
                <span>New password</span>
                <input className="auth-field" type="password" value={passwordForm.password} onChange={(event) => setPasswordForm((current) => ({ ...current, password: event.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm text-slate-300 md:col-span-2">
                <span>Confirm new password</span>
                <input className="auth-field" type="password" value={passwordForm.password_confirmation} onChange={(event) => setPasswordForm((current) => ({ ...current, password_confirmation: event.target.value }))} />
              </label>
              <div className="md:col-span-2 rounded-[20px] border border-white/10 bg-white/[.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Password strength</span>
                  <strong>{passwordStrengthLabel}</strong>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-800">
                  <div className={`h-2 rounded-full ${passwordStrength === 0 ? 'bg-slate-500' : passwordStrength === 1 ? 'bg-rose-500' : passwordStrength === 2 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${(passwordStrength / 3) * 100}%` }} />
                </div>
              </div>
            </div>
          </section>

          <section className="glass-card p-5 shadow-[0_20px_60px_rgba(2,8,23,0.35)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="eyebrow">Preferences</p>
                <h2 className="text-2xl font-black text-white">Notifications & availability</h2>
              </div>
              <button className="btn-ghost" type="button" onClick={() => setProfileForm((current) => ({ ...current, booking_notifications: !current.booking_notifications, email_notifications: !current.email_notifications }))}>Reset toggles</button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-[20px] border border-white/10 bg-white/[.035] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Booking notifications</p>
                    <strong className="text-white">{profileForm.booking_notifications ? 'Enabled' : 'Disabled'}</strong>
                  </div>
                  <button className={`quick-chip ${profileForm.booking_notifications ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700/70 text-slate-300'}`} type="button" onClick={() => setProfileForm((current) => ({ ...current, booking_notifications: !current.booking_notifications }))}>
                    {profileForm.booking_notifications ? 'On' : 'Off'}
                  </button>
                </div>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-white/[.035] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Email notifications</p>
                    <strong className="text-white">{profileForm.email_notifications ? 'Enabled' : 'Disabled'}</strong>
                  </div>
                  <button className={`quick-chip ${profileForm.email_notifications ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700/70 text-slate-300'}`} type="button" onClick={() => setProfileForm((current) => ({ ...current, email_notifications: !current.email_notifications }))}>
                    {profileForm.email_notifications ? 'On' : 'Off'}
                  </button>
                </div>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-white/[.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:col-span-2">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Availability status</p>
                    <strong className="text-white">{profileForm.availability}</strong>
                    <p className="mt-1 text-sm text-slate-400">This updates the same field the customer-facing worker list uses for availability visibility.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Available', 'Busy', 'Offline'].map((status) => (
                      <button key={status} className={`quick-chip ${profileForm.availability === status ? 'bg-blue-500/15 text-blue-300' : ''}`} type="button" onClick={() => setProfileForm((current) => ({ ...current, availability: status }))}>
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="glass-card p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="eyebrow">Appearance</p>
                <h2 className="text-2xl font-black text-white">Theme</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {['dark', 'light'].map((option) => (
                  <button key={option} className={`quick-chip ${themePreference === option ? 'bg-blue-500/15 text-blue-300' : ''}`} type="button" onClick={() => setThemePreference(option)}>
                    {option === 'dark' ? 'Dark' : 'Light'}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-400">Your current dashboard theme is reused across the worker workspace and admin/customer surfaces.</p>
          </section>

          <div className="flex flex-wrap gap-3">
            <button className="btn-primary" type="button" onClick={handleProfileSave} disabled={settingsSaving}>{settingsSaving ? 'Saving…' : 'Save Changes'}</button>
            <button className="btn-ghost" type="button" onClick={() => {
              setProfileForm((current) => ({ ...current, availability: user?.availability || 'Available', booking_notifications: Boolean(user?.booking_notifications ?? true), email_notifications: Boolean(user?.email_notifications ?? true) }));
              setThemePreference(localStorage.getItem('tunatuna_admin_theme') || 'dark');
            }}>Cancel</button>
          </div>
        </div>
      )}
    </WorkerDashboardLayout>
  );
}
