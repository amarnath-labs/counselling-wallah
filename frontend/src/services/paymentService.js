import { apiRequest } from './apiClient';

const CASHFREE_SDK_URL = 'https://sdk.cashfree.com/js/v3/cashfree.js';

function getCashfreeMode() {
  return import.meta.env.VITE_CASHFREE_MODE || 'sandbox';
}

function loadCashfreeSdk() {
  if (window.Cashfree) {
    return Promise.resolve(window.Cashfree);
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${CASHFREE_SDK_URL}"]`
    );

    if (existing) {
      existing.addEventListener('load', () => resolve(window.Cashfree));
      existing.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.src = CASHFREE_SDK_URL;
    script.async = true;
    script.onload = () => resolve(window.Cashfree);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export async function createPaymentOrder(planId) {
  return apiRequest('/payments/create-order', {
    method: 'POST',
    body: JSON.stringify({ planId }),
  });
}

export async function startCashfreeCheckout(planId) {
  const order = await createPaymentOrder(planId);

  if (!order.paymentSessionId) {
    throw new Error('Payment session was not returned by the server');
  }

  const Cashfree = await loadCashfreeSdk();
  const cashfree = Cashfree({
    mode: getCashfreeMode(),
  });

  await cashfree.checkout({
    paymentSessionId: order.paymentSessionId,
    redirectTarget: '_self',
  });

  return order;
}

export async function getPaymentStatus(orderId) {
  return apiRequest(`/payments/status/${encodeURIComponent(orderId)}`);
}

export function runDemoPayment(amount, plan) {
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          amount,
          plan,
          status: 'Successful',
          demo: true,
        }),
      300
    )
  );
}
