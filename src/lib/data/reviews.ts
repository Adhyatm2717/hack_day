import type { Review } from "@/types/db";
import { MOCK_HOST_ID, MOCK_RIDER_ID } from "./constants";

// ── Seed data ─────────────────────────────────────────────────────────────────

const MOCK_REVIEWS: Review[] = [
  {
    id:         "review-001",
    booking_id: "booking-006",
    rater_id:   "rider-kavya-003",
    host_id:    MOCK_HOST_ID,
    rating:     5,
    comment:    "Excellent spot! Gate code worked perfectly, charging was fast and the driveway is nicely shaded. Will come back!",
    reply:      "Thank you Kavya! Your EV is welcome anytime 🙏",
    created_at: "2026-10-24T13:00:00.000Z",
    updated_at: "2026-10-24T14:00:00.000Z",
  },
  {
    id:         "review-002",
    booking_id: "booking-002",
    rater_id:   MOCK_RIDER_ID,
    host_id:    "host-suresh-003",
    rating:     5,
    comment:    "Suresh was very welcoming. CCS2 charger works great, gave full 7.2 kW. Perfect for a quick charge before the evening.",
    reply:      null,
    created_at: "2026-10-21T16:00:00.000Z",
    updated_at: "2026-10-21T16:00:00.000Z",
  },
  {
    id:         "review-003",
    booking_id: "booking-003",
    rater_id:   MOCK_RIDER_ID,
    host_id:    "host-vikram-005",
    rating:     4,
    comment:    "Good experience overall. Spot was a little hard to find the first time but Vikram guided me on WhatsApp. Charger reliable.",
    reply:      "Sorry about the directions — I've added a landmark note to the listing now!",
    created_at: "2026-10-18T13:00:00.000Z",
    updated_at: "2026-10-18T15:30:00.000Z",
  },
  {
    id:         "review-004",
    booking_id: "ledger-002", // different booking for Ramesh's spot
    rater_id:   "rider-deepak-004",
    host_id:    MOCK_HOST_ID,
    rating:     5,
    comment:    "Ramesh bhai is the best! Very punctual, charger always online. Been using his spot for 3 months now.",
    reply:      "Always happy to host you Deepak! 😊",
    created_at: "2026-10-24T10:30:00.000Z",
    updated_at: "2026-10-24T11:00:00.000Z",
  },
  {
    id:         "review-005",
    booking_id: "booking-x01",
    rater_id:   "rider-sarita-005",
    host_id:    MOCK_HOST_ID,
    rating:     5,
    comment:    "Great host. Spot exactly as described. Type 2 cable is long enough for my car easily.",
    reply:      null,
    created_at: "2026-10-20T09:00:00.000Z",
    updated_at: "2026-10-20T09:00:00.000Z",
  },
];

// ── Public API ────────────────────────────────────────────────────────────────

/** Returns all reviews for a specific host, newest first. */
export async function getReviewsForHost(hostId: string): Promise<Review[]> {
  return MOCK_REVIEWS
    .filter((r) => r.host_id === hostId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Rider: returns all reviews written by the logged-in rider. */
export async function getMyReviews(): Promise<Review[]> {
  return MOCK_REVIEWS
    .filter((r) => r.rater_id === MOCK_RIDER_ID)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Host: reply to a review (sets the reply field). */
export async function replyToReview(id: string, text: string): Promise<Review> {
  const idx = MOCK_REVIEWS.findIndex((r) => r.id === id && r.host_id === MOCK_HOST_ID);
  if (idx === -1) throw new Error(`Review not found or not on your spot: ${id}`);
  MOCK_REVIEWS[idx] = { ...MOCK_REVIEWS[idx], reply: text, updated_at: new Date().toISOString() };
  return { ...MOCK_REVIEWS[idx] };
}

export interface SubmitReviewParams {
  bookingId: string;
  rating:    number;  // 1-5
  comment:   string;
}

/** Rider: submit a new review after a completed session. */
export async function submitReview(params: SubmitReviewParams): Promise<Review> {
  // Validate rating
  if (params.rating < 1 || params.rating > 5)
    throw new Error("Rating must be between 1 and 5");

  const review: Review = {
    id:         `review-${Date.now()}`,
    booking_id: params.bookingId,
    rater_id:   MOCK_RIDER_ID,
    host_id:    MOCK_HOST_ID, // mock: always Ramesh's spot
    rating:     params.rating,
    comment:    params.comment || null,
    reply:      null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  MOCK_REVIEWS.push(review);
  return review;
}
