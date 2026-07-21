import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BriefcaseBusiness, ChevronRight, Clock, Star, WalletCards } from 'lucide-react';
import { Avatar } from './Avatar';
import { currency } from '../utils/constants';

export function WorkerCard({ worker, onHire, compact = false }) {
  const [showHire, setShowHire] = useState(false);

  if (compact) {
    return (
      <Link
        to={`/worker/${worker.id}`}
        className="glass-card flex items-center gap-4 p-4 transition hover:-translate-y-1 hover:border-blue-400/50"
      >
        <Avatar worker={worker} size="h-12 w-12" />
        <div className="flex-1 min-w-0">
          <h4 className="truncate font-bold text-white">{worker.full_name}</h4>
          <p className="text-sm text-blue-200">{worker.category?.name}</p>
        </div>
        <div className="text-right text-sm font-semibold text-cyan-300">
          ₹{worker.price || 0}
        </div>
      </Link>
    );
  }

  return (
    <article className="glass-card flex flex-col p-5 transition hover:-translate-y-1 hover:border-blue-400/50">
      <div className="flex items-start gap-4">
        <Avatar worker={worker} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              to={`/worker/${worker.id}`}
              className="truncate text-lg font-bold text-white hover:text-blue-300 transition"
            >
              {worker.full_name}
            </Link>
            {worker.verified && (
              <span className="px-2 py-1 rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-300">
                Verified
              </span>
            )}
          </div>
          <p className="text-sm text-blue-200">{worker.category?.name}</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <span className="metric">
          <Star size={15} /> {Number(worker.rating || 0).toFixed(1)}
        </span>
        <span className="metric">
          <BriefcaseBusiness size={15} /> {worker.experience} yrs
        </span>
        <span className="metric">
          <WalletCards size={15} /> {currency.format(worker.price || 0)}
        </span>
        <span className="metric">
          <Clock size={15} /> {worker.availability || 'Flexible'}
        </span>
      </div>
      <p className="mt-4 line-clamp-2 text-sm text-slate-400">{(worker.skills || []).join(', ')}</p>
      <button
        className="btn-primary mt-5 w-full"
        onClick={() => setShowHire(true)}
      >
        Hire Now <ChevronRight size={17} />
      </button>

      {showHire && onHire && (
        <div className="absolute inset-0 z-50 bg-black/50 p-4 rounded-xl flex items-center justify-center">
          <div className="bg-slate-900 rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-white mb-4">Hire {worker.full_name}?</h3>
            <p className="text-slate-300 mb-6">
              Are you ready to book this worker? You'll be able to select date, time, and details on the next step.
            </p>
            <div className="flex gap-3">
              <button
                className="btn-ghost flex-1"
                onClick={() => setShowHire(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary flex-1"
                onClick={() => {
                  onHire(worker);
                  setShowHire(false);
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
