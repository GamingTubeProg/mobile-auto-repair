/**
 * NHTSA vPIC API client.
 * Free, official US government vehicle database — no API key required.
 * Docs: https://vpic.nhtsa.dot.gov/api/
 *
 * We cache aggressively in memory to avoid spamming the endpoint and to
 * keep the UI instantaneous when users step back through the wizard.
 */

const API_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles';

// In-memory caches — populated once per page visit.
let makesCache = null;
const modelsCache = new Map(); // key: `${make}|${year}`

/**
 * A curated list of the most common passenger-car / light-truck makes
 * serviced by a mobile workshop in Ontario. Used as a fallback when the
 * NHTSA API is slow or unreachable, and as a "priority" list to surface
 * common makes first.
 */
export const POPULAR_MAKES = [
  'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler',
  'Dodge', 'Fiat', 'Ford', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jaguar',
  'Jeep', 'Kia', 'Land Rover', 'Lexus', 'Lincoln', 'Mazda', 'Mercedes-Benz',
  'Mini', 'Mitsubishi', 'Nissan', 'Porsche', 'Ram', 'Subaru', 'Tesla',
  'Toyota', 'Volkswagen', 'Volvo',
];

/**
 * Returns an ascending list of model years to offer in the dropdown.
 * We go back 35 years (covers nearly every vehicle still on the road).
 */
export const getYearRange = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  // Include next model year (dealers sell ahead)
  for (let y = currentYear + 1; y >= currentYear - 35; y--) {
    years.push(y);
  }
  return years;
};

/**
 * Fetch every make known to NHTSA. Filtered to car-likely results and
 * sorted alphabetically, with popular makes floated to the top.
 */
export const getMakes = async () => {
  if (makesCache) return makesCache;

  try {
    const res = await fetch(`${API_BASE}/GetMakesForVehicleType/car?format=json`);
    if (!res.ok) throw new Error(`NHTSA ${res.status}`);
    const data = await res.json();

    const all = (data.Results || [])
      .map(r => r.MakeName)
      .filter(Boolean)
      .map(n => n.trim())
      // Convert to title-case (NHTSA returns SHOUTY CASE)
      .map(n => n.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' '));

    // De-dupe, then sort: popular first (in the POPULAR_MAKES order),
    // then everything else alphabetically.
    const unique = Array.from(new Set(all));
    const popularSet = new Set(POPULAR_MAKES.map(m => m.toLowerCase()));
    const popular = POPULAR_MAKES.filter(p =>
      unique.some(u => u.toLowerCase() === p.toLowerCase())
    );
    const rest = unique
      .filter(u => !popularSet.has(u.toLowerCase()))
      .sort((a, b) => a.localeCompare(b));

    makesCache = [...popular, ...rest];
    return makesCache;
  } catch (err) {
    console.warn('NHTSA getMakes failed, falling back to POPULAR_MAKES', err);
    makesCache = [...POPULAR_MAKES];
    return makesCache;
  }
};

/**
 * Fetch every model for a given make + model year.
 * Falls back to an empty array (the UI lets the user type freely) on failure.
 */
export const getModels = async (make, year) => {
  if (!make || !year) return [];
  const key = `${make.toLowerCase()}|${year}`;
  if (modelsCache.has(key)) return modelsCache.get(key);

  try {
    const url = `${API_BASE}/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`NHTSA ${res.status}`);
    const data = await res.json();

    const models = (data.Results || [])
      .map(r => r.Model_Name)
      .filter(Boolean)
      .map(n => n.trim());

    const unique = Array.from(new Set(models)).sort((a, b) => a.localeCompare(b));
    modelsCache.set(key, unique);
    return unique;
  } catch (err) {
    console.warn(`NHTSA getModels failed for ${make} ${year}`, err);
    modelsCache.set(key, []);
    return [];
  }
};
