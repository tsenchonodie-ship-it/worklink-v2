import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Lock, Check, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { CardCvcElement, CardExpiryElement, CardNumberElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const INK = '#10162A';
const INK_SOFT = '#4A5268';
const INK_FAINT = '#8892A6';
const PAPER = '#EEF1F6';
const LINE = '#D7DCE5';
const EMERALD = '#0F9D6C';
const GOLD = '#C89B3C';

const ITEMS = [
  { label: 'Nomad Pro — annual plan', amount: 240 },
  { label: 'Founding member discount', amount: -40 },
  { label: 'Tax', amount: 16 },
];
const TOTAL = ITEMS.reduce((sum, item) => sum + item.amount, 0);
const fmt = (n) => `${n < 0 ? '-' : ''}$${Math.abs(n).toFixed(2)}`;

const PROCESSING_STEPS = [
  'Verifying card details…',
  'Contacting your bank…',
  'Confirming payment…',
];

const stripeElementStyle = {
  base: {
    color: INK,
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    lineHeight: '1.5',
    '::placeholder': { color: '#B7BECC' },
  },
  invalid: {
    color: '#e11d48',
    iconColor: '#e11d48',
  },
};

function formatCardNumber(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function PaymentCheckoutContent() {
  const stripe = useStripe();
  const elements = useElements();

  const [name, setName] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [status, setStatus] = useState('idle');
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');

  const isFlipped = focusedField === 'cvc';

  useEffect(() => {
    if (status !== 'processing') return;
    setStep(0);
    const t1 = window.setTimeout(() => setStep(1), 700);
    const t2 = window.setTimeout(() => setStep(2), 1400);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [status]);

  const handlePay = useCallback(async (event) => {
    event.preventDefault();
    if (status !== 'idle' || !name || !stripe || !elements) return;

    const cardNumber = elements.getElement(CardNumberElement);
    const cardExpiry = elements.getElement(CardExpiryElement);
    const cardCvc = elements.getElement(CardCvcElement);

    if (!cardNumber || !cardExpiry || !cardCvc) {
      setStatus('error');
      setError('Stripe is not ready yet. Please refresh and try again.');
      return;
    }

    setStatus('processing');
    setError('');

    try {
      const response = await fetch('/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(TOTAL * 100), currency: 'usd' }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to create a payment intent.');
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardNumber,
          billing_details: { name },
        },
      });

      if (stripeError) {
        throw new Error(stripeError.message || 'Your card could not be authorized.');
      }

      if (paymentIntent?.status === 'succeeded') {
        setStatus('success');
        setError('');
        return;
      }

      throw new Error('Payment did not complete successfully.');
    } catch (payError) {
      setStatus('error');
      setError(payError.message || 'Something went wrong while processing your payment.');
    }
  }, [elements, name, status, stripe]);

  const reset = () => {
    setStatus('idle');
    setStep(0);
    setFocusedField(null);
    setError('');

    const cardNumber = elements?.getElement(CardNumberElement);
    const cardExpiry = elements?.getElement(CardExpiryElement);
    const cardCvc = elements?.getElement(CardCvcElement);

    cardNumber?.clear();
    cardExpiry?.clear();
    cardCvc?.clear();
  };

  return (
    <div
      style={{ background: PAPER, fontFamily: "'Inter', sans-serif" }}
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        .pco * { box-sizing: border-box; }
        .pco-input {
          width: 100%;
          background: #fff;
          border: 1.5px solid ${LINE};
          border-radius: 10px;
          padding: 12px 16px;
          color: ${INK};
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .pco-input:focus-within { border-color: ${GOLD}; box-shadow: 0 0 0 3px rgba(200,155,60,0.14); }
        .pco-input:disabled { opacity: 0.6; }
        .pco-mono { font-family: 'IBM Plex Mono', monospace; }
        .pco-pay-btn {
          width: 100%; border: none; border-radius: 12px; padding: 16px 18px;
          font-family: 'Inter', sans-serif; font-weight: 600; font-size: 14px;
          color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
          background: linear-gradient(180deg, #171F38 0%, ${INK} 100%);
          box-shadow: 0 12px 24px -10px rgba(16,22,42,0.55);
          transition: transform 0.15s ease, filter 0.15s ease;
        }
        .pco-pay-btn:hover:not(:disabled) { filter: brightness(1.12); transform: translateY(-1px); }
        .pco-pay-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .pco-reset-btn {
          border: 1.5px solid ${LINE}; background: #fff; border-radius: 10px; padding: 12px 18px;
          font-family: 'Inter', sans-serif; font-weight: 600; font-size: 14px; color: ${INK};
          cursor: pointer; transition: border-color 0.2s ease, background 0.2s ease;
        }
        .pco-reset-btn:hover { border-color: ${GOLD}; background: #FBF7EE; }
        @media (prefers-reduced-motion: reduce) {
          .pco-scan { display: none; }
        }
      `}</style>

      <div
        className="pco flex flex-col md:flex-row w-full"
        style={{
          maxWidth: 820,
          background: '#fff',
          borderRadius: 24,
          boxShadow: '0 40px 80px -30px rgba(16,22,42,0.25)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="p-7 sm:p-8 md:w-[38%]" style={{ position: 'relative' }}>
          <p className="pco-mono" style={{ fontSize: 10.5, letterSpacing: '0.14em', color: INK_FAINT, marginBottom: 4 }}>
            INVOICE #NM-0417-22
          </p>
          <p className="pco-mono" style={{ fontSize: 10.5, letterSpacing: '0.14em', color: INK_FAINT, marginBottom: 22 }}>
            JUL 22, 2026
          </p>

          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 19, color: INK, marginBottom: 3 }}>
            Nomad Pro
          </h2>
          <p style={{ fontSize: 14, color: INK_SOFT, marginBottom: 24 }}>Billed yearly · auto-renews</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ITEMS.map((item) => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: INK_SOFT }}>{item.label}</span>
                <span className="pco-mono" style={{ color: item.amount < 0 ? EMERALD : INK }}>
                  {fmt(item.amount)}
                </span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: `1.5px dashed ${LINE}`, margin: '16px 0 16px' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, color: INK }}>
              Total due
            </span>
            <span className="pco-mono" style={{ fontSize: 24, fontWeight: 600, color: INK }}>
              {fmt(TOTAL)}
            </span>
          </div>

          <div style={{ marginTop: 26, display: 'flex', alignItems: 'center', gap: 6, color: INK_FAINT }}>
            <ShieldCheck size={14} />
            <span style={{ fontSize: 11.5 }}>Encrypted &amp; PCI compliant</span>
          </div>
        </div>

        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div className="hidden md:block" style={{ width: 0, height: '100%', borderLeft: `2px dashed ${LINE}` }} />
          <div className="block md:hidden" style={{ height: 0, borderTop: `2px dashed ${LINE}` }} />
          <span className="hidden md:block" style={{ position: 'absolute', top: -14, left: -14, width: 28, height: 28, borderRadius: '50%', background: PAPER }} />
          <span className="hidden md:block" style={{ position: 'absolute', bottom: -14, left: -14, width: 28, height: 28, borderRadius: '50%', background: PAPER }} />
          <span className="block md:hidden" style={{ position: 'absolute', top: -14, left: -14, width: 28, height: 28, borderRadius: '50%', background: PAPER }} />
          <span className="block md:hidden" style={{ position: 'absolute', top: -14, right: -14, width: 28, height: 28, borderRadius: '50%', background: PAPER }} />
        </div>

        <div className="p-7 sm:p-8 md:w-[62%]" style={{ background: PAPER }}>
          <AnimatePresence mode="wait">
            {status !== 'success' ? (
              <motion.div key="pay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
                  <Lock size={12} color={INK_FAINT} />
                  <span className="pco-mono" style={{ fontSize: 10.5, letterSpacing: '0.14em', color: INK_FAINT }}>
                    SECURE CHECKOUT
                  </span>
                </div>

                <div style={{ perspective: 1200, marginBottom: 22 }}>
                  <motion.div
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    style={{ position: 'relative', width: '100%', maxWidth: 360, height: 200, transformStyle: 'preserve-3d' }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backfaceVisibility: 'hidden',
                        borderRadius: 16,
                        padding: 20,
                        background: 'linear-gradient(135deg, #1B2340 0%, #0B0F1E 100%)',
                        color: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        overflow: 'hidden',
                        boxShadow: '0 18px 34px -14px rgba(16,22,42,0.6)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ width: 34, height: 24, borderRadius: 5, background: `linear-gradient(135deg, ${GOLD}, #8f6f22)` }} />
                        <div style={{ display: 'flex' }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: GOLD, opacity: 0.85 }} />
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: EMERALD, opacity: 0.85, marginLeft: -9 }} />
                        </div>
                      </div>

                      <p
                        className="pco-mono"
                        style={{
                          fontSize: 18,
                          letterSpacing: '0.06em',
                          boxShadow: focusedField === 'number' ? `0 2px 0 0 ${GOLD}` : 'none',
                          width: 'fit-content',
                          paddingBottom: 2,
                        }}
                      >
                        {formatCardNumber('4242424242424242')}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                          <p style={{ fontSize: 8.5, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.45)', marginBottom: 3 }}>
                            CARDHOLDER
                          </p>
                          <p
                            className="pco-mono"
                            style={{
                              fontSize: 12.5,
                              textTransform: 'uppercase',
                              boxShadow: focusedField === 'name' ? `0 2px 0 0 ${GOLD}` : 'none',
                              width: 'fit-content',
                              paddingBottom: 2,
                            }}
                          >
                            {name || 'YOUR NAME'}
                          </p>
                        </div>
                        <div>
                          <p style={{ fontSize: 8.5, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.45)', marginBottom: 3 }}>
                            EXPIRES
                          </p>
                          <p
                            className="pco-mono"
                            style={{
                              fontSize: 12.5,
                              boxShadow: focusedField === 'expiry' ? `0 2px 0 0 ${GOLD}` : 'none',
                              width: 'fit-content',
                              paddingBottom: 2,
                            }}
                          >
                            {formatExpiry('1229')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        borderRadius: 16,
                        background: 'linear-gradient(135deg, #1B2340 0%, #0B0F1E 100%)',
                        overflow: 'hidden',
                        boxShadow: '0 18px 34px -14px rgba(16,22,42,0.6)',
                      }}
                    >
                      <div style={{ width: '100%', height: 40, background: '#0A0C14', marginTop: 20 }} />
                      <div style={{ padding: '20px 20px 0' }}>
                        <div style={{ background: '#fff', borderRadius: 4, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 10px' }}>
                          <span className="pco-mono" style={{ fontSize: 14, color: INK, letterSpacing: '0.2em' }}>
                            •••
                          </span>
                        </div>
                        <p style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.4)', marginTop: 10 }}>
                          Authorized signature — not valid unless signed.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <input
                    className="pco-input"
                    placeholder="Cardholder name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    disabled={status !== 'idle'}
                  />
                  <div className="pco-input" style={{ padding: 0 }}>
                    <div style={{ padding: '12px 16px' }}>
                      <CardNumberElement
                        onChange={() => undefined}
                        onFocus={() => setFocusedField('number')}
                        onBlur={() => setFocusedField(null)}
                        options={{ style: stripeElementStyle, disabled: status !== 'idle' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div className="pco-input" style={{ padding: 0 }}>
                      <div style={{ padding: '12px 16px' }}>
                        <CardExpiryElement
                          onFocus={() => setFocusedField('expiry')}
                          onBlur={() => setFocusedField(null)}
                          options={{ style: stripeElementStyle, disabled: status !== 'idle' }}
                        />
                      </div>
                    </div>
                    <div className="pco-input" style={{ padding: 0 }}>
                      <div style={{ padding: '12px 16px' }}>
                        <CardCvcElement
                          onFocus={() => setFocusedField('cvc')}
                          onBlur={() => setFocusedField(null)}
                          options={{ style: stripeElementStyle, disabled: status !== 'idle' }}
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(225,29,72,.08)', border: '1px solid rgba(225,29,72,.18)', color: '#b91c1c', fontSize: 14 }}>
                      {error}
                    </motion.div>
                  )}

                  <div style={{ marginTop: 8 }}>
                    <button type="submit" className="pco-pay-btn" disabled={status !== 'idle' || !stripe || !elements}>
                      {status === 'idle' && (
                        <>
                          Pay {fmt(TOTAL)} <ArrowRight size={16} />
                        </>
                      )}
                      {status === 'processing' && (
                        <>
                          <Loader2 size={16} className="pco-spin" style={{ animation: 'spin 0.8s linear infinite' }} />
                          <AnimatePresence mode="wait">
                            <motion.span key={step} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
                              {PROCESSING_STEPS[step]}
                            </motion.span>
                          </AnimatePresence>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <AnimatePresence>
                  {status === 'processing' && (
                    <motion.div className="pco-scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', borderRadius: 24, overflow: 'hidden' }}>
                      <motion.div initial={{ x: '-120%' }} animate={{ x: '220%' }} transition={{ duration: 1.3, repeat: Infinity, ease: 'linear' }} style={{ position: 'absolute', top: 0, bottom: 0, width: '18%', background: `linear-gradient(90deg, transparent, rgba(200,155,60,0.18), transparent)` }} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 8 }}>
                <div style={{ position: 'relative', width: 96, height: 96, marginBottom: 18 }}>
                  <svg width="96" height="96" viewBox="0 0 96 96">
                    <motion.circle cx="48" cy="48" r="44" fill="none" stroke={EMERALD} strokeWidth="3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: 'easeOut' }} />
                    <motion.path d="M30 49 L42 61 L67 35" fill="none" stroke={EMERALD} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, delay: 0.5, ease: 'easeOut' }} />
                  </svg>
                </div>

                <motion.div initial={{ opacity: 0, scale: 2.4, rotate: -22 }} animate={{ opacity: 1, scale: 1, rotate: -10 }} transition={{ delay: 0.75, duration: 0.45, type: 'spring', stiffness: 260, damping: 14 }} style={{ border: `3px solid ${EMERALD}`, color: EMERALD, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: '0.18em', padding: '6px 18px', borderRadius: 8, marginBottom: 20 }}>
                  PAID
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0, duration: 0.35 }}>
                  <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 18, color: INK, marginBottom: 4 }}>
                    Payment received
                  </p>
                  <p className="pco-mono" style={{ fontSize: 26, fontWeight: 600, color: INK, marginBottom: 6 }}>
                    {fmt(TOTAL)}
                  </p>
                  <p style={{ fontSize: 12.5, color: INK_SOFT, marginBottom: 26 }}>
                    Receipt sent for invoice #NM-0417-22
                  </p>
                  <button className="pco-reset-btn" onClick={reset}>
                    Make another payment
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );
}

function PaymentCheckoutWithStripe() {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || import.meta.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '';
  const stripePromise = useMemo(() => (publishableKey ? loadStripe(publishableKey) : null), [publishableKey]);

  if (!stripePromise) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: PAPER, color: INK }}>
        <div style={{ maxWidth: 480, textAlign: 'center', background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 24px 60px -30px rgba(16,22,42,0.28)' }}>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, marginBottom: 8 }}>Stripe is not configured</p>
          <p style={{ color: INK_SOFT, lineHeight: 1.7 }}>Set VITE_STRIPE_PUBLISHABLE_KEY or REACT_APP_STRIPE_PUBLISHABLE_KEY in your environment to enable card payments.</p>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentCheckoutContent />
    </Elements>
  );
}

export default PaymentCheckoutWithStripe;
