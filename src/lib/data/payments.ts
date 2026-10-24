import type { Payment, PaymentOrder, WalletBalance } from "@/types/db";
import { MOCK_RIDER_ID } from "./constants";

// ── Seed data ─────────────────────────────────────────────────────────────────

const MOCK_PAYMENTS: Payment[] = [
  {
    id:               "payment-001",
    booking_id:       "booking-002",
    amount_inr:       73.8,
    platform_fee_inr: 3.69,
    host_payout_inr:  70.11,
    status:           "paid",
    method:           "upi",
    created_at:       "2026-10-21T15:45:00.000Z",
    updated_at:       "2026-10-21T15:46:00.000Z",
  },
  {
    id:               "payment-002",
    booking_id:       "booking-003",
    amount_inr:       122.4,
    platform_fee_inr: 6.12,
    host_payout_inr:  116.28,
    status:           "paid",
    method:           "wallet",
    created_at:       "2026-10-18T12:00:00.000Z",
    updated_at:       "2026-10-18T12:01:00.000Z",
  },
];

let MOCK_WALLET_BALANCE = 250; // INR

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Creates a payment order for a booking.
 * Real version: hits Razorpay order creation API.
 */
export async function createPayment(bookingId: string): Promise<PaymentOrder> {
  // Mock: always creates an order for ₹150 (the session estimate)
  return {
    orderId:   `order_mock_${Date.now()}`,
    amountInr: 150,
    key:       "rzp_test_mock",
  };
}

/** Returns the payment record for a completed booking. */
export async function getPayment(bookingId: string): Promise<Payment> {
  const payment = MOCK_PAYMENTS.find((p) => p.booking_id === bookingId);
  if (!payment) throw new Error(`Payment not found for booking: ${bookingId}`);
  return { ...payment };
}

/** Rider: returns current wallet balance. */
export async function getWalletBalance(): Promise<WalletBalance> {
  return {
    balanceInr: MOCK_WALLET_BALANCE,
    lastTopUp:  "2026-10-10T11:00:00.000Z",
  };
}

/** Rider: top up the wallet by a given amount. */
export async function topUpWallet(amountInr: number): Promise<WalletBalance> {
  if (amountInr < 50) throw new Error("Minimum top-up is ₹50");
  MOCK_WALLET_BALANCE += amountInr;
  return {
    balanceInr: MOCK_WALLET_BALANCE,
    lastTopUp:  new Date().toISOString(),
  };
}
