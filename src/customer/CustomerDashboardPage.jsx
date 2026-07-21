import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  BriefcaseBusiness,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  EyeOff,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  MoonStar,
  Pencil,
  ReceiptText,
  Settings2,
  Sparkles,
  Star,
  SunMedium,
  Trash2,
  UserRound,
  Wallet,
  X,
} from 'lucide-react';
import { api, apiMessage, assetUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

function initials(name = 'TT') {
  return String(name || 'TT').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function formatBookingSlot(booking) {
  const date = booking?.booking_date ? new Date(`${booking.booking_date}T${booking.booking_time || '00:00'}`) : null;
  if (!date) return 'Not scheduled';
  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function StatCard({ icon: Icon, label, value, hint, tone = 'default' }) {
  return (
    <article className={`glass-card customer-stat-card ${tone}`}>
      <div className="customer-stat-card__icon">
        <Icon size={20} />
      </div>
      <div>
        <p className="customer-stat-card__label">{label}</p>
        <strong className="customer-stat-card__value">{value}</strong>
        {hint ? <small className="customer-stat-card__hint">{hint}</small> : null}
      </div>
    </article>
  );
}

function PlaceholderPage({ title, description }) {
  return (
    <section className="glass-card customer-placeholder-card">
      <p className="eyebrow">Customer workspace</p>
      <h2>{title}</h2>
      <p>{description}</p>
      <Link className="btn-primary" to="/dashboard">
        Back to overview <ChevronRight size={17} />
      </Link>
    </section>
  );
}

export default function CustomerDashboardPage({ show, theme, toggleTheme }) {
  const { user, logout, updateProfile, changePassword } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [data, setData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);
  const [categories, setCategories] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingSearch, setBookingSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [workersLoading, setWorkersLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedBooking, setSubmittedBooking] = useState(null);
  const [form, setForm] = useState({
    categoryId: '',
    problem: '',
    address: '',
    date: '',
    time: '',
    urgency: 'normal',
  });
  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [workerSearch, setWorkerSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ bookingId: '', rating: 5, comment: '' });
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [refreshingNotifications, setRefreshingNotifications] = useState(false);
  const [markingNotificationId, setMarkingNotificationId] = useState(null);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    booking_notifications: true,
    email_notifications: true,
    theme_preference: 'dark',
  });
  const [profileSnapshot, setProfileSnapshot] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    booking_notifications: true,
    email_notifications: true,
    theme_preference: 'dark',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState('');
  const photoInputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const [dashboardRes, paymentsRes, categoriesRes] = await Promise.all([
        api.get('/customer/dashboard'),
        api.get('/payments'),
        api.get('/categories'),
      ]);
      setData(dashboardRes.data);
      setPayments(paymentsRes.data || []);
      setCategories(categoriesRes.data || []);
      setUsingMockData(false);
    } catch (error) {
      setUsingMockData(true);
      setData(null);
      setPayments([]);
      setCategories([]);
      show(apiMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    setBookingsLoading(true);
    try {
      const response = await api.get('/bookings');
      setBookingsList(response.data || []);
    } catch (error) {
      show(apiMessage(error), 'error');
      setBookingsList([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  const loadPayments = async () => {
    setPaymentsLoading(true);
    try {
      const response = await api.get('/payments');
      setPayments(response.data || []);
    } catch (error) {
      show(apiMessage(error), 'error');
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const loadCustomerReviews = async () => {
    setReviewsLoading(true);
    try {
      const [bookingsRes, reviewsRes] = await Promise.all([
        api.get('/bookings'),
        api.get('/customer/reviews'),
      ]);
      setBookingsList(bookingsRes.data || []);
      setReviews(reviewsRes.data || []);
    } catch (error) {
      show(apiMessage(error), 'error');
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const loadNotifications = async ({ silent = false } = {}) => {
    if (!silent) setNotificationsLoading(true);
    else setRefreshingNotifications(true);
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data || []);
    } catch (error) {
      show(apiMessage(error), 'error');
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
      setRefreshingNotifications(false);
    }
  };

  const loadWorkers = async (categorySlug = '') => {
    setWorkersLoading(true);
    try {
      const response = await api.get('/workers', { params: categorySlug ? { category: categorySlug } : {} });
      setWorkers(response.data?.data || response.data || []);
    } catch (error) {
      show(apiMessage(error), 'error');
      setWorkers([]);
    } finally {
      setWorkersLoading(false);
    }
  };

  const currentView = location.pathname.replace(/\/$/, '') || '/dashboard';
  const closeMobileMenu = () => setMobileOpen(false);

  useEffect(() => {
    if (currentView === '/dashboard/bookings') {
      loadBookings();
    } else if (currentView === '/dashboard/payments') {
      loadPayments();
    } else if (currentView === '/dashboard/reviews') {
      loadCustomerReviews();
    } else if (currentView === '/dashboard/notifications') {
      loadNotifications();
    } else if (currentView === '/dashboard') {
      load();
    }
  }, [currentView]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (currentView === '/dashboard/notifications' || currentView === '/dashboard') {
        loadNotifications({ silent: true });
      }
    }, 15000);
    return () => window.clearInterval(interval);
  }, [currentView]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const nextProfile = {
      full_name: user?.full_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      booking_notifications: user?.booking_notifications ?? true,
      email_notifications: user?.email_notifications ?? true,
      theme_preference: user?.theme_preference || 'dark',
    };
    setProfileForm(nextProfile);
    setProfileSnapshot(nextProfile);
    setProfilePhotoPreview(user?.profile_photo ? assetUrl(String(user.profile_photo)) : '');
  }, [user?.id, user?.full_name, user?.email, user?.phone, user?.address, user?.booking_notifications, user?.email_notifications, user?.theme_preference, user?.profile_photo]);

  useEffect(() => {
    if (user?.address && useSavedAddress && !form.address) {
      setForm((current) => ({ ...current, address: user.address }));
    }
  }, [user?.address, useSavedAddress]);

  useEffect(() => {
    const selectedCategory = categories.find((category) => String(category.id) === String(form.categoryId));
    if (selectedCategory?.slug) {
      loadWorkers(selectedCategory.slug);
    } else {
      loadWorkers('');
    }
  }, [form.categoryId, categories]);

  const overview = data?.overview || {};
  const dashboardBookings = data?.bookings || [];
  const recentActivity = data?.recentActivity || data?.notifications || [];
  const totalAmountSpent = useMemo(() => payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0), [payments]);
  const unreadNotificationsCount = useMemo(() => notifications.filter((notification) => !notification.read_at).length, [notifications]);

  const activeBookings = dashboardBookings.filter((booking) => ['confirmed', 'accepted', 'in_progress'].includes(String(booking.status || '').toLowerCase())).length;
  const pendingBookings = dashboardBookings.filter((booking) => String(booking.status || '').toLowerCase() === 'pending').length;
  const completedServices = dashboardBookings.filter((booking) => ['completed', 'reviewed'].includes(String(booking.status || '').toLowerCase())).length;

  const stats = [
    { label: 'Total Bookings', value: overview.totalBookings ?? dashboardBookings.length ?? 0, hint: usingMockData ? 'Mock data' : 'Live data', tone: 'default' },
    { label: 'Active Bookings', value: overview.upcomingServices ?? activeBookings ?? 0, hint: 'In progress or accepted', tone: 'accent' },
    { label: 'Pending Bookings', value: pendingBookings, hint: 'Awaiting confirmation', tone: 'warm' },
    { label: 'Completed Services', value: overview.completedJobs ?? completedServices ?? 0, hint: 'Finished jobs', tone: 'success' },
    { label: 'Total Amount Spent', value: currency.format(overview.totalAmountSpent ?? totalAmountSpent ?? 0), hint: usingMockData ? 'Mock data' : 'Payments summary', tone: 'cool' },
  ];

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/dashboard/book-services', label: 'Book Services', icon: BriefcaseBusiness },
    { path: '/dashboard/bookings', label: 'My Bookings', icon: CalendarCheck },
    { path: '/dashboard/payments', label: 'Payments', icon: ReceiptText },
    { path: '/dashboard/reviews', label: 'Reviews', icon: Star },
    { path: '/dashboard/notifications', label: 'Notifications', icon: Bell, badge: unreadNotificationsCount },
    { path: '/dashboard/profile', label: 'Profile', icon: UserRound },
    { path: '/dashboard/settings', label: 'Settings', icon: Settings2 },
  ];

  const pageConfig = {
    '/dashboard': { title: 'Customer dashboard', subtitle: 'Track services, stay up to date, and keep an eye on every booking.' },
    '/dashboard/book-services': { title: 'Book services', subtitle: 'Choose a trusted worker and confirm your booking in minutes.' },
    '/dashboard/bookings': { title: 'My bookings', subtitle: 'Manage your service requests and review their progress.' },
    '/dashboard/payments': { title: 'Payments', subtitle: 'Review invoices, payment status, and transaction history.' },
    '/dashboard/reviews': { title: 'Reviews', subtitle: 'Share feedback for completed services and revisit past ratings.' },
    '/dashboard/notifications': { title: 'Notifications', subtitle: 'All alerts, updates and booking notices in one place.' },
    '/dashboard/profile': { title: 'Profile', subtitle: 'Keep your account information accurate and up to date.' },
    '/dashboard/settings': { title: 'Settings', subtitle: 'Manage security, notification, and appearance preferences.' },
  };
  const activeContent = pageConfig[currentView] || pageConfig['/dashboard'];

  const selectedCategory = categories.find((category) => String(category.id) === String(form.categoryId));
  const today = new Date().toISOString().split('T')[0];
  const reviewableBookings = useMemo(() => bookingsList.filter((booking) => booking.status === 'completed' && !booking.review), [bookingsList]);

  const filteredWorkers = useMemo(() => {
    const keyword = workerSearch.trim().toLowerCase();
    return workers.filter((worker) => {
      const categoryMatch = categoryFilter === 'all' || String(worker.category?.id || worker.service_category_id) === String(categoryFilter);
      const priceMatch = priceFilter === 'all' || (priceFilter === 'low' ? Number(worker.price || 0) <= 800 : Number(worker.price || 0) > 800);
      const ratingMatch = ratingFilter === 'all' || (ratingFilter === 'high' ? Number(worker.rating || 0) >= 4.8 : Number(worker.rating || 0) < 4.8);
      const searchMatch = !keyword || [worker.full_name, worker.category?.name, worker.skills?.join(' '), worker.availability].filter(Boolean).join(' ').toLowerCase().includes(keyword);
      const availabilityMatch = !form.date || (() => {
        const selectedDate = new Date(form.date);
        const selectedDay = selectedDate.getDay();
        const isWeekend = selectedDay === 0 || selectedDay === 6;
        const availability = String(worker.availability || '').toLowerCase();
        if (availability.includes('available')) return true;
        if (availability.includes('weekend') && isWeekend) return true;
        if (availability.includes('today') && form.date === today) return true;
        if (availability.includes('tomorrow') && form.date === new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]) return true;
        return false;
      })();
      return categoryMatch && priceMatch && ratingMatch && searchMatch && availabilityMatch;
    });
  }, [workers, workerSearch, categoryFilter, priceFilter, ratingFilter, form.date, today]);

  const handlePhotoSelection = (event) => {
    const files = Array.from(event.target.files || []);
    const capped = files.slice(0, 3);
    const nextPreviews = capped.map((file) => URL.createObjectURL(file));
    setPhotoFiles(capped);
    setPhotoPreviews(nextPreviews);
  };

  const normalizeProfilePayload = (values = profileForm) => ({
    ...values,
    full_name: String(values.full_name || '').trim(),
    email: String(values.email || '').trim(),
    phone: String(values.phone || '').trim(),
    address: String(values.address || '').trim(),
  });

  const resetProfileForm = () => {
    const nextProfile = {
      full_name: profileSnapshot.full_name || user?.full_name || '',
      email: profileSnapshot.email || user?.email || '',
      phone: profileSnapshot.phone || user?.phone || '',
      address: profileSnapshot.address || user?.address || '',
      booking_notifications: profileSnapshot.booking_notifications ?? user?.booking_notifications ?? true,
      email_notifications: profileSnapshot.email_notifications ?? user?.email_notifications ?? true,
      theme_preference: profileSnapshot.theme_preference || user?.theme_preference || 'dark',
    };
    setProfileForm(nextProfile);
    setProfileSnapshot(nextProfile);
    setProfilePhotoFile(null);
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
    setProfilePhotoPreview(user?.profile_photo ? assetUrl(String(user.profile_photo)) : '');
  };

  const persistProfileChanges = async ({ showMessage = false } = {}) => {
    const payload = profilePhotoFile ? (() => {
      const formData = new FormData();
      Object.entries(profileForm).forEach(([key, value]) => {
        if (value !== null && value !== undefined) formData.append(key, value);
      });
      formData.append('profile_photo', profilePhotoFile);
      return formData;
    })() : normalizeProfilePayload(profileForm);

    await updateProfile(payload);
    const nextSnapshot = normalizeProfilePayload(profileForm);
    setProfileSnapshot(nextSnapshot);
    setProfilePhotoFile(null);
    if (showMessage) show('Profile updated successfully.', 'success');
    return nextSnapshot;
  };

  const handleProfilePhotoSelection = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProfilePhotoFile(file);
    setProfilePhotoPreview(URL.createObjectURL(file));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    if (!profileForm.full_name.trim()) {
      show('Please enter your full name.', 'error');
      return;
    }
    setProfileSaving(true);
    try {
      await persistProfileChanges({ showMessage: true });
      if (profileForm.theme_preference !== theme && ['dark', 'light'].includes(profileForm.theme_preference)) {
        toggleTheme();
      }
    } catch (error) {
      show(apiMessage(error), 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSettingsSave = async (event) => {
    event.preventDefault();
    setSettingsSaving(true);
    try {
      await persistProfileChanges({ showMessage: true });
      if (profileForm.theme_preference !== theme && ['dark', 'light'].includes(profileForm.theme_preference)) {
        toggleTheme();
      }
    } catch (error) {
      show(apiMessage(error), 'error');
    } finally {
      setSettingsSaving(false);
    }
  };

  const handlePasswordSave = async (event) => {
    event.preventDefault();
    if (!passwordForm.current_password) {
      show('Please enter your current password first.', 'error');
      return;
    }
    if (!passwordForm.password || passwordForm.password.length < 8) {
      show('New password must be at least 8 characters long.', 'error');
      return;
    }
    if (passwordForm.password !== passwordForm.password_confirmation) {
      show('Passwords do not match.', 'error');
      return;
    }
    setPasswordSaving(true);
    try {
      await changePassword(passwordForm);
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
      show('Password updated successfully.', 'success');
    } catch (error) {
      show(apiMessage(error), 'error');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedCategory) {
      show('Please select a service category first.', 'error');
      return;
    }
    if (!selectedWorkerId) {
      show('Please choose a worker from the list before booking.', 'error');
      return;
    }
    if (!form.problem.trim()) {
      show('Please describe the problem before submitting your request.', 'error');
      return;
    }
    if (!form.address.trim()) {
      show('Please provide an address for the service.', 'error');
      return;
    }
    if (!form.date || !form.time) {
      show('Please choose a preferred date and time.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const chosenWorker = workers.find((worker) => String(worker.id) === String(selectedWorkerId));
      const payload = {
        worker_id: Number(selectedWorkerId),
        booking_date: form.date,
        booking_time: form.time,
        address: form.address,
        notes: `${form.problem.trim()}\nUrgency: ${form.urgency === 'urgent' ? 'Urgent' : 'Normal'}`,
        payment_method: 'cash',
      };
      const response = await api.post('/bookings', payload);
      setSubmittedBooking({
        ...(response.data || payload),
        category_name: selectedCategory?.name || '',
        worker_name: chosenWorker?.full_name || '',
        urgency_label: form.urgency === 'urgent' ? 'Urgent' : 'Normal',
      });
      setForm({ categoryId: '', problem: '', address: '', date: '', time: '', urgency: 'normal' });
      setSelectedWorkerId('');
      setPhotoFiles([]);
      setPhotoPreviews([]);
      setUseSavedAddress(true);
      show('Booking created successfully.', 'success');
    } catch (error) {
      show(apiMessage(error), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddressUse = () => {
    setUseSavedAddress(true);
    setForm((current) => ({ ...current, address: user?.address || '' }));
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    if (!reviewForm.comment.trim()) {
      show('Please write a short review before submitting.', 'error');
      return;
    }
    if (!reviewForm.bookingId && !editingReviewId) {
      show('Choose a completed booking before leaving a review.', 'error');
      return;
    }

    setSubmittingReview(true);
    try {
      if (editingReviewId) {
        await api.patch(`/reviews/${editingReviewId}`, {
          rating: Number(reviewForm.rating),
          comment: reviewForm.comment.trim(),
        });
        show('Review updated successfully.', 'success');
      } else {
        await api.post('/reviews', {
          booking_id: Number(reviewForm.bookingId),
          rating: Number(reviewForm.rating),
          comment: reviewForm.comment.trim(),
        });
        show('Review submitted successfully.', 'success');
      }
      setReviewForm({ bookingId: '', rating: 5, comment: '' });
      setEditingReviewId(null);
      await loadCustomerReviews();
    } catch (error) {
      show(apiMessage(error), 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReviewEdit = (review) => {
    setEditingReviewId(review.id);
    setReviewForm({ bookingId: review.booking_id || '', rating: review.rating || 5, comment: review.comment || '' });
  };

  const handleReviewDelete = async (review) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await api.delete(`/reviews/${review.id}`);
      show('Review deleted successfully.', 'success');
      await loadCustomerReviews();
    } catch (error) {
      show(apiMessage(error), 'error');
    }
  };

  const handleMarkNotificationRead = async (notification) => {
    if (!notification.id || notification.read_at) return;
    setMarkingNotificationId(notification.id);
    try {
      await api.patch(`/notifications/${notification.id}/read`);
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item));
    } catch (error) {
      show(apiMessage(error), 'error');
    } finally {
      setMarkingNotificationId(null);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      await api.post('/notifications/clear');
      setNotifications([]);
      show('All notifications cleared.', 'success');
    } catch (error) {
      show(apiMessage(error), 'error');
    }
  };

  const getNotificationLabel = (notification) => {
    const title = String(notification.title || notification.type || '').toLowerCase();
    const message = String(notification.message || '').toLowerCase();
    if (title.includes('booking confirmed') || title.includes('booking confirmed') || title.includes('booking accepted') || title.includes('confirmed')) return 'Booking Confirmed';
    if (title.includes('worker accepted') || message.includes('accepted')) return 'Worker Accepted';
    if (title.includes('on the way') || message.includes('on the way')) return 'Worker On The Way';
    if (title.includes('arrived') || message.includes('arrived')) return 'Worker Arrived';
    if (title.includes('completed') || message.includes('completed')) return 'Service Completed';
    if (title.includes('payment') || message.includes('payment') || message.includes('invoice')) return 'Payment Successful';
    return notification.title || 'Service Update';
  };

  const workerStatus = (worker) => {
    const availability = String(worker.availability || '').toLowerCase();
    if (availability.includes('available')) return { label: 'Available', className: 'customer-status-badge available' };
    if (availability.includes('busy') || availability.includes('unavailable')) return { label: 'Busy', className: 'customer-status-badge busy' };
    return { label: 'Offline', className: 'customer-status-badge offline' };
  };

  const bookingStages = ['Booking Requested', 'Worker Accepted', 'Worker On The Way', 'Worker Arrived', 'Service In Progress', 'Service Completed', 'Payment Completed', 'Rate & Review'];

  const bookingStatusIndex = (booking) => {
    const status = String(booking?.status || '').toLowerCase();
    if (status === 'pending') return 0;
    if (['confirmed', 'accepted'].includes(status)) return 1;
    if (status === 'in_progress') return 4;
    if (status === 'completed') return 5;
    if (status === 'reviewed') return 7;
    if (status === 'cancelled' || status === 'rejected') return -1;
    return 1;
  };

  const formatStatus = (status) => String(status || 'pending').replace(/_/g, ' ');

  const filteredBookings = useMemo(() => {
    return bookingsList.filter((booking) => {
      const searchMatch = !bookingSearch.trim() || `${booking.id} ${booking.worker?.full_name || ''} ${booking.category?.name || ''} ${booking.notes || ''}`.toLowerCase().includes(bookingSearch.trim().toLowerCase());
      const statusMatch = statusFilter === 'all' || String(booking.status || '').toLowerCase() === statusFilter;
      const fromMatch = !dateFrom || booking.booking_date >= dateFrom;
      const toMatch = !dateTo || booking.booking_date <= dateTo;
      return searchMatch && statusMatch && fromMatch && toMatch;
    });
  }, [bookingsList, bookingSearch, statusFilter, dateFrom, dateTo]);

  const handleCancelBooking = async (booking) => {
    if (!window.confirm('Cancel this pending booking?')) return;
    setCancellingId(booking.id);
    try {
      await api.patch(`/bookings/${booking.id}/status`, { status: 'cancelled' });
      setBookingsList((current) => current.map((item) => item.id === booking.id ? { ...item, status: 'cancelled' } : item));
      show('Booking cancelled successfully.', 'success');
    } catch (error) {
      show(apiMessage(error), 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const handleDownloadInvoice = async (booking) => {
    const paymentId = booking?.payment?.id;
    if (!paymentId) {
      show('Invoice is not available yet for this booking.', 'error');
      return;
    }
    try {
      const response = await api.get(`/payments/${paymentId}/invoice`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `invoice-${booking.id}.html`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      show(apiMessage(error), 'error');
    }
  };

  const handlePaymentInvoiceDownload = async (payment) => {
    if (!payment?.id) return;
    try {
      const response = await api.get(`/payments/${payment.id}/invoice`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `invoice-${payment.id}.html`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      show(apiMessage(error), 'error');
    }
  };

  return (
    <div className={`customer-shell ${theme === 'light' ? 'theme-light' : 'theme-dark'}`}>
      <div className={`customer-mobile-backdrop ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />
      <aside className={`customer-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="customer-sidebar__brand">
          <div className="customer-sidebar__brand-mark">TT</div>
          <div>
            <strong>TunaTuna</strong>
            <small>Customer workspace</small>
          </div>
          <button className="customer-mobile-toggle customer-mobile-close" type="button" onClick={closeMobileMenu}>
            <X size={18} />
          </button>
        </div>

        <nav className="customer-sidebar__nav">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink key={path} to={path} className={({ isActive }) => `customer-nav-item ${isActive ? 'active' : ''}`} end={path === '/dashboard'} onClick={closeMobileMenu}>
              <Icon size={17} />
              <span>{label}</span>
              {path === '/dashboard/notifications' && unreadNotificationsCount ? <span className="customer-nav-badge">{unreadNotificationsCount}</span> : null}
            </NavLink>
          ))}
          <button className="customer-nav-item customer-nav-item--logout" type="button" onClick={() => { closeMobileMenu(); logout(); }}>
            <LogOut size={17} />
            <span>Logout</span>
          </button>
        </nav>

        <div className="customer-sidebar__footer">
          <div className="customer-user-pill">
            <span>{initials(user?.full_name || user?.name)}</span>
            <div>
              <strong>{user?.full_name || user?.name || 'Customer'}</strong>
              <small>{user?.role || 'customer'}</small>
            </div>
          </div>
          <button className="customer-ghost-button" type="button" onClick={toggleTheme}>
            {theme === 'dark' ? <SunMedium size={16} /> : <MoonStar size={16} />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
      </aside>

      <main className="customer-main">
        <header className="customer-topbar">
          <div className="customer-topbar__left">
            <button className="customer-mobile-toggle" type="button" onClick={() => setMobileOpen(true)}>
              <Menu size={18} />
            </button>
            <div>
              <p className="eyebrow">Customer dashboard</p>
              <h1>{activeContent.title}</h1>
            </div>
          </div>
          <div className="customer-topbar__right">
            <button className="icon-btn" type="button" onClick={toggleTheme} aria-label="Toggle customer theme">
              {theme === 'dark' ? <SunMedium size={18} /> : <MoonStar size={18} />}
            </button>
            <div className="customer-topbar__chip">
              <Sparkles size={16} />
              {usingMockData ? 'Mock data active' : 'Live data ready'}
            </div>
          </div>
        </header>

        <div className="customer-page-transition" key={location.pathname}>
          {currentView === '/dashboard' ? (
            <div className="customer-overview-grid">
              <section className="glass-card customer-hero-card">
                <div className="customer-hero-card__content">
                  <p className="eyebrow">Welcome back</p>
                  <h2>{user?.full_name || 'Customer'} — a clear view of your home services.</h2>
                  <p>{activeContent.subtitle}</p>
                </div>
                <div className="customer-hero-card__pill">
                  <Wallet size={18} />
                  <span>{currency.format(totalAmountSpent || 0)} spent</span>
                </div>
              </section>

              <div className="customer-stats-grid">
                {stats.map((item) => (
                  <StatCard key={item.label} icon={item.label === 'Total Bookings' ? CalendarCheck : item.label === 'Active Bookings' ? Clock3 : item.label === 'Pending Bookings' ? Bell : item.label === 'Completed Services' ? CheckCircle2 : Wallet} label={item.label} value={item.value} hint={item.hint} tone={item.tone} />
                ))}
              </div>

              <section className="glass-card customer-activity-card">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Recent activity</p>
                    <h2>Latest service updates</h2>
                  </div>
                </div>

                {loading ? (
                  <div className="customer-loading-state">
                    <LoaderCircle className="animate-spin" size={18} />
                    Loading recent activity…
                  </div>
                ) : recentActivity.length ? (
                  <div className="customer-feed-list">
                    {recentActivity.slice(0, 5).map((item, index) => {
                      const title = item.category?.name || item.worker?.full_name || item.booking?.category?.name || 'Service update';
                      const date = item.booking_date || item.created_at || item.updated_at || 'Recently updated';
                      const statusText = item.status ? String(item.status).replace(/_/g, ' ') : 'updated';
                      return (
                        <article key={`${title}-${index}`} className="customer-feed-item">
                          <div className="customer-feed-item__dot" />
                          <div>
                            <strong>{title}</strong>
                            <p>{statusText} • {date}</p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-400">No recent activity yet.</p>
                )}
              </section>
            </div>
          ) : currentView === '/dashboard/bookings' ? (
            <section className="glass-card customer-bookings-card">
              <div className="section-head">
                <div>
                  <p className="eyebrow">My bookings</p>
                  <h2>Track every service request</h2>
                  <p className="section-subtitle">Review scheduled appointments, payment status, and manage your active bookings from one place.</p>
                </div>
              </div>

              <div className="customer-bookings-toolbar">
                <label>
                  <span>Search</span>
                  <input value={bookingSearch} onChange={(event) => setBookingSearch(event.target.value)} placeholder="Booking ID, worker, service" />
                </label>
                <label>
                  <span>Status</span>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    <option value="all">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="accepted">Accepted</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </label>
                <label>
                  <span>From</span>
                  <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
                </label>
                <label>
                  <span>To</span>
                  <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
                </label>
              </div>

              {bookingsLoading ? (
                <div className="customer-loading-state"><LoaderCircle className="animate-spin" size={18} /> Loading bookings…</div>
              ) : filteredBookings.length ? (
                <div className="customer-bookings-table-wrap">
                  <table className="customer-bookings-table">
                    <thead>
                      <tr>
                        <th>Booking ID</th>
                        <th>Worker</th>
                        <th>Service</th>
                        <th>Appointment</th>
                        <th>Payment Status</th>
                        <th>Booking Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map((booking) => (
                        <tr key={booking.id}>
                          <td>#{booking.id}</td>
                          <td>{booking.worker?.full_name || '—'}</td>
                          <td>{booking.category?.name || booking.worker?.category?.name || '—'}</td>
                          <td>
                            <div className="customer-booking-appointment">
                              <strong>{formatBookingSlot(booking)}</strong>
                              <small>{booking.address || 'Location not specified'}</small>
                            </div>
                          </td>
                          <td><span className={`customer-pill ${booking.payment?.payment_status === 'successful' ? 'success' : booking.payment?.payment_status === 'pending' ? 'pending' : 'failed'}`}>{booking.payment?.payment_status || 'pending'}</span></td>
                          <td><span className={`customer-pill ${booking.status === 'cancelled' ? 'failed' : booking.status === 'completed' || booking.status === 'reviewed' ? 'success' : 'pending'}`}>{formatStatus(booking.status)}</span></td>
                          <td>
                            <div className="customer-actions-group">
                              <button className="icon-btn" type="button" onClick={() => setSelectedBooking(booking)}><Eye size={16} /></button>
                              <button className="icon-btn" type="button" onClick={() => handleDownloadInvoice(booking)}><Download size={16} /></button>
                              <button className="btn-ghost" type="button" onClick={() => handleCancelBooking(booking)} disabled={cancellingId === booking.id || !['pending'].includes(String(booking.status || '').toLowerCase())}>
                                {cancellingId === booking.id ? <LoaderCircle className="animate-spin" size={16} /> : 'Cancel'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="customer-empty-state">No bookings found for the current search and filters.</p>
              )}

              {selectedBooking ? (
                <div className="customer-booking-detail-panel">
                  <div className="section-head">
                    <div>
                      <p className="eyebrow">Booking details</p>
                      <h2>#{selectedBooking.id} • {selectedBooking.category?.name || 'Service request'}</h2>
                    </div>
                    <button className="customer-ghost-button" type="button" onClick={() => setSelectedBooking(null)}>Close</button>
                  </div>

                  <div className="customer-booking-detail-grid">
                    <div className="customer-booking-summary">
                      <p><strong>Worker:</strong> {selectedBooking.worker?.full_name || 'Pending assignment'}</p>
                      <p><strong>Scheduled for:</strong> {formatBookingSlot(selectedBooking)}</p>
                      <p><strong>Address:</strong> {selectedBooking.address || '—'}</p>
                      <p><strong>Notes:</strong> {selectedBooking.notes || 'No notes provided.'}</p>
                    </div>

                    <div className="customer-booking-status-block">
                      <div className="customer-status-legend">
                        <span className={`customer-pill ${selectedBooking.status === 'cancelled' ? 'failed' : selectedBooking.status === 'completed' || selectedBooking.status === 'reviewed' ? 'success' : 'pending'}`}>{formatStatus(selectedBooking.status)}</span>
                        <span className="customer-pill pending">{selectedBooking.payment?.payment_status || 'Pending'}</span>
                      </div>
                      <div className="customer-stepper">
                        {bookingStages.map((stage, index) => {
                          const statusIndex = bookingStatusIndex(selectedBooking);
                          const isCompleted = statusIndex >= 0 && index < statusIndex;
                          const isCurrent = index === statusIndex;
                          return (
                            <div key={stage} className={`customer-step ${isCompleted ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                              <span className="customer-step__dot" />
                              <div>
                                <strong>{stage}</strong>
                                {isCurrent ? <p>Current stage</p> : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </section>
          ) : currentView === '/dashboard/book-services' ? (
            <div className="customer-book-services-grid">
              <section className="glass-card customer-book-form-card">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Book services</p>
                    <h2>Request a trusted professional</h2>
                  </div>
                </div>

                {submittedBooking ? (
                  <div className="customer-success-card customer-success-booking">
                    <div className="customer-success-booking__header">
                      <CheckCircle2 size={30} className="text-emerald-400" />
                      <div>
                        <h3>Booking confirmed</h3>
                        <p>Your service is scheduled and will be available at the chosen date and time.</p>
                      </div>
                    </div>
                    <div className="customer-success-booking__details">
                      <div>
                        <span>Service</span>
                        <strong>{submittedBooking.category_name || selectedCategory?.name || 'Service request'}</strong>
                      </div>
                      <div>
                        <span>Provider</span>
                        <strong>{submittedBooking.worker_name || 'Assigned worker'}</strong>
                      </div>
                      <div>
                        <span>Appointment</span>
                        <strong>{formatBookingSlot(submittedBooking)}</strong>
                      </div>
                      <div>
                        <span>Location</span>
                        <strong>{submittedBooking.address || 'Address not provided'}</strong>
                      </div>
                      <div>
                        <span>Urgency</span>
                        <strong>{submittedBooking.urgency_label || 'Normal'}</strong>
                      </div>
                    </div>
                    <div className="customer-success-actions">
                      <Link className="btn-primary" to="/dashboard/bookings">View my bookings</Link>
                      <button className="btn-ghost" type="button" onClick={() => setSubmittedBooking(null)}>Create another booking</button>
                    </div>
                  </div>
                ) : (
                  <form className="customer-book-form" onSubmit={handleSubmit}>
                    <div className="customer-form-grid">
                      <label className="customer-form-field">
                        <span>Select service category</span>
                        <select value={form.categoryId} onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))} required>
                          <option value="">Choose a category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                        </select>
                      </label>

                      <label className="customer-form-field">
                        <span>Describe the problem</span>
                        <textarea value={form.problem} onChange={(event) => setForm((current) => ({ ...current, problem: event.target.value }))} rows={4} placeholder="Describe the issue, room, size, or any important detail." required />
                      </label>

                      <label className="customer-form-field customer-form-field--full">
                        <span>Upload up to 3 photos</span>
                        <input type="file" accept="image/*" multiple onChange={handlePhotoSelection} />
                        {photoPreviews.length ? (
                          <div className="customer-photo-preview-list">
                            {photoPreviews.map((preview, index) => (
                              <img key={`${preview}-${index}`} src={preview} alt={`Upload preview ${index + 1}`} />
                            ))}
                          </div>
                        ) : null}
                      </label>

                      <label className="customer-form-field">
                        <span>Address</span>
                        <div className="customer-inline-actions">
                          <input value={form.address} onChange={(event) => { setUseSavedAddress(false); setForm((current) => ({ ...current, address: event.target.value })); }} placeholder="Enter your address" required />
                          {user?.address ? (
                            <button className="btn-ghost" type="button" onClick={handleAddressUse}>Use saved</button>
                          ) : null}
                        </div>
                      </label>

                      <label className="customer-form-field">
                        <span>Preferred appointment date</span>
                        <input type="date" min={today} value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} required />
                      </label>

                      <label className="customer-form-field">
                        <span>Preferred appointment time</span>
                        <input type="time" value={form.time} onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))} required />
                      </label>
                      {form.date && form.time ? (
                        <p className="customer-appointment-preview">Your preferred appointment is set for <strong>{new Date(`${form.date}T${form.time}`).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</strong>.</p>
                      ) : null}
                    </div>

                    <div className="customer-urgency-group">
                      <span>Urgency</span>
                      <div className="customer-urgency-options">
                        <label className={`${form.urgency === 'normal' ? 'active' : ''}`}>
                          <input type="radio" name="urgency" value="normal" checked={form.urgency === 'normal'} onChange={() => setForm((current) => ({ ...current, urgency: 'normal' }))} />
                          Normal
                        </label>
                        <label className={`${form.urgency === 'urgent' ? 'active' : ''}`}>
                          <input type="radio" name="urgency" value="urgent" checked={form.urgency === 'urgent'} onChange={() => setForm((current) => ({ ...current, urgency: 'urgent' }))} />
                          Urgent
                        </label>
                      </div>
                    </div>

                    <button className="btn-primary customer-submit-button" type="submit" disabled={submitting}>
                      {submitting ? <LoaderCircle className="animate-spin" size={18} /> : <BriefcaseBusiness size={17} />} {submitting ? 'Creating booking…' : 'Book service'}
                    </button>
                  </form>
                )}
              </section>

              <section className="glass-card customer-worker-panel">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Available workers</p>
                    <h2>Match the right professional</h2>
                  </div>
                </div>

                <div className="customer-worker-filters">
                  <label>
                    <span>Search</span>
                    <input value={workerSearch} onChange={(event) => setWorkerSearch(event.target.value)} placeholder="Name, skill, keyword" />
                  </label>
                  <label>
                    <span>Category</span>
                    <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                      <option value="all">All categories</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Price</span>
                    <select value={priceFilter} onChange={(event) => setPriceFilter(event.target.value)}>
                      <option value="all">Any price</option>
                      <option value="low">Up to ₹800</option>
                      <option value="high">Above ₹800</option>
                    </select>
                  </label>
                  <label>
                    <span>Rating</span>
                    <select value={ratingFilter} onChange={(event) => setRatingFilter(event.target.value)}>
                      <option value="all">Any rating</option>
                      <option value="high">4.8+ rated</option>
                      <option value="low">Below 4.8</option>
                    </select>
                  </label>
                </div>

                {workersLoading ? (
                  <div className="customer-loading-state"><LoaderCircle className="animate-spin" size={18} /> Loading workers…</div>
                ) : filteredWorkers.length ? (
                  <div className="customer-worker-list">
                    {filteredWorkers.map((worker) => {
                      const status = workerStatus(worker);
                      const isSelected = String(worker.id) === String(selectedWorkerId);
                      return (
                        <article key={worker.id} className={`customer-worker-card ${isSelected ? 'selected' : ''}`} onClick={() => setSelectedWorkerId(worker.id)}>
                          <div className="customer-worker-card__head">
                            <div className="customer-worker-avatar">{worker.profile_photo ? <img src={worker.profile_photo} alt={worker.full_name} /> : <span>{initials(worker.full_name)}</span>}</div>
                            <div>
                              <strong>{worker.full_name}</strong>
                              <p>{worker.category?.name || 'Service provider'}</p>
                            </div>
                          </div>
                          <div className="customer-worker-card__meta">
                            <span><Star size={15} /> {Number(worker.rating || 0).toFixed(1)}</span>
                            <span><BriefcaseBusiness size={15} /> {worker.experience || 0} yrs</span>
                            <span><Wallet size={15} /> {currency.format(worker.price || 0)}</span>
                          </div>
                          <div className="customer-worker-card__footer">
                            <span className={status.className}>{status.label}</span>
                            <span>{worker.availability || 'No availability info'}</span>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="customer-empty-state">No workers are currently available. Please try another date or time.</p>
                )}
              </section>
            </div>
          ) : currentView === '/dashboard/notifications' ? (
            <section className="glass-card customer-notifications-card">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Notifications</p>
                  <h2>Stay on top of every update</h2>
                </div>
                <div className="customer-notifications-actions">
                  <button className="btn-ghost" type="button" onClick={() => loadNotifications({ silent: true })} disabled={refreshingNotifications}>
                    {refreshingNotifications ? <LoaderCircle className="animate-spin" size={16} /> : <Bell size={16} />} Refresh
                  </button>
                  <button className="btn-ghost" type="button" onClick={handleClearAllNotifications} disabled={!notifications.length}>
                    <Trash2 size={16} /> Clear all
                  </button>
                </div>
              </div>

              {notificationsLoading ? (
                <div className="customer-loading-state"><LoaderCircle className="animate-spin" size={18} /> Loading notifications…</div>
              ) : notifications.length ? (
                <div className="customer-notifications-list">
                  {notifications.map((notification) => (
                    <article key={notification.id} className={`customer-notification-item ${notification.read_at ? '' : 'unread'}`}>
                      <div className="customer-notification-item__top">
                        <div>
                          <strong>{getNotificationLabel(notification)}</strong>
                          <p>{notification.message || 'You have a new update from TunaTuna.'}</p>
                        </div>
                        <div className="customer-notification-item__meta">
                          {!notification.read_at ? <span className="customer-pill pending">Unread</span> : <span className="customer-pill success">Read</span>}
                          <small>{notification.created_at ? new Date(notification.created_at).toLocaleString() : 'Recently updated'}</small>
                        </div>
                      </div>
                      <div className="customer-notification-item__actions">
                        {!notification.read_at ? (
                          <button className="btn-ghost" type="button" onClick={() => handleMarkNotificationRead(notification)} disabled={markingNotificationId === notification.id}>
                            {markingNotificationId === notification.id ? <LoaderCircle className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} Mark as read
                          </button>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="customer-empty-state">You do not have any notifications yet.</p>
              )}
            </section>
          ) : currentView === '/dashboard/profile' ? (
            <section className="glass-card customer-profile-card">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Profile</p>
                  <h2>Keep your account details current</h2>
                </div>
              </div>

              <div className="customer-profile-grid">
                <div className="customer-profile-panel">
                  <div className="customer-profile-summary">
                    <div className="customer-profile-avatar">
                      {profilePhotoPreview ? <img src={profilePhotoPreview} alt="Profile preview" /> : <span>{initials(profileForm.full_name || user?.full_name || 'TT')}</span>}
                    </div>
                    <div>
                      <strong>{profileForm.full_name || user?.full_name || 'Customer'}</strong>
                      <p>{profileForm.email || user?.email || 'Keep your account details accurate and secure.'}</p>
                    </div>
                  </div>

                  <label className="customer-form-field">
                    <span>Profile picture</span>
                    <input ref={photoInputRef} type="file" accept="image/*" onChange={handleProfilePhotoSelection} />
                  </label>

                  <form className="customer-profile-form" onSubmit={handleProfileSave}>
                    <div className="customer-form-grid">
                      <label className="customer-form-field">
                        <span>Full name</span>
                        <input value={profileForm.full_name} onChange={(event) => setProfileForm((current) => ({ ...current, full_name: event.target.value }))} placeholder="Enter your full name" />
                      </label>
                      <label className="customer-form-field">
                        <span>Email</span>
                        <input type="email" value={profileForm.email} onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))} placeholder="Enter your email" />
                      </label>
                      <label className="customer-form-field">
                        <span>Phone</span>
                        <input value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Phone number" />
                      </label>
                      <label className="customer-form-field">
                        <span>Address</span>
                        <input value={profileForm.address} onChange={(event) => setProfileForm((current) => ({ ...current, address: event.target.value }))} placeholder="Home or service address" />
                      </label>
                    </div>
                    <div className="customer-profile-actions customer-profile-actions--right">
                      <button className="btn-primary" type="submit" disabled={profileSaving}>
                        {profileSaving ? <LoaderCircle className="animate-spin" size={16} /> : null} {profileSaving ? 'Saving profile…' : 'Save profile'}
                      </button>
                      <button className="btn-ghost" type="button" onClick={resetProfileForm}>Revert changes</button>
                    </div>
                  </form>
                </div>

                <div className="customer-profile-panel">
                  <div className="section-head">
                    <div>
                      <p className="eyebrow">Preferences</p>
                      <h3>Notification and appearance preferences</h3>
                    </div>
                  </div>
                  <div className="customer-preference-list">
                    <label className="customer-preference-item">
                      <span>Booking notifications</span>
                      <input type="checkbox" checked={profileForm.booking_notifications} onChange={(event) => setProfileForm((current) => ({ ...current, booking_notifications: event.target.checked }))} />
                    </label>
                    <label className="customer-preference-item">
                      <span>Email notifications</span>
                      <input type="checkbox" checked={profileForm.email_notifications} onChange={(event) => setProfileForm((current) => ({ ...current, email_notifications: event.target.checked }))} />
                    </label>
                    <label className="customer-preference-item">
                      <span>Preferred theme</span>
                      <select value={profileForm.theme_preference} onChange={(event) => setProfileForm((current) => ({ ...current, theme_preference: event.target.value }))}>
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                      </select>
                    </label>
                  </div>
                  <div className="customer-profile-actions customer-profile-actions--right">
                    <button className="btn-primary" type="button" onClick={handleSettingsSave} disabled={settingsSaving}>
                      {settingsSaving ? <LoaderCircle className="animate-spin" size={16} /> : null} {settingsSaving ? 'Saving settings…' : 'Save preferences'}
                    </button>
                    <button className="btn-ghost" type="button" onClick={resetProfileForm}>Revert changes</button>
                  </div>
                </div>
              </div>
            </section>
          ) : currentView === '/dashboard/settings' ? (
            <section className="glass-card customer-profile-card">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Settings</p>
                  <h2>Manage your account security</h2>
                </div>
              </div>

              <div className="customer-profile-grid">
                <div className="customer-profile-panel">
                  <div className="section-head">
                    <div>
                      <p className="eyebrow">Security</p>
                      <h3>Update your password securely</h3>
                    </div>
                  </div>
                  <form className="customer-profile-form" onSubmit={handlePasswordSave}>
                    <div className="customer-form-grid">
                      <label className="customer-form-field customer-form-field--full">
                        <span>Current password</span>
                        <div className="customer-inline-actions">
                          <input type={showPassword ? 'text' : 'password'} value={passwordForm.current_password} onChange={(event) => setPasswordForm((current) => ({ ...current, current_password: event.target.value }))} placeholder="Enter your current password" />
                          <button className="btn-ghost" type="button" onClick={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />} {showPassword ? 'Hide' : 'Show'}</button>
                        </div>
                      </label>
                      <label className="customer-form-field">
                        <span>New password</span>
                        <input type={showPassword ? 'text' : 'password'} value={passwordForm.password} onChange={(event) => setPasswordForm((current) => ({ ...current, password: event.target.value }))} placeholder="Minimum 8 characters" />
                      </label>
                      <label className="customer-form-field">
                        <span>Confirm password</span>
                        <input type={showPassword ? 'text' : 'password'} value={passwordForm.password_confirmation} onChange={(event) => setPasswordForm((current) => ({ ...current, password_confirmation: event.target.value }))} placeholder="Confirm password" />
                      </label>
                    </div>
                    <div className="customer-profile-actions">
                      <button className="btn-primary" type="submit" disabled={passwordSaving}>
                        {passwordSaving ? <LoaderCircle className="animate-spin" size={16} /> : null} Update password
                      </button>
                    </div>
                  </form>
                </div>

                <div className="customer-profile-panel">
                  <div className="section-head">
                    <div>
                      <p className="eyebrow">Preferences</p>
                      <h3>Manage notification and theme preferences</h3>
                    </div>
                  </div>
                  <div className="customer-preference-list">
                    <label className="customer-preference-item">
                      <span>Booking notifications</span>
                      <input type="checkbox" checked={profileForm.booking_notifications} onChange={(event) => setProfileForm((current) => ({ ...current, booking_notifications: event.target.checked }))} />
                    </label>
                    <label className="customer-preference-item">
                      <span>Email notifications</span>
                      <input type="checkbox" checked={profileForm.email_notifications} onChange={(event) => setProfileForm((current) => ({ ...current, email_notifications: event.target.checked }))} />
                    </label>
                    <label className="customer-preference-item">
                      <span>Preferred theme</span>
                      <select value={profileForm.theme_preference} onChange={(event) => setProfileForm((current) => ({ ...current, theme_preference: event.target.value }))}>
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                      </select>
                    </label>
                  </div>
                  <div className="customer-profile-actions customer-profile-actions--right">
                    <button className="btn-primary" type="button" onClick={handleSettingsSave} disabled={settingsSaving}>
                      {settingsSaving ? <LoaderCircle className="animate-spin" size={16} /> : null} {settingsSaving ? 'Saving settings…' : 'Save preferences'}
                    </button>
                    <button className="btn-ghost" type="button" onClick={resetProfileForm}>Revert changes</button>
                  </div>
                </div>
              </div>
            </section>
          ) : currentView === '/dashboard/payments' ? (
            <section className="glass-card customer-payments-card">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Payments</p>
                  <h2>Transaction history</h2>
                  <p className="section-subtitle">Review settled invoices, payment methods, and download receipts for completed services.</p>
                </div>
              </div>

              {paymentsLoading ? (
                <div className="customer-loading-state"><LoaderCircle className="animate-spin" size={18} /> Loading payments…</div>
              ) : payments.length ? (
                <div className="customer-payments-table-wrap">
                  <table className="customer-payments-table">
                    <thead>
                      <tr>
                        <th>Transaction ID</th>
                        <th>Booking</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id}>
                          <td>{payment.transaction_id || payment.payment_id || `#${payment.id}`}</td>
                          <td>{payment.booking ? `#${payment.booking.id} • ${payment.booking.category?.name || 'Service'}` : '—'}</td>
                          <td>{currency.format(payment.amount || 0)}</td>
                          <td>{String(payment.payment_method || 'demo').toUpperCase()}</td>
                          <td><span className={`customer-pill ${payment.payment_status === 'successful' ? 'success' : payment.payment_status === 'pending' ? 'pending' : 'failed'}`}>{String(payment.payment_status || 'pending').replace(/_/g, ' ')}</span></td>
                          <td>{payment.created_at ? new Date(payment.created_at).toLocaleDateString() : '—'}</td>
                          <td>
                            <button className="btn-ghost btn-small" type="button" onClick={() => handlePaymentInvoiceDownload(payment)}>
                              <Download size={16} />
                              <span>Download</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="customer-empty-state">No payments have been recorded yet.</p>
              )}
            </section>
          ) : currentView === '/dashboard/reviews' ? (
            <section className="glass-card customer-reviews-card">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Reviews</p>
                  <h2>Share feedback after your completed services</h2>
                  <p className="section-subtitle">Review your service experience and keep feedback history visible in one place.</p>
                </div>
              </div>

              <div className="customer-reviews-grid">
                <div className="customer-review-panel">
                  <div className="section-head">
                    <div>
                      <p className="eyebrow">Leave a review</p>
                      <h3>{editingReviewId ? 'Edit your review' : 'Rate your last completed service'}</h3>
                    </div>
                  </div>

                  {reviewsLoading ? (
                    <div className="customer-loading-state"><LoaderCircle className="animate-spin" size={18} /> Loading reviews…</div>
                  ) : (
                    <form className="customer-review-form" onSubmit={handleReviewSubmit}>
                      <label className="customer-form-field">
                        <span>Completed booking</span>
                        <select value={reviewForm.bookingId} onChange={(event) => setReviewForm((current) => ({ ...current, bookingId: event.target.value }))} disabled={Boolean(editingReviewId)}>
                          <option value="">{editingReviewId ? 'Editing existing review' : 'Select a completed booking'}</option>
                          {reviewableBookings.map((booking) => (
                            <option key={booking.id} value={booking.id}>#{booking.id} • {booking.category?.name || 'Service'}</option>
                          ))}
                        </select>
                      </label>

                      <div className="customer-stars-row">
                        <span>Rating</span>
                        <div className="customer-stars">
                          {[1, 2, 3, 4, 5].map((value) => (
                            <button key={value} className="customer-star-button" type="button" onClick={() => setReviewForm((current) => ({ ...current, rating: value }))}>
                              <Star size={20} fill={value <= reviewForm.rating ? '#fbbf24' : 'none'} stroke={value <= reviewForm.rating ? '#fbbf24' : 'currentColor'} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <label className="customer-form-field">
                        <span>Review</span>
                        <textarea value={reviewForm.comment} onChange={(event) => setReviewForm((current) => ({ ...current, comment: event.target.value }))} placeholder="Share what went well and how the service felt." rows={5} />
                      </label>

                      <div className="customer-review-actions">
                        <button className="btn-primary" type="submit" disabled={submittingReview}>
                          {submittingReview ? <LoaderCircle className="animate-spin" size={18} /> : <Star size={16} />} {editingReviewId ? 'Update review' : 'Submit review'}
                        </button>
                        {editingReviewId ? (
                          <button className="btn-ghost" type="button" onClick={() => { setEditingReviewId(null); setReviewForm({ bookingId: '', rating: 5, comment: '' }); }}>
                            Cancel edit
                          </button>
                        ) : null}
                      </div>
                    </form>
                  )}
                </div>

                <div className="customer-review-panel">
                  <div className="section-head">
                    <div>
                      <p className="eyebrow">Your reviews</p>
                      <h3>Manage your feedback history</h3>
                    </div>
                  </div>

                  {reviewsLoading ? (
                    <div className="customer-loading-state"><LoaderCircle className="animate-spin" size={18} /> Loading your reviews…</div>
                  ) : reviews.length ? (
                    <div className="customer-review-list">
                      {reviews.map((review) => (
                        <article key={review.id} className="customer-review-item">
                          <div className="customer-review-item__head">
                            <div>
                              <strong>{review.worker?.full_name || 'Worker'}</strong>
                              <p>{review.worker?.category?.name || 'Service provider'}</p>
                            </div>
                            <div className="customer-review-actions-inline">
                              <button className="icon-btn" type="button" onClick={() => handleReviewEdit(review)}><Pencil size={16} /></button>
                              <button className="icon-btn" type="button" onClick={() => handleReviewDelete(review)}><Trash2 size={16} /></button>
                            </div>
                          </div>
                          <div className="customer-stars customer-stars--small">
                            {[1, 2, 3, 4, 5].map((value) => (
                              <Star key={value} size={16} fill={value <= review.rating ? '#fbbf24' : 'none'} stroke={value <= review.rating ? '#fbbf24' : 'currentColor'} />
                            ))}
                          </div>
                          <p>{review.comment}</p>
                          <small>{review.created_at ? new Date(review.created_at).toLocaleDateString() : 'Recently added'}</small>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="customer-empty-state">You have not left any reviews yet.</p>
                  )}
                </div>
              </div>
            </section>
          ) : (
            <PlaceholderPage title={activeContent.title} description={activeContent.subtitle} />
          )}
        </div>
      </main>
    </div>
  );
}
