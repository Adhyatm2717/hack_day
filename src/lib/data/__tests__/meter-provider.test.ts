// ─────────────────────────────────────────────────────────────────────────────
// ChargeMate — MeterProvider tests
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import { SimulatedMeterProvider } from "@/lib/data/meter-provider";

describe("SimulatedMeterProvider", () => {
  const meter = new SimulatedMeterProvider();
  const POWER_KW    = 7.2;
  const BATTERY_KWH = 24;
  const PRICE_PER_KWH = 12;

  it("returns zero kWh for a just-started session", () => {
    const startedAt = new Date().toISOString();
    const reading = meter.getReading(startedAt, POWER_KW, BATTERY_KWH, 20, PRICE_PER_KWH);
    expect(reading.kwhUsed).toBe(0);
    expect(reading.elapsedSec).toBe(0);
    expect(reading.batteryPct).toBe(20);
  });

  it("accumulates kWh proportional to elapsed time", () => {
    // Simulate 1 hour ago start
    const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
    const reading = meter.getReading(oneHourAgo, POWER_KW, BATTERY_KWH, 0, PRICE_PER_KWH);
    // 7.2 kW × 1 hour = 7.2 kWh (exact, battery started at 0%)
    expect(reading.kwhUsed).toBeCloseTo(7.2, 0);
    expect(reading.batteryPct).toBeCloseTo(30, 0); // 7.2/24 = 30%
    expect(reading.powerKw).toBe(POWER_KW); // still charging
  });

  it("caps kWh at battery capacity and reports zero power when full", () => {
    // Simulate 10 hours ago — battery was already at 80% → only 20% headroom
    const tenHoursAgo = new Date(Date.now() - 36_000_000).toISOString();
    // maxKwh = 24 × (100-80)/100 = 4.8 kWh
    const reading = meter.getReading(tenHoursAgo, POWER_KW, BATTERY_KWH, 80, PRICE_PER_KWH);
    expect(reading.kwhUsed).toBeCloseTo(4.8, 1);
    expect(reading.batteryPct).toBe(100);
    expect(reading.powerKw).toBe(0); // charger stopped
  });

  it("never exceeds battery capacity", () => {
    const longAgo = new Date(Date.now() - 86_400_000).toISOString(); // 24h ago
    const reading = meter.getReading(longAgo, POWER_KW, BATTERY_KWH, 0, PRICE_PER_KWH);
    expect(reading.kwhUsed).toBeLessThanOrEqual(BATTERY_KWH);
    expect(reading.batteryPct).toBeLessThanOrEqual(100);
  });

  it("handles 30-minute session correctly", () => {
    const halfHourAgo = new Date(Date.now() - 1_800_000).toISOString();
    const reading = meter.getReading(halfHourAgo, 3.3, 30, 50, 10);
    // 3.3 kW × 0.5 hr = 1.65 kWh; maxKwh = 30 × 0.5 = 15 kWh → not capped
    expect(reading.kwhUsed).toBeCloseTo(1.65, 1);
  });

  it("elapsedSec is never negative", () => {
    const futureTime = new Date(Date.now() + 5000).toISOString();
    const reading = meter.getReading(futureTime, POWER_KW, BATTERY_KWH, 0, PRICE_PER_KWH);
    expect(reading.elapsedSec).toBe(0);
    expect(reading.kwhUsed).toBe(0);
  });
});
