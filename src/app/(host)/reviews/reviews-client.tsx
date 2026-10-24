"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, MessageCircle, Star } from "lucide-react";
import { Button } from "@/components/chargemate/button";
import { cn } from "@/lib/utils";
import { getReviewsForHost, replyToReview, MOCK_HOST_ID, type Review } from "@/lib/data";

function ReviewCard({ review, onReply }: { review: Review; onReply: (id: string, reply: string) => Promise<void> }) {
  const [draft, setDraft] = useState(review.reply ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const date = new Date(review.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  async function submit() {
    if (!draft.trim()) return;
    setSaving(true); setError("");
    try { await onReply(review.id, draft.trim()); setEditing(false); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not post your reply."); }
    finally { setSaving(false); }
  }
  return <article className="bg-card rounded-xl p-md lg:p-lg shadow-sm flex flex-col gap-md">
    <div className="flex items-center justify-between gap-sm">
      <div className="flex items-center gap-xs" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, i) => <Star key={i} className={cn("size-4", i < review.rating ? "text-ochre fill-ochre" : "text-border")} />)}<span className="ml-1 text-label-sm text-muted-foreground">{review.rating}/5</span></div>
      <time className="text-body-sm text-muted-foreground">{date}</time>
    </div>
    <p className="text-body-sm text-muted-foreground">Booking #{review.booking_id}</p>
    {review.comment ? <p className="text-body-md leading-relaxed">“{review.comment}”</p> : <p className="italic text-muted-foreground text-body-sm">No written comment.</p>}
    {review.reply && !editing && <div className="bg-host-fixed rounded-lg p-sm"><p className="text-label-md text-forest mb-1">Your reply</p><p className="text-body-sm">{review.reply}</p></div>}
    {editing ? <div className="flex flex-col gap-sm"><label className="text-label-md" htmlFor={`reply-${review.id}`}>Your reply</label><textarea id={`reply-${review.id}`} rows={3} maxLength={500} value={draft} onChange={e => setDraft(e.target.value)} className="w-full bg-recessed border border-border rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-ring resize-y" placeholder="Write a thoughtful reply…"/><div className="flex justify-between items-center"><span className="text-body-sm text-muted-foreground">{draft.length}/500</span><div className="flex gap-sm"><button className="text-label-md text-muted-foreground px-sm" onClick={() => {setEditing(false);setDraft(review.reply ?? "");setError("");}}>Cancel</button><Button variant="host" size="sm" disabled={saving || !draft.trim()} onClick={submit}>{saving ? "Posting…" : "Post reply"}</Button></div></div>{error && <p role="alert" className="text-body-sm text-destructive">{error}</p>}</div> : <button onClick={() => setEditing(true)} className="self-start text-label-md text-forest hover:underline">{review.reply ? "Edit reply" : "Reply to review"}</button>}
  </article>;
}

export function ReviewsClient() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { setReviews(await getReviewsForHost(MOCK_HOST_ID)); } catch (e) { setError(e instanceof Error ? e.message : "Could not load reviews."); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  async function handleReply(id: string, text: string) { const updated = await replyToReview(id, text); setReviews(items => items.map(item => item.id === id ? updated : item)); }
  const average = reviews.length ? (reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length).toFixed(1) : "—";
  return <div className="p-gutter lg:p-margin max-w-screen-lg mx-auto flex flex-col gap-lg">
    <header><span className="font-heading text-label-sm uppercase tracking-widest text-ochre">Guest feedback</span><h1 className="font-heading text-headline-lg text-forest mt-xs">Reviews</h1><p className="text-body-md text-muted-foreground mt-xs">See what guests say about their charging experience.</p></header>
    {!loading && !error && reviews.length > 0 && <section className="bg-forest text-forest-foreground rounded-xl p-lg flex items-center gap-md"><Star className="size-8 text-ochre fill-ochre"/><div><p className="font-heading text-headline-lg">{average}<span className="text-body-md text-forest-foreground/70"> / 5</span></p><p className="text-body-sm text-forest-foreground/70">Average rating · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}</p></div></section>}
    {loading ? <div aria-busy="true" className="space-y-md">{[1,2,3].map(n => <div key={n} className="h-44 rounded-xl bg-recessed animate-pulse" />)}</div> : error ? <div className="min-h-64 flex flex-col items-center justify-center gap-md text-center"><AlertTriangle className="size-9 text-destructive"/><p>{error}</p><Button variant="outline" onClick={() => void load()}>Retry</Button></div> : reviews.length === 0 ? <div className="bg-card rounded-xl py-16 text-center"><MessageCircle className="size-10 text-border mx-auto mb-sm"/><h2 className="font-heading text-headline-sm">No reviews yet</h2><p className="text-body-sm text-muted-foreground mt-xs">Guest feedback will appear here after completed bookings.</p></div> : <div className="flex flex-col gap-md">{reviews.map(review => <ReviewCard key={review.id} review={review} onReply={handleReply}/>)}</div>}
  </div>;
}
