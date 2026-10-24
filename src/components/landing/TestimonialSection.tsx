"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    id:       "t1",
    name:     "Pooja Hegde",
    role:     "Ather 450X rider · Indiranagar",
    avatar:   "https://i.pravatar.cc/64?u=pooja-hegde",
    rating:   5,
    quote:    "Found a 7 kW charger 400 m from my flat in under a minute. Ramesh even left the gate open for me. This is exactly how it should work.",
    highlight:"400 m from my flat",
  },
  {
    id:       "t2",
    name:     "Aarav Shah",
    role:     "MG Windsor owner · Koramangala",
    avatar:   "https://i.pravatar.cc/64?u=aarav-shah",
    rating:   5,
    quote:    "I list my Type 2 point on weekdays when I'm in the office. Made ₹4,200 last month with zero effort. Payout hit my UPI before I got home.",
    highlight:"₹4,200 last month",
  },
  {
    id:       "t3",
    name:     "Kavya Reddy",
    role:     "Tata Nexon EV · Whitefield",
    avatar:   "https://i.pravatar.cc/64?u=kavya-reddy",
    rating:   5,
    quote:    "The live kWh tracker is addictive — I can see exactly how much charge I'm getting. Way better than guessing at a mall charger that's always busy.",
    highlight:"live kWh tracker",
  },
];

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="size-4 fill-ochre text-ochre" aria-hidden />
      ))}
    </div>
  );
}

export function TestimonialSection() {
  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="bg-forest py-20 md:py-28 overflow-hidden"
    >
      <div className="max-w-screen-xl mx-auto px-gutter-mobile md:px-gutter">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="font-heading text-label-md uppercase tracking-widest text-white/50 block mb-2">
            Real people, real charges
          </span>
          <h2
            id="testimonials-heading"
            className="font-heading text-headline-lg-mobile md:text-headline-md text-white tracking-tight"
          >
            The grid is already alive
          </h2>
        </motion.div>

        {/* Cards */}
        <ul role="list" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.li
              key={t.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <figure className="h-full bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4 backdrop-blur-sm">
                {/* Quote icon */}
                <Quote className="size-6 text-charge/70 -mb-1" aria-hidden />

                {/* Quote text — highlight key phrase */}
                <blockquote className="font-body text-body-md text-white/80 flex-1 leading-relaxed">
                  {t.quote.split(t.highlight).map((part, idx, arr) => (
                    <span key={idx}>
                      {part}
                      {idx < arr.length - 1 && (
                        <strong className="text-charge font-semibold not-italic">
                          {t.highlight}
                        </strong>
                      )}
                    </span>
                  ))}
                </blockquote>

                <figcaption className="flex items-center gap-3 pt-3 border-t border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.avatar}
                    alt={t.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-heading text-label-lg text-white truncate">{t.name}</p>
                    <p className="font-body text-label-sm text-white/50 truncate">{t.role}</p>
                  </div>
                  <StarRow count={t.rating} />
                </figcaption>
              </figure>
            </motion.li>
          ))}
        </ul>

        {/* Aggregate trust stat */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-8 text-center"
        >
          {[
            { num: "4.9★", label: "average host rating" },
            { num: "2,800+", label: "sessions completed" },
            { num: "₹0", label: "membership fee" },
          ].map(({ num, label }) => (
            <div key={label}>
              <p className="font-heading text-data-display text-charge">{num}</p>
              <p className="font-body text-body-sm text-white/50">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
