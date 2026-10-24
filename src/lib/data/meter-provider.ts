// ─────────────────────────────────────────────────────────────────────────────
// ChargeMate — MeterProvider interface
//
// Abstracts how kWh is metered during a charging session.
// The SimulatedMeterProvider uses elapsed time × spot power_kw.
// Replace with a real smart-meter integration by implementing this interface.
// ─────────────────────────────────────────────────────────────────────────────

export interface MeterReading {
  kwhUsed:    number;   // total kWh consumed in this session
  powerKw:    number;   // instantaneous power draw
  batteryPct: number;   // estimated current battery %
  elapsedSec: number;   // seconds since session started
}

/**
 * MeterProvider — plug-in interface for reading energy consumption.
 *
 * Implementations:
 *   • SimulatedMeterProvider — uses wall-clock time × power_kw
 *   • (future) OcppMeterProvider — reads from an OCPP-compliant charger
 *   • (future) ModbusMeterProvider — reads from a Modbus energy meter
 */
export interface MeterProvider {
  /**
   * Get the current meter reading for a given session.
   *
   * @param startedAt     ISO-8601 timestamp when the session started
   * @param powerKw       charger output in kW (from charging_spot.power_kw)
   * @param batteryKwh    vehicle battery capacity in kWh
   * @param startBatteryPct  battery % when session started (0-100)
   * @param pricePerKwh   price in INR per kWh (for cost calculation)
   */
  getReading(
    startedAt:       string,
    powerKw:         number,
    batteryKwh:      number,
    startBatteryPct: number,
    pricePerKwh:     number,
  ): MeterReading;
}

/**
 * Simulated meter: kWh = power_kw × elapsed_hours.
 * Capped at (100% - startBatteryPct) worth of the battery.
 */
export class SimulatedMeterProvider implements MeterProvider {
  getReading(
    startedAt: string,
    powerKw: number,
    batteryKwh: number,
    startBatteryPct: number,
    _pricePerKwh: number,
  ): MeterReading {
    const startMs   = new Date(startedAt).getTime();
    const elapsedSec = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
    const elapsedHrs = elapsedSec / 3600;

    // Max kWh the battery can still absorb
    const maxKwh = batteryKwh * ((100 - startBatteryPct) / 100);

    // Simulated draw: full power_kw until battery full
    const rawKwh  = powerKw * elapsedHrs;
    const kwhUsed = Math.min(rawKwh, maxKwh);
    const kwhUsedRound = Math.round(kwhUsed * 1000) / 1000;

    // Estimate battery %
    const addedPct   = batteryKwh > 0 ? (kwhUsed / batteryKwh) * 100 : 0;
    const batteryPct = Math.min(100, Math.round(startBatteryPct + addedPct));

    // If battery is full, charger is drawing 0
    const currentPower = kwhUsed >= maxKwh ? 0 : powerKw;

    return {
      kwhUsed: kwhUsedRound,
      powerKw: currentPower,
      batteryPct,
      elapsedSec,
    };
  }
}

/** Singleton simulated meter — used by default in the data layer. */
export const simulatedMeter = new SimulatedMeterProvider();
