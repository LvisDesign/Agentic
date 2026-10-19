import { PropertyListing } from '../types/marketplace';
import { DELTA_CITIES } from '../data/mockListings';

export interface PostedLocationOption {
  name: string;
  city: string;
  count: number;
  fullLabel: string;
  tags?: string[];
}

/**
 * Extracts and deduplicates unique neighborhoods, landmarks, and areas
 * posted by agents across listings in the chosen state.
 */
export function extractPostedLocations(
  listings: PropertyListing[],
  targetState: string = 'Delta State'
): PostedLocationOption[] {
  const normalizedState = targetState.toLowerCase().replace(/state|\(.*?\)/gi, '').trim();
  const locationMap = new Map<string, { city: string; count: number; tags: Set<string> }>();

  listings.forEach((item) => {
    // Check if listing belongs to target state
    const itemState = (item.state || '').toLowerCase();
    if (normalizedState && !itemState.includes(normalizedState)) {
      return;
    }

    // Extract neighborhood / area name
    if (item.neighborhood && item.neighborhood.trim()) {
      const cleanNeighborhood = item.neighborhood.trim();
      const existing = locationMap.get(cleanNeighborhood);
      if (existing) {
        existing.count += 1;
        (item.tags || []).forEach((t) => existing.tags.add(t));
      } else {
        const tagSet = new Set<string>();
        (item.tags || []).forEach((t) => tagSet.add(t));
        locationMap.set(cleanNeighborhood, {
          city: item.city || 'Delta State',
          count: 1,
          tags: tagSet,
        });
      }
    }
  });

  return Array.from(locationMap.entries()).map(([name, data]) => ({
    name,
    city: data.city,
    count: data.count,
    fullLabel: `${name} (${data.city})`,
    tags: Array.from(data.tags),
  }));
}

/**
 * Normalizes a text string into search tokens, removing common stop words.
 */
function tokenize(text: string): string[] {
  const stopWords = new Set([
    'in', 'at', 'the', 'near', 'off', 'and', 'or', 'to', 'for', 'all',
    'state', 'delta', 'cities', 'city', 'lga', 'zone', 'area', 'close',
    'behind', 'opposite', 'beside', 'road', 'rd', 'street', 'st', 'layout',
    'estate', 'expressway', 'junction', 'phase'
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2 && !stopWords.has(w));
}

/**
 * Matches a listing against a chosen state and location query.
 * Supports:
 * 1. Default "All Delta Cities" (matches all in the state)
 * 2. Static city names (e.g. "Asaba", "Warri", "Ughelli")
 * 3. Exact agent-posted neighborhood matches
 * 4. Word-by-word token matching and similarity (e.g. typing "Airport" matches "Airport Road / Effurun")
 * 5. Typo-tolerant prefix matching for words >= 4 characters
 */
export function matchesLocation(
  listing: PropertyListing,
  selectedLocation: string,
  targetState: string = 'Delta State'
): boolean {
  // 1. Verify State
  const cleanTargetState = targetState.toLowerCase().replace(/state|\(.*?\)/gi, '').trim();
  const listingState = (listing.state || '').toLowerCase();
  if (cleanTargetState && !listingState.includes(cleanTargetState)) {
    return false;
  }

  // 2. All Cities selection
  if (
    !selectedLocation ||
    selectedLocation === 'All Delta Cities' ||
    selectedLocation.trim().toLowerCase() === 'all'
  ) {
    return true;
  }

  const query = selectedLocation.trim().toLowerCase();

  // 3. Special "Others" filter
  if (query === 'others') {
    const majorCities = ['asaba', 'warri', 'effurun', 'ughelli', 'sapele', 'agbor', 'abraka'];
    return !majorCities.includes(listing.city.toLowerCase());
  }

  // 4. Exact equality match on city or neighborhood
  const listingCity = (listing.city || '').toLowerCase();
  const listingNeighborhood = (listing.neighborhood || '').toLowerCase();

  if (listingCity === query || listingNeighborhood === query) {
    return true;
  }

  // 5. Direct substring match on any location-related listing field
  const listingFullAddress = (listing.fullAddress || '').toLowerCase();
  const listingTitle = (listing.title || '').toLowerCase();
  const listingTags = (listing.tags || []).map((t) => t.toLowerCase()).join(' ');
  const listingDesc = (listing.description || '').toLowerCase();

  const combinedLocationText = `${listingCity} ${listingNeighborhood} ${listingFullAddress} ${listingTitle} ${listingTags}`;

  if (combinedLocationText.includes(query)) {
    return true;
  }

  // Check reverse inclusion (e.g. user typed "Warri Airport Road" and listing city is "Warri" or neighborhood is "Airport Road")
  if (query.includes(listingCity) && listingCity.length > 3) {
    return true;
  }

  // 6. Word-by-word token similarity matching
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    // If only stop-words were typed, fallback to raw word match
    const rawTokens = query.split(/\s+/).filter((w) => w.length >= 2);
    return rawTokens.some((token) => combinedLocationText.includes(token));
  }

  // Extract tokens from the listing's location fields
  const listingTokens = tokenize(combinedLocationText);
  const listingTokensSet = new Set(listingTokens);

  // Check if any query token matches or prefix-matches listing tokens
  const matchingTokensCount = queryTokens.filter((qToken) => {
    // Exact token match
    if (listingTokensSet.has(qToken)) {
      return true;
    }

    // Direct substring in neighborhood or address
    if (listingNeighborhood.includes(qToken) || listingFullAddress.includes(qToken) || listingCity.includes(qToken)) {
      return true;
    }

    // Prefix/stem similarity for tokens with 4+ characters (e.g. "airp" -> "airport", "delsu" -> "delsu", "otow" -> "otovwodo")
    if (qToken.length >= 4) {
      return listingTokens.some((lToken) => {
        if (lToken.length >= 4) {
          return lToken.startsWith(qToken) || qToken.startsWith(lToken);
        }
        return false;
      });
    }

    return false;
  }).length;

  // If at least one meaningful token matches (or majority of tokens when multiple are typed)
  if (queryTokens.length === 1) {
    return matchingTokensCount >= 1;
  }

  // For multi-word queries (e.g. "Airport Road", "Campus 3 Gate", "GRA Asaba"):
  // If at least one highly specific token matches
  return matchingTokensCount >= 1;
}
