import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, MoonStar, SunMedium, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Shell({ toast, theme, toggleTheme }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const links = [
    ['Home', { pathname: '/', hash: '' }],
    ['Services', { pathname: '/', hash: '#services' }],
    ['How It Works', { pathname: '/', hash: '#how-it-works' }],
    ['About Us', { pathname: '/', hash: '#about' }],
    ['Contact', { pathname: '/', hash: '#contact' }],
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-20 w-[min(1200px,calc(100%-32px))] items-center justify-between gap-4">
          <Link to="/" className="flex items-center font-black tracking-tight">
            <span className="text-lg">TunaTuna</span>
          </Link>
          <div className="hidden items-center gap-6 text-sm font-semibold text-slate-300 md:flex">
            {links.map(([label, target]) => (
              <Link key={label} className="hover:text-white transition-colors" to={target}>
                {label}
              </Link>
            ))}
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <button className="icon-btn" onClick={toggleTheme} title="Toggle theme" type="button">
              {theme === 'dark' ? <SunMedium size={18} /> : <MoonStar size={18} />}
            </button>
            {user ? (
              <>
                <Link className="btn-primary" to="/dashboard">
                  <LayoutDashboard size={17} /> Dashboard
                </Link>
                <button className="icon-btn" onClick={logout} title="Logout" type="button">
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <>
                <Link className="btn-ghost" to="/login">
                  Login
                </Link>
                <Link className="btn-primary" to="/register">
                  Register
                </Link>
              </>
            )}
          </div>
          <button className="icon-btn md:hidden" onClick={() => setOpen(true)}>
            <Menu />
          </button>
        </nav>
        {open && (
          <div className="fixed inset-0 z-50 bg-slate-950/95 p-5 md:hidden">
            <div className="mb-8 flex items-center justify-between">
              <strong>TunaTuna</strong>
              <button className="icon-btn" onClick={() => setOpen(false)}>
                <X />
              </button>
            </div>
            <div className="grid gap-3">
              <button className="mobile-link" type="button" onClick={() => { toggleTheme(); setOpen(false); }}>
                {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              </button>
              {links.map(([label, target]) => (
                <Link
                  key={label}
                  className="mobile-link"
                  onClick={() => setOpen(false)}
                  to={target}
                >
                  {label}
                </Link>
              ))}
              {user ? (
                <Link className="mobile-link" to="/dashboard">
                  Dashboard
                </Link>
              ) : (
                <Link className="mobile-link" to="/login">
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </>
  );
}
