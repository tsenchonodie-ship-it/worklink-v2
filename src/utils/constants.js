export const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export const statusFlow = ['pending', 'confirmed', 'accepted', 'in_progress', 'completed', 'reviewed'];

export const paymentMethods = [
  { id: 'upi', label: 'UPI', detail: 'Demo UPI payment', icon: 'Smartphone' },
  { id: 'card', label: 'Credit/Debit Card', detail: 'Demo card authorization', icon: 'CreditCard' },
  { id: 'wallet', label: 'Wallet', detail: 'Demo wallet balance', icon: 'Wallet' },
  { id: 'cash', label: 'Cash on Service', detail: 'Pay after job', icon: 'WalletCards' },
];

export const serviceNames = [
  'House Cleaning', 'Deep Cleaning', 'Electrician', 'Plumber', 'Carpenter', 'Painter', 'Gardener',
  'AC Repair', 'Appliance Repair', 'Pest Control', 'Home Shifting', 'Babysitting', 'Elder Care',
];

export const initials = (name = 'TT') => {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
};

export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatTime = (time) => {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
  return `${displayHour}:${m} ${ampm}`;
};

export const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    confirmed: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    accepted: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    in_progress: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    completed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    reviewed: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    cancelled: 'bg-red-500/15 text-red-300 border-red-500/30',
    rejected: 'bg-red-500/15 text-red-300 border-red-500/30',
  };
  return colors[status] || 'bg-slate-500/15 text-slate-300 border-slate-500/30';
};

export const getStatusLabel = (status) => {
  const labels = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    accepted: 'Accepted',
    in_progress: 'In Progress',
    completed: 'Completed',
    reviewed: 'Reviewed',
    cancelled: 'Cancelled',
    rejected: 'Rejected',
  };
  return labels[status] || status;
};
