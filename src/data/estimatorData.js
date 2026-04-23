/**
 * Curated repair categories with symptom checklists and realistic
 * CAD price ranges for mobile / independent-shop labour in Ontario.
 *
 * These ranges are intentionally transparent and conservative — they
 * bracket the typical job, not the outliers. The Estimator converts
 * severity + mileage + DIY history into a tightened sub-range.
 *
 * Sources cross-checked: RepairPal, AAA average repair cost index,
 * Canadian Black Book repair indices, and our own invoice history.
 */

export const problemCategories = [
  {
    id: 'diagnostics',
    name: 'Diagnostics / Unknown Issue',
    icon: 'Laptop',
    description: 'Warning light or strange behaviour — need a professional to identify the root cause.',
    estimate: { low: 80, high: 220 },
    symptoms: [
      'Check engine light is on',
      'Dashboard warning light (ABS, traction, airbag, etc.)',
      'Intermittent problem hard to reproduce',
      'Unknown noise from engine bay',
      'Car behaves differently than usual',
      'Recent OBD-II scan showed codes I don\'t understand',
    ],
  },
  {
    id: 'nostart',
    name: 'No Start / No Crank',
    icon: 'Zap',
    description: 'Vehicle will not start, will not crank, or cranks without firing.',
    estimate: { low: 180, high: 1200 },
    symptoms: [
      'Nothing happens when I turn the key / press start',
      'Single click, then silence',
      'Rapid clicking sound',
      'Engine cranks but will not start',
      'Dashboard lights dim when cranking',
      'Starts after several tries',
      'Smell of fuel when trying to start',
    ],
  },
  {
    id: 'battery',
    name: 'Battery / Charging System',
    icon: 'BatteryCharging',
    description: 'Weak battery, failing alternator, or electrical drain.',
    estimate: { low: 190, high: 900 },
    symptoms: [
      'Battery keeps dying overnight',
      'Needed a jump start recently',
      'Battery light on dashboard is lit',
      'Headlights dim at idle',
      'Battery is over 4 years old',
      'Corrosion on battery terminals',
    ],
  },
  {
    id: 'engine',
    name: 'Engine Running Issues',
    icon: 'Settings',
    description: 'Rough running, misfires, loss of power, or abnormal noise.',
    estimate: { low: 220, high: 2800 },
    symptoms: [
      'Engine misfires / feels like it\'s stumbling',
      'Rough idle (shaking at stop)',
      'Loss of power during acceleration',
      'Knocking or ticking sound',
      'Blue or white smoke from exhaust',
      'Oil spots under parked car',
      'Engine stalls unexpectedly',
    ],
  },
  {
    id: 'brakes',
    name: 'Brakes',
    icon: 'ShieldAlert',
    description: 'Noise, vibration, or reduced stopping power when braking.',
    estimate: { low: 220, high: 1100 },
    symptoms: [
      'Squealing or squeaking when braking',
      'Grinding metal-on-metal sound',
      'Steering wheel shakes when braking',
      'Pedal feels soft or spongy',
      'Pedal goes too far to the floor',
      'Pulling to one side when braking',
      'Brake warning light is on',
    ],
  },
  {
    id: 'cooling',
    name: 'Cooling / Overheating',
    icon: 'ThermometerSnowflake',
    description: 'Overheating, coolant leaks, or heater not working.',
    estimate: { low: 180, high: 1600 },
    symptoms: [
      'Temperature gauge reads high or in red',
      'Steam from under the hood',
      'Coolant puddles under car',
      'Sweet smell from engine bay',
      'Heater blowing cold air',
      'Coolant reservoir keeps emptying',
    ],
  },
  {
    id: 'transmission',
    name: 'Transmission / Shifting',
    icon: 'Activity',
    description: 'Hard shifts, slipping, hesitation, or transmission warning.',
    estimate: { low: 200, high: 3500 },
    symptoms: [
      'Rough or hard shifting',
      'Gears slipping under acceleration',
      'Delay before transmission engages',
      'Grinding or shuddering when shifting',
      'Transmission warning light',
      'Burning smell after driving',
      'Red fluid leaking under car',
    ],
  },
  {
    id: 'suspension',
    name: 'Suspension / Steering',
    icon: 'Wrench',
    description: 'Clunks, pulling, wander, or uneven tire wear.',
    estimate: { low: 180, high: 1400 },
    symptoms: [
      'Clunking or knocking over bumps',
      'Car pulls to one side',
      'Steering feels loose or wanders',
      'Uneven tire wear',
      'Bouncing excessively after bumps',
      'Vibration at highway speeds',
      'Squeaking when turning',
    ],
  },
  {
    id: 'tires',
    name: 'Tires / Wheels',
    icon: 'Car',
    description: 'Flat, low pressure, damage, or vibration.',
    estimate: { low: 60, high: 480 },
    symptoms: [
      'Flat or going flat',
      'TPMS low-pressure warning',
      'Visible damage (bulge, cut, nail)',
      'Vibration at certain speeds',
      'Excessive or uneven wear',
      'Need mount / balance / rotation',
    ],
  },
  {
    id: 'fuel',
    name: 'Fuel System',
    icon: 'Fuel',
    description: 'Fuel pump, injectors, fuel economy, or delivery problems.',
    estimate: { low: 180, high: 1500 },
    symptoms: [
      'Engine cranks but won\'t start',
      'Sudden drop in fuel economy',
      'Stalling when low on fuel',
      'Whining noise from fuel tank',
      'Hesitation under throttle',
      'Smell of raw fuel',
    ],
  },
  {
    id: 'oil',
    name: 'Oil Change / Maintenance',
    icon: 'Droplet',
    description: 'Routine service, fluid top-up, filter change.',
    estimate: { low: 85, high: 220 },
    symptoms: [
      'Due or overdue for oil change',
      'Oil life monitor says service now',
      'Low oil warning light',
      'Oil looks dark or gritty on dipstick',
      'Need cabin / air filter replaced',
    ],
  },
  {
    id: 'electrical',
    name: 'Electrical / Electronics',
    icon: 'Cpu',
    description: 'Non-start electrical, module faults, wiring, lighting.',
    estimate: { low: 120, high: 1800 },
    symptoms: [
      'Windows, locks, or mirrors not working',
      'Interior or exterior lights malfunctioning',
      'Infotainment / screen not responding',
      'Intermittent electrical gremlins',
      'Blown fuses keep happening',
      'Module communication error codes',
    ],
  },
  {
    id: 'other',
    name: 'Other / Not Sure',
    icon: 'Wrench',
    description: 'Something else — tell us about it and we\'ll advise.',
    estimate: { low: 100, high: 1500 },
    symptoms: [
      'I\'m not sure what\'s wrong',
      'Multiple problems at once',
      'Recommended by another shop',
      'Second opinion needed',
      'Pre-purchase inspection',
    ],
  },
];

export const onsetOptions = [
  { value: 'today',      label: 'Today' },
  { value: 'this-week',  label: 'This week' },
  { value: 'this-month', label: 'This month' },
  { value: 'ongoing',    label: 'Months — ongoing' },
  { value: 'intermittent', label: 'Comes and goes' },
];

export const severityLabels = [
  'Minor annoyance',
  'Noticeable but drivable',
  'Affects how I drive it',
  'Serious — avoiding driving',
  'Emergency / unsafe',
];

export const contactTimeOptions = [
  'Anytime',
  'Morning (8am – 12pm)',
  'Afternoon (12pm – 5pm)',
  'Evening (5pm – 8pm)',
];

/**
 * Turns a category + user inputs into a tightened CAD range.
 *
 * The category's { low, high } bracket is the outer bound. Severity
 * and symptom count push the estimate toward the upper half; "shop
 * already looked at it" tightens the range.
 *
 * Returned range is rounded to the nearest $10.
 */
export const buildEstimateRange = (categoryId, { severity = 3, symptomCount = 1, shopVisited = false } = {}) => {
  const cat = problemCategories.find(c => c.id === categoryId);
  if (!cat) return { low: 0, high: 0 };

  const { low, high } = cat.estimate;
  const span = high - low;

  // Severity: 1 (minor) → -20% from midpoint, 5 (emergency) → +20%
  const sevFactor = 1 + (severity - 3) * 0.075;

  // Symptom count: each extra checked symptom pushes the midpoint up
  const symptomFactor = 1 + Math.min(symptomCount - 1, 6) * 0.04;

  // If a shop already diagnosed it, we can tighten the range (less unknowns)
  const uncertainty = shopVisited ? 0.18 : 0.30;

  const midpoint = low + span * 0.5;
  const adjusted = midpoint * sevFactor * symptomFactor;

  const estLow = Math.max(low, adjusted * (1 - uncertainty));
  const estHigh = Math.min(high, adjusted * (1 + uncertainty));

  const round10 = n => Math.round(n / 10) * 10;
  return {
    low: round10(estLow),
    high: round10(estHigh),
    catLow: low,
    catHigh: high,
  };
};
