import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Clock3,
  CreditCard,
  Download,
  FileText,
  Home,
  LayoutDashboard,
  LoaderCircle,
  Lock,
  LogOut,
  Mail,
  Eye,
  EyeOff,
  MapPin,
  Menu,
  Moon,
  Phone,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Sun,
  ReceiptText,
  Smartphone,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
  WalletCards,
  Wrench,
  X,
} from 'lucide-react';
import { api, apiMessage, assetUrl } from './api/client';
import { useAuth } from './context/AuthContext';
import { Shell } from './components/Shell';
import { WorkerDetailPage } from './components/WorkerDetailPage';
import CustomerDashboardPage from './customer/CustomerDashboardPage';
import WorkerDashboardPage from './worker/WorkerDashboardPage';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend);

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const chartOptions = { responsive: true, plugins: { legend: { labels: { color: '#94a3b8' } } }, scales: { x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,.12)' } }, y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,.12)' } } } };
const chartOptionsWithYAxis = { ...chartOptions, scales: { ...chartOptions.scales, y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,.12)' }, beginAtZero: true } } };
const dashboardAccentColor = '#38bdf8';
const dashboardAccentSoft = 'rgba(56,189,248,.16)';
const dashboardChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false, labels: { color: '#94a3b8' } } },
  scales: {
    x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,.12)', drawBorder: false } },
    y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,.12)', drawBorder: false }, beginAtZero: true },
  },
};
const statusFlow = ['pending', 'confirmed', 'accepted', 'in_progress', 'completed', 'reviewed'];
const paymentMethods = [
  { id: 'upi', label: 'UPI', detail: 'Demo UPI payment', icon: Smartphone },
  { id: 'card', label: 'Credit/Debit Card', detail: 'Demo card authorization', icon: CreditCard },
  { id: 'wallet', label: 'Wallet', detail: 'Demo wallet balance', icon: Wallet },
  { id: 'cash', label: 'Cash on Service', detail: 'Pay after job', icon: WalletCards },
];
const serviceNames = [
  'House Cleaning', 'Deep Cleaning', 'Electrician', 'Plumber', 'Carpenter', 'Painter', 'Gardener',
  'AC Repair', 'Appliance Repair', 'Pest Control', 'Home Shifting', 'Babysitting', 'Elder Care',
];

function initials(name = 'TT') {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function useToast() {
  const [toast, setToast] = useState(null);
  const show = (message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(show.timer);
    show.timer = window.setTimeout(() => setToast(null), 3200);
  };
  return { toast, show };
}

function Protected({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  if (user.role === 'worker' && !['approved', 'verified'].includes(String(user.status || '').toLowerCase())) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <article className="glass-card p-5">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/15 text-blue-300"><Icon size={20} /></div>
      <p className="text-sm text-slate-400">{label}</p>
      <strong className="mt-1 block text-2xl text-white">{value}</strong>
    </article>
  );
}

function Avatar({ worker, size = 'h-14 w-14' }) {
  if (worker?.profile_photo) {
    return <img className={`${size} rounded-xl object-cover`} src={assetUrl(worker.profile_photo)} alt={worker.full_name} />;
  }
  return <div className={`${size} grid place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 font-black text-white`}>{initials(worker?.full_name)}</div>;
}

function WorkerCard({ worker, onHire }) {
  return (
    <article className="glass-card flex flex-col p-5 transition hover:-translate-y-1 hover:border-blue-400/50">
      <div className="flex items-start gap-4">
        <Avatar worker={worker} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-lg font-bold text-white">{worker.full_name}</h3>
            {worker.verified && <ShieldCheck className="text-cyan-300" size={17} />}
          </div>
          <p className="text-sm text-blue-200">{worker.category?.name}</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <span className="metric"><Star size={15} /> {Number(worker.rating).toFixed(1)}</span>
        <span className="metric"><BriefcaseBusiness size={15} /> {worker.experience} yrs</span>
        <span className="metric"><WalletCards size={15} /> {currency.format(worker.price)}</span>
        <span className="metric"><Clock size={15} /> {worker.availability}</span>
      </div>
      <p className="mt-4 line-clamp-2 text-sm text-slate-400">{(worker.skills || []).join(', ')}</p>
      <button className="btn-primary mt-5 w-full" onClick={() => onHire(worker)}>Hire Now <ChevronRight size={17} /></button>
    </article>
  );
}

function ScrollToHash() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const node = document.getElementById(id);
      if (node) {
        window.setTimeout(() => node.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname, location.hash]);

  return null;
}

function Landing({ show }) {
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [newsletterEmail, setNewsletterEmail] = useState('');

  useEffect(() => {
    api.get('/landing').then(({ data }) => setData(data)).catch((error) => show(apiMessage(error), 'error'));
  }, []);

  const stats = data?.stats || { customers: 0, workers: 0, bookings: 0, completed: 0 };
  const services = [
    { name: 'Plumbing', description: 'Leak repair, pipe replacement, and emergency fixes.', price: 'From ₹299', rating: '4.9', icon: Wrench },
    { name: 'Electrician', description: 'Wiring, fan mounting, switchboard upgrades, and lighting.', price: 'From ₹349', rating: '4.8', icon: Sparkles },
    { name: 'Carpenter', description: 'Furniture repair, custom woodwork, and home installations.', price: 'From ₹399', rating: '4.9', icon: BriefcaseBusiness },
    { name: 'Painter', description: 'Interior and exterior painting with long-lasting finish.', price: 'From ₹499', rating: '4.9', icon: Sparkles },
    { name: 'Cleaner', description: 'Deep cleaning, sanitization, and recurring home care.', price: 'From ₹249', rating: '4.8', icon: CheckCircle2 },
    { name: 'House Maid', description: 'Daily help, kitchen support, and routine household upkeep.', price: 'From ₹229', rating: '4.8', icon: Users },
    { name: 'Baby Sitting', description: 'Trusted care with flexible schedules and vetted helpers.', price: 'From ₹399', rating: '4.9', icon: Users },
    { name: 'Elder Care', description: 'Companion support, medication reminders, and personal care.', price: 'From ₹449', rating: '4.9', icon: ShieldCheck },
    { name: 'Driver', description: 'Local rides, airport transfers, and personal errands.', price: 'From ₹299', rating: '4.7', icon: Users },
    { name: 'Mechanic', description: 'Bike and car maintenance, repairs, and inspections.', price: 'From ₹349', rating: '4.8', icon: Wrench },
    { name: 'AC Repair', description: 'Cooling system diagnostics, service, and maintenance.', price: 'From ₹499', rating: '4.9', icon: Sparkles },
    { name: 'Appliance Repair', description: 'Fridge, washing machine, and microwave support.', price: 'From ₹329', rating: '4.8', icon: Wrench },
  ];
  const steps = [
    { title: 'Choose a Service', description: 'Browse trusted categories and pick the support your home needs.', icon: Search },
    { title: 'Select a Verified Worker', description: 'Compare profiles, ratings, experience, and pricing before you book.', icon: ShieldCheck },
    { title: 'Book & Schedule', description: 'Choose a date, time, and address in just a few taps.', icon: CalendarCheck },
    { title: 'Get the Job Done', description: 'Track the appointment and leave feedback once the work is complete.', icon: CheckCircle2 },
  ];
  const features = [
    { title: 'Verified Professionals', description: 'Every worker is screened, reviewed, and ready for professional home service.', icon: ShieldCheck },
    { title: 'Secure Booking', description: 'Enjoy clear scheduling, transparent pricing, and trusted communication.', icon: Lock },
    { title: 'Affordable Pricing', description: 'Flexible packages and fair rates for every budget and room.', icon: Wallet },
    { title: 'Fast Service', description: 'Book quickly and get local help on your preferred day and time.', icon: Clock3 },
    { title: 'Trusted Reviews', description: 'See real customer feedback and choose professionals with confidence.', icon: Star },
    { title: 'Safe Payments', description: 'Secure payments keep every booking protected from start to finish.', icon: CreditCard },
  ];
  const testimonials = data?.testimonials?.length ? data.testimonials.map((review) => ({
    name: review.customer?.full_name || 'Happy Customer',
    service: review.category?.name || 'Home Service',
    quote: review.comment,
    rating: 5,
  })) : [
    { name: 'Adaso', service: 'Electrician', quote: 'The technician arrived on time and fixed the issue in one visit.', rating: 5 },
    { name: 'Liben', service: 'Painter', quote: 'Smooth process, fair pricing, and excellent finishing quality.', rating: 5 },
    { name: 'Meren', service: 'Cleaner', quote: 'The crew was professional, punctual, and left the home spotless.', rating: 5 },
  ];

  const handleContactSubmit = (event) => {
    event.preventDefault();
    show('Thanks for reaching out. Our team will get back to you shortly.', 'success');
    setContactForm({ name: '', email: '', subject: '', message: '' });
  };

  const handleNewsletterSubmit = (event) => {
    event.preventDefault();
    if (!newsletterEmail) return;
    show('You are subscribed to WorkLink updates.', 'success');
    setNewsletterEmail('');
  };

  return (
    <>
      <section className="hero-shell">
        <div className="landing-hero">
          <div className="hero-copy">
            <span className="home-badge">Trusted home service matching</span>
            <h1>Professional home repairs, maintenance, and care—booked with confidence.</h1>
            <p>Connect with verified local experts for plumbing, electrical, carpentry, cleaning, and more, with secure scheduling and transparent pricing.</p>
            <div className="hero-actions">
              <Link className="btn-primary" to="/marketplace">Hire a specialist <Search size={18} /></Link>
              <Link className="btn-ghost" to="/register">Join as a professional</Link>
            </div>
            <div className="hero-stats">
              <div className="hero-stat-card">
                <strong>10,000+</strong>
                <span>Happy Customers</span>
              </div>
              <div className="hero-stat-card">
                <strong>5,000+</strong>
                <span>Verified Workers</span>
              </div>
              <div className="hero-stat-card">
                <strong>50,000+</strong>
                <span>Completed Services</span>
              </div>
              <div className="hero-stat-card">
                <strong>4.9★</strong>
                <span>Average Rating</span>
              </div>
            </div>
          </div>

          <div className="hero-visual glass-card">
            <div className="hero-visual-top">
              <div>
                <p className="eyebrow">Live booking network</p>
                <strong>Professionals near you</strong>
              </div>
              <span className="status-pill">Online</span>
            </div>
            <div className="hero-visual-grid">
              <div className="hero-visual-stack">
                {['Plumber', 'Electrician', 'Carpenter', 'Painter', 'Cleaner', 'House Maid'].map((label) => (
                  <div key={label} className="hero-chip">{label}</div>
                ))}
              </div>
              <div className="hero-visual-panel">
                <div className="hero-visual-panel-top">
                  <div className="avatar-ring">TT</div>
                  <div>
                    <strong>Verified specialists ready</strong>
                    <p>Same-day booking, background checks, and transparent pricing.</p>
                  </div>
                </div>
                <div className="hero-visual-metrics">
                  <div><strong>{stats.customers}</strong><span>Customers</span></div>
                  <div><strong>{stats.workers}</strong><span>Workers</span></div>
                  <div><strong>{stats.completed}</strong><span>Jobs Done</span></div>
                </div>
                <div className="hero-visual-footer">
                  <span>Trusted service delivery</span>
                  <button type="button" className="btn-small" onClick={() => navigate('/marketplace')}>Browse now</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-section" id="services">
        <div className="section-head">
          <div>
            <p className="eyebrow">Services</p>
            <h2>Premium home services for every need</h2>
            <p className="section-subtitle">Browse top categories built for fast quotes, transparent pricing, and quality work.</p>
          </div>
          <Link className="btn-ghost" to="/marketplace">Open marketplace</Link>
        </div>
        <div className="service-grid">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <article className="service-card glass-card" key={service.name}>
                <div className="service-card-top">
                  <div className="service-icon"><Icon size={18} /></div>
                  <span className="service-rating">★ {service.rating}</span>
                </div>
                <h3>{service.name}</h3>
                <p>{service.description}</p>
                <div className="service-meta">
                  <span>{service.price}</span>
                  <button type="button" className="btn-small" onClick={() => navigate('/marketplace')}>Book Now</button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="page-section" id="how-it-works">
        <div className="section-head">
          <div>
            <p className="eyebrow">How It Works</p>
            <h2>Simple steps from search to service completion</h2>
            <p className="section-subtitle">Get work done with a clear process from booking to satisfaction.</p>
          </div>
        </div>
        <div className="steps-grid">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article className="step-card glass-card" key={step.title}>
                <div className="step-index">0{index + 1}</div>
                <div className="step-icon"><Icon size={18} /></div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="page-section" id="why-choose">
        <div className="section-head">
          <div>
            <p className="eyebrow">Why Choose WorkLink</p>
            <h2>Built for reliability, safety, and quality</h2>
            <p className="section-subtitle">Our platform connects you with verified professionals and dependable service standards.</p>
          </div>
        </div>
        <div className="feature-grid">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article className="feature-card glass-card" key={feature.title}>
                <div className="feature-icon"><Icon size={20} /></div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="page-section" id="about">
        <div className="about-grid">
          <div className="glass-card about-card">
            <p className="eyebrow">About WorkLink</p>
            <h2>Your Trusted Partner for Home Services</h2>
            <p>At WorkLink, we believe every home deserves reliable and professional service. Our platform connects customers with carefully verified local professionals across a wide range of home services, ensuring safe bookings, transparent communication, and exceptional customer experiences from start to finish.</p>
            <div className="about-highlights">
              <div><strong>Verified Workers</strong><span>Screened and ready to serve</span></div>
              <div><strong>Customer Satisfaction</strong><span>4.9★ average experience</span></div>
              <div><strong>Completed Projects</strong><span>50k+ successful jobs</span></div>
              <div><strong>Trusted Platform</strong><span>Growing local network daily</span></div>
            </div>
          </div>
          <div className="glass-card about-card-alt">
            <div className="about-badge">WorkLink</div>
            <h3>Professional service, delivered with care</h3>
            <p>From emergency repairs to routine maintenance, our platform helps customers book the right specialist without guesswork.</p>
            <div className="about-list">
              <span><CheckCircle2 size={16} /> Verified professionals</span>
              <span><CheckCircle2 size={16} /> Safe payments</span>
              <span><CheckCircle2 size={16} /> Clear scheduling</span>
            </div>
          </div>
        </div>
      </section>

      <section className="page-section" id="testimonials">
        <div className="section-head">
          <div>
            <p className="eyebrow">Customer Reviews</p>
            <h2>What customers say about their experience</h2>
            <p className="section-subtitle">Read real feedback from customers who trusted WorkLink for home service support.</p>
          </div>
        </div>
        <div className="testimonial-shell glass-card">
          <div className="testimonial-intro">
            <p className="eyebrow">Trusted by real homes</p>
            <h3>Every review reflects the quality of our local professionals.</h3>
            <p>Customers rely on WorkLink for dependable timelines, transparent communication, and high-standard service delivery.</p>
            <div className="testimonial-nav">
              <button className="icon-btn" type="button" aria-label="Previous testimonial" onClick={() => setActiveTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}><ChevronLeft size={18} /></button>
              <button className="icon-btn" type="button" aria-label="Next testimonial" onClick={() => setActiveTestimonial((prev) => (prev + 1) % testimonials.length)}><ChevronRight size={18} /></button>
            </div>
          </div>
          <article className="testimonial-card">
            <div className="testimonial-card-top">
              <div className="avatar-ring">{initials(testimonials[activeTestimonial].name)}</div>
              <div>
                <strong>{testimonials[activeTestimonial].name}</strong>
                <p>{testimonials[activeTestimonial].service}</p>
              </div>
            </div>
            <div className="testimonial-stars">{'★'.repeat(testimonials[activeTestimonial].rating)}</div>
            <blockquote>“{testimonials[activeTestimonial].quote}”</blockquote>
          </article>
        </div>
      </section>

      <section className="page-section" id="contact">
        <div className="contact-grid">
          <div className="glass-card contact-card">
            <p className="eyebrow">Contact</p>
            <h2>Let&apos;s make your next home service effortless</h2>
            <p className="section-subtitle">Reach our local support team for booking help, service questions, or expert guidance.</p>
            <p>Whether you want to book a professional or ask about our platform, our local support team is ready to help.</p>
            <div className="contact-details">
              <span><MapPin size={16} /> 190, Kohima</span>
              <span><Phone size={16} /> +91 98765 43210</span>
              <span><Mail size={16} /> support@Tuna.local</span>
              <span><Clock3 size={16} /> Mon-Sat • 8:00 AM - 10:00 PM</span>
            </div>
          </div>
          <form className="glass-card contact-form" onSubmit={handleContactSubmit}>
            <div className="contact-form-grid">
              <input value={contactForm.name} onChange={(event) => setContactForm({ ...contactForm, name: event.target.value })} placeholder="Your Name" required />
              <input type="email" value={contactForm.email} onChange={(event) => setContactForm({ ...contactForm, email: event.target.value })} placeholder="Email Address" required />
            </div>
            <input value={contactForm.subject} onChange={(event) => setContactForm({ ...contactForm, subject: event.target.value })} placeholder="Subject" required />
            <textarea value={contactForm.message} onChange={(event) => setContactForm({ ...contactForm, message: event.target.value })} placeholder="How can we help?" required />
            <button className="btn-primary" type="submit">Send Message <ArrowRight size={17} /></button>
          </form>
        </div>
      </section>

      <footer className="footer-shell">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">WorkLink</div>
            <p>Trusted home service matching for customers and skilled professionals.</p>
          </div>
          <div>
            <h3>Quick Links</h3>
            <Link to="/">Home</Link>
            <Link to="/marketplace">Services</Link>
            <Link to="/#about">About Us</Link>
            <Link to="/#contact">Contact</Link>
          </div>
          <div>
            <h3>Company</h3>
            <a href="#">Careers</a>
            <a href="#">FAQs</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms &amp; Conditions</a>
          </div>
          <div>
            <h3>Stay Updated</h3>
            <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
              <input value={newsletterEmail} onChange={(event) => setNewsletterEmail(event.target.value)} placeholder="Your email" type="email" required />
              <button className="btn-primary" type="submit">Subscribe</button>
            </form>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 WorkLink. All rights reserved.</span>
          <div className="footer-socials">
            <a href="#">Instagram</a>
            <a href="#">LinkedIn</a>
            <a href="#">Facebook</a>
          </div>
        </div>
      </footer>
    </>
  );
}

function Marketplace({ show }) {
  const { user } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ search: '', category: '', sort: 'rating' });
  const [bookingWorker, setBookingWorker] = useState(null);

  const load = async () => {
    try {
      const params = new URLSearchParams(filters);
      const [workerRes, categoryRes] = await Promise.all([api.get(`/workers?${params}`), api.get('/categories')]);
      setWorkers(workerRes.data.data || workerRes.data);
      setCategories(categoryRes.data);
    } catch (error) {
      show(apiMessage(error), 'error');
    }
  };
  useEffect(() => { load(); }, [filters.category, filters.sort]);

  const hire = (worker) => {
    if (!user || user.role !== 'customer') return show('Login as a customer to hire a worker.', 'error');
    setBookingWorker(worker);
  };

  return (
    <section className="page-section">
      <div className="section-head">
        <div><p className="eyebrow">Service Marketplace</p><h1 className="text-4xl font-black text-white">Find verified workers</h1></div>
        <form className="filter-bar" onSubmit={(event) => { event.preventDefault(); load(); }}>
          <Search size={18} />
          <input placeholder="Search service, skill, or worker" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            <option value="">All categories</option>
            {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
          </select>
          <select value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
            <option value="rating">Top rated</option>
            <option value="price_low">Price low</option>
            <option value="price_high">Price high</option>
            <option value="experience">Experience</option>
          </select>
          <button className="btn-primary"><SlidersHorizontal size={17} /> Apply</button>
        </form>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {workers.map((worker) => <WorkerCard key={worker.id} worker={worker} onHire={hire} />)}
      </div>
      {bookingWorker && <BookingModal worker={bookingWorker} onClose={() => setBookingWorker(null)} show={show} />}
    </section>
  );
}

function BookingModal({ worker, onClose, show, onBooked }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    worker_id: worker.id,
    booking_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    booking_time: '10:00',
    address: user?.address || '',
    notes: '',
    payment_method: 'upi',
  });
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post('/bookings', form);
      show(form.payment_method === 'cash' ? 'Booking confirmed. Cash payment is pending.' : `Demo payment successful. Invoice ${data.payment.invoice_number} generated.`);
      onBooked?.();
      onClose();
    } catch (error) {
      show(apiMessage(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <form className="glass-card modal-panel p-6" onSubmit={submit}>
        <div className="mb-5 flex items-center justify-between">
          <div><p className="eyebrow">Demo Checkout</p><h2 className="text-2xl font-black text-white">Confirm and Pay</h2></div>
          <button type="button" className="icon-btn" onClick={onClose}><X /></button>
        </div>
        <div className="checkout-grid">
          <div className="grid gap-3">
            <input type="date" required value={form.booking_date} onChange={(e) => setForm({ ...form, booking_date: e.target.value })} />
            <input type="time" required value={form.booking_time} onChange={(e) => setForm({ ...form, booking_time: e.target.value })} />
            <input required placeholder="Service address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <textarea placeholder="Notes for worker" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <div className="payment-methods">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button type="button" className={`payment-method ${form.payment_method === method.id ? 'active' : ''}`} key={method.id} onClick={() => setForm({ ...form, payment_method: method.id })}>
                    <Icon size={18} />
                    <span>{method.label}<small>{method.detail}</small></span>
                  </button>
                );
              })}
            </div>
          </div>
          <aside className="payment-summary">
            <p className="eyebrow">Payment Summary</p>
            <div className="summary-row"><span>Service</span><strong>{worker.category?.name}</strong></div>
            <div className="summary-row"><span>Worker</span><strong>{worker.full_name}</strong></div>
            <div className="summary-row"><span>Date</span><strong>{form.booking_date} at {form.booking_time}</strong></div>
            <div className="summary-row"><span>Address</span><strong>{form.address || 'Add address'}</strong></div>
            <div className="summary-total"><span>Total Amount</span><strong>{currency.format(worker.price)}</strong></div>
            <p className="demo-disclaimer">Localhost demo only. Pay Now creates simulated IDs and an invoice; no real money is transferred.</p>
            <button className="btn-primary w-full" disabled={busy}>{busy ? 'Processing...' : form.payment_method === 'cash' ? 'Confirm Cash Booking' : 'Pay Now'}</button>
          </aside>
        </div>
      </form>
    </div>
  );
}

function Dashboard({ show, theme, toggleTheme }) {
  const { user } = useAuth();
  if (user.role === 'admin') return <AdminDashboard show={show} />;
  if (user.role === 'worker') return <WorkerDashboard show={show} />;
  return <CustomerDashboardPage show={show} theme={theme} toggleTheme={toggleTheme} />;
}

function CustomerDashboard({ show }) {
  const [data, setData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [activeView, setActiveView] = useState('overview');
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [reviewForm, setReviewForm] = useState({ booking_id: '', rating: '5', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const load = async () => {
    try {
      const [dashboardRes, paymentsRes] = await Promise.all([api.get('/customer/dashboard'), api.get('/payments')]);
      setData(dashboardRes.data);
      setPayments(paymentsRes.data);
      setReviewForm((current) => ({ ...current, booking_id: '', rating: '5', comment: '' }));
    } catch (error) {
      show(apiMessage(error), 'error');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    if (!reviewForm.booking_id) {
      show('Choose a completed booking first.', 'error');
      return;
    }
    setSubmittingReview(true);
    try {
      await api.post('/reviews', { ...reviewForm, rating: Number(reviewForm.rating) });
      show('Review posted. Thanks for sharing your experience.');
      setReviewForm({ booking_id: '', rating: '5', comment: '' });
      load();
    } catch (error) {
      show(apiMessage(error), 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleNotificationRead = async (notification) => {
    if (notification.read_at) return;
    try {
      await api.patch(`/notifications/${notification.id}/read`);
      load();
    } catch (error) {
      show(apiMessage(error), 'error');
    }
  };

  if (!data) return <Loader />;

  const overview = data.overview || {};
  const bookings = data.bookings || [];
  const notifications = data.notifications || [];
  const nearbyWorkers = data.nearbyWorkers || [];
  const upcoming = bookings.filter((booking) => ['pending', 'confirmed', 'accepted', 'in_progress'].includes(booking.status));
  const completed = bookings.filter((booking) => ['completed', 'reviewed'].includes(booking.status));
  const heroCopy = upcoming[0] ? `${upcoming[0].category?.name || 'Service'} is lined up for ${upcoming[0].booking_date}` : 'Choose your next trusted worker and keep your home projects moving.';

  return (
    <>
      <CustomerDashboardLayout title="Customer Dashboard" activeView={activeView} onSelect={setActiveView} quickActions={['Overview', 'Bookings', 'Payments', 'Settings']}>
        {activeView === 'overview' && (
          <div className="grid gap-5">
            <section className="glass-card overflow-hidden rounded-[30px] border border-blue-400/20 bg-gradient-to-br from-slate-900 via-slate-900/80 to-blue-950/80 p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <p className="eyebrow">Premium customer workspace</p>
                  <h2 className="mt-3 text-3xl font-black text-white">Keep your service bookings, payments, and reviews in one polished place.</h2>
                  <p className="mt-3 max-w-xl text-slate-300">{heroCopy}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {[ 'Verified professionals', 'Secure booking flow', 'Instant invoice access' ].map((item) => <span key={item} className="quick-chip">{item}</span>)}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <p className="text-sm text-slate-400">Next up</p>
                  <strong className="mt-1 block text-lg text-white">{upcoming[0] ? `${upcoming[0].worker?.full_name || 'Your worker'} • ${upcoming[0].booking_date}` : 'No upcoming services yet'}</strong>
                  <button className="btn-primary mt-4" type="button" onClick={() => setActiveView('bookings')}>Open booking flow</button>
                </div>
              </div>
            </section>

            <div className="grid gap-4 md:grid-cols-4">
              <StatCard icon={CalendarCheck} label="My Bookings" value={overview.totalBookings || bookings.length} />
              <StatCard icon={Clock} label="Upcoming Services" value={overview.upcomingServices || upcoming.length} />
              <StatCard icon={CheckCircle2} label="Completed Jobs" value={overview.completedJobs || completed.length} />
              <StatCard icon={Bell} label="Notifications" value={overview.notifications || notifications.length} />
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <Panel title="Recommended workers">
                <div className="grid gap-3">
                  {nearbyWorkers.slice(0, 4).map((worker) => (
                    <div key={worker.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-4">
                      <div className="flex items-center gap-3">
                        <Avatar worker={worker} size="h-12 w-12" />
                        <div>
                          <strong className="text-white">{worker.full_name}</strong>
                          <p className="text-sm text-slate-400">{worker.category?.name} • {Number(worker.rating || 0).toFixed(1)} ★</p>
                        </div>
                      </div>
                      <button className="btn-small" type="button" onClick={() => setSelectedWorker(worker)}>Book</button>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel title="Latest activity">
                {bookings.length ? bookings.slice(0, 4).map((booking) => (
                  <div className="list-row" key={booking.id}>
                    <span>
                      <strong className="text-white">{booking.category?.name || booking.worker?.category?.name}</strong>
                      <small>{booking.booking_date} • {booking.status.replace('_', ' ')}</small>
                    </span>
                    <StatusBadge status={booking.status} />
                  </div>
                )) : <p className="text-slate-400">No bookings yet. Start with a worker you trust.</p>}
              </Panel>
            </div>
          </div>
        )}

        {activeView === 'bookings' && (
          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <Panel title="Upcoming and past bookings">
              <div className="grid gap-3">
                {bookings.length ? bookings.map((booking) => (
                  <article className="rounded-2xl border border-white/10 bg-white/[.035] p-4" key={booking.id}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <strong className="text-white">#{booking.id} {booking.category?.name || booking.worker?.category?.name}</strong>
                        <p className="text-sm text-slate-400">{booking.worker?.full_name} • {booking.booking_date} at {booking.booking_time}</p>
                      </div>
                      <StatusBadge status={booking.status} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {statusFlow.map((step) => <span className={`flow-step ${statusFlow.indexOf(booking.status) >= statusFlow.indexOf(step) ? 'active' : ''}`} key={step}>{step.replace('_', ' ')}</span>)}
                    </div>
                    {['completed', 'reviewed'].includes(booking.status) && (
                      <button className="btn-small mt-3" type="button" onClick={() => setReviewForm((current) => ({ ...current, booking_id: booking.id }))}>Leave review</button>
                    )}
                  </article>
                )) : <p className="text-slate-400">No bookings yet. Explore the marketplace and book your first service.</p>}
              </div>
            </Panel>
            <Panel title="Share feedback">
              <form className="grid gap-3" onSubmit={handleReviewSubmit}>
                <select value={reviewForm.booking_id} onChange={(event) => setReviewForm({ ...reviewForm, booking_id: event.target.value })}>
                  <option value="">Choose a completed booking</option>
                  {completed.map((booking) => <option key={booking.id} value={booking.id}>#{booking.id} • {booking.category?.name || booking.worker?.category?.name}</option>)}
                </select>
                <select value={reviewForm.rating} onChange={(event) => setReviewForm({ ...reviewForm, rating: event.target.value })}>
                  {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} star{value > 1 ? 's' : ''}</option>)}
                </select>
                <textarea placeholder="Describe your experience" value={reviewForm.comment} onChange={(event) => setReviewForm({ ...reviewForm, comment: event.target.value })} />
                <button className="btn-primary" type="submit" disabled={submittingReview}>{submittingReview ? 'Posting review...' : 'Publish review'}</button>
              </form>
            </Panel>
          </div>
        )}

        {activeView === 'payments' && (
          <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <Panel title="Payment history">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                  <p className="text-sm text-slate-400">Total paid</p>
                  <strong className="mt-1 block text-lg text-white">{currency.format(payments.reduce((total, payment) => total + Number(payment.amount || 0), 0))}</strong>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                  <p className="text-sm text-slate-400">Pending review</p>
                  <strong className="mt-1 block text-lg text-white">{pendingPayments}</strong>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                  <p className="text-sm text-slate-400">Invoices tracked</p>
                  <strong className="mt-1 block text-lg text-white">{payments.length}</strong>
                </div>
              </div>
              <div className="mt-4">
                <PaymentList payments={payments} show={show} />
              </div>
            </Panel>
            <div className="grid gap-5">
              <Panel title="Invoices at a glance">
                <div className="grid gap-3">
                  {payments.length ? payments.slice(0, 4).map((payment) => (
                    <div key={payment.id} className="list-row">
                      <span>
                        <strong className="text-white">{payment.invoice_number || payment.transaction_id}</strong>
                        <small>{payment.booking?.category?.name || 'Service'} • {payment.payment_status}</small>
                      </span>
                      <strong>{currency.format(payment.amount)}</strong>
                    </div>
                  )) : <p className="text-slate-400">No payment records yet.</p>}
                </div>
              </Panel>
              <Panel title="Support note">
                <p className="text-slate-400">If a payment is delayed, the billing team can review it quickly from the invoice list above.</p>
              </Panel>
            </div>
          </div>
        )}

        {activeView === 'settings' && (
          <ProfileSettings show={show} heading="Account settings" eyebrow="Customer workspace" description="Update your contact details, password, and notification preferences in one place." />
        )}
      </CustomerDashboardLayout>
      {selectedWorker && <BookingModal worker={selectedWorker} onClose={() => setSelectedWorker(null)} onBooked={load} show={show} />}
    </>
  );
}

function WorkerDashboard({ show }) {
  return <WorkerDashboardPage show={show} />;
}

function AdminDashboard({ show }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [reviews, setReviews] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('tunatuna_admin_settings');
      return saved ? JSON.parse(saved) : { notificationsEnabled: true, compactView: false };
    } catch {
      return { notificationsEnabled: true, compactView: false };
    }
  });
  const [collapsed, setCollapsed] = useState(false);
  const [clock, setClock] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState('dashboard');

  const load = async () => {
    try {
      const params = paymentStatus ? `?status=${paymentStatus}` : '';
      const [dash, customerRes, workerRes, bookingRes, categoryRes, paymentRes, reviewRes, notificationRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/customers'),
        api.get('/admin/workers'),
        api.get('/bookings'),
        api.get('/categories'),
        api.get(`/payments${params}`),
        api.get('/reviews'),
        api.get('/notifications'),
      ]);
      setData(dash.data);
      setCustomers(customerRes.data);
      setWorkers(workerRes.data);
      setBookings(bookingRes.data);
      setCategories(categoryRes.data);
      setPayments(paymentRes.data);
      setReviews(reviewRes.data || []);
      setNotifications(notificationRes.data || []);
    } catch (e) {
      show(apiMessage(e), 'error');
    }
  };

  const refreshCustomers = () => {
    void load();
  };

  useEffect(() => {
    load();
  }, [paymentStatus]);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const verifyWorker = async (id) => {
    try {
      await api.patch(`/admin/workers/${id}/verify`);
      show('Worker verified.');
      load();
    } catch (error) {
      show(apiMessage(error), 'error');
    }
  };

  const updateBooking = async (id, status) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      show('Booking status updated.');
      load();
    } catch (error) {
      show(apiMessage(error), 'error');
    }
  };

  const updatePayment = async (id, payment_status) => {
    try {
      await api.patch(`/admin/payments/${id}`, { payment_status });
      show('Payment status updated.');
      load();
    } catch (error) {
      show(apiMessage(error), 'error');
    }
  };

  const viewPaymentDetails = async (payment) => {
    try {
      const { data } = await api.get(`/payments/${payment.id}`);
      show(`Payment ${data.invoice_number || data.transaction_id} loaded. Status: ${data.payment_status}`);
    } catch (error) {
      show(apiMessage(error), 'error');
    }
  };

  const statusDistribution = useMemo(() => {
    const map = {};
    bookings.forEach((booking) => { map[booking.status] = (map[booking.status] || 0) + 1; });
    return Object.entries(map).map(([status, value]) => ({ status, value }));
  }, [bookings]);

  const activeWorkers = workers.filter((worker) => worker.verified).length || workers.length;
  const growth = getTrend(data?.charts?.customerGrowth || data?.charts?.monthlyBookings || []);
  const topWorkers = (data?.charts?.topRatedWorkers || []).map((worker) => ({
    ...worker,
    completedJobs: bookings.filter((item) => item.worker_id === worker.id).length,
  }));
  const pendingApprovals = workers.filter((worker) => !worker.verified).slice(0, 6);

  const quickActions = [
    { label: 'Dashboard', icon: LayoutDashboard, target: 'dashboard' },
    { label: 'Customers', icon: Users, target: 'customers' },
    { label: 'Bookings', icon: CalendarCheck, target: 'bookings' },
    { label: 'Payments', icon: CreditCard, target: 'payments' },
    { label: 'Categories', icon: Wrench, target: 'service-categories' },
    { label: 'Analytics', icon: BarChart3, target: 'analytics' },
  ];
  const adminSectionRoutes = {
    dashboard: '/dashboard',
    customers: '/dashboard/customers',
    workers: '/dashboard/workers',
    bookings: '/dashboard/bookings',
    'service-categories': '/dashboard/service-categories',
    payments: '/dashboard/payments',
    reviews: '/dashboard/reviews',
    reports: '/dashboard/reports',
    analytics: '/dashboard/analytics',
    notifications: '/dashboard/notifications',
    settings: '/dashboard/settings',
  };

  const searchResults = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2 || !data) return null;
    const query = searchTerm.toLowerCase();
    return {
      customers: customers.filter((customer) => [customer.full_name, customer.email, customer.phone].some((value) => String(value || '').toLowerCase().includes(query))),
      workers: workers.filter((worker) => [worker.full_name, worker.category?.name].some((value) => String(value || '').toLowerCase().includes(query))),
      bookings: bookings.filter((booking) => [booking.id, booking.customer?.full_name, booking.worker?.full_name, booking.category?.name, booking.status].some((value) => String(value || '').toLowerCase().includes(query))),
      payments: payments.filter((payment) => [payment.invoice_number, payment.transaction_id, payment.customer?.full_name, payment.payment_status].some((value) => String(value || '').toLowerCase().includes(query))),
    };
  }, [searchTerm, customers, workers, bookings, payments, data]);

  const handleSection = (target) => {
    const route = adminSectionRoutes[target] || '/dashboard';
    setActiveSection(target);
    navigate(route);
    window.location.hash = route;
    const element = document.getElementById(`admin-${target}`);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const exportCsv = (filename, headers, rows) => {
    const csv = [headers.join(','), ...rows.map((row) => headers.map((header) => `"${String(row[header] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const saveSettings = () => {
    localStorage.setItem('tunatuna_admin_settings', JSON.stringify(settings));
    show('Admin preferences saved.', 'success');
  };

  useEffect(() => {
    const hashPath = window.location.hash.replace(/^#\//, '').replace(/^#/, '');
    const hashSection = hashPath.split('/').filter(Boolean).pop() || 'dashboard';
    if (['dashboard', 'customers', 'workers', 'bookings', 'service-categories', 'payments', 'reviews', 'reports', 'analytics', 'notifications', 'settings'].includes(hashSection)) {
      setActiveSection(hashSection);
      const element = document.getElementById(`admin-${hashSection}`);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  useEffect(() => {
    const path = location.pathname.replace(/\/$/, '') || '/dashboard';
    const segment = path.split('/').filter(Boolean).pop() || 'dashboard';
    const fallback = ['dashboard', 'customers', 'workers', 'bookings', 'service-categories', 'payments', 'reviews', 'reports', 'analytics', 'notifications', 'settings'].includes(segment) ? segment : 'dashboard';
    setActiveSection(fallback);
  }, [location.pathname]);

  if (!data) return <AdminDashboardSkeleton />;

  const currentSection = activeSection || 'dashboard';
  const sectionTitles = {
    dashboard: 'Overview',
    customers: 'Customers',
    workers: 'Workers',
    bookings: 'Bookings',
    'service-categories': 'Service Categories',
    payments: 'Payments',
    reviews: 'Reviews',
    reports: 'Reports',
    analytics: 'Analytics',
    notifications: 'Notifications',
    settings: 'Settings',
  };

  const bookingRows = bookings.slice(0, 8);
  const paymentRows = payments.slice(0, 6);
  const recentCustomers = customers.slice(0, 5);
  const recentWorkers = workers.slice(0, 5);
  const recentReviews = reviews.slice(0, 6);
  const recentNotifications = notifications.slice(0, 6);
  const recentActivities = (data.recentActivities || []).slice(0, 6);
  const overviewTotals = data?.totals || {};
  const overviewCharts = data?.charts || {};
  const overviewPayments = data?.payments || {};
  const useMockData = !data?.totals || !data?.charts;
  const pendingApplications = workers.filter((worker) => !worker.verified && worker.status !== 'rejected').length;

  const statCards = [
    { icon: Users, label: 'Total Customers', value: overviewTotals.customers ?? customers.length ?? 0, helper: 'Registered accounts' },
    { icon: Wrench, label: 'Total Workers', value: overviewTotals.workers ?? workers.length ?? 0, helper: 'Active professionals' },
    { icon: ShieldCheck, label: 'Pending Worker Applications', value: pendingApplications, helper: 'Awaiting review' },
    { icon: CalendarCheck, label: 'Total Bookings', value: overviewTotals.bookings ?? bookings.length ?? 0, helper: 'All service requests' },
    { icon: CheckCircle2, label: 'Completed Services', value: overviewTotals.completedJobs ?? bookings.filter((booking) => ['completed', 'reviewed'].includes(booking.status)).length ?? 0, helper: 'Finished successfully' },
    { icon: WalletCards, label: 'Demo Revenue', value: currency.format(overviewTotals.monthlyRevenue ?? overviewPayments.totalCollected ?? 0), helper: 'Current dashboard snapshot' },
  ];

  const monthlyBookingsData = Array.isArray(overviewCharts.monthlyBookings) && overviewCharts.monthlyBookings.length ? overviewCharts.monthlyBookings : [
    { label: 'Jan', value: 32 },
    { label: 'Feb', value: 41 },
    { label: 'Mar', value: 38 },
    { label: 'Apr', value: 53 },
    { label: 'May', value: 67 },
    { label: 'Jun', value: 72 },
  ];
  const revenueData = Array.isArray(overviewPayments.monthlyRevenue) && overviewPayments.monthlyRevenue.length ? overviewPayments.monthlyRevenue : Array.isArray(overviewCharts.revenue) && overviewCharts.revenue.length ? overviewCharts.revenue : [
    { label: 'Jan', value: 180000 },
    { label: 'Feb', value: 220000 },
    { label: 'Mar', value: 205000 },
    { label: 'Apr', value: 272000 },
    { label: 'May', value: 318000 },
    { label: 'Jun', value: 360000 },
  ];
  const workerGrowthData = Array.isArray(overviewCharts.workerGrowth) && overviewCharts.workerGrowth.length ? overviewCharts.workerGrowth : [
    { label: 'Jan', value: 10 },
    { label: 'Feb', value: 14 },
    { label: 'Mar', value: 19 },
    { label: 'Apr', value: 24 },
    { label: 'May', value: 29 },
    { label: 'Jun', value: 34 },
  ];
  const customerGrowthData = Array.isArray(overviewCharts.customerGrowth) && overviewCharts.customerGrowth.length ? overviewCharts.customerGrowth : [
    { label: 'Jan', value: 42 },
    { label: 'Feb', value: 56 },
    { label: 'Mar', value: 67 },
    { label: 'Apr', value: 81 },
    { label: 'May', value: 94 },
    { label: 'Jun', value: 112 },
  ];
  const servicePopularityData = Array.isArray(overviewCharts.mostBookedServices) && overviewCharts.mostBookedServices.length ? overviewCharts.mostBookedServices : [
    { name: 'Cleaning', value: 28 },
    { name: 'Plumbing', value: 22 },
    { name: 'Electrician', value: 18 },
    { name: 'Painting', value: 16 },
  ];
  const workerPerformanceData = Array.isArray(overviewCharts.workerPerformance) && overviewCharts.workerPerformance.length ? overviewCharts.workerPerformance : [];
  const paymentMethodsData = Array.isArray(overviewCharts.paymentMethods) && overviewCharts.paymentMethods.length ? overviewCharts.paymentMethods : [];
  const paymentStatusesData = Array.isArray(overviewCharts.paymentStatuses) && overviewCharts.paymentStatuses.length ? overviewCharts.paymentStatuses : [];
  const paymentAnalyticsData = Array.isArray(overviewPayments.monthlyRevenue) && overviewPayments.monthlyRevenue.length ? overviewPayments.monthlyRevenue : revenueData;

  const kpis = [
    { icon: Users, label: 'Total Customers', value: overviewTotals.customers ?? customers.length ?? 0, trend: getTrend(monthlyBookingsData), values: monthlyBookingsData.map((item) => item.value) },
    { icon: Wrench, label: 'Total Workers', value: overviewTotals.workers ?? workers.length ?? 0, trend: getTrend(workerGrowthData), values: workerGrowthData.map((item) => item.value) },
    { icon: ShieldCheck, label: 'Active Workers', value: activeWorkers, trend: getTrend(workerGrowthData), values: workerGrowthData.map((item) => item.value) },
    { icon: CalendarCheck, label: 'Total Bookings', value: overviewTotals.bookings ?? bookings.length ?? 0, trend: getTrend(monthlyBookingsData), values: monthlyBookingsData.map((item) => item.value) },
    { icon: Clock, label: 'Pending Bookings', value: overviewTotals.pendingJobs ?? 0, trend: getTrend(statusDistribution.map((item) => ({ label: item.status, value: item.value }))), values: statusDistribution.map((item) => item.value) },
    { icon: CheckCircle2, label: 'Completed Jobs', value: overviewTotals.completedJobs ?? bookings.filter((booking) => ['completed', 'reviewed'].includes(booking.status)).length ?? 0, trend: getTrend(monthlyBookingsData), values: monthlyBookingsData.map((item) => item.value) },
    { icon: WalletCards, label: 'Total Revenue', value: currency.format(overviewTotals.monthlyRevenue ?? overviewPayments.totalCollected ?? 0), trend: getTrend(revenueData), values: revenueData.map((item) => item.value) },
    { icon: TrendingUp, label: 'Monthly Growth', value: growth.label, trend: growth, values: growth.values },
  ];

  const sectionContent = (() => {
    switch (currentSection) {
      case 'customers':
        return (
          <section className="glass-card admin-panel p-5" id="admin-customers" key="customers-view">
            <div className="section-head">
              <div>
                <p className="eyebrow">Customer roster</p>
                <h2>Registered customers</h2>
              </div>
            </div>
            <CustomerManagementPage customers={customers} setCustomers={setCustomers} show={show} onRefresh={load} />
          </section>
        );
      case 'workers':
        return (
          <section className="glass-card admin-panel p-5" id="admin-workers" key="workers-view">
            <WorkerManagementPage workers={workers} setWorkers={setWorkers} show={show} onRefresh={load} />
          </section>
        );
      case 'bookings':
        return (
          <section className="glass-card admin-panel p-5" id="admin-bookings" key="bookings-view">
            <BookingManagementPage bookings={bookings} onUpdate={updateBooking} show={show} />
          </section>
        );
      case 'service-categories':
        return <ServiceCategoriesManagementPage categories={categories} reload={load} show={show} />;
      case 'payments':
        return <PaymentsManagementPage payments={payments} show={show} onRefresh={load} />;
      case 'reviews':
        return <ReviewsManagementPage reviews={reviews} show={show} onRefresh={load} />;
      case 'reports':
        return <ReportsPage bookings={bookings} customers={customers} workers={workers} payments={payments} show={show} />;
      case 'analytics':
        return <AnalyticsPage data={data} bookings={bookings} customers={customers} workers={workers} payments={payments} />;
      case 'notifications':
        return <NotificationsPage show={show} />;
      case 'settings':
        return <ProfileSettings show={show} />;
      case 'dashboard':
        return (
          <div className="admin-page-transition" id="admin-dashboard" key="dashboard-view">
            {searchResults && (
              <section className="glass-card admin-panel p-5" id="admin-search">
                <div className="section-head"><div><p className="eyebrow">Search</p><h2>Matched records</h2></div></div>
                <div className="grid gap-4 xl:grid-cols-4">
                  <div className="glass-card p-4">
                    <p className="text-sm text-slate-400">Customers</p>
                    {searchResults.customers.length ? searchResults.customers.slice(0, 4).map((customer) => (
                      <div className="list-row" key={customer.id}><span>{customer.full_name}</span><small>{customer.email}</small></div>
                    )) : <p className="text-slate-500">No matching customer records.</p>}
                  </div>
                  <div className="glass-card p-4">
                    <p className="text-sm text-slate-400">Workers</p>
                    {searchResults.workers.length ? searchResults.workers.slice(0, 4).map((worker) => (
                      <div className="list-row" key={worker.id}><span>{worker.full_name}</span><small>{worker.category?.name}</small></div>
                    )) : <p className="text-slate-500">No matching workers.</p>}
                  </div>
                  <div className="glass-card p-4">
                    <p className="text-sm text-slate-400">Bookings</p>
                    {searchResults.bookings.length ? searchResults.bookings.slice(0, 4).map((booking) => (
                      <div className="list-row" key={booking.id}><span>#{booking.id}</span><small>{booking.customer?.full_name || booking.worker?.full_name}</small></div>
                    )) : <p className="text-slate-500">No matching bookings.</p>}
                  </div>
                  <div className="glass-card p-4">
                    <p className="text-sm text-slate-400">Payments</p>
                    {searchResults.payments.length ? searchResults.payments.slice(0, 4).map((payment) => (
                      <div className="list-row" key={payment.id}><span>{payment.invoice_number || payment.transaction_id}</span><small>{payment.payment_status}</small></div>
                    )) : <p className="text-slate-500">No matching payments.</p>}
                  </div>
                </div>
              </section>
            )}

            <section className="overview-shell admin-section" id="admin-dashboard-content">
              <div className="overview-hero glass-card">
                <div className="overview-hero-copy">
                  <p className="eyebrow">Operations hub</p>
                  <h2>Welcome back, {user?.full_name || 'Admin'}</h2>
                  <p>Monitor the marketplace health, review new worker applications, and keep every booking moving from a single premium control center.</p>
                  <div className="hero-actions">
                    <button className="btn-primary" type="button" onClick={() => handleSection('bookings')}>Review bookings</button>
                    <button className="btn-ghost" type="button" onClick={() => handleSection('analytics')}>Open overview reports</button>
                  </div>
                </div>
                <div className="overview-hero-side">
                  <div className="overview-status-pill">
                    <span className="hero-pill">{useMockData ? 'Mock data' : 'Live data'}</span>
                    <span>{clock.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="overview-metric-stack">
                    <div className="overview-metric-row">
                      <strong>{overviewTotals.bookings ?? 314}</strong>
                      <span>Bookings</span>
                    </div>
                    <div className="overview-metric-row">
                      <strong>{currency.format(overviewTotals.monthlyRevenue ?? 480000)}</strong>
                      <span>Revenue</span>
                    </div>
                    <div className="overview-metric-row">
                      <strong>{pendingApprovals.length}</strong>
                      <span>Pending approvals</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overview-kpi-grid">
                {statCards.map((item) => {
                  const Icon = item.icon;
                  return (
                    <article key={item.label} className="overview-kpi-card glass-card">
                      <div className="overview-kpi-icon"><Icon size={18} /></div>
                      <div>
                        <p className="kpi-label">{item.label}</p>
                        <strong className="kpi-value">{item.value}</strong>
                        <small>{item.helper}</small>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="overview-grid">
                <article className="overview-chart-card glass-card">
                  <div className="section-head">
                    <div>
                      <p className="eyebrow">Performance trend</p>
                      <h2>Monthly bookings</h2>
                    </div>
                  </div>
                  <div className="overview-chart-canvas">
                    <Line data={{ labels: monthlyBookingsData.map((item) => item.label), datasets: [{ label: 'Bookings', data: monthlyBookingsData.map((item) => item.value), borderColor: dashboardAccentColor, backgroundColor: dashboardAccentSoft, tension: .35 }] }} options={dashboardChartOptions} />
                  </div>
                </article>
                <article className="overview-chart-card glass-card">
                  <div className="section-head">
                    <div>
                      <p className="eyebrow">Revenue pulse</p>
                      <h2>Revenue overview</h2>
                    </div>
                  </div>
                  <div className="overview-chart-canvas">
                    <Bar data={{ labels: revenueData.map((item) => item.label), datasets: [{ label: 'Revenue', data: revenueData.map((item) => item.value), backgroundColor: Array.from({ length: revenueData.length }, () => dashboardAccentColor) }] }} options={dashboardChartOptions} />
                  </div>
                </article>
              </div>

              <div className="overview-grid">
                <article className="overview-chart-card glass-card">
                  <div className="section-head">
                    <div>
                      <p className="eyebrow">Growth signals</p>
                      <h2>Worker and customer growth</h2>
                    </div>
                  </div>
                  <div className="overview-double-chart">
                    <div>
                      <h3>Worker growth</h3>
                      <div className="overview-chart-canvas compact">
                        <Line data={{ labels: workerGrowthData.map((item) => item.label), datasets: [{ label: 'Workers', data: workerGrowthData.map((item) => item.value), borderColor: dashboardAccentColor, backgroundColor: dashboardAccentSoft, tension: .3 }] }} options={dashboardChartOptions} />
                      </div>
                    </div>
                    <div>
                      <h3>Customer growth</h3>
                      <div className="overview-chart-canvas compact">
                        <Line data={{ labels: customerGrowthData.map((item) => item.label), datasets: [{ label: 'Customers', data: customerGrowthData.map((item) => item.value), borderColor: dashboardAccentColor, backgroundColor: dashboardAccentSoft, tension: .3 }] }} options={dashboardChartOptions} />
                      </div>
                    </div>
                  </div>
                </article>
                <article className="overview-activity-card glass-card">
                  <div className="section-head">
                    <div>
                      <p className="eyebrow">Recent activities</p>
                      <h2>Live feed</h2>
                    </div>
                  </div>
                  <div className="overview-feed-list">
                    {recentActivities.length ? recentActivities.map((item, index) => (
                      <div key={`${item.title || 'activity'}-${index}`} className="overview-feed-item">
                        <div>
                          <strong>{item.title || 'Marketplace update'}</strong>
                          <small>{item.message || item.summary || 'A new update is ready for review.'}</small>
                        </div>
                        <span className="quick-chip">{item.type || 'info'}</span>
                      </div>
                    )) : <p className="text-slate-400">No recent activity yet. New updates will appear here as they come in.</p>}
                  </div>
                </article>
              </div>

              <article className="overview-chart-card glass-card">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Demand snapshot</p>
                    <h2>Popular services</h2>
                  </div>
                </div>
                <div className="overview-chart-canvas">
                  <Bar data={{ labels: servicePopularityData.map((item) => item.name || item.label), datasets: [{ label: 'Requests', data: servicePopularityData.map((item) => item.value), backgroundColor: Array.from({ length: servicePopularityData.length }, () => dashboardAccentColor) }] }} options={dashboardChartOptions} />
                </div>
              </article>
            </section>

            <section className="glass-card admin-panel p-5" id="admin-activity">
              <div className="section-head"><div><p className="eyebrow">Live operations</p><h2>Today’s pulse</h2></div></div>
              <div className="grid gap-3">
                {recentActivities.length ? recentActivities.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="list-row">
                    <span><strong>{item.title || 'Marketplace update'}</strong><small>{item.message || item.summary || 'A fresh activity update is ready for review.'}</small></span>
                    <span className="quick-chip">{item.type || 'info'}</span>
                  </div>
                )) : <p className="text-slate-400">No recent activities to show yet.</p>}
              </div>
            </section>

            <section className="admin-section" id="admin-analytics">
              <div className="section-head"><div><p className="eyebrow">Analytics Overview</p><h2>Enterprise insights</h2></div></div>
              <div className="analytics-grid">
                <Panel title="Monthly Bookings"><Line data={{ labels: data.charts.monthlyBookings.map((item) => item.label), datasets: [{ label: 'Bookings', data: data.charts.monthlyBookings.map((item) => item.value), borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,.18)', tension: .3 }] }} options={chartOptions} /></Panel>
                <Panel title="Revenue Overview"><Line data={{ labels: data.payments.monthlyRevenue.map((item) => item.label), datasets: [{ label: 'Revenue', data: data.payments.monthlyRevenue.map((item) => item.value), borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,.18)', tension: .3 }] }} options={chartOptions} /></Panel>
                <Panel title="Worker Performance"><Bar data={{ labels: data.charts.workerPerformance.map((item) => item.label), datasets: [{ label: 'Jobs', data: data.charts.workerPerformance.map((item) => item.value), backgroundColor: '#38bdf8' }] }} options={chartOptionsWithYAxis} /></Panel>
                <Panel title="Most Requested Services"><Bar data={{ labels: data.charts.mostBookedServices.map((item) => item.name || item.label), datasets: [{ label: 'Requests', data: data.charts.mostBookedServices.map((item) => item.value), backgroundColor: '#818cf8' }] }} options={chartOptionsWithYAxis} /></Panel>
                <Panel title="Booking Status Distribution"><Bar data={{ labels: statusDistribution.map((item) => item.status.replace('_', ' ')), datasets: [{ label: 'Status', data: statusDistribution.map((item) => item.value), backgroundColor: '#38bdf8' }] }} options={chartOptionsWithYAxis} /></Panel>
              </div>
              <PaymentAnalytics analytics={data.payments} />
            </section>

            <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
              <section className="glass-card admin-panel p-5" id="admin-bookings">
                <BookingManagementPage bookings={bookings} onUpdate={updateBooking} show={show} />
              </section>

              <aside className="glass-card admin-summary p-5" id="admin-workers">
                <div className="section-head"><div><p className="eyebrow">Top-rated workers</p><h2>Worker summary</h2></div></div>
                <div className="summary-list">
                  {topWorkers.map((worker) => (
                    <div className="summary-card" key={worker.id}>
                      <div className="summary-avatar"><Avatar worker={worker} size="h-12 w-12" /></div>
                      <div>
                        <strong>{worker.full_name}</strong>
                        <p>{worker.category?.name || 'Service'}</p>
                      </div>
                      <div className="summary-meta">
                        <span>{worker.rating?.toFixed(1) || '0.0'} ★</span>
                        <span>{worker.completedJobs} jobs</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="section-head mt-6"><div><p className="eyebrow">Pending approvals</p><h2>Worker verification</h2></div></div>
                <div className="summary-list">
                  {pendingApprovals.length ? pendingApprovals.map((worker) => (
                    <div key={worker.id} className="list-row">
                      <span>{worker.full_name}</span>
                      <button className="btn-small" type="button" onClick={() => verifyWorker(worker.id)}>Verify</button>
                    </div>
                  )) : <p className="text-slate-400">No workers awaiting verification.</p>}
                </div>
                <div className="section-head mt-6"><div><p className="eyebrow">Quick actions</p><h2>Management</h2></div></div>
                <div className="quick-action-grid">
                  {quickActions.map((item) => (
                    <button type="button" key={item.label} className="quick-action" onClick={() => handleSection(item.target)}>
                      <item.icon size={18} /> {item.label}
                    </button>
                  ))}
                </div>
              </aside>
            </div>

            <section className="glass-card admin-panel p-5" id="admin-workers-management">
              <WorkerManagementPage workers={workers} setWorkers={setWorkers} show={show} onRefresh={load} />
            </section>

            <section className="glass-card admin-panel p-5" id="admin-customers">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Customer roster</p>
                  <h2>Registered customers</h2>
                </div>
                <div className="action-buttons">
                  <button className="btn-small" type="button" onClick={() => refreshCustomers()}>Refresh</button>
                </div>
              </div>

              <CustomerManagementPage
                customers={customers}
                setCustomers={setCustomers}
                show={show}
                onRefresh={refreshCustomers}
              />
            </section>

            <section className="glass-card admin-panel p-5" id="admin-payments">
              <div className="section-head"><div><p className="eyebrow">Payments & registrations</p><h2>Recent activity</h2></div><div className="flex items-center gap-3"><label className="text-sm text-slate-400">Filter status</label><select className="status-select" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}><option value="">All</option><option value="pending">Pending</option><option value="successful">Successful</option><option value="failed">Failed</option><option value="refunded">Refunded</option></select></div></div>
              <div className="grid gap-5 xl:grid-cols-3">
                <div className="activity-panel">
                  <h3>Recent Payments</h3>
                  {paymentRows.map((payment) => (
                    <div key={payment.id} className="activity-row">
                      <div><strong>{payment.transaction_id || payment.invoice_number}</strong><small>{payment.customer?.full_name || 'Customer'}</small></div>
                      <div><span>{currency.format(payment.amount)}</span><span className={`status-pill ${payment.payment_status}`}>{payment.payment_status}</span></div>
                      <div className="flex items-center gap-2">
                        <select className="status-select" value={payment.payment_status} onChange={(e) => updatePayment(payment.id, e.target.value)}>
                          <option value="successful">Successful</option>
                          <option value="pending">Pending</option>
                          <option value="failed">Failed</option>
                          <option value="refunded">Refunded</option>
                        </select>
                        <button className="table-button" type="button" onClick={() => viewPaymentDetails(payment)}>
                          Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="activity-panel">
                  <h3>New customers</h3>
                  {recentCustomers.map((customer) => (<div key={customer.id} className="activity-row"><div><strong>{customer.full_name}</strong><small>{customer.email}</small></div><span>{customer.bookings_count || '0'} bookings</span></div>))}
                </div>
                <div className="activity-panel">
                  <h3>New workers</h3>
                  {recentWorkers.map((worker) => (<div key={worker.id} className="activity-row"><div><strong>{worker.full_name}</strong><small>{worker.category?.name}</small></div><span>{worker.verified ? 'Verified' : 'Pending'}</span></div>))}
                </div>
              </div>
            </section>

            <section className="glass-card admin-panel p-5" id="admin-reviews">
              <div className="section-head"><div><p className="eyebrow">Customer feedback</p><h2>Recent reviews</h2></div></div>
              <div className="grid gap-3">
                {recentReviews.length ? recentReviews.map((review) => (
                  <div key={review.id} className="list-row">
                    <span><strong>{review.customer?.full_name || 'Customer'}</strong><small>{review.comment}</small></span>
                    <span className="quick-chip">{review.rating}/5</span>
                  </div>
                )) : <p className="text-slate-400">No reviews yet.</p>}
              </div>
            </section>

            <section className="glass-card admin-panel p-5" id="admin-reports">
              <div className="section-head"><div><p className="eyebrow">Export-ready reports</p><h2>Reports</h2></div></div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="activity-panel">
                  <h3>Bookings</h3>
                  <p className="text-slate-400">{bookings.length} total records</p>
                  <button className="btn-small mt-3" type="button" onClick={() => exportCsv('bookings.csv', ['id', 'customer', 'worker', 'status'], bookings.map((booking) => ({ id: booking.id, customer: booking.customer?.full_name || '', worker: booking.worker?.full_name || '', status: booking.status }))) }>Export CSV</button>
                </div>
                <div className="activity-panel">
                  <h3>Customers</h3>
                  <p className="text-slate-400">{customers.length} registered</p>
                  <button className="btn-small mt-3" type="button" onClick={() => exportCsv('customers.csv', ['id', 'full_name', 'email', 'phone'], customers.map((customer) => ({ id: customer.id, full_name: customer.full_name, email: customer.email, phone: customer.phone }))) }>Export CSV</button>
                </div>
                <div className="activity-panel">
                  <h3>Workers</h3>
                  <p className="text-slate-400">{workers.length} profiles</p>
                  <button className="btn-small mt-3" type="button" onClick={() => exportCsv('workers.csv', ['id', 'full_name', 'email', 'verified'], workers.map((worker) => ({ id: worker.id, full_name: worker.full_name, email: worker.email, verified: worker.verified ? 'Yes' : 'No' }))) }>Export CSV</button>
                </div>
                <div className="activity-panel">
                  <h3>Payments</h3>
                  <p className="text-slate-400">{payments.length} payment records</p>
                  <button className="btn-small mt-3" type="button" onClick={() => exportCsv('payments.csv', ['id', 'transaction_id', 'payment_status', 'amount'], payments.map((payment) => ({ id: payment.id, transaction_id: payment.transaction_id || payment.invoice_number, payment_status: payment.payment_status, amount: payment.amount }))) }>Export CSV</button>
                </div>
              </div>
            </section>

            <section className="glass-card admin-panel p-5" id="admin-notifications">
              <div className="section-head"><div><p className="eyebrow">Live notifications</p><h2>System updates</h2></div></div>
              <div className="grid gap-3">
                {recentNotifications.length ? recentNotifications.map((item) => (
                  <div key={item.id} className="list-row">
                    <span><strong>{item.title}</strong><small>{item.message}</small></span>
                    <span className="quick-chip">{item.type}</span>
                  </div>
                )) : <p className="text-slate-400">No notifications yet.</p>}
              </div>
            </section>

            <section className="glass-card admin-panel p-5" id="admin-settings">
              <div className="section-head"><div><p className="eyebrow">Admin preferences</p><h2>Settings</h2></div></div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="activity-panel">
                  <h3>Notifications</h3>
                  <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                    <span>Enable in-app alerts</span>
                    <input type="checkbox" checked={settings.notificationsEnabled} onChange={(e) => setSettings({ ...settings, notificationsEnabled: e.target.checked })} />
                  </label>
                </div>
                <div className="activity-panel">
                  <h3>Layout</h3>
                  <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                    <span>Compact cards</span>
                    <input type="checkbox" checked={settings.compactView} onChange={(e) => setSettings({ ...settings, compactView: e.target.checked })} />
                  </label>
                  <button className="btn-primary mt-3" type="button" onClick={saveSettings}>Save settings</button>
                </div>
              </div>
            </section>
          </div>
        );
      default:
        return (
          <section className="glass-card admin-panel p-5 admin-placeholder" key={location.pathname}>
            <div className="section-head">
              <div>
                <p className="eyebrow">Admin shell</p>
                <h2>{sectionTitles[currentSection] || 'Section'}</h2>
              </div>
              <button className="btn-ghost" type="button" onClick={() => handleSection('dashboard')}>Back to overview</button>
            </div>
            <div className="admin-placeholder-body">
              <p>Placeholder content for the {sectionTitles[currentSection] || 'selected'} section. The shell, routing, sidebar, and navigation are now live.</p>
              <div className="placeholder-pill-row">
                <span className="quick-chip">Responsive shell</span>
                <span className="quick-chip">Route-aware navigation</span>
                <span className="quick-chip">Collapsible sidebar</span>
              </div>
            </div>
          </section>
        );
    }
  })();

  return (
    <AdminDashboardLayout
      user={user}
      collapsed={collapsed}
      setCollapsed={setCollapsed}
      clock={clock}
      notificationCount={data.recentActivities?.length || 0}
      searchTerm={searchTerm}
      onSearch={setSearchTerm}
      activeSection={currentSection}
      onAction={handleSection}
      quickActions={quickActions}
    >
      {sectionContent}
    </AdminDashboardLayout>
  );
}

function CustomerManagementPage({ customers, setCustomers, show, onRefresh }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', address: '', is_active: true });
  const [busyId, setBusyId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const safeCustomers = Array.isArray(customers) ? customers : [];

  const filteredCustomers = useMemo(() => {
    return safeCustomers.filter((customer) => {
      const matchesSearch = !search || [customer.full_name, customer.email, customer.phone].some((value) => String(value || '').toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? customer.is_active !== false : customer.is_active === false);
      const createdAt = customer.created_at ? new Date(customer.created_at) : null;
      const matchesFrom = !dateFrom || !createdAt || createdAt >= new Date(dateFrom);
      const matchesTo = !dateTo || !createdAt || createdAt <= new Date(dateTo);
      return matchesSearch && matchesStatus && matchesFrom && matchesTo;
    });
  }, [safeCustomers, dateFrom, dateTo, search, statusFilter]);

  const selectedCustomerData = customerProfile || safeCustomers.find((customer) => String(customer.id) === String(selectedCustomerId)) || null;

  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomerProfile(null);
      setDetailsError('');
      setDetailsLoading(false);
      return undefined;
    }

    let isActive = true;
    setDetailsLoading(true);
    setDetailsError('');

    api.get(`/admin/customers/${selectedCustomerId}`)
      .then(({ data }) => {
        if (!isActive) return;
        setCustomerProfile(data || null);
      })
      .catch((error) => {
        if (!isActive) return;
        setCustomerProfile(null);
        setDetailsError(apiMessage(error));
      })
      .finally(() => {
        if (isActive) setDetailsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [selectedCustomerId]);

  const openEditor = (customer) => {
    setSelectedCustomer(customer);
    setForm({
      full_name: customer.full_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      is_active: customer.is_active !== false,
    });
    setIsEditing(true);
  };

  const closeEditor = () => {
    setSelectedCustomer(null);
    setIsEditing(false);
    setForm({ full_name: '', email: '', phone: '', address: '', is_active: true });
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setSelectedCustomerId(customer?.id ?? null);
    setIsEditing(false);
  };

  const saveCustomer = async (event) => {
    event.preventDefault();
    if (!selectedCustomer) return;
    try {
      const { data } = await api.put(`/admin/customers/${selectedCustomer.id}`, form);
      setCustomers((current) => current.map((customer) => customer.id === selectedCustomer.id ? { ...customer, ...data.customer } : customer));
      show('Customer profile updated.', 'success');
      closeEditor();
      onRefresh();
    } catch (error) {
      show(apiMessage(error), 'error');
    }
  };

  const toggleStatus = async (customer) => {
    try {
      setBusyId(customer.id);
      const { data } = await api.patch(`/admin/customers/${customer.id}/status`);
      setCustomers((current) => current.map((item) => item.id === customer.id ? { ...item, ...data.customer } : item));
      show(data.message || 'Customer status updated.', 'success');
    } catch (error) {
      show(apiMessage(error), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const deleteCustomer = async (customer) => {
    try {
      setBusyId(customer.id);
      await api.delete(`/admin/customers/${customer.id}`);
      setCustomers((current) => current.filter((item) => item.id !== customer.id));
      show('Customer deleted.', 'success');
      setConfirmDeleteId(null);
    } catch (error) {
      show(apiMessage(error), 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="customer-details-card glass-card p-4">
        {detailsLoading ? (
          <div className="customer-details-grid empty">
            <div className="customer-avatar-cell large"><div>TT</div></div>
            <div>
              <p className="eyebrow">Customer profile</p>
              <h3>Loading customer details…</h3>
              <p>Please wait while the admin profile is fetched.</p>
            </div>
          </div>
        ) : selectedCustomerData ? (
          <div className="customer-details-grid">
            <div className="customer-avatar-cell large">
              {selectedCustomerData.profile_photo ? <img src={assetUrl(selectedCustomerData.profile_photo)} alt={selectedCustomerData.full_name} /> : <div>{initials(selectedCustomerData.full_name)}</div>}
            </div>
            <div>
              <p className="eyebrow">Customer profile</p>
              <h3>{selectedCustomerData.full_name || 'Customer'}</h3>
              <p>{selectedCustomerData.email || 'No email provided'}</p>
              <div className="customer-detail-meta">
                <span>{selectedCustomerData.phone || 'No phone number'}</span>
                <span>{selectedCustomerData.address || 'No address provided'}</span>
                <span>{selectedCustomerData.bookings_count || selectedCustomerData.bookings?.length || 0} bookings</span>
                <span>{selectedCustomerData.is_active === false ? 'Disabled' : 'Active'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="customer-details-grid empty">
            <div className="customer-avatar-cell large"><div>TT</div></div>
            <div>
              <p className="eyebrow">Customer workspace</p>
              <h3>Select a customer</h3>
              <p>Choose a customer from the table to view their profile details here.</p>
            </div>
          </div>
        )}
        {detailsError ? <p className="empty-table-state">{detailsError}</p> : null}
      </div>

      <div className="customer-management-toolbar glass-card p-4">
        <div className="search-group">
          <div className="search-input">
            <Search size={16} />
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, email, or phone" />
          </div>
        </div>
        <div className="customer-filter-grid">
          <label className="filter-field">
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All accounts</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>
          <label className="filter-field">
            <span>Joined from</span>
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </label>
          <label className="filter-field">
            <span>Joined to</span>
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </label>
        </div>
      </div>

      <div className="table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Profile Picture</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone Number</th>
              <th>Registration Date</th>
              <th>Total Bookings</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length ? filteredCustomers.map((customer) => (
              <tr key={customer.id} className={selectedCustomerId === customer.id ? 'customer-row-active' : ''} onClick={() => selectCustomer(customer)}>
                <td>
                  <div className="customer-avatar-cell">
                    {customer.profile_photo ? <img src={assetUrl(customer.profile_photo)} alt={customer.full_name} /> : <div>{initials(customer.full_name)}</div>}
                  </div>
                </td>
                <td>{customer.full_name}</td>
                <td>{customer.email}</td>
                <td>{customer.phone || '—'}</td>
                <td>{customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '—'}</td>
                <td>{customer.bookings_count || 0}</td>
                <td><span className={`status-pill ${customer.is_active === false ? 'failed' : 'successful'}`}>{customer.is_active === false ? 'Disabled' : 'Active'}</span></td>
                <td>
                  <div className="action-buttons">
                    <button className="table-button" type="button" onClick={(event) => { event.stopPropagation(); selectCustomer(customer); }}>View</button>
                    <button className="table-button" type="button" onClick={(event) => { event.stopPropagation(); openEditor(customer); }}>Edit</button>
                    <button className="table-button" type="button" onClick={(event) => { event.stopPropagation(); toggleStatus(customer); }} disabled={busyId === customer.id}>{busyId === customer.id ? 'Working…' : customer.is_active === false ? 'Enable' : 'Disable'}</button>
                    <button className="table-button danger" type="button" onClick={(event) => { event.stopPropagation(); setConfirmDeleteId(customer.id); }}>Delete</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="8" className="empty-table-state">No customers match the current filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isEditing && selectedCustomer && (
        <div className="modal-backdrop" onClick={closeEditor}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="section-head">
              <div>
                <p className="eyebrow">Customer profile</p>
                <h2>Edit customer</h2>
              </div>
              <button className="table-button" type="button" onClick={closeEditor}>Close</button>
            </div>
            <form className="customer-form" onSubmit={saveCustomer}>
              <label>
                <span>Full name</span>
                <input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} required />
              </label>
              <label>
                <span>Email</span>
                <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
              </label>
              <label>
                <span>Phone number</span>
                <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              </label>
              <label>
                <span>Address</span>
                <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
              </label>
              <label className="toggle-row">
                <span>Account active</span>
                <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />
              </label>
              <div className="action-buttons justify-end">
                <button className="btn-ghost" type="button" onClick={closeEditor}>Cancel</button>
                <button className="btn-primary" type="submit">Save changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="modal-backdrop" onClick={() => setConfirmDeleteId(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="section-head">
              <div>
                <p className="eyebrow">Delete customer</p>
                <h2>Confirm removal</h2>
              </div>
            </div>
            <p className="text-slate-400">This will permanently remove the customer account and related bookings from the admin view. Continue?</p>
            <div className="action-buttons justify-end">
              <button className="btn-ghost" type="button" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button className="btn-primary danger" type="button" onClick={() => deleteCustomer(customers.find((customer) => customer.id === confirmDeleteId))}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function WorkerManagementPage({ workers, setWorkers, show, onRefresh }) {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState('');

  const filteredWorkers = useMemo(() => {
    return workers.filter((worker) => {
      const matchesTab = activeTab === 'all' || (activeTab === 'pending' ? worker.status !== 'approved' && worker.status !== 'rejected' : worker.status === activeTab);
      const matchesSearch = !search || [worker.full_name, worker.email, worker.phone, worker.category?.name].some((value) => String(value || '').toLowerCase().includes(search.toLowerCase()));
      return matchesTab && matchesSearch;
    });
  }, [activeTab, search, workers]);

  const updateWorkerStatus = async (worker, nextStatus) => {
    try {
      setBusyId(worker.id);
      const endpoint = nextStatus === 'approved' ? `/admin/workers/${worker.id}/verify` : `/admin/workers/${worker.id}/reject`;
      const { data } = await api.patch(endpoint);
      setWorkers((current) => current.map((item) => item.id === worker.id ? { ...item, ...data.worker, status: data.worker.status || nextStatus } : item));
      show(data.message || `Worker ${nextStatus}.`, 'success');
      if (selectedWorker?.id === worker.id) {
        setSelectedWorker({ ...selectedWorker, ...data.worker, status: data.worker.status || nextStatus });
      }
      onRefresh();
    } catch (error) {
      show(apiMessage(error), 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="section-head">
        <div>
          <p className="eyebrow">Worker roster</p>
          <h2>Workforce management</h2>
        </div>
        <div className="action-buttons">
          <button className="btn-small" type="button" onClick={onRefresh}>Refresh</button>
        </div>
      </div>

      <div className="worker-tabs">
        <button className={`tab-pill ${activeTab === 'pending' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('pending')}>Pending</button>
        <button className={`tab-pill ${activeTab === 'approved' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('approved')}>Approved</button>
        <button className={`tab-pill ${activeTab === 'rejected' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('rejected')}>Rejected</button>
        <button className={`tab-pill ${activeTab === 'all' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('all')}>All</button>
      </div>

      <div className="customer-management-toolbar glass-card p-4">
        <div className="search-group">
          <div className="search-input">
            <Search size={16} />
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search workers" />
          </div>
        </div>
      </div>

      <div className="worker-card-grid">
        {filteredWorkers.length ? filteredWorkers.map((worker) => (
          <article key={worker.id} className="worker-card glass-card p-4">
            <div className="worker-card-head">
              <div className="customer-avatar-cell">
                {worker.profile_photo ? <img src={assetUrl(worker.profile_photo)} alt={worker.full_name} /> : <div>{initials(worker.full_name)}</div>}
              </div>
              <div>
                <strong>{worker.full_name}</strong>
                <p>{worker.category?.name || 'Unassigned category'}</p>
              </div>
              <span className={`status-pill ${worker.status === 'approved' ? 'successful' : worker.status === 'rejected' ? 'failed' : 'pending'}`}>{worker.status || 'pending'}</span>
            </div>
            <div className="worker-meta-grid">
              <div><span>Email</span><strong>{worker.email}</strong></div>
              <div><span>Phone</span><strong>{worker.phone || '—'}</strong></div>
              <div><span>Experience</span><strong>{worker.experience || 0} yrs</strong></div>
              <div><span>Bookings</span><strong>{worker.bookings_count || 0}</strong></div>
            </div>
            <p className="worker-about">{worker.about || worker.skills?.join(', ') || 'No bio provided yet.'}</p>
            <div className="action-buttons">
              <button className="table-button" type="button" onClick={() => setSelectedWorker(worker)}>View</button>
              <button className="table-button" type="button" onClick={() => updateWorkerStatus(worker, 'approved')} disabled={busyId === worker.id}>Approve</button>
              <button className="table-button danger" type="button" onClick={() => updateWorkerStatus(worker, 'rejected')} disabled={busyId === worker.id}>Reject</button>
            </div>
          </article>
        )) : <div className="empty-table-state">No workers match the current tab.</div>}
      </div>

      {selectedWorker && (
        <div className="modal-backdrop" onClick={() => setSelectedWorker(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="section-head">
              <div>
                <p className="eyebrow">Worker profile</p>
                <h2>{selectedWorker.full_name}</h2>
              </div>
              <button className="table-button" type="button" onClick={() => setSelectedWorker(null)}>Close</button>
            </div>
            <div className="worker-detail-grid">
              <div className="customer-avatar-cell detail-avatar">
                {selectedWorker.profile_photo ? <img src={assetUrl(selectedWorker.profile_photo)} alt={selectedWorker.full_name} /> : <div>{initials(selectedWorker.full_name)}</div>}
              </div>
              <div className="worker-detail-copy">
                <p><strong>Email:</strong> {selectedWorker.email}</p>
                <p><strong>Phone:</strong> {selectedWorker.phone || '—'}</p>
                <p><strong>Service category:</strong> {selectedWorker.category?.name || '—'}</p>
                <p><strong>Experience:</strong> {selectedWorker.experience || 0} years</p>
                <p><strong>Status:</strong> {selectedWorker.status || 'pending'}</p>
                <p><strong>About:</strong> {selectedWorker.about || selectedWorker.skills?.join(', ') || 'No bio provided yet.'}</p>
              </div>
            </div>
            <div className="action-buttons justify-end">
              <button className="btn-ghost" type="button" onClick={() => updateWorkerStatus(selectedWorker, 'rejected')}>Reject</button>
              <button className="btn-primary" type="button" onClick={() => updateWorkerStatus(selectedWorker, 'approved')}>Approve</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function BookingManagementPage({ bookings, onUpdate, show }) {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState('');

  const bookingFlow = ['pending', 'accepted', 'worker_on_the_way', 'worker_arrived', 'in_progress', 'completed'];

  const filteredBookings = useMemo(() => {
    const term = search.toLowerCase();
    return bookings.filter((booking) => {
      if (!term) return true;
      return [booking.id, booking.customer?.full_name, booking.worker?.full_name, booking.category?.name, booking.address, booking.booking_date].some((value) => String(value || '').toLowerCase().includes(term));
    });
  }, [bookings, search]);

  const statusSummary = useMemo(() => filteredBookings.reduce((acc, booking) => {
    const key = String(booking.status || 'pending').replace(/_/g, ' ');
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {}), [filteredBookings]);

  const updateStatus = async (booking, status) => {
    try {
      setBusyId(booking.id);
      await onUpdate(booking.id, status);
      if (selectedBooking?.id === booking.id) {
        setSelectedBooking({ ...selectedBooking, status });
      }
    } catch (error) {
      show(apiMessage(error), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const resolveImages = (booking) => {
    const images = booking?.images || booking?.uploaded_images || [];
    if (!Array.isArray(images)) return [];
    return images.filter((image) => {
      if (typeof image === 'string') return Boolean(image.trim());
      return Boolean(image);
    });
  };

  return (
    <>
      <div className="section-head">
        <div>
          <p className="eyebrow">Service bookings</p>
          <h2>Booking management</h2>
        </div>
        <div className="search-group">
          <div className="search-input">
            <Search size={16} />
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search bookings" />
          </div>
        </div>
      </div>

      <div className="booking-summary-row">
        <div className="booking-summary-pill">
          <span>Open requests</span>
          <strong>{filteredBookings.length}</strong>
        </div>
        <div className="booking-summary-pill">
          <span>Pending</span>
          <strong>{statusSummary.pending || 0}</strong>
        </div>
        <div className="booking-summary-pill">
          <span>Accepted</span>
          <strong>{statusSummary.accepted || 0}</strong>
        </div>
        <div className="booking-summary-pill">
          <span>Completed</span>
          <strong>{statusSummary.completed || 0}</strong>
        </div>
      </div>

      <div className="booking-grid">
        {filteredBookings.length ? filteredBookings.map((booking) => (
          <article key={booking.id} className="booking-card glass-card p-4">
            <div className="booking-card-head">
              <div className="booking-card-title">
                <div className="booking-card-icon"><BriefcaseBusiness size={16} /></div>
                <div>
                  <strong>Booking #{booking.id}</strong>
                  <p>{booking.customer?.full_name || 'Customer'}</p>
                </div>
              </div>
              <span className={`status-pill ${booking.status === 'completed' ? 'successful' : booking.status === 'cancelled' ? 'failed' : 'pending'}`}>{String(booking.status || 'pending').replace(/_/g, ' ')}</span>
            </div>

            <div className="booking-meta-grid">
              <div><span>Worker</span><strong>{booking.worker?.full_name || '—'}</strong></div>
              <div><span>Service</span><strong>{booking.category?.name || booking.worker?.category?.name || '—'}</strong></div>
              <div><span>Date</span><strong>{booking.booking_date || '—'}</strong></div>
              <div><span>Time</span><strong>{booking.booking_time || '—'}</strong></div>
            </div>

            <div className="booking-chip-row">
              <span className="quick-chip"><MapPin size={14} /> {booking.address || 'Location pending'}</span>
              <span className="quick-chip"><Clock3 size={14} /> {booking.booking_date || 'Schedule TBD'}</span>
            </div>

            <p className="booking-problem">{booking.notes || booking.problem_description || 'No problem description provided.'}</p>

            {resolveImages(booking).length ? (
              <div className="booking-image-row">
                {resolveImages(booking).slice(0, 4).map((image, index) => {
                  const src = typeof image === 'string' ? assetUrl(image) : image instanceof Blob ? URL.createObjectURL(image) : '';
                  return src ? <img key={`${booking.id}-${index}`} src={src} alt={`Booking ${booking.id} image ${index + 1}`} /> : null;
                })}
              </div>
            ) : <p className="text-slate-400">No uploaded images.</p>}

            <div className="booking-card-footer">
              <div className="booking-pill-row">
                <span className="quick-chip"><ReceiptText size={14} /> {booking.urgency || 'Standard'}</span>
                <span className="quick-chip"><WalletCards size={14} /> {booking.payment?.payment_status || 'pending'}</span>
              </div>
              <div className="action-buttons">
                <button className="table-button" type="button" onClick={() => setSelectedBooking(booking)}>View</button>
                <button className="table-button" type="button" onClick={() => updateStatus(booking, 'cancelled')} disabled={busyId === booking.id}>Cancel</button>
              </div>
            </div>
          </article>
        )) : <div className="empty-table-state">No bookings match the current search.</div>}
      </div>

      {selectedBooking && (
        <div className="modal-backdrop" onClick={() => setSelectedBooking(null)}>
          <div className="modal-card booking-detail-card" onClick={(event) => event.stopPropagation()}>
            <div className="section-head">
              <div>
                <p className="eyebrow">Booking details</p>
                <h2>Booking #{selectedBooking.id}</h2>
              </div>
              <button className="table-button" type="button" onClick={() => setSelectedBooking(null)}>Close</button>
            </div>

            <div className="booking-detail-grid">
              <div className="booking-detail-pane">
                <div className="booking-detail-surface">
                  <div className="booking-detail-header">
                    <div>
                      <p className="eyebrow">Service snapshot</p>
                      <h3>Customer & service details</h3>
                    </div>
                    <span className={`status-pill ${selectedBooking.status === 'completed' ? 'successful' : selectedBooking.status === 'cancelled' ? 'failed' : 'pending'}`}>{String(selectedBooking.status || 'pending').replace(/_/g, ' ')}</span>
                  </div>
                  <div className="booking-info-grid">
                    <div><span>Customer</span><strong>{selectedBooking.customer?.full_name || '—'}</strong></div>
                    <div><span>Worker</span><strong>{selectedBooking.worker?.full_name || '—'}</strong></div>
                    <div><span>Service</span><strong>{selectedBooking.category?.name || selectedBooking.worker?.category?.name || '—'}</strong></div>
                    <div><span>Address</span><strong>{selectedBooking.address || '—'}</strong></div>
                    <div><span>Date</span><strong>{selectedBooking.booking_date || '—'}</strong></div>
                    <div><span>Time</span><strong>{selectedBooking.booking_time || '—'}</strong></div>
                    <div><span>Urgency</span><strong>{selectedBooking.urgency || 'Standard'}</strong></div>
                    <div><span>Payment</span><strong>{selectedBooking.payment?.payment_status || 'pending'}</strong></div>
                  </div>
                  <p className="booking-problem"><strong>Service notes:</strong> {selectedBooking.notes || selectedBooking.problem_description || 'No problem description provided.'}</p>
                </div>
              </div>
              <div className="booking-detail-pane">
                <div className="booking-detail-surface">
                  <div className="booking-status-flow">
                    {bookingFlow.map((status) => (
                      <button key={status} className={`status-step ${selectedBooking.status === status ? 'active' : ''}`} type="button" onClick={() => updateStatus(selectedBooking, status)} disabled={busyId === selectedBooking.id}>
                        {status.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                  <div className="booking-image-row">
                    {resolveImages(selectedBooking).length ? resolveImages(selectedBooking).slice(0, 6).map((image, index) => {
                      const src = typeof image === 'string' ? assetUrl(image) : image instanceof Blob ? URL.createObjectURL(image) : '';
                      return src ? <img key={`${selectedBooking.id}-${index}`} src={src} alt={`Booking ${selectedBooking.id} detail ${index + 1}`} /> : null;
                    }) : <p className="text-slate-400">No uploaded images to display.</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AdminDashboardLayout({ user, collapsed, setCollapsed, clock, notificationCount, searchTerm, onSearch, activeSection, quickActions, onAction, children }) {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('tunatuna_admin_theme') || 'dark');

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    document.body.classList.toggle('theme-light', theme === 'light');
    document.body.classList.toggle('theme-dark', theme === 'dark');
  }, [theme]);

  const nav = [
    { label: 'Dashboard', icon: LayoutDashboard, target: 'dashboard' },
    { label: 'Customers', icon: Users, target: 'customers' },
    { label: 'Workers', icon: ShieldCheck, target: 'workers' },
    { label: 'Bookings', icon: CalendarCheck, target: 'bookings' },
    { label: 'Service Categories', icon: Wrench, target: 'service-categories' },
    { label: 'Payments', icon: CreditCard, target: 'payments' },
    { label: 'Reviews', icon: Star, target: 'reviews' },
    { label: 'Reports', icon: FileText, target: 'reports' },
    { label: 'Analytics', icon: BarChart3, target: 'analytics' },
    { label: 'Notifications', icon: Bell, target: 'notifications' },
    { label: 'Settings', icon: Settings2, target: 'settings' },
    { label: 'Logout', icon: LogOut, target: 'logout' },
  ];

  const currentPath = location.pathname.replace(/\/$/, '') || '/dashboard';
  const currentSegment = currentPath.split('/').filter(Boolean).pop() || 'dashboard';
  const activeTarget = ['dashboard', 'customers', 'workers', 'bookings', 'service-categories', 'payments', 'reviews', 'reports', 'analytics', 'notifications', 'settings'].includes(currentSegment) ? currentSegment : 'dashboard';
  const sectionTitles = {
    dashboard: 'Overview',
    customers: 'Customers',
    workers: 'Workers',
    bookings: 'Bookings',
    'service-categories': 'Service Categories',
    payments: 'Payments',
    reviews: 'Reviews',
    reports: 'Reports',
    analytics: 'Analytics',
    notifications: 'Notifications',
    settings: 'Settings',
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setMobileNavOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const closeMobileNav = () => setMobileNavOpen(false);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('tunatuna_admin_theme', nextTheme);
  };

  const handleLogout = async () => {
    closeMobileNav();
    await logout();
    navigate('/login');
  };

  const handleNavSelect = (target) => {
    if (target === 'logout') {
      void handleLogout();
      return;
    }
    onAction?.(target);
    closeMobileNav();
  };

  return (
    <>
      <div className={`admin-mobile-backdrop ${mobileNavOpen ? 'open' : ''}`} onClick={closeMobileNav} />
      <section className={`dashboard-wrap ${theme === 'light' ? 'theme-light' : 'theme-dark'}`}>
        <aside className={`dashboard-sidebar ${mobileNavOpen ? 'flex' : 'hidden'} md:flex ${collapsed ? 'collapsed' : ''}`}>
          <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[.04] p-3">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 font-black text-white">TT</span>
              <div>
                <strong className="text-white">TunaTuna</strong>
                <small>{user?.role || 'Admin'} workspace</small>
              </div>
            </div>
            <button className="btn-ghost md:hidden" type="button" onClick={() => setMobileNavOpen(false)}><X size={17} /></button>
          </div>

          <div className="mb-4 rounded-2xl border border-white/10 bg-white/[.04] p-3">
            <p className="eyebrow">Admin panel</p>
            <h3 className="mt-1 text-lg font-black text-white">{sectionTitles[activeSection] || 'Dashboard'}</h3>
            <p className="mt-1 text-sm text-slate-400">Manage operations from one place.</p>
          </div>

          <nav className="flex flex-col gap-2">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.label} className={`side-link ${item.target === activeTarget ? 'active' : ''}`} type="button" onClick={() => handleNavSelect(item.target)}>
                  <Icon size={17} /> {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3 rounded-2xl border border-white/10 bg-white/[.04] p-3">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 font-black text-white">{initials(user?.full_name || user?.name)}</span>
              <div>
                <strong className="block text-white">{user?.full_name || user?.name}</strong>
                <small>{user?.role || 'Admin'}</small>
              </div>
            </div>
            <button className="btn-ghost w-full justify-start" type="button" onClick={() => void handleLogout()}><LogOut size={16} /> Logout</button>
          </div>
        </aside>

        <main className="dashboard-main">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/10 bg-slate-900/70 p-5 backdrop-blur">
            <div>
              <p className="eyebrow">Welcome, {user?.full_name || user?.name || 'Admin'}</p>
              <h1 className="text-3xl font-black text-white sm:text-4xl">{sectionTitles[activeSection] || 'Dashboard'}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button className="btn-ghost md:hidden" type="button" onClick={() => setMobileNavOpen((current) => !current)}>{mobileNavOpen ? <X size={17} /> : <Menu size={17} />}</button>
              <button className="icon-btn" type="button" onClick={toggleTheme} aria-label="Toggle admin theme">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button className="icon-btn" type="button" aria-label="Notifications">
                <Bell size={18} />
                {notificationCount ? <span className="notification-badge">{notificationCount}</span> : null}
              </button>
              <div className="rounded-2xl border border-white/10 bg-white/[.04] px-3 py-2 text-right text-sm text-slate-300">
                <div>{clock.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                <strong className="text-white">{clock.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</strong>
              </div>
              <button className="btn-primary" type="button" onClick={() => handleNavSelect('reports')}>Reports</button>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {quickActions?.map((action) => (
              <button key={action.label} type="button" className="quick-chip" onClick={() => handleNavSelect(action.target)}>
                <action.icon size={16} /> {action.label}
              </button>
            ))}
          </div>

          <div className="admin-page-transition" key={location.pathname}>
            {children}
          </div>
        </main>
      </section>
    </>
  );
}

function getTrend(items = []) {
  if (!items.length) return { label: '0%', rising: true, values: [0] };
  const first = Number(items[0].value) || 0;
  const last = Number(items[items.length - 1].value) || 0;
  const diff = first ? Math.round(((last - first) / first) * 100) : (last ? 100 : 0);
  return { label: `${diff > 0 ? '+' : ''}${diff}%`, rising: diff >= 0, values: items.map((item) => Number(item.value) || 0) };
}

function Sparkline({ values = [], color = '#38bdf8' }) {
  const width = 120;
  const height = 36;
  const points = values.map((value, index) => {
    const normalized = values.length > 1 ? (Number(value) - Math.min(...values)) / (Math.max(...values) - Math.min(...values) || 1) : 0.5;
    const x = index * (width / Math.max(values.length - 1, 1));
    const y = height - normalized * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="sparkline" aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AdminDashboardSkeleton() {
  return (
    <section className="admin-shell admin-loading">
      <aside className="admin-sidebar loading-sidebar">
        <div className="loading-skeleton h-16 mb-6 rounded-3xl"></div>
        <div className="loading-skeleton h-12 rounded-3xl mb-3"></div>
        <div className="loading-skeleton h-12 rounded-3xl mb-3"></div>
        <div className="loading-skeleton h-12 rounded-3xl mb-3"></div>
      </aside>
      <main className="admin-main">
        <div className="loading-skeleton h-16 mb-6 rounded-3xl"></div>
        <div className="admin-card-grid">
          {Array.from({ length: 6 }).map((_, index) => <div key={index} className="glass-card loading-skeleton h-36" />)}
        </div>
        <div className="grid gap-5 lg:grid-cols-2 mt-5">
          <div className="glass-card loading-skeleton h-80" />
          <div className="glass-card loading-skeleton h-80" />
        </div>
      </main>
    </section>
  );
}

function CustomerDashboardLayout({ title, activeView, onSelect, quickActions, children }) {
  const { user, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
    { id: 'payments', label: 'Payments', icon: ReceiptText },
    { id: 'settings', label: 'Settings', icon: Settings2 },
  ];

  return (
    <section className="dashboard-wrap">
      <aside className={`dashboard-sidebar ${mobileNavOpen ? 'flex' : 'hidden'} md:flex`}>
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.04] p-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 font-black text-white">TT</span>
          <div>
            <strong className="text-white">TunaTuna</strong>
            <small>{user.role} workspace</small>
          </div>
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} className={`side-link ${activeView === item.id ? 'active' : ''}`} type="button" onClick={() => { setMobileNavOpen(false); onSelect(item.id); }}>
              <Icon size={17} /> {item.label}
            </button>
          );
        })}
        <Link className="side-link" to="/marketplace"><BriefcaseBusiness size={17} /> Marketplace</Link>
        <Link className="side-link" to="/map"><MapPin size={17} /> Map</Link>
        <button className="side-link mt-auto" type="button" onClick={logout}><LogOut size={17} /> Logout</button>
      </aside>
      <main className="dashboard-main">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/10 bg-slate-900/70 p-5 backdrop-blur">
          <div>
            <p className="eyebrow">Welcome, {user.full_name || user.name}</p>
            <h1 className="text-3xl font-black text-white sm:text-4xl">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-ghost md:hidden" type="button" onClick={() => setMobileNavOpen((current) => !current)}>{mobileNavOpen ? <X size={17} /> : <Menu size={17} />}</button>
            <div className="flex flex-wrap gap-2">{quickActions.map((item) => <button key={item} className="quick-chip" type="button" onClick={() => onSelect(item.toLowerCase())}>{item}</button>)}</div>
          </div>
        </div>
        <div className="grid gap-5">{children}</div>
      </main>
    </section>
  );
}

function DashboardLayout({ title, quick, children }) {
  const { user, logout } = useAuth();
  const nav = user.role === 'admin'
    ? [['Dashboard', '/dashboard'], ['Analytics', '/dashboard'], ['Users', '/dashboard'], ['Categories', '/dashboard']]
    : [['Dashboard', '/dashboard'], ['Marketplace', '/marketplace'], ['Map', '/map'], ['Settings', '/settings']];
  return (
    <section className="dashboard-wrap">
      <aside className="dashboard-sidebar">
        <div className="mb-8 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-500 font-black">TT</span><div><strong>TunaTuna</strong><small>{user.role} workspace</small></div></div>
        {nav.map(([label, path]) => <Link key={label} className="side-link" to={path}><Home size={17} /> {label}</Link>)}
        <button className="side-link mt-auto" onClick={logout}><LogOut size={17} /> Logout</button>
      </aside>
      <main className="dashboard-main">
        <div className="section-head">
          <div><p className="eyebrow">Welcome, {user.full_name || user.name}</p><h1 className="text-4xl font-black text-white">{title}</h1></div>
          <div className="flex flex-wrap gap-2">{quick.map((item) => <span className="quick-chip" key={item}>{item}</span>)}</div>
        </div>
        <div className="grid gap-5">{children}</div>
      </main>
    </section>
  );
}

function Panel({ title, children }) {
  return <section className="glass-card p-5"><h2 className="mb-4 text-xl font-black text-white">{title}</h2><div className="grid gap-3">{children}</div></section>;
}

function MiniWorker({ worker }) {
  return <div className="list-row"><span className="flex items-center gap-3"><Avatar worker={worker} size="h-10 w-10" />{worker.full_name}<small>{worker.category?.name}</small></span><strong>{Number(worker.rating).toFixed(1)}</strong></div>;
}

function BookingList({ bookings = [], onStatus }) {
  if (!bookings.length) return <p className="text-slate-400">No bookings yet.</p>;
  return bookings.map((booking) => (
    <article className="rounded-lg border border-white/10 bg-white/[.035] p-4" key={booking.id}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><strong className="text-white">#{booking.id} {booking.category?.name || booking.worker?.category?.name}</strong><p>{booking.customer?.full_name || booking.worker?.full_name} - {booking.booking_date} at {booking.booking_time}</p></div>
        <StatusBadge status={booking.status} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">{statusFlow.map((step) => <span className={`flow-step ${statusFlow.indexOf(booking.status) >= statusFlow.indexOf(step) ? 'active' : ''}`} key={step}>{step.replace('_', ' ')}</span>)}</div>
      {booking.payment && <div className="mt-3 text-sm text-slate-300">Payment: <strong className="capitalize text-blue-200">{booking.payment.payment_status}</strong> via {booking.payment.payment_method.toUpperCase()}</div>}
      {onStatus && <select className="mt-3 max-w-xs" value={booking.status} onChange={(e) => onStatus(booking.id, e.target.value)}>{['pending', 'confirmed', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected'].map((s) => <option key={s}>{s}</option>)}</select>}
    </article>
  ));
}

function StatusBadge({ status }) {
  return <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black uppercase text-blue-200">{status.replace('_', ' ')}</span>;
}

function NotificationList({ items = [] }) {
  if (!items.length) return <p className="text-slate-400">No notifications.</p>;
  return items.map((item) => <div className="list-row" key={item.id}><span>{item.title}<small>{item.message}</small></span><Bell size={17} className="text-blue-300" /></div>);
}

function PaymentList({ payments = [], admin = false, onStatus, show }) {
  const downloadInvoice = async (payment) => {
    try {
      const { data } = await api.get(`/payments/${payment.id}/invoice`, { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${payment.invoice_number}.html`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      show(apiMessage(error), 'error');
    }
  };

  if (!payments.length) return <p className="text-slate-400">No payment records yet.</p>;

  return payments.map((payment) => (
    <article className="payment-row" key={payment.id}>
      <div>
        <strong>{payment.invoice_number}</strong>
        <small>{payment.booking?.category?.name} with {payment.worker?.full_name} - {payment.transaction_id}</small>
        {admin && <small>Customer: {payment.customer?.full_name}</small>}
      </div>
      <div className="payment-row-actions">
        <span className={`payment-badge ${payment.payment_status}`}>{payment.payment_status}</span>
        <strong>{currency.format(payment.amount)}</strong>
        <button className="btn-small" onClick={() => downloadInvoice(payment)}><Download size={15} /> Invoice</button>
        {admin && (
          <select value={payment.payment_status} onChange={(e) => onStatus(payment.id, e.target.value)}>
            <option value="successful">Successful</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        )}
      </div>
    </article>
  ));
}

function PaymentAnalytics({ analytics }) {
  if (!analytics) return null;
  const options = { responsive: true, plugins: { legend: { labels: { color: '#cbd5e1' } } }, scales: { x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,.1)' } }, y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,.1)' } } } };
  const revenue = {
    labels: analytics.monthlyRevenue.map((item) => item.label),
    datasets: [{ label: 'Revenue', data: analytics.monthlyRevenue.map((item) => item.value), borderColor: '#22d3ee', backgroundColor: 'rgba(34,211,238,.2)', tension: .35 }],
  };
  const methods = {
    labels: analytics.methods.map((item) => item.label.toUpperCase()),
    datasets: [{ label: 'Payments', data: analytics.methods.map((item) => item.value), backgroundColor: '#2563eb', borderRadius: 8 }],
  };

  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <div className="glass-card p-5">
        <h2 className="mb-4 text-xl font-black text-white">Payment Analytics</h2>
        <div className="grid gap-3">
          <div className="summary-row"><span>Total Collected</span><strong>{currency.format(analytics.totalCollected)}</strong></div>
          <div className="summary-row"><span>Pending Cash</span><strong>{currency.format(analytics.pendingAmount)}</strong></div>
          <div className="summary-row"><span>Successful</span><strong>{analytics.successfulCount}</strong></div>
          <div className="summary-row"><span>Pending</span><strong>{analytics.pendingCount}</strong></div>
        </div>
      </div>
      <Panel title="Payment Revenue"><Line data={revenue} options={options} /></Panel>
      <Panel title="Payment Methods"><Bar data={methods} options={options} /></Panel>
    </div>
  );
}

function AnalyticsCharts({ charts }) {
  const lineData = (items, label) => ({
    labels: items.map((i) => i.label),
    datasets: [{ label, data: items.map((i) => i.value), borderColor: '#38bdf8', backgroundColor: 'rgba(59,130,246,.2)', tension: .35 }],
  });
  const barData = (items, labelKey = 'name') => ({
    labels: items.map((i) => i[labelKey] || i.label),
    datasets: [{ label: 'Count', data: items.map((i) => i.value), backgroundColor: '#2563eb', borderRadius: 8 }],
  });
  const options = { responsive: true, plugins: { legend: { labels: { color: '#cbd5e1' } } }, scales: { x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,.1)' } }, y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,.1)' } } } };
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <Panel title="Bookings"><Line data={lineData(charts.monthlyBookings, 'Bookings')} options={options} /></Panel>
      <Panel title="Services"><Bar data={barData(charts.mostBookedServices)} options={options} /></Panel>
      <Panel title="Worker Performance"><Bar data={barData(charts.workerPerformance, 'label')} options={options} /></Panel>
    </div>
  );
}

function CategoryManager({ categories, reload, show }) {
  const [form, setForm] = useState({ name: '', base_price: 499, description: '' });
  const save = async (event) => {
    event.preventDefault();
    try {
      await api.post('/admin/categories', form);
      setForm({ name: '', base_price: 499, description: '' });
      show('Category added.');
      reload();
    } catch (error) { show(apiMessage(error), 'error'); }
  };
  const remove = async (id) => {
    try { await api.delete(`/admin/categories/${id}`); show('Category deleted.'); reload(); } catch (error) { show(apiMessage(error), 'error'); }
  };
  return (
    <Panel title="Service Category Management">
      <form className="grid gap-3" onSubmit={save}>
        <input required placeholder="Category name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input required type="number" placeholder="Base price" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button className="btn-primary">Add Category</button>
      </form>
      {categories.map((category) => <div className="list-row" key={category.id}><span>{category.name}<small>{currency.format(category.base_price)}</small></span><button className="btn-small" onClick={() => remove(category.id)}>Delete</button></div>)}
    </Panel>
  );
}

function ServiceCategoriesManagementPage({ categories, reload, show }) {
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', base_price: 499, description: '', active: true });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const seededRef = useRef(false);

  const filteredCategories = useMemo(() => {
    const term = search.toLowerCase();
    return categories.filter((category) => {
      if (!term) return true;
      return [category.name, category.description, category.base_price].some((value) => String(value || '').toLowerCase().includes(term));
    });
  }, [categories, search]);

  useEffect(() => {
    if (seededRef.current || categories.length > 0) return;
    const seedDefaults = async () => {
      seededRef.current = true;
      const defaults = [
        { name: 'House Cleaning', description: 'Routine home cleaning for apartments and villas.', base_price: 599 },
        { name: 'Deep Cleaning', description: 'Detailed cleaning for kitchens, bathrooms, and full homes.', base_price: 1299 },
        { name: 'Electrician', description: 'Certified electrical repairs, fixtures, and wiring checks.', base_price: 499 },
        { name: 'Plumber', description: 'Leak repairs, fittings, blockage clearing, and inspections.', base_price: 499 },
        { name: 'Carpenter', description: 'Furniture repair, installation, and custom woodwork.', base_price: 699 },
        { name: 'Painter', description: 'Wall painting, touch-ups, and waterproof coating.', base_price: 999 },
      ];
      try {
        await Promise.all(defaults.map((item) => api.post('/admin/categories', item)));
        show('Default service categories were seeded.', 'success');
        reload();
      } catch (error) {
        show(apiMessage(error), 'error');
      }
    };
    seedDefaults();
  }, [categories.length, reload, show]);

  const openEditor = (category) => {
    setSelectedCategory(category);
    setEditorOpen(true);
    setForm({
      name: category.name || '',
      base_price: category.base_price || 499,
      description: category.description || '',
      active: category.active !== false,
    });
  };

  const closeEditor = () => {
    setSelectedCategory(null);
    setEditorOpen(false);
    setForm({ name: '', base_price: 499, description: '', active: true });
  };

  const saveCategory = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      show('Please enter a category name.', 'error');
      return;
    }
    if (!Number(form.base_price) || Number(form.base_price) < 99) {
      show('Base price must be at least 99.', 'error');
      return;
    }
    try {
      const payload = {
        name: form.name.trim(),
        base_price: Number(form.base_price),
        description: form.description?.trim() || '',
        active: form.active,
      };
      if (selectedCategory) {
        await api.put(`/admin/categories/${selectedCategory.id}`, payload);
        show('Category updated.', 'success');
      } else {
        await api.post('/admin/categories', payload);
        show('Category added.', 'success');
      }
      closeEditor();
      reload();
    } catch (error) {
      show(apiMessage(error), 'error');
    }
  };

  const toggleActive = async (category) => {
    try {
      setBusyId(category.id);
      await api.put(`/admin/categories/${category.id}`, { name: category.name, description: category.description || '', base_price: category.base_price || 499, active: !category.active });
      show('Category status updated.', 'success');
      reload();
    } catch (error) {
      show(apiMessage(error), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const deleteCategory = async (category) => {
    try {
      setBusyId(category.id);
      await api.delete(`/admin/categories/${category.id}`);
      show('Category deleted.', 'success');
      setConfirmDeleteId(null);
      reload();
    } catch (error) {
      show(apiMessage(error), 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="glass-card admin-panel p-5" id="admin-service-categories">
      <div className="section-head">
        <div>
          <p className="eyebrow">Service catalog</p>
          <h2>Service categories</h2>
        </div>
        <button className="btn-primary" type="button" onClick={() => { setSelectedCategory(null); setEditorOpen(true); setForm({ name: '', base_price: 499, description: '', active: true }); }}>Add category</button>
      </div>

      <div className="customer-management-toolbar glass-card p-4">
        <div className="search-group">
          <div className="search-input">
            <Search size={16} />
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search categories" />
          </div>
        </div>
      </div>

      <div className="table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Base price</th>
              <th>Status</th>
              <th>Workers</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.length ? filteredCategories.map((category) => (
              <tr key={category.id}>
                <td>
                  <strong className="text-white">{category.name}</strong>
                  <small>{category.description || 'No description provided.'}</small>
                </td>
                <td>{currency.format(category.base_price)}</td>
                <td><span className={`status-pill ${category.active === false ? 'failed' : 'successful'}`}>{category.active === false ? 'Disabled' : 'Active'}</span></td>
                <td>{category.workers_count ?? 0}</td>
                <td>
                  <div className="action-buttons">
                    <button className="table-button" type="button" onClick={() => openEditor(category)}>Edit</button>
                    <button className="table-button" type="button" onClick={() => toggleActive(category)} disabled={busyId === category.id}>{busyId === category.id ? 'Working…' : category.active === false ? 'Enable' : 'Disable'}</button>
                    <button className="table-button danger" type="button" onClick={() => setConfirmDeleteId(category.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            )) : <tr><td colSpan="5" className="empty-table-state">No categories match the current search.</td></tr>}
          </tbody>
        </table>
      </div>

      {editorOpen && (
        <div className="modal-backdrop" onClick={closeEditor}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="section-head">
              <div>
                <p className="eyebrow">Category editor</p>
                <h2>{selectedCategory ? 'Edit category' : 'Add category'}</h2>
              </div>
              <button className="table-button" type="button" onClick={closeEditor}>Close</button>
            </div>
            <form className="customer-form" onSubmit={saveCategory}>
              <label>
                <span>Name</span>
                <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </label>
              <label>
                <span>Base price</span>
                <input required type="number" min="99" value={form.base_price} onChange={(event) => setForm({ ...form, base_price: event.target.value })} />
              </label>
              <label>
                <span>Description</span>
                <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              </label>
              <label className="toggle-row">
                <span>Visible to customers</span>
                <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
              </label>
              <div className="action-buttons justify-end">
                <button className="btn-ghost" type="button" onClick={closeEditor}>Cancel</button>
                <button className="btn-primary" type="submit">Save changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="modal-backdrop" onClick={() => setConfirmDeleteId(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="section-head">
              <div>
                <p className="eyebrow">Delete category</p>
                <h2>Confirm removal</h2>
              </div>
            </div>
            <p className="text-slate-400">This will remove the category from the admin catalog. Continue?</p>
            <div className="action-buttons justify-end">
              <button className="btn-ghost" type="button" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button className="btn-primary danger" type="button" onClick={() => deleteCategory(categories.find((category) => category.id === confirmDeleteId))}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function PaymentsManagementPage({ payments, show, onRefresh }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [busyId, setBusyId] = useState(null);

  const filteredPayments = useMemo(() => {
    const term = search.toLowerCase();
    return payments.filter((payment) => {
      const matchesStatus = statusFilter === 'all' || payment.payment_status === statusFilter;
      const matchesSearch = !term || [payment.transaction_id, payment.invoice_number, payment.customer?.full_name, payment.worker?.full_name, payment.booking?.category?.name, payment.payment_method].some((value) => String(value || '').toLowerCase().includes(term));
      return matchesStatus && matchesSearch;
    });
  }, [payments, search, statusFilter]);

  const updateStatus = async (payment, payment_status) => {
    try {
      setBusyId(payment.id);
      await api.patch(`/admin/payments/${payment.id}`, { payment_status });
      show('Payment status updated.', 'success');
      onRefresh();
    } catch (error) {
      show(apiMessage(error), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const downloadInvoice = async (payment) => {
    try {
      const { data } = await api.get(`/payments/${payment.id}/invoice`, { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${payment.invoice_number || payment.transaction_id || payment.id}.html`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      show(apiMessage(error), 'error');
    }
  };

  return (
    <section className="glass-card admin-panel p-5" id="admin-payments">
      <div className="section-head">
        <div>
          <p className="eyebrow">Billing operations</p>
          <h2>Payments</h2>
        </div>
        <button className="btn-ghost" type="button" onClick={onRefresh}>Refresh</button>
      </div>

      <div className="customer-management-toolbar glass-card p-4">
        <div className="search-group">
          <div className="search-input">
            <Search size={16} />
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search payments" />
          </div>
        </div>
        <label className="filter-field">
          <span>Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="successful">Successful</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </label>
      </div>

      <div className="table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Transaction</th>
              <th>Customer</th>
              <th>Worker</th>
              <th>Booking</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length ? filteredPayments.map((payment) => (
              <tr key={payment.id}>
                <td><strong className="text-white">{payment.transaction_id || payment.invoice_number}</strong><small>{payment.invoice_number}</small></td>
                <td>{payment.customer?.full_name || '—'}</td>
                <td>{payment.worker?.full_name || '—'}</td>
                <td>{payment.booking?.category?.name || '—'}<small>#{payment.booking?.id || '—'}</small></td>
                <td>{currency.format(payment.amount)}</td>
                <td className="capitalize">{payment.payment_method || '—'}</td>
                <td>{payment.created_at ? new Date(payment.created_at).toLocaleDateString() : '—'}</td>
                <td><span className={`status-pill ${payment.payment_status === 'successful' ? 'successful' : payment.payment_status === 'pending' ? 'pending' : 'failed'}`}>{payment.payment_status}</span></td>
                <td>
                  <div className="action-buttons">
                    <select className="status-select" value={payment.payment_status} onChange={(event) => updateStatus(payment, event.target.value)} disabled={busyId === payment.id}>
                      <option value="successful">Successful</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                    <button className="table-button" type="button" onClick={() => downloadInvoice(payment)}><Download size={15} /> Invoice</button>
                  </div>
                </td>
              </tr>
            )) : <tr><td colSpan="9" className="empty-table-state">No payments match the current filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ReviewsManagementPage({ reviews, show, onRefresh }) {
  const [search, setSearch] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const filteredReviews = useMemo(() => {
    const term = search.toLowerCase();
    return reviews.filter((review) => {
      if (!term) return true;
      return [review.customer?.full_name, review.worker?.full_name, review.comment, review.rating].some((value) => String(value || '').toLowerCase().includes(term));
    });
  }, [reviews, search]);

  const deleteReview = async (review) => {
    try {
      setBusyId(review.id);
      await api.delete(`/admin/reviews/${review.id}`);
      show('Review deleted.', 'success');
      setConfirmDeleteId(null);
      onRefresh();
    } catch (error) {
      show(apiMessage(error), 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="glass-card admin-panel p-5" id="admin-reviews">
      <div className="section-head">
        <div>
          <p className="eyebrow">Customer feedback</p>
          <h2>Reviews</h2>
        </div>
        <button className="btn-ghost" type="button" onClick={onRefresh}>Refresh</button>
      </div>

      <div className="customer-management-toolbar glass-card p-4">
        <div className="search-group">
          <div className="search-input">
            <Search size={16} />
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reviews" />
          </div>
        </div>
      </div>

      <div className="table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Worker</th>
              <th>Rating</th>
              <th>Comment</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReviews.length ? filteredReviews.map((review) => (
              <tr key={review.id}>
                <td>{review.customer?.full_name || '—'}</td>
                <td>{review.worker?.full_name || '—'}</td>
                <td>{review.rating}/5</td>
                <td><span className="review-preview">{review.comment || '—'}</span></td>
                <td>{review.created_at ? new Date(review.created_at).toLocaleDateString() : '—'}</td>
                <td>
                  <div className="action-buttons">
                    <button className="table-button" type="button" onClick={() => setSelectedReview(review)}>View</button>
                    <button className="table-button danger" type="button" onClick={() => setConfirmDeleteId(review.id)} disabled={busyId === review.id}>Delete</button>
                  </div>
                </td>
              </tr>
            )) : <tr><td colSpan="6" className="empty-table-state">No reviews match the current search.</td></tr>}
          </tbody>
        </table>
      </div>

      {selectedReview && (
        <div className="modal-backdrop" onClick={() => setSelectedReview(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="section-head">
              <div>
                <p className="eyebrow">Review details</p>
                <h2>Full review</h2>
              </div>
              <button className="table-button" type="button" onClick={() => setSelectedReview(null)}>Close</button>
            </div>
            <div className="review-detail-grid">
              <p><strong>Customer:</strong> {selectedReview.customer?.full_name || '—'}</p>
              <p><strong>Worker:</strong> {selectedReview.worker?.full_name || '—'}</p>
              <p><strong>Rating:</strong> {selectedReview.rating}/5</p>
              <p><strong>Posted:</strong> {selectedReview.created_at ? new Date(selectedReview.created_at).toLocaleString() : '—'}</p>
              <p className="review-comment">{selectedReview.comment || 'No comment provided.'}</p>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="modal-backdrop" onClick={() => setConfirmDeleteId(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="section-head">
              <div>
                <p className="eyebrow">Delete review</p>
                <h2>Confirm removal</h2>
              </div>
            </div>
            <p className="text-slate-400">This will permanently remove the selected review from the admin view. Continue?</p>
            <div className="action-buttons justify-end">
              <button className="btn-ghost" type="button" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button className="btn-primary danger" type="button" onClick={() => deleteReview(reviews.find((review) => review.id === confirmDeleteId))}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ReportsPage({ bookings, customers, workers, payments, show }) {
  const [activeReport, setActiveReport] = useState('bookings');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const reportConfig = useMemo(() => ({
    bookings: {
      title: 'Booking Report',
      description: 'Review service activity, statuses, and booking volume across a chosen period.',
      columns: ['Booking ID', 'Customer', 'Worker', 'Service', 'Date', 'Status', 'Amount'],
      keys: ['id', 'customer', 'worker', 'service', 'date', 'status', 'amount'],
      getRows: () => bookings.map((booking) => ({
        id: booking.id,
        customer: booking.customer?.full_name || '—',
        worker: booking.worker?.full_name || '—',
        service: booking.category?.name || booking.worker?.category?.name || '—',
        date: booking.booking_date || '—',
        status: booking.status || 'pending',
        amount: currency.format(booking.price || 0),
      })),
      summary: () => {
        const completed = bookings.filter((booking) => ['completed', 'reviewed'].includes(booking.status)).length;
        const pending = bookings.filter((booking) => ['pending', 'confirmed', 'accepted', 'in_progress'].includes(booking.status)).length;
        return [
          { label: 'Total bookings', value: bookings.length },
          { label: 'Completed', value: completed },
          { label: 'Upcoming', value: pending },
          { label: 'Revenue', value: currency.format(bookings.reduce((sum, booking) => sum + Number(booking.price || 0), 0)) },
        ];
      },
    },
    customers: {
      title: 'Customer Report',
      description: 'Track account growth, active users, and recent customer activity.',
      columns: ['Customer', 'Email', 'Phone', 'Joined', 'Bookings', 'Status'],
      keys: ['customer', 'email', 'phone', 'joined', 'bookings', 'status'],
      getRows: () => customers.map((customer) => ({
        id: customer.id,
        customer: customer.full_name || '—',
        email: customer.email || '—',
        phone: customer.phone || '—',
        joined: customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '—',
        bookings: customer.bookings_count || 0,
        status: customer.is_active === false ? 'Disabled' : 'Active',
      })),
      summary: () => {
        const active = customers.filter((customer) => customer.is_active !== false).length;
        return [
          { label: 'Total customers', value: customers.length },
          { label: 'Active', value: active },
          { label: 'Disabled', value: customers.length - active },
          { label: 'Total bookings', value: customers.reduce((sum, customer) => sum + Number(customer.bookings_count || 0), 0) },
        ];
      },
    },
    workers: {
      title: 'Worker Report',
      description: 'Inspect worker approvals, ratings, and service allocation.',
      columns: ['Worker', 'Email', 'Service', 'Experience', 'Rating', 'Status'],
      keys: ['worker', 'email', 'service', 'experience', 'rating', 'status'],
      getRows: () => workers.map((worker) => ({
        id: worker.id,
        worker: worker.full_name || '—',
        email: worker.email || '—',
        service: worker.category?.name || '—',
        experience: `${worker.experience || 0} yrs`,
        rating: `${Number(worker.rating || 0).toFixed(1)} ★`,
        status: worker.verified ? 'Verified' : 'Pending',
      })),
      summary: () => [
        { label: 'Total workers', value: workers.length },
        { label: 'Verified', value: workers.filter((worker) => worker.verified).length },
        { label: 'Pending', value: workers.filter((worker) => !worker.verified).length },
        { label: 'Average rating', value: `${(workers.reduce((sum, worker) => sum + Number(worker.rating || 0), 0) / Math.max(workers.length, 1)).toFixed(1)} ★` },
      ],
    },
    payments: {
      title: 'Payment Report',
      description: 'Monitor settlements, pending payments, and payment methods at a glance.',
      columns: ['Transaction', 'Customer', 'Worker', 'Amount', 'Method', 'Status', 'Date'],
      keys: ['transaction', 'customer', 'worker', 'amount', 'method', 'status', 'date'],
      getRows: () => payments.map((payment) => ({
        id: payment.id,
        transaction: payment.transaction_id || payment.invoice_number || '—',
        customer: payment.customer?.full_name || '—',
        worker: payment.worker?.full_name || '—',
        amount: currency.format(payment.amount || 0),
        method: payment.payment_method || '—',
        status: payment.payment_status || 'pending',
        date: payment.created_at ? new Date(payment.created_at).toLocaleDateString() : '—',
      })),
      summary: () => {
        const successful = payments.filter((payment) => payment.payment_status === 'successful').length;
        const pending = payments.filter((payment) => payment.payment_status === 'pending').length;
        return [
          { label: 'Total payments', value: payments.length },
          { label: 'Successful', value: successful },
          { label: 'Pending', value: pending },
          { label: 'Revenue', value: currency.format(payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)) },
        ];
      },
    },
  }), [bookings, customers, workers, payments]);

  const currentReport = reportConfig[activeReport];

  const filteredRows = useMemo(() => {
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;
    const rows = currentReport.getRows();
    return rows.filter((row) => {
      const rowDate = (() => {
        switch (activeReport) {
          case 'bookings': return row.date ? new Date(row.date) : null;
          case 'customers': return row.joined && row.joined !== '—' ? new Date(row.joined) : null;
          case 'workers': return null;
          case 'payments': return row.date && row.date !== '—' ? new Date(row.date) : null;
          default: return null;
        }
      })();

      if (!from && !to) return true;
      if (!rowDate) return true;
      if (from && rowDate < from) return false;
      if (to) {
        const endOfDay = new Date(to);
        endOfDay.setHours(23, 59, 59, 999);
        if (rowDate > endOfDay) return false;
      }
      return true;
    });
  }, [activeReport, currentReport, dateFrom, dateTo]);

  const exportCsv = () => {
    const headers = currentReport.columns;
    const rows = filteredRows.map((row) => headers.map((_, index) => `"${String(row[currentReport.keys[index]] ?? '').replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${activeReport}-report.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportPdf = () => {
    const content = `<!doctype html><html><head><meta charset="utf-8"/><title>${currentReport.title}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#0f172a}table{width:100%;border-collapse:collapse}th,td{padding:10px;border-bottom:1px solid #e2e8f0;text-align:left}th{background:#f8fafc}</style></head><body><h1>${currentReport.title}</h1><p>${currentReport.description}</p><table><thead><tr>${currentReport.columns.map((column) => `<th>${column}</th>`).join('')}</tr></thead><tbody>${filteredRows.map((row) => `<tr>${currentReport.columns.map((_, index) => `<td>${String(row[currentReport.keys[index]] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`;
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      show('Please allow popups to export PDF.', 'error');
      return;
    }
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <section className="glass-card admin-panel p-5 report-shell" id="admin-reports">
      <div className="section-head">
        <div>
          <p className="eyebrow">Reports workspace</p>
          <h2>Operational reports</h2>
        </div>
        <div className="action-buttons">
          <button className="btn-small" type="button" onClick={exportCsv}>Export CSV</button>
          <button className="btn-primary" type="button" onClick={exportPdf}>Export PDF</button>
        </div>
      </div>

      <div className="report-toolbar glass-card p-4">
        <div className="report-toolbar-grid">
          <label className="filter-field">
            <span>Report type</span>
            <select value={activeReport} onChange={(event) => setActiveReport(event.target.value)}>
              <option value="bookings">Booking Report</option>
              <option value="customers">Customer Report</option>
              <option value="workers">Worker Report</option>
              <option value="payments">Payment Report</option>
            </select>
          </label>
          <label className="filter-field">
            <span>From</span>
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </label>
          <label className="filter-field">
            <span>To</span>
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </label>
        </div>
      </div>

      <div className="report-summary-grid">
        {currentReport.summary().map((item) => (
          <div key={item.label} className="glass-card p-4 report-stat-card">
            <p className="text-sm text-slate-400">{item.label}</p>
            <strong className="mt-2 block text-xl text-white">{item.value}</strong>
          </div>
        ))}
      </div>

      <div className="report-card glass-card p-4">
        <div className="section-head">
          <div>
            <p className="eyebrow">{currentReport.title}</p>
            <h3>{currentReport.description}</h3>
          </div>
        </div>
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>{currentReport.columns.map((column) => <th key={column}>{column}</th>)}</tr>
            </thead>
            <tbody>
              {filteredRows.length ? filteredRows.map((row, index) => (
                <tr key={`${activeReport}-${index}`}>
                  {currentReport.columns.map((column, columnIndex) => <td key={`${activeReport}-${column}-${index}`}>{String(row[currentReport.keys[columnIndex]] ?? '')}</td>)}
                </tr>
              )) : <tr><td colSpan={currentReport.columns.length} className="empty-table-state">No data for the selected range.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function AnalyticsPage({ data, bookings, customers, workers, payments }) {
  const charts = data?.charts || {};
  const monthlyBookings = charts.monthlyBookings || [];
  const monthlyRevenue = charts.revenue || charts.monthlyRevenue || [];
  const workerGrowth = charts.workerGrowth || [];
  const customerGrowth = charts.customerGrowth || [];
  const mostBookedServices = charts.mostBookedServices || [];

  const summaryCards = [
    { label: 'Total bookings', value: bookings.length },
    { label: 'Revenue tracked', value: currency.format(payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)) },
    { label: 'Verified workers', value: workers.filter((worker) => worker.verified).length },
    { label: 'Customer accounts', value: customers.length },
  ];

  return (
    <section className="glass-card admin-panel p-5 report-shell" id="admin-analytics">
      <div className="section-head">
        <div>
          <p className="eyebrow">Analytics workspace</p>
          <h2>Business insights</h2>
        </div>
      </div>

      <div className="report-summary-grid">
        {summaryCards.map((item) => (
          <div key={item.label} className="glass-card p-4 report-stat-card">
            <p className="kpi-label">{item.label}</p>
            <strong className="kpi-value">{item.value}</strong>
          </div>
        ))}
      </div>

      <div className="analytics-grid">
        <div className="glass-card p-4 report-card">
          <div className="section-head"><div><p className="eyebrow">Performance</p><h3>Monthly bookings</h3></div></div>
          <div className="overview-chart-canvas">
            <Line data={{ labels: monthlyBookings.map((item) => item.label), datasets: [{ label: 'Bookings', data: monthlyBookings.map((item) => item.value), borderColor: dashboardAccentColor, backgroundColor: dashboardAccentSoft, tension: .35 }] }} options={dashboardChartOptions} />
          </div>
        </div>
        <div className="glass-card p-4 report-card">
          <div className="section-head"><div><p className="eyebrow">Revenue</p><h3>Monthly revenue</h3></div></div>
          <div className="overview-chart-canvas">
            <Line data={{ labels: monthlyRevenue.map((item) => item.label), datasets: [{ label: 'Revenue', data: monthlyRevenue.map((item) => item.value), borderColor: dashboardAccentColor, backgroundColor: dashboardAccentSoft, tension: .35 }] }} options={dashboardChartOptions} />
          </div>
        </div>
        <div className="glass-card p-4 report-card">
          <div className="section-head"><div><p className="eyebrow">Growth</p><h3>Worker growth</h3></div></div>
          <div className="overview-chart-canvas">
            <Line data={{ labels: workerGrowth.map((item) => item.label), datasets: [{ label: 'Workers', data: workerGrowth.map((item) => item.value), borderColor: dashboardAccentColor, backgroundColor: dashboardAccentSoft, tension: .35 }] }} options={dashboardChartOptions} />
          </div>
        </div>
        <div className="glass-card p-4 report-card">
          <div className="section-head"><div><p className="eyebrow">Growth</p><h3>Customer growth</h3></div></div>
          <div className="overview-chart-canvas">
            <Line data={{ labels: customerGrowth.map((item) => item.label), datasets: [{ label: 'Customers', data: customerGrowth.map((item) => item.value), borderColor: dashboardAccentColor, backgroundColor: dashboardAccentSoft, tension: .35 }] }} options={dashboardChartOptions} />
          </div>
        </div>
        <div className="glass-card p-4 report-card analytics-wide">
          <div className="section-head"><div><p className="eyebrow">Demand</p><h3>Most popular services</h3></div></div>
          <div className="overview-chart-canvas">
            <Bar data={{ labels: mostBookedServices.map((item) => item.name || item.label), datasets: [{ label: 'Requests', data: mostBookedServices.map((item) => item.value), backgroundColor: Array.from({ length: mostBookedServices.length }, () => dashboardAccentColor) }] }} options={dashboardChartOptions} />
          </div>
        </div>
      </div>
    </section>
  );
}

function NotificationsPage({ show }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [clearing, setClearing] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/notifications');
      const normalized = (data || []).map((item) => ({
        ...item,
        title: item.title || 'System update',
        message: item.message || 'You have a new update to review.',
        type: item.type || 'announcement',
      }));
      setNotifications(normalized.length ? normalized : [
        { id: 'worker-registration', title: 'New Worker Registration', message: 'A new professional application is waiting for review.', type: 'announcement', read_at: null },
        { id: 'worker-approved', title: 'Worker Approved', message: 'A verified worker is now active and ready to accept jobs.', type: 'announcement', read_at: null },
        { id: 'new-booking', title: 'New Booking', message: 'A customer just requested a new service booking.', type: 'announcement', read_at: null },
        { id: 'payment-completed', title: 'Payment Completed', message: 'A successful payment has been recorded for a completed booking.', type: 'announcement', read_at: null },
      ]);
    } catch (error) {
      show(apiMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = window.setInterval(() => {
      load();
    }, 15000);
    return () => window.clearInterval(interval);
  }, []);

  const markAsRead = async (notification) => {
    if (notification.read_at || !notification.id || typeof notification.id === 'string' && notification.id.startsWith('worker-')) return;
    setBusyId(notification.id);
    try {
      await api.patch(`/notifications/${notification.id}/read`);
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item));
      show('Notification marked as read.');
    } catch (error) {
      show(apiMessage(error), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const clearAll = async () => {
    setClearing(true);
    try {
      await api.post('/notifications/clear');
      setNotifications([]);
      show('Notifications cleared.');
    } catch (error) {
      show(apiMessage(error), 'error');
    } finally {
      setClearing(false);
    }
  };

  return (
    <section className="glass-card admin-panel p-5 report-shell">
      <div className="section-head">
        <div>
          <p className="eyebrow">Notifications workspace</p>
          <h2>Activity and updates</h2>
        </div>
        <div className="action-buttons">
          <button className="btn-small" type="button" onClick={() => load()}>Refresh</button>
          <button className="btn-primary" type="button" onClick={clearAll} disabled={clearing}>{clearing ? 'Clearing...' : 'Clear all'}</button>
        </div>
      </div>

      <div className="glass-card p-4 report-card">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <p className="eyebrow">Live feed</p>
            <h3>Recent system notifications</h3>
          </div>
          <span className="quick-chip">Polling every 15s</span>
        </div>
        {loading ? <p className="text-slate-400">Loading notifications…</p> : notifications.length ? (
          <div className="grid gap-3">
            {notifications.map((item) => (
              <div key={item.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-4">
                <div>
                  <strong className="block text-white">{item.title}</strong>
                  <p className="mt-1 text-sm text-slate-400">{item.message}</p>
                  <span className="mt-2 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">{item.type}</span>
                </div>
                <div className="flex gap-2">
                  {!item.read_at && (
                    <button className="btn-small" type="button" disabled={busyId === item.id} onClick={() => markAsRead(item)}>{busyId === item.id ? 'Working...' : 'Mark read'}</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-slate-400">No notifications at the moment.</p>}
      </div>
    </section>
  );
}

function ProfileSettings({ show, heading = 'Profile & Settings', eyebrow = 'Profile workspace', description = 'Manage your account details and preferences.' }) {
  const { user, updateProfile, changePassword, logout } = useAuth();

  const buildProfileState = (source = user) => ({
    full_name: source?.full_name || '',
    email: source?.email || '',
    phone: source?.phone || '',
    address: source?.address || '',
    booking_notifications: source?.booking_notifications ?? true,
    email_notifications: source?.email_notifications ?? true,
    theme_preference: source?.theme_preference || 'dark',
  });

  const [profile, setProfile] = useState(() => buildProfileState());
  const [profileSnapshot, setProfileSnapshot] = useState(() => buildProfileState());
  const [password, setPassword] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user?.profile_photo ? assetUrl(user.profile_photo) : '');

  useEffect(() => {
    const next = buildProfileState(user);
    setProfile(next);
    setProfileSnapshot(next);
    setPhotoPreview(user?.profile_photo ? assetUrl(user.profile_photo) : '');
  }, [user?.id, user?.full_name, user?.email, user?.phone, user?.address, user?.booking_notifications, user?.email_notifications, user?.theme_preference, user?.profile_photo]);

  const resetProfile = () => {
    const next = buildProfileState(user);
    setProfile(next);
    setProfileSnapshot(next);
    setPhotoFile(null);
    setPhotoPreview(user?.profile_photo ? assetUrl(user.profile_photo) : '');
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    if (!profile.full_name.trim()) {
      show('Please enter your full name.', 'error');
      return;
    }
    if (!profile.email.trim()) {
      show('Please enter your email address.', 'error');
      return;
    }
    setSavingProfile(true);
    try {
      const payload = photoFile ? (() => {
        const formData = new FormData();
        Object.entries(profile).forEach(([key, value]) => {
          if (value !== null && value !== undefined) formData.append(key, value);
        });
        formData.append('profile_photo', photoFile);
        return formData;
      })() : {
        ...profile,
        full_name: profile.full_name.trim(),
        email: profile.email.trim(),
        phone: profile.phone?.trim() || '',
        address: profile.address?.trim() || '',
      };

      await updateProfile(payload);
      setProfileSnapshot(profile);
      setPhotoFile(null);
      show('Account details saved successfully.');
    } catch (error) {
      show(apiMessage(error), 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    if (!password.current_password) {
      show('Please enter your current password first.', 'error');
      return;
    }
    if (!password.password || password.password.length < 8) {
      show('New password must be at least 8 characters long.', 'error');
      return;
    }
    if (password.password !== password.password_confirmation) {
      show('Passwords do not match.', 'error');
      return;
    }
    if (password.current_password === password.password) {
      show('Choose a new password different from your current one.', 'error');
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword(password);
      setPassword({ current_password: '', password: '', password_confirmation: '' });
      show('Password changed successfully.');
    } catch (error) {
      show(apiMessage(error), 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('This will permanently delete your account. Continue?')) return;
    setDeleting(true);
    try {
      await api.delete('/me');
      await logout();
      show('Account deleted.');
    } catch (error) {
      show(apiMessage(error), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handlePhotoSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const passwordStrength = password.password.length >= 8 ? 'Strong' : password.password.length >= 6 ? 'Medium' : 'Weak';

  return (
    <section className="glass-card admin-panel p-5 settings-page-shell">
      <div className="section-head">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{heading}</h2>
        </div>
        <div className="settings-badge">
          <strong>{user?.full_name || 'Member'}</strong>
          <span>{user?.email || 'member@tunatuna.test'}</span>
        </div>
      </div>

      {description && <p className="settings-page-copy">{description}</p>}

      <div className="settings-shell">
        <section className="settings-hero-card">
          <div className="mt-1 grid gap-4 md:grid-cols-2">
            <div className="settings-metric-card">
              <p className="text-sm text-slate-400">Member since</p>
              <strong className="mt-1 block text-white">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recently joined'}</strong>
            </div>
            <div className="settings-metric-card">
              <p className="text-sm text-slate-400">Total bookings</p>
              <strong className="mt-1 block text-white">{user?.bookings_count || 0}</strong>
            </div>
          </div>

          <form className="mt-6 grid gap-4" onSubmit={saveProfile}>
            <div className="settings-photo-card">
              <div className="h-20 w-20 overflow-hidden rounded-2xl border border-white/10 bg-slate-800/90">
                {photoPreview ? <img className="h-full w-full object-cover" src={photoPreview} alt="Account preview" /> : <div className="grid h-full w-full place-items-center text-2xl font-black text-white">{initials(user?.full_name || 'TT')}</div>}
              </div>
              <label className="flex flex-1 flex-col gap-2 text-sm text-slate-300">
                <span>Account photo</span>
                <input type="file" accept="image/*" onChange={handlePhotoSelect} />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-slate-300">
                <span>Full name</span>
                <input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} placeholder="Full name" />
              </label>
              <label className="grid gap-2 text-sm text-slate-300">
                <span>Email</span>
                <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} placeholder="Email" />
              </label>
              <label className="grid gap-2 text-sm text-slate-300">
                <span>Phone number</span>
                <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="Phone" />
              </label>
              <label className="grid gap-2 text-sm text-slate-300">
                <span>Address</span>
                <input value={profile.address || ''} onChange={(e) => setProfile({ ...profile, address: e.target.value })} placeholder="Address" />
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="btn-primary" type="submit" disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save account details'}</button>
              <button className="btn-ghost" type="button" onClick={resetProfile}>Cancel</button>
            </div>
          </form>
        </section>

        <div className="settings-stack">
        <section className="settings-panel">
          <div className="flex items-center gap-2"><Lock size={18} className="text-cyan-300" /><h3 className="text-lg font-black text-white">Security</h3></div>
          <form className="mt-4 grid gap-3" onSubmit={savePassword}>
            <div className="auth-password-wrap">
              <input type={showPassword ? 'text' : 'password'} placeholder="Current password" value={password.current_password} onChange={(e) => setPassword({ ...password, current_password: e.target.value })} />
              <button className="auth-icon-btn" type="button" onClick={() => setShowPassword((current) => !current)} aria-label="Toggle password visibility">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            <input type={showPassword ? 'text' : 'password'} placeholder="New password" value={password.password} onChange={(e) => setPassword({ ...password, password: e.target.value })} />
            <input type={showPassword ? 'text' : 'password'} placeholder="Confirm password" value={password.password_confirmation} onChange={(e) => setPassword({ ...password, password_confirmation: e.target.value })} />
            <div className="settings-option-row text-sm text-slate-300">
              Password strength: <strong className={passwordStrength === 'Strong' ? 'text-emerald-300' : passwordStrength === 'Medium' ? 'text-amber-300' : 'text-rose-300'}>{passwordStrength}</strong>
            </div>
            <button className="btn-primary" type="submit" disabled={savingPassword}>{savingPassword ? 'Updating...' : 'Change password'}</button>
          </form>
        </section>

        <section className="settings-panel">
          <div className="flex items-center gap-2"><Bell size={18} className="text-cyan-300" /><h3 className="text-lg font-black text-white">Preferences</h3></div>
          <div className="mt-4 grid gap-3">
            <label className="settings-option-row text-sm text-slate-300">
              <span>Booking notifications</span>
              <input type="checkbox" checked={profile.booking_notifications} onChange={(e) => setProfile({ ...profile, booking_notifications: e.target.checked })} />
            </label>
            <label className="settings-option-row text-sm text-slate-300">
              <span>Email notifications</span>
              <input type="checkbox" checked={profile.email_notifications} onChange={(e) => setProfile({ ...profile, email_notifications: e.target.checked })} />
            </label>
            <label className="settings-option-row text-sm text-slate-300">
              <span>Theme</span>
              <select value={profile.theme_preference} onChange={(e) => setProfile({ ...profile, theme_preference: e.target.value })}>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </label>
            <button className="btn-primary" type="button" onClick={saveProfile} disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save preferences'}</button>
          </div>
        </section>

        <section className="settings-panel">
          <div className="flex items-center gap-2"><UserRound size={18} className="text-cyan-300" /><h3 className="text-lg font-black text-white">Account</h3></div>
          <div className="mt-4 grid gap-3">
            <button className="btn-ghost" type="button" onClick={() => logout()}><LogOut size={16} /> Logout</button>
            <button className="btn-ghost danger" type="button" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete account'}</button>
          </div>
        </section>
        </div>
      </div>
    </section>
  );
}

function AuthIllustration({ accent = 'customer' }) {
  const color = accent === 'worker' ? '#38bdf8' : '#7c3aed';
  return (
    <svg viewBox="0 0 640 640" className="auth-illustration" role="img" aria-label="Premium home service illustration">
      <rect x="70" y="70" width="500" height="500" rx="38" fill="url(#bg)" />
      <circle cx="180" cy="180" r="78" fill="rgba(255,255,255,0.24)" />
      <circle cx="470" cy="188" r="52" fill="rgba(56,189,248,0.22)" />
      <rect x="122" y="290" width="182" height="160" rx="22" fill="rgba(255,255,255,0.78)" />
      <rect x="324" y="250" width="192" height="200" rx="24" fill="rgba(15,23,42,0.16)" />
      <rect x="146" y="314" width="134" height="104" rx="16" fill={color} opacity="0.9" />
      <rect x="350" y="274" width="140" height="92" rx="18" fill="rgba(255,255,255,0.88)" />
      <rect x="352" y="386" width="136" height="46" rx="16" fill="rgba(255,255,255,0.76)" />
      <rect x="198" y="188" width="92" height="72" rx="18" fill="rgba(15,23,42,0.86)" />
      <rect x="418" y="180" width="96" height="40" rx="12" fill="rgba(15,23,42,0.75)" />
      <path d="M218 188c0-38 30-68 68-68s68 30 68 68" stroke="#fff" strokeWidth="14" fill="none" strokeLinecap="round" />
      <circle cx="286" cy="182" r="18" fill="#fff" />
      <path d="M208 404c22-46 62-72 110-72s88 26 110 72" fill="none" stroke="#fff" strokeWidth="12" strokeLinecap="round" />
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function AuthPage({ mode, show }) {
  const { login, register, forgotPassword, user } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState(mode === 'admin' ? 'admin' : 'customer');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', password_confirmation: '', username: '', address: '', service_category_id: '', experience: 2, bio: '', skills: '', price: 699 });
  const [categories, setCategories] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/categories').then(({ data }) => {
      setCategories(data);
      if (data[0]) setForm((old) => ({ ...old, service_category_id: data[0].id }));
    }).catch(() => undefined);
  }, []);

  if (user) return <Navigate to="/dashboard" replace />;

  const validate = () => {
    if (mode === 'forgot') {
      if (!form.email) {
        show('Please enter your email address.', 'error');
        return false;
      }
      return true;
    }

    if (mode === 'register-customer') {
      if (!form.full_name || !form.email || !form.phone || !form.password || !form.password_confirmation) {
        show('Please fill in all customer registration fields.', 'error');
        return false;
      }
      if (form.password.length < 8) {
        show('Password must be at least 8 characters long.', 'error');
        return false;
      }
      if (form.password !== form.password_confirmation) {
        show('Passwords do not match.', 'error');
        return false;
      }
      return true;
    }

    if (mode === 'register-worker') {
      if (!form.full_name || !form.email || !form.phone || !form.service_category_id || !form.experience || !form.bio || !form.password || !form.password_confirmation) {
        show('Please fill in all worker registration fields.', 'error');
        return false;
      }
      if (form.password.length < 8) {
        show('Password must be at least 8 characters long.', 'error');
        return false;
      }
      if (form.password !== form.password_confirmation) {
        show('Passwords do not match.', 'error');
        return false;
      }
      return true;
    }

    if (!form.password || (role === 'admin' ? !form.username : !form.email)) {
      show('Please enter your credentials.', 'error');
      return false;
    }

    return true;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      if (mode === 'forgot') {
        const { message } = await forgotPassword(form.email);
        show(message);
      } else if (mode === 'register-customer') {
        const { message } = await register('customer', {
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          password_confirmation: form.password_confirmation,
        });
        show(message || 'Account created successfully. Please log in to continue.');
        navigate('/login');
      } else if (mode === 'register-worker') {
        const { message } = await register('worker', {
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          service_category_id: form.service_category_id,
          experience: form.experience,
          skills: form.skills || form.bio,
          password: form.password,
          password_confirmation: form.password_confirmation,
          address: form.address || 'Pending address',
        });
        show(message || 'Your application has been submitted successfully. Please wait for Admin approval before logging in.');
        navigate('/login');
      } else {
        const payload = role === 'admin' ? { role, username: form.username, password: form.password } : { role, email: form.email, password: form.password };
        await login(payload);
        navigate('/dashboard');
      }
    } catch (error) {
      show(apiMessage(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  const commonFields = (
    <>
      {mode === 'login' && (
        <div className="auth-role-switch">
          {['customer', 'worker', 'admin'].map((item) => (
            <button type="button" className={`auth-role-pill ${role === item ? 'active' : ''}`} key={item} onClick={() => setRole(item)}>{item}</button>
          ))}
        </div>
      )}
      <div className="auth-field-stack">
        {mode === 'register-customer' && (
          <>
            <input required placeholder="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <input required type="email" placeholder="Email Address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input required placeholder="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </>
        )}
        {mode === 'register-worker' && (
          <>
            <input required placeholder="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <input required type="email" placeholder="Email Address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input required placeholder="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <select value={form.service_category_id} onChange={(e) => setForm({ ...form, service_category_id: e.target.value })}>
              <option value="">Select a service category</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <input required type="number" min="1" max="40" placeholder="Work Experience (years)" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
            <textarea required placeholder="Tell us about yourself" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            <input placeholder="Special skills" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
            <input placeholder="Service address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </>
        )}
        {mode === 'login' && (
          <>
            {role === 'admin' ? (
              <input required placeholder="Admin Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            ) : (
              <input required type="email" placeholder="Email Address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            )}
          </>
        )}
        {mode !== 'register-customer' && mode !== 'register-worker' && mode !== 'forgot' && (
          <div className="auth-password-wrap">
            <input required minLength="8" type={showPassword ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <button className="auth-icon-btn" type="button" onClick={() => setShowPassword((current) => !current)} aria-label="Toggle password visibility">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        )}
        {(mode === 'register-customer' || mode === 'register-worker') && (
          <>
            <div className="auth-password-wrap">
              <input required minLength="8" type={showPassword ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <button className="auth-icon-btn" type="button" onClick={() => setShowPassword((current) => !current)} aria-label="Toggle password visibility">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <input required minLength="8" type={showPassword ? 'text' : 'password'} placeholder="Confirm Password" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} />
          </>
        )}
        {mode === 'forgot' && <input required type="email" placeholder="Email Address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />}
      </div>
    </>
  );

  if (mode === 'register') {
    return (
      <section className="auth-shell">
        <div className="auth-hero-card glass-card">
          <div className="auth-hero-copy">
            <p className="eyebrow">Premium access</p>
            <h1>Create your WorkLink account</h1>
            <p>Choose the experience that fits you best and get matched with trusted professionals in minutes.</p>
            <div className="auth-pill-row">
              <span className="auth-pill"><ShieldCheck size={16} /> Verified professionals</span>
              <span className="auth-pill"><CheckCircle2 size={16} /> Secure onboarding</span>
            </div>
          </div>
          <AuthIllustration accent="customer" />
        </div>
        <div className="auth-choice-grid">
          <Link className="auth-choice-card glass-card" to="/register/customer">
            <div className="auth-choice-icon"><UserRound size={24} /></div>
            <h2>Register as Customer</h2>
            <p>Book trusted home services, manage appointments, and pay securely.</p>
            <span className="auth-choice-link">Create customer account <ArrowRight size={17} /></span>
          </Link>
          <Link className="auth-choice-card glass-card" to="/register/worker">
            <div className="auth-choice-icon"><BriefcaseBusiness size={24} /></div>
            <h2>Register as Worker</h2>
            <p>Showcase your services, receive bookings, and grow your professional network.</p>
            <span className="auth-choice-link">Start worker application <ArrowRight size={17} /></span>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-shell auth-shell-split">
      <aside className="auth-side-panel glass-card">
        <div className="auth-brand">
          <div className="auth-brand-mark">TT</div>
          <div>
            <strong>WorkLink</strong>
            <p>Trusted home services</p>
          </div>
        </div>
        <div className="auth-side-copy">
          <p className="eyebrow">{mode === 'forgot' ? 'Recover access' : mode === 'register-customer' ? 'Customer Registration' : mode === 'register-worker' ? 'Worker Registration' : 'Welcome back'}</p>
          <h1>{mode === 'forgot' ? 'Reset your password' : mode === 'register-customer' ? 'Create your customer account' : mode === 'register-worker' ? 'Apply as a worker' : 'Connect with trusted professionals'}</h1>
          <p>{mode === 'forgot' ? 'We will send you recovery steps for your WorkLink account.' : mode === 'register-worker' ? 'Your application is reviewed by our admin team before you can start receiving bookings.' : 'From urgent repairs to routine maintenance, find the right specialist for every need.'}</p>
          <div className="auth-feature-list">
            <span><ShieldCheck size={16} /> Verified professionals</span>
            <span><Sparkles size={16} /> Premium booking experience</span>
            <span><CheckCircle2 size={16} /> Safe and secure platform</span>
          </div>
        </div>
        <AuthIllustration accent={mode === 'register-worker' ? 'worker' : 'customer'} />
      </aside>
      <div className="auth-form-panel glass-card">
        <div className="auth-form-head">
          <p className="eyebrow">{mode === 'forgot' ? 'Recover Access' : mode === 'register-customer' ? 'Customer Registration' : mode === 'register-worker' ? 'Worker Registration' : 'Secure Login'}</p>
          <h2>{mode === 'forgot' ? 'Forgot your password?' : mode === 'register-customer' ? 'Customer Registration' : mode === 'register-worker' ? 'Worker Registration' : 'Welcome back'}</h2>
        </div>
        <form className="auth-form" onSubmit={submit}>
          {commonFields}
          <div className="auth-inline-row">
            {mode === 'login' && (
              <label className="auth-check-row">
                <input type="checkbox" defaultChecked />
                <span>Remember me</span>
              </label>
            )}
            {mode === 'login' ? <Link className="auth-link" to="/forgot">Forgot password?</Link> : <Link className="auth-link" to="/login">Already have an account?</Link>}
          </div>
          {(mode === 'register-customer' || mode === 'register-worker') && (
            <Link className="btn-ghost auth-submit" to="/register">Back</Link>
          )}
          <button className="btn-primary auth-submit" type="submit" disabled={busy}>
            {busy ? <><LoaderCircle className="animate-spin" size={18} /> Please wait...</> : mode === 'forgot' ? 'Send reset request' : mode === 'register-customer' ? 'Create customer account' : mode === 'register-worker' ? 'Submit application' : 'Sign in'}
          </button>
          {mode === 'login' && (
            <Link className="btn-ghost auth-submit" to="/register">Create new account</Link>
          )}
          <div className="auth-footnote">
            {mode === 'login' ? 'Demo admin: admin / admin123' : mode === 'register-worker' ? 'Your worker account will stay pending until an admin approves it.' : 'Your details are protected with industry-standard security.'}
          </div>
        </form>
      </div>
    </section>
  );
}

function MapPage({ show }) {
  const mapRef = useRef(null);
  const nodeRef = useRef(null);
  const [workers, setWorkers] = useState([]);
  useEffect(() => { api.get('/workers').then(({ data }) => setWorkers(data.data || data)).catch((e) => show(apiMessage(e), 'error')); }, []);
  useEffect(() => {
    if (!nodeRef.current || mapRef.current) return;
    const map = L.map(nodeRef.current).setView([28.6139, 77.2090], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
    L.marker([28.6139, 77.2090]).addTo(map).bindPopup('Customer Location');
    mapRef.current = map;
  }, []);
  useEffect(() => {
    if (!mapRef.current) return;
    workers.forEach((worker) => {
      if (worker.latitude && worker.longitude) L.circleMarker([worker.latitude, worker.longitude], { radius: 8, color: '#38bdf8', fillColor: '#2563eb', fillOpacity: .8 }).addTo(mapRef.current).bindPopup(`${worker.full_name} - ${worker.category?.name}`);
    });
  }, [workers]);
  return (
    <section className="page-section">
      <div className="section-head"><div><p className="eyebrow">Interactive Map</p><h1 className="text-4xl font-black text-white">Nearby workers around you</h1></div></div>
      <div className="glass-card overflow-hidden p-3"><div ref={nodeRef} className="h-[620px] rounded-xl" /></div>
    </section>
  );
}

function SettingsPage({ show }) {
  return <section className="page-section"><ProfileSettings show={show} /></section>;
}

function HelpPage() {
  return (
    <section className="page-section grid gap-5 lg:grid-cols-2">
      <SectionBlock title="About Us" copy="TunaTuna is an original academic project for connecting local skilled workers and customers through secure booking workflows." />
      <SectionBlock title="Mission" copy="Make local service hiring transparent, fast, and dependable for households and independent workers." />
      <SectionBlock title="Vision" copy="A trusted digital work network where skilled professionals can grow and customers can book with confidence." />
      <SectionBlock title="FAQ" copy="Customers book workers from the marketplace. Workers manage incoming jobs from their dashboard. Admin verifies workers, categories, bookings, and analytics." />
      <ContactPanel />
      <SectionBlock title="Help & Support" copy="For local demo support, use the contact details or sign in with the seeded demo accounts to test each role." />
    </section>
  );
}

function SectionBlock({ title, copy }) {
  return <article className="glass-card p-6"><h2 className="text-2xl font-black text-white">{title}</h2><p className="mt-3 text-slate-300">{copy}</p></article>;
}

function Loader() {
  return <div className="grid min-h-[50vh] place-items-center text-slate-300">Loading TunaTuna...</div>;
}

export default function App() {
  const { toast, show } = useToast();
  const { user } = useAuth();
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = window.localStorage.getItem('worklink-theme');
    return stored === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    if (user?.theme_preference && ['dark', 'light'].includes(user.theme_preference)) {
      setTheme(user.theme_preference);
    }
  }, [user?.theme_preference]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.toggle('theme-light', theme === 'light');
    window.localStorage.setItem('worklink-theme', theme);
  }, [theme]);

  return (
    <>
      <Shell toast={toast} theme={theme} toggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))} />
      <ScrollToHash />
      <Routes>
        <Route path="/" element={<Landing show={show} />} />
        <Route path="/marketplace" element={<Marketplace show={show} />} />
        <Route path="/worker/:id" element={<WorkerDetailPage show={show} />} />
        <Route path="/map" element={<MapPage show={show} />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/login" element={<AuthPage mode="login" show={show} />} />
        <Route path="/register" element={<AuthPage mode="register" show={show} />} />
        <Route path="/register/customer" element={<AuthPage mode="register-customer" show={show} />} />
        <Route path="/register/worker" element={<AuthPage mode="register-worker" show={show} />} />
        <Route path="/forgot" element={<AuthPage mode="forgot" show={show} />} />
        <Route path="/dashboard/*" element={<Protected roles={['admin', 'customer', 'worker']}><Dashboard show={show} theme={theme} toggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))} /></Protected>} />
        <Route path="/settings" element={<Protected roles={['customer', 'worker']}><SettingsPage show={show} /></Protected>} />
      </Routes>
    </>
  );
}
