import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHero from '../components/PageHero';
import { startCashfreeCheckout } from '../services/paymentService';

const PLANS = [
  {
    id: 'free',
    name: 'FREE',
    amount: '₹0',
    subtitle: 'Start exploring',
    items: [
      'Basic college search',
      'Limited results',
      'Basic college information',
    ],
    button: 'Start Free',
  },
  {
    id: 'basic',
    name: 'BASIC',
    amount: '₹49',
    subtitle: 'For quick college research',
    items: [
      'Full eligible college list',
      '2026 Round-wise cutoff details',
      'Basic filters',
      'College-wise cutoff information',
    ],
    button: 'Unlock Basic',
  },
  {
    id: 'finder',
    name: 'COLLEGE FINDER',
    amount: '₹99',
    subtitle: 'For personalized counselling',
    popular: true,
    items: [
      'Everything in Basic',
      'Dream / Target / Safe / Backup',
      'Advanced filters',
      'College comparison',
      'Preference-list builder',
    ],
    button: 'Unlock College Finder',
  },
  {
    id: 'support',
    name: 'COUNSELLING SUPPORT',
    amount: '₹299',
    subtitle: 'For personal guidance',
    items: [
      'Everything in College Finder',
      'Personalized counselling guidance',
      'Choice-list review',
      'Deadline reminders',
      'Document guidance',
      'Support chat',
    ],
    button: 'Get Counselling Support',
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const handleClick = (plan) => {
    setPaymentError('');
    setSelectedPlan(plan);

    if (plan.id === 'free') {
      navigate('/exams');
    }
  };

  const handlePayment = async () => {
    if (!selectedPlan || selectedPlan.id === 'free') {
      return;
    }

    setPaymentLoading(true);
    setPaymentError('');

    try {
      await startCashfreeCheckout(selectedPlan.id);
    } catch (error) {
      setPaymentError(
        error?.message ||
          'Unable to start payment. Please try again.'
      );
      setPaymentLoading(false);
    }
  };

  return (
    <>
      <PageHero
        title="Counselling Wallah Pro"
        description="Choose the plan that fits your counselling needs."
        crumb={<a href="/">Home</a>}
      />

      <div className="container section">
        <div className="section-head">
          <div className="kicker">
            Counselling Wallah Pro
          </div>

          <h2>
            Simple, transparent pricing
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '18px',
            alignItems: 'stretch',
          }}
        >
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className="card"
              style={{
                position: 'relative',
                zIndex: 1,
                padding: '28px',
                minHeight: '470px',
                display: 'flex',
                flexDirection: 'column',
                pointerEvents: 'auto',
                borderRadius: '22px',
                border: plan.popular
                  ? '2px solid var(--orange)'
                  : '1px solid var(--line)',
              }}
            >
              {plan.popular && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-14px',
                    right: '20px',
                    zIndex: 20,
                    background: 'var(--orange)',
                    color: '#fff',
                    padding: '7px 15px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 800,
                    pointerEvents: 'none',
                  }}
                >
                  MOST USED
                </div>
              )}

              <div
                style={{
                  color: 'var(--ink-3)',
                  fontWeight: 800,
                  fontSize: '15px',
                }}
              >
                {plan.name}
              </div>

              <div
                style={{
                  fontSize: '42px',
                  fontWeight: 800,
                  color: 'var(--navy)',
                  marginTop: '12px',
                }}
              >
                {plan.amount}
              </div>

              <div
                style={{
                  color: 'var(--ink-3)',
                  marginTop: '5px',
                  marginBottom: '20px',
                }}
              >
                {plan.subtitle}
              </div>

              <div style={{ flex: 1 }}>
                {plan.items.map((item) => (
                  <div
                    key={item}
                    style={{
                      padding: '12px 0',
                      borderBottom:
                        '1px dashed var(--line)',
                      color: 'var(--ink)',
                    }}
                  >
                    ✓ {item}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleClick(plan)}
                style={{
                  position: 'relative',
                  zIndex: 100,
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  width: '100%',
                  minHeight: '54px',
                  marginTop: '24px',
                  borderRadius: '14px',
                  border: plan.popular
                    ? 'none'
                    : '1px solid #d8deef',
                  background: plan.popular
                    ? '#172451'
                    : '#fff',
                  color: plan.popular
                    ? '#fff'
                    : '#172451',
                  fontSize: '16px',
                  fontWeight: 800,
                }}
              >
                {plan.button}
              </button>
            </div>
          ))}
        </div>

        {selectedPlan && selectedPlan.id !== 'free' && (
          <div
            className="card"
            style={{
              marginTop: '25px',
              padding: '20px',
              textAlign: 'center',
              position: 'relative',
              zIndex: 5,
            }}
          >
            <h3>
              Selected: {selectedPlan.name}
            </h3>

            <p>
              Amount:{' '}
              <strong>
                {selectedPlan.amount}
              </strong>
            </p>

            {paymentError && (
              <p
                style={{
                  color: '#b00020',
                  fontWeight: 700,
                }}
              >
                {paymentError}
              </p>
            )}

            <button
              type="button"
              disabled={paymentLoading}
              style={{
                marginTop: '10px',
                padding: '12px 25px',
                border: 'none',
                borderRadius: '10px',
                background: '#172451',
                color: '#fff',
                fontWeight: 800,
                cursor: paymentLoading ? 'wait' : 'pointer',
                opacity: paymentLoading ? 0.72 : 1,
              }}
              onClick={handlePayment}
            >
              {paymentLoading
                ? 'Starting Payment...'
                : 'Continue to Payment'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
