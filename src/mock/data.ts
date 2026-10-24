// Mock data for development showcase page

export const mockSession = {
  hostName:       "Suresh K.",
  spotName:       "Suresh's Shaded Driveway",
  address:        "14B, Koramangala 4th Block, Bengaluru",
  batteryPercent: 42,
  startPercent:   15,
  targetPercent:  80,
  voltage:        "232V",
  currentLabel:   "30A Stabilized",
  metrics: [
    { label: "Power",   value: "6.9",  unit: "kW",  subtitle: "AC Level 2" },
    { label: "Elapsed", value: "38",   unit: "min", subtitle: "~42 min left" },
    { label: "Energy",  value: "13.6", unit: "kWh", subtitle: "Added today" },
    { label: "Temp",    value: "33.4", unit: "°C",  subtitle: "Ambient" },
  ],
};

export const mockHostStats = [
  {
    label:       "Today's Earnings",
    value:       "₹486",
    unit:        "",
    subtitle:    "3 completed sessions",
    footerLeft:  "Yesterday",
    footerRight: "₹312",
    accentColor: "ochre" as const,
  },
  {
    label:       "Month Total",
    value:       "₹9,240",
    unit:        "",
    subtitle:    "Oct 2026",
    footerLeft:  "Last month",
    footerRight: "₹7,850",
    accentColor: "host" as const,
  },
  {
    label:       "Energy Dispensed",
    value:       "148",
    unit:        "kWh",
    subtitle:    "This month",
    footerLeft:  "Avg / session",
    footerRight: "4.6 kWh",
    accentColor: "charge" as const,
  },
  {
    label:       "Rating",
    value:       "4.9",
    unit:        "★",
    subtitle:    "32 reviews",
    footerLeft:  "Response rate",
    footerRight: "98%",
    accentColor: "forest" as const,
  },
];

export const mockConnectors = [
  { type: "type2" as const,     power: "7.2 kW" },
  { type: "16a" as const,       power: "3.3 kW" },
  { type: "ccs2" as const,      power: "50 kW"  },
  { type: "ather" as const,     power: "1.5 kW" },
  { type: "bharat-ac" as const, power: "3.3 kW" },
];

export const mockReceipts = [
  { id: "REC-1024", date: "24 Oct 2026", host: "Suresh's Shaded Driveway", kwh: 13.6, amount: 122.4, status: "paid" },
  { id: "REC-1019", date: "21 Oct 2026", host: "Priya's EV Point",          kwh: 8.2,  amount: 73.8,  status: "paid" },
  { id: "REC-1012", date: "18 Oct 2026", host: "Green Bay Charger",          kwh: 22.1, amount: 198.9, status: "paid" },
];
