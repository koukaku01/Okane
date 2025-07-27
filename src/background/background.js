/**
 * Current: Currency Converter
 * 
 * Background Service Worker
 * Handle API calls, caching and scheduling updates.
 */

// Frankfurter API config
const API_BASE = 'https://api.frankfurter.dev/v1/latest';
const UPDATE_ALARM_NAME = 'updateExchangeRates';
const CACHE_DURATION_HOURS = 24;

/**
 * Service Worker Installation
 * Set up initial alarms and checks for existing data
 */
self.addEventListener('install', async () => {
  console.log('CURRENT extension installed');
  
  // Initialize extension on first install
  await initializeExtension();
});

/**
 * Service Worker Activation
 * Clean up old caches and set up alarms
 */
self.addEventListener('activate', async () => {
  console.log('CURRENT extension activated');

  // Ensure we have fresh rates and proper scheduling
  await scheduleNextUpdate();
});

/**
 * Initialize extension with default settings and check for rates
 */
async function initializeExtension() {
    try {
        // Check if we have cached rates
        const {exchangeRates, lastUpdated} = await browser.storage.local.get([
            'exchangeRates',
            'lastUpdated'
        ]);

        // if no rates or stale rates, fetch immediately
        if (!exchangeRates || isDataStale(lastUpdated)) {
            console.log('No cached rates or stale data, fetching fresh rates');
            await fetchAndCacheRates();
        }

        // Set up default preferences if they don't exist
        const { baseCurrency } = await broswer.storage.local.get('baseCurrency');
        if (!baseCurrency) {
            await browser.storage.local.set({ baseCurrency: 'EUR' });
            console.log('Default base currency set to EUR');
        }

    } catch (error) {
        console.error('Failed to initialize extension: ', error);
    }
}

/**
 * Check if cached data is stale (older than 24 hours)
 */
function isFataStale(lastUpdated) {
    if (!lastUpdated) return true; // No data means stale

    const now = Date.now();
    const lastUpdateTime = new Date(lastUpdated).getTime();
    const hoursSinceLastUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);

    return hoursSinceLastUpdate > CACHE_DURATION_HOURS;
}

/**
 * Schedule the next update alarm
 * Targets 4:30 PM CET (30 minutes after ECB updates)
 */
async function scheduleNextUpdate() {
    // Clear existing alarm
    await browser.alarms.clear(UPDATE_ALARM_NAME);

    // Calculate next 4:30 PM CET
    const now = new Date();
    const targetTime = getNext430PMCET();
  
    console.log(`Scheduling next update for: ${targetTime.toISOString()}`);
  
  // Create alarm for target time, then repeat every 24 hours
    await browser.alarms.create(UPDATE_ALARM_NAME, {
    when: targetTime.getTime(),
    periodInMinutes: 24 * 60 // 24 hours
  });
}

/**
 * Calculate next 4:30 PM Central European Time
 */
function getNext430PMCET() {
  const now = new Date();
  
  // Create date for today at 4:30 PM CET
  // Note: This is a simplified approach. In production, consider daylight saving time
  const targetTime = new Date();
  targetTime.setHours(16, 30, 0, 0); // 4:30 PM
  
  // If it's already past 4:30 PM today, schedule for tomorrow
  if (now >= targetTime) {
    targetTime.setDate(targetTime.getDate() + 1);
  }
  
  return targetTime;
}
