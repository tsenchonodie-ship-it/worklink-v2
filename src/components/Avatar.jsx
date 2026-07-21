import { assetUrl } from '../api/client';

export function Avatar({ worker, size = 'h-14 w-14' }) {
  if (worker?.profile_photo) {
    return (
      <img
        className={`${size} rounded-xl object-cover`}
        src={assetUrl(worker.profile_photo)}
        alt={worker.full_name}
      />
    );
  }
  const initials = worker?.full_name
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'TT';
  return (
    <div
      className={`${size} grid place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 font-black text-white`}
    >
      {initials}
    </div>
  );
}
