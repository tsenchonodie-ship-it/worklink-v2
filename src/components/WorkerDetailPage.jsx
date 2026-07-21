import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, MessageSquare, Phone, Shield, Star, Users } from 'lucide-react';
import { api, apiMessage } from '../api/client';
import { Avatar } from './Avatar';
import { currency } from '../utils/constants';
import { useAuth } from '../context/AuthContext';

export function WorkerDetailPage({ show }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingStep, setBookingStep] = useState(0);
  const [booking, setBooking] = useState({
    booking_date: '',
    booking_time: '09:00',
    address: '',
    notes: '',
  });

  useEffect(() => {
    api
      .get(`/workers/${id}`)
      .then(({ data }) => {
        setWorker(data);
        setLoading(false);
      })
      .catch((err) => {
        show(apiMessage(err), 'error');
        setLoading(false);
        setTimeout(() => navigate('/marketplace'), 2000);
      });
  }, [id]);

  const handleBookingChange = (field, value) => {
    setBooking((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitBooking = () => {
    if (!user) {
      show('Please login to book', 'error');
      navigate('/login');
      return;
    }

    if (!booking.booking_date || !booking.address) {
      show('Please fill in all required fields', 'error');
      return;
    }

    // Proceed to payment
    setBookingStep(2);
  };

  if (loading) {
    return (
      <section className="page-section">
        <div className="grid min-h-[60vh] place-items-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-slate-300">Loading worker profile...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!worker) {
    return (
      <section className="page-section">
        <div className="text-center">
          <p className="text-slate-300">Worker not found</p>
        </div>
      </section>
    );
  }

  const reviews = worker.bookings?.filter((b) => b.review)?.map((b) => b.review) || [];
  const completedJobs = worker.bookings?.filter((b) => ['completed', 'reviewed'].includes(b.status))?.length || 0;

  return (
    <div className="page-section">
      <button onClick={() => navigate(-1)} className="btn-ghost mb-6">
        <ArrowLeft size={17} /> Back
      </button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Profile Card */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6 sticky top-24">
            <div className="mb-6 flex flex-col items-center">
              <Avatar worker={worker} size="h-24 w-24" />
              <h1 className="mt-4 text-2xl font-black text-white text-center">{worker.full_name}</h1>
              <p className="mt-2 text-center text-blue-300 font-semibold">{worker.category?.name}</p>
              {worker.verified && (
                <div className="mt-3 flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15">
                  <Shield size={16} className="text-emerald-300" />
                  <span className="text-xs font-bold text-emerald-300">Verified Professional</span>
                </div>
              )}
            </div>

            {/* Key Stats */}
            <div className="space-y-3 border-t border-white/10 pt-6">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Rating</span>
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-yellow-400" fill="currentColor" />
                  <strong className="text-white">{Number(worker.rating || 0).toFixed(1)}</strong>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Experience</span>
                <strong className="text-white">{worker.experience} years</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Hourly Rate</span>
                <strong className="text-cyan-300">{currency.format(worker.price || 0)}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Jobs Completed</span>
                <strong className="text-emerald-300">{completedJobs}</strong>
              </div>
            </div>

            {/* Contact & Booking Buttons */}
            <div className="mt-6 space-y-3 border-t border-white/10 pt-6">
              <button className="btn-secondary w-full">
                <MessageSquare size={17} /> Send Message
              </button>
              <button className="btn-primary w-full" onClick={() => setBookingStep(1)}>
                <Calendar size={17} /> Book Now
              </button>
            </div>
          </div>
        </div>

        {/* Right: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-white mb-4">About</h2>
            <p className="text-slate-300 leading-relaxed">
              {worker.address || 'Professional service provider'}
            </p>
          </div>

          {/* Skills */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-white mb-4">Skills & Specialization</h2>
            <div className="flex flex-wrap gap-2">
              {(worker.skills || []).map((skill) => (
                <span key={skill} className="px-3 py-1 rounded-full bg-blue-500/15 text-sm font-semibold text-blue-300">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Clock size={18} /> Availability
            </h2>
            <p className="text-slate-300">{worker.availability || 'Available for bookings'}</p>
          </div>

          {/* Reviews */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Users size={18} /> Customer Reviews ({reviews.length})
            </h2>
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="border-l-2 border-blue-500/30 pl-4 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <strong className="text-white">{review.customer?.full_name || 'Anonymous'}</strong>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < review.rating ? 'text-yellow-400 fill-current' : 'text-slate-600'}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-slate-400">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400">No reviews yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingStep > 0 && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {bookingStep === 1 ? (
              <>
                <h2 className="text-xl font-bold text-white mb-4">Book {worker.full_name}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Date *</label>
                    <input
                      type="date"
                      required
                      value={booking.booking_date}
                      onChange={(e) => handleBookingChange('booking_date', e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/[.04] px-4 py-2 text-white placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Time</label>
                    <input
                      type="time"
                      value={booking.booking_time}
                      onChange={(e) => handleBookingChange('booking_time', e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/[.04] px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Address *</label>
                    <textarea
                      required
                      placeholder="Where should the worker come?"
                      value={booking.address}
                      onChange={(e) => handleBookingChange('address', e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/[.04] px-4 py-2 text-white placeholder-slate-500"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Additional Notes</label>
                    <textarea
                      placeholder="Any special requests?"
                      value={booking.notes}
                      onChange={(e) => handleBookingChange('notes', e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/[.04] px-4 py-2 text-white placeholder-slate-500"
                      rows="3"
                    />
                  </div>

                  {/* Summary */}
                  <div className="border-t border-white/10 pt-4 mt-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-300">Base Price:</span>
                      <strong className="text-white">{currency.format(worker.price || 0)}</strong>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-white">Total:</span>
                      <span className="text-cyan-300">{currency.format(worker.price || 0)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button className="btn-ghost flex-1" onClick={() => setBookingStep(0)}>
                      Cancel
                    </button>
                    <button className="btn-primary flex-1" onClick={handleSubmitBooking}>
                      Continue to Payment
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-300 mb-4">Payment checkout coming next...</p>
                <button className="btn-ghost" onClick={() => setBookingStep(0)}>
                  Back
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
