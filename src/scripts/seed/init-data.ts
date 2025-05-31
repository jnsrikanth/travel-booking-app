/**
 * Database Initialization and Seeding Script
 * 
 * This script populates the SkyJourney database with initial data:
 * - Global airports and cities
 * - Currency rates and payment methods
 * - Sample flight routes with pricing
 * - Test user accounts and bookings
 * - Initial system settings
 */

import { executeQuery, executeTransaction, getPool, withConnection } from '../../lib/db';
import { batchInsert, insertRecord } from '../../lib/mysql';
import * as bcrypt from 'bcrypt';
import chalk from 'chalk';

// Initialize the DB connection
const pool = getPool();

// Configuration
const SALT_ROUNDS = 10;
const DEFAULT_ADMIN_PASSWORD = 'admin123';
const DEFAULT_USER_PASSWORD = 'password123';

// Logging utility
const log = {
  info: (message: string) => console.log(chalk.blue(`[INFO] ${message}`)),
  success: (message: string) => console.log(chalk.green(`[SUCCESS] ${message}`)),
  warning: (message: string) => console.log(chalk.yellow(`[WARNING] ${message}`)),
  error: (message: string) => console.log(chalk.red(`[ERROR] ${message}`)),
  step: (message: string) => console.log(chalk.cyan(`\n[STEP] ${message}`)),
  progress: (current: number, total: number, message: string) => {
    const percentage = Math.round((current / total) * 100);
    console.log(chalk.magenta(`[${percentage}%] ${message} (${current}/${total})`));
  }
};

/**
 * Main initialization function
 */
async function initializeDatabase() {
  try {
    log.step('Starting database initialization');
    
    // Check database connection
    await checkDatabaseConnection();
    
    // Create tables if they don't exist (this should be done via migrations in a real app)
    // For this demo, we'll assume tables are already created
    
    // Populate countries and cities
    await populateCountriesAndCities();
    
    // Populate airports
    await populateAirports();
    
    // Setup currencies and payment methods
    await setupCurrenciesAndPaymentMethods();
    
    // Create airlines and aircraft
    await createAirlinesAndAircraft();
    
    // Create flight routes
    await createFlightRoutes();
    
    // Generate sample flights
    await generateSampleFlights();
    
    // Create test users
    await createTestUsers();
    
    // Create sample bookings
    await createSampleBookings();
    
    // Configure system settings
    await configureSystemSettings();
    
    log.success('Database initialization completed successfully');
    
    // Close pool
    await pool.end();
    
  } catch (error) {
    log.error(`Database initialization failed: ${error}`);
    
    // Close pool even if there's an error
    try {
      await pool.end();
    } catch (err) {
      log.error(`Failed to close database pool: ${err}`);
    }
    
    process.exit(1);
  }
}

/**
 * Check database connection
 */
async function checkDatabaseConnection() {
  try {
    log.info('Checking database connection...');
    await executeQuery('SELECT 1');
    log.success('Database connection successful');
  } catch (error) {
    log.error(`Database connection failed: ${error}`);
    throw error;
  }
}

/**
 * Populate countries and cities
 */
async function populateCountriesAndCities() {
  try {
    log.step('Populating countries and cities');
    
    // Check if countries already exist
    const existingCountries = await executeQuery<any[]>('SELECT COUNT(*) as count FROM countries');
    if (existingCountries[0].count > 0) {
      log.warning('Countries already exist in the database. Skipping countries and cities creation.');
      return;
    }
    
    // Countries data
    const countries = [
      { code: 'US', name: 'United States' },
      { code: 'IN', name: 'India' },
      { code: 'GB', name: 'United Kingdom' },
      { code: 'AE', name: 'United Arab Emirates' },
      { code: 'SG', name: 'Singapore' },
      { code: 'AU', name: 'Australia' },
      { code: 'CA', name: 'Canada' },
      { code: 'FR', name: 'France' },
      { code: 'DE', name: 'Germany' },
      { code: 'JP', name: 'Japan' },
      { code: 'CN', name: 'China' },
      { code: 'IT', name: 'Italy' },
      { code: 'ES', name: 'Spain' },
      { code: 'NL', name: 'Netherlands' },
      { code: 'TH', name: 'Thailand' },
    ];
    
    log.info(`Inserting ${countries.length} countries...`);
    const countryIds = await batchInsert('countries', countries);
    log.success(`Inserted ${countryIds.length} countries`);
    
    // Map country codes to IDs
    const countryCodeToId = {};
    for (let i = 0; i < countries.length; i++) {
      countryCodeToId[countries[i].code] = countryIds[i];
    }
    
    // Cities data - array of [name, country_code, is_major]
    const citiesData = [
      ['New York', 'US', true],
      ['Los Angeles', 'US', true],
      ['Chicago', 'US', true],
      ['San Francisco', 'US', true],
      ['Miami', 'US', true],
      ['Delhi', 'IN', true],
      ['Mumbai', 'IN', true],
      ['Bangalore', 'IN', true],
      ['Chennai', 'IN', true],
      ['Hyderabad', 'IN', true],
      ['London', 'GB', true],
      ['Manchester', 'GB', true],
      ['Edinburgh', 'GB', true],
      ['Dubai', 'AE', true],
      ['Abu Dhabi', 'AE', true],
      ['Singapore', 'SG', true],
      ['Sydney', 'AU', true],
      ['Melbourne', 'AU', true],
      ['Toronto', 'CA', true],
      ['Vancouver', 'CA', true],
      ['Paris', 'FR', true],
      ['Nice', 'FR', true],
      ['Berlin', 'DE', true],
      ['Munich', 'DE', true],
      ['Tokyo', 'JP', true],
      ['Osaka', 'JP', true],
      ['Shanghai', 'CN', true],
      ['Beijing', 'CN', true],
      ['Rome', 'IT', true],
      ['Milan', 'IT', true],
      ['Madrid', 'ES', true],
      ['Barcelona', 'ES', true],
      ['Amsterdam', 'NL', true],
      ['Bangkok', 'TH', true],
      ['Phuket', 'TH', true],
    ];
    
    // Convert to city objects
    const cities = citiesData.map(([name, countryCode, isMajor]) => ({
      name,
      country_id: countryCodeToId[countryCode as string],
      is_major: isMajor,
    }));
    
    log.info(`Inserting ${cities.length} cities...`);
    const cityIds = await batchInsert('cities', cities);
    log.success(`Inserted ${cityIds.length} cities`);
    
  } catch (error) {
    log.error(`Failed to populate countries and cities: ${error}`);
    throw error;
  }
}

/**
 * Populate airports
 */
async function populateAirports() {
  try {
    log.step('Populating airports');
    
    // Check if airports already exist
    const existingAirports = await executeQuery<any[]>('SELECT COUNT(*) as count FROM airports');
    if (existingAirports[0].count > 0) {
      log.warning('Airports already exist in the database. Skipping airports creation.');
      return;
    }
    
    // Get cities from database to map names to IDs
    const citiesResult = await executeQuery<any[]>('SELECT id, name, country_id FROM cities');
    const cities = citiesResult;
    
    // Map city names to IDs
    const cityNameToId = {};
    cities.forEach(city => {
      cityNameToId[city.name] = city.id;
    });
    
    // Major global airports - [code, name, city_name, latitude, longitude]
    const airportsData = [
      ['JFK', 'John F. Kennedy International Airport', 'New York', 40.6413, -73.7781],
      ['LAX', 'Los Angeles International Airport', 'Los Angeles', 33.9416, -118.4085],
      ['ORD', 'O\'Hare International Airport', 'Chicago', 41.9742, -87.9073],
      ['SFO', 'San Francisco International Airport', 'San Francisco', 37.6213, -122.3790],
      ['MIA', 'Miami International Airport', 'Miami', 25.7932, -80.2906],
      ['DEL', 'Indira Gandhi International Airport', 'Delhi', 28.5562, 77.1000],
      ['BOM', 'Chhatrapati Shivaji Maharaj International Airport', 'Mumbai', 19.0896, 72.8656],
      ['BLR', 'Kempegowda International Airport', 'Bangalore', 13.1986, 77.7066],
      ['MAA', 'Chennai International Airport', 'Chennai', 12.9941, 80.1709],
      ['HYD', 'Rajiv Gandhi International Airport', 'Hyderabad', 17.2403, 78.4294],
      ['LHR', 'Heathrow Airport', 'London', 51.4700, -0.4543],
      ['MAN', 'Manchester Airport', 'Manchester', 53.3537, -2.2750],
      ['EDI', 'Edinburgh Airport', 'Edinburgh', 55.9500, -3.3725],
      ['DXB', 'Dubai International Airport', 'Dubai', 25.2532, 55.3657],
      ['AUH', 'Abu Dhabi International Airport', 'Abu Dhabi', 24.4330, 54.6511],
      ['SIN', 'Singapore Changi Airport', 'Singapore', 1.3644, 103.9915],
      ['SYD', 'Sydney Airport', 'Sydney', -33.9399, 151.1753],
      ['MEL', 'Melbourne Airport', 'Melbourne', -37.6690, 144.8410],
      ['YYZ', 'Toronto Pearson International Airport', 'Toronto', 43.6777, -79.6248],
      ['YVR', 'Vancouver International Airport', 'Vancouver', 49.1967, -123.1815],
      ['CDG', 'Charles de Gaulle Airport', 'Paris', 49.0097, 2.5479],
      ['NCE', 'Nice Côte d\'Azur Airport', 'Nice', 43.6584, 7.2167],
      ['TXL', 'Berlin Tegel Airport', 'Berlin', 52.5548, 13.2925],
      ['MUC', 'Munich Airport', 'Munich', 48.3537, 11.7750],
      ['HND', 'Tokyo Haneda Airport', 'Tokyo', 35.5494, 139.7798],
      ['KIX', 'Kansai International Airport', 'Osaka', 34.4320, 135.2302],
      ['PVG', 'Shanghai Pudong International Airport', 'Shanghai', 31.1443, 121.8083],
      ['PEK', 'Beijing Capital International Airport', 'Beijing', 40.0799, 116.6031],
      ['FCO', 'Leonardo da Vinci International Airport', 'Rome', 41.8045, 12.2508],
      ['MXP', 'Milan Malpensa Airport', 'Milan', 45.6306, 8.7281],
      ['MAD', 'Adolfo Suárez Madrid–Barajas Airport', 'Madrid', 40.4983, -3.5676],
      ['BCN', 'Josep Tarradellas Barcelona-El Prat Airport', 'Barcelona', 41.3275, 2.0833],
      ['AMS', 'Amsterdam Airport Schiphol', 'Amsterdam', 52.3105, 4.7683],
      ['BKK', 'Suvarnabhumi Airport', 'Bangkok', 13.6900, 100.7501],
      ['HKT', 'Phuket International Airport', 'Phuket', 8.1132, 98.3169],
    ];
    
    // Convert to airport objects
    const airports = [];
    for (const [code, name, cityName, latitude, longitude] of airportsData) {
      const cityId = cityNameToId[cityName];
      if (!cityId) {
        log.warning(`City not found for airport ${code}: ${cityName}`);
        continue;
      }
      
      airports.push({
        code,
        name,
        city_id: cityId,
        latitude,
        longitude,
        is_international: true,
        is_active: true,
      });
    }
    
    log.info(`Inserting ${airports.length} airports...`);
    const airportIds = await batchInsert('airports', airports);
    log.success(`Inserted ${airportIds.length} airports`);
    
  } catch (error) {
    log.error(`Failed to populate airports: ${error}`);
    throw error;
  }
}

/**
 * Setup currencies and payment methods
 */
async function setupCurrenciesAndPaymentMethods() {
  try {
    log.step('Setting up currencies and payment methods');
    
    // Check if currencies already exist
    const existingCurrencies = await executeQuery<any[]>('SELECT COUNT(*) as count FROM currencies');
    if (existingCurrencies[0].count > 0) {
      log.warning('Currencies already exist in the database. Skipping currencies creation.');
    } else {
      // Currencies data - [code, name, symbol, exchange_rate_to_usd]
      const currenciesData = [
        ['USD', 'US Dollar', '$', 1.0],
        ['EUR', 'Euro', '€', 0.85],
        ['GBP', 'British Pound', '£', 0.72],
        ['INR', 'Indian Rupee', '₹', 74.5],
        ['AED', 'UAE Dirham', 'د.إ', 3.67],
        ['SGD', 'Singapore Dollar', 'S$', 1.34],
        ['AUD', 'Australian Dollar', 'A$', 1.35],
        ['CAD', 'Canadian Dollar', 'C$', 1.25],
        ['JPY', 'Japanese Yen', '¥', 110.42],
        ['CNY', 'Chinese Yuan', '¥', 6.45],
      ];
      
      // Convert to currency objects
      const currencies = currenciesData.map(([code, name, symbol, exchangeRate]) => ({
        code,
        name,
        symbol,
        exchange_rate_to_usd: exchangeRate,
        is_active: true,
        last_updated: new Date(),
      }));
      
      log.info(`Inserting ${currencies.length} currencies...`);
      const currencyIds = await batchInsert('currencies', currencies);
      log.success(`Inserted ${currencyIds.length} currencies`);
    }
    
    // Check if payment methods already exist
    const existingPaymentMethods = await executeQuery<any[]>('SELECT COUNT(*) as count FROM payment_methods');
    if (existingPaymentMethods[0].count > 0) {
      log.warning('Payment methods already exist in the database. Skipping payment methods creation.');
    } else {
      // Payment methods data - [name, description, is_card_based, processing_fee_percentage]
      const paymentMethodsData = [
        ['Credit Card', 'Visa, MasterCard, American Express, Discover', true, 2.5],
        ['Debit Card', 'Visa Debit, MasterCard Debit', true, 1.5],
        ['PayPal', 'Online payment system', false, 3.0],
        ['Bank Transfer', 'Direct bank transfer / ACH / Wire', false, 0.5],
        ['Apple Pay', 'Mobile payment via Apple devices', true, 2.0],
        ['Google Pay', 'Mobile payment via Google', true, 2.0],
        ['Cryptocurrency', 'Bitcoin, Ethereum, and other cryptocurrencies', false, 1.0],
        ['Net Banking', 'Direct payment via bank portal', false, 1.0],
        ['UPI', 'Unified Payments Interface', false, 0.5],
      ];
      
      // Convert to payment method objects
      const paymentMethods = paymentMethodsData.map(([name, description, isCardBased, processingFee]) => ({
        name,
        description,
        is_card_based: isCardBased,
        processing_fee_percentage: processingFee,
        is_active: true,
      }));
      
      log.info(`Inserting ${paymentMethods.length} payment methods...`);
      const paymentMethodIds = await batchInsert('payment_methods', paymentMethods);
      log.success(`Inserted ${paymentMethodIds.length} payment methods`);
    }
    
  } catch (error) {
    log.error(`Failed to setup currencies and payment methods: ${error}`);
    throw error;
  }
}

/**
 * Create airlines and aircraft
 */
async function createAirlinesAndAircraft() {
  try {
    log.step('Creating airlines and aircraft');
    
    // Check if airlines already exist
    const existingAirlines = await executeQuery<any[]>('SELECT COUNT(*) as count FROM airlines');
    if (existingAirlines[0].count > 0) {
      log.warning('Airlines already exist in the database. Skipping airlines creation.');
    } else {
      // Airlines data - [code, name, country_code, logo_url]
      const airlinesData = [
        ['UA', 'United Airlines', 'US', '/images/airlines/united.png'],
        ['AA', 'American Airlines', 'US', '/images/airlines/american.png'],
        ['DL', 'Delta Air Lines', 'US', '/images/airlines/delta.png'],
        ['AI', 'Air India', 'IN', '/images/airlines/airindia.png'],
        ['6E', 'IndiGo', 'IN', '/images/airlines/indigo.png'],
        ['UK', 'Vistara', 'IN', '/images/airlines/vistara.png'],
        ['BA', 'British Airways', 'GB', '/images/airlines/british.png'],
        ['VS', 'Virgin Atlantic', 'GB', '/images/airlines/virgin.png'],
        ['EK', 'Emirates', 'AE', '/images/airlines/emirates.png'],
        ['EY', 'Etihad Airways', 'AE', '/images/airlines/etihad.png'],
        ['SQ', 'Singapore Airlines', 'SG', '/images/airlines/singapore.png'],
        ['QF', 'Qantas', 'AU', '/images/airlines/qantas.png'],
        ['AC', 'Air Canada', 'CA', '/images/airlines/aircanada.png'],
        ['AF', 'Air France', 'FR', '/images/airlines/airfrance.png'],
        ['LH', 'Lufthansa', 'DE', '/images/airlines/lufthansa.png'],
        ['NH', 'All Nippon Airways', 'JP', '/images/airlines/ana.png'],
        ['CA', 'Air China', 'CN', '/images/airlines/airchina.png'],
        ['AZ', 'Alitalia', 'IT', '/images/airlines/alitalia.png'],
        ['IB', 'Iberia', 'ES', '/images/airlines/iberia.png'],
        ['KL', 'KLM', 'NL', '/images/airlines/klm.png'],
        ['TG', 'Thai Airways', 'TH', '/images/airlines/thai.png'],
      ];
      
      // Get country IDs
      const countriesResult = await executeQuery<any[]>('SELECT id, code FROM countries');
      const countryCodeToId = {};
      countriesResult.forEach(country => {
        countryCodeToId[country.code] = country.id;
      });
      
      // Convert to airline objects
      const airlines = [];
      for (const [code, name, countryCode, logoUrl] of airlinesData) {
        const countryId = countryCodeToId[countryCode];
        if (!countryId) {
          log.warning(`Country not found for airline ${code}: ${countryCode}`);
          continue;
        }
        
        airlines.push({
          code,
          name,
          country_id: countryId,
          logo_url: logoUrl,
          is_active: true,
        });
      }
      
      log.info(`Inserting ${airlines.length} airlines...`);
      const airlineIds = await batchInsert('airlines', airlines);
      log.success(`Inserted ${airlineIds.length} airlines`);
    }
    
    // Check if aircraft already exist
    const existingAircraft = await executeQuery<any[]>('SELECT COUNT(*) as count FROM aircraft');
    if (existingAircraft[0].count > 0) {
      log.warning('Aircraft already exist in the database. Skipping aircraft creation.');
    } else {
      // Aircraft data - [model, manufacturer, capacity_economy, capacity_business, capacity_first]
      const aircraftData = [
        ['Boeing 737-800', 'Boeing', 162, 16, 0],
        ['Boeing 787-9', 'Boeing', 250, 48, 12],
        ['Boeing 777-300ER', 'Boeing', 350, 48, 8],
        ['Airbus A320', 'Airbus', 150, 12, 0],
        ['Airbus A330-300', 'Airbus', 285, 40, 0],
        ['Airbus A350-900', 'Airbus', 300, 36, 8],
        ['Airbus A380', 'Airbus', 420, 76, 14],
        ['Bombardier Q400', 'Bombardier', 78, 0, 0],
        ['Embraer E190', 'Embraer', 100, 0, 0],
      ];
      
      // Convert to aircraft objects
      const aircraft = aircraftData.map(([model, manufacturer, capacityEconomy, capacityBusiness, capacityFirst]) => ({
        model,
        manufacturer,
        capacity_economy: capacityEconomy,
        capacity_business: capacityBusiness,
        capacity_first: capacityFirst,
        is_active: true,
      }));
      
      log.info(`Inserting ${aircraft.length} aircraft...`);
      const aircraftIds = await batchInsert('aircraft', aircraft);
      log.success(`Inserted ${aircraftIds.length} aircraft`);
    }
    
  } catch (error) {
    log.error(`Failed to create airlines and aircraft: ${error}`);
    throw error;
  }
}

/**
 * Create flight routes
 */
async function createFlightRoutes() {
  try {
    log.step('Creating flight routes');
    
    // Check if routes already exist
    const existingRoutes = await executeQuery<any[]>('SELECT COUNT(*) as count FROM routes');
    if (existingRoutes[0].count > 0) {
      log.warning('Routes already exist in the database. Skipping routes creation.');
      return;
    }
    
    // Get airports from database
    const airportsResult = await executeQuery<any[]>('SELECT id, code FROM airports');
    const airportCodeToId = {};
    airportsResult.forEach(airport => {
      airportCodeToId[airport.code] = airport.id;
    });
    
    // Popular routes - [origin_code, destination_code, distance_km, flight_time_minutes]
    const routesData = [
      // US Domestic
      ['JFK', 'LAX', 3983, 360],
      ['LAX', 'JFK', 3983, 330], // Return routes may have different times due to winds
      ['JFK', 'SFO', 4154, 365],
      ['SFO', 'JFK', 4154, 335],
      ['LAX', 'SFO', 544, 90],
      ['SFO', 'LAX', 544, 85],
      ['JFK', 'MIA', 1757, 180],
      ['MIA', 'JFK', 1757, 190],
      
      // India Domestic
      ['DEL', 'BOM', 1148, 120],
      ['BOM', 'DEL', 1148, 130],
      ['BLR', 'DEL', 1740, 160],
      ['DEL', 'BLR', 1740, 170],
      ['BOM', 'BLR', 842, 90],
      ['BLR', 'BOM', 842, 95],
      ['HYD', 'DEL', 1253, 130],
      ['DEL', 'HYD', 1253, 140],
      
      // UK Domestic
      ['LHR', 'EDI', 534, 80],
      ['EDI', 'LHR', 534, 85],
      ['LHR', 'MAN', 263, 60],
      ['MAN', 'LHR', 263, 65],
      
      // UAE
      ['DXB', 'AUH', 120, 45],
      ['AUH', 'DXB', 120, 45],
      
      // International Long Haul
      ['JFK', 'LHR', 5541, 420],
      ['LHR', 'JFK', 5541, 450],
      ['JFK', 'DEL', 11370, 810],
      ['DEL', 'JFK', 11370, 850],
      ['LHR', 'SIN', 10841, 780],
      ['SIN', 'LHR', 10841, 840],
      ['SIN', 'SYD', 6291, 480],
      ['SYD', 'SIN', 6291, 510],
      ['LAX', 'SYD', 12051, 840],
      ['SYD', 'LAX', 12051, 780],
      ['DEL', 'DXB', 2185, 195],
      ['DXB', 'DEL', 2185, 190],
      ['LHR', 'DXB', 5495, 420],
      ['DXB', 'LHR', 5495, 460],
      ['CDG', 'JFK', 5834, 460],
      ['JFK', 'CDG', 5834, 430],
      ['HND', 'SIN', 5316, 420],
      ['SIN', 'HND', 5316, 400],
      ['HND', 'LAX', 8773, 630],
      ['LAX', 'HND', 8773, 660],
      ['SIN', 'BKK', 1418, 150],
      ['BKK', 'SIN', 1418, 145],
    ];
    
    // Convert to route objects
    const routes = [];
    for (const [originCode, destinationCode, distanceKm, flightTimeMinutes] of routesData) {
      const originId = airportCodeToId[originCode];
      const destinationId = airportCodeToId[destinationCode];
      
      if (!originId || !destinationId) {
        log.warning(`Airport not found for route ${originCode}-${destinationCode}`);
        continue;
      }
      
      routes.push({
        origin_airport_id: originId,
        destination_airport_id: destinationId,
        distance_km: distanceKm,
        flight_time_minutes: flightTimeMinutes,
        is_active: true,
      });
    }
    
    log.info(`Inserting ${routes.length} routes...`);
    const routeIds = await batchInsert('routes', routes);
    log.success(`Inserted ${routeIds.length} routes`);
    
  } catch (error) {
    log.error(`Failed to create flight routes: ${error}`);
    throw error;
  }
}

/**
 * Generate sample flights
 */
async function generateSampleFlights() {
  try {
    log.step('Generating sample flights');
    
    // Check if flights already exist
    const existingFlights = await executeQuery<any[]>('SELECT COUNT(*) as count FROM flights');
    if (existingFlights[0].count > 0) {
      log.warning('Flights already exist in the database. Skipping flights creation.');
      return;
    }
    
    // Get routes from database
    const routesResult = await executeQuery<any[]>('SELECT id, origin_airport_id, destination_airport_id, flight_time_minutes FROM routes');
    
    // Get airports for code lookup
    const airportsResult = await executeQuery<any[]>('SELECT id, code FROM airports');
    const airportIdToCode = {};
    airportsResult.forEach(airport => {
      airportIdToCode[airport.id] = airport.code;
    });
    
    // Get airlines
    const airlinesResult = await executeQuery<any[]>('SELECT id, code FROM airlines');
    const airlines = airlinesResult;
    
    // Get aircraft
    const aircraftResult = await executeQuery<any[]>('SELECT id, model FROM aircraft');
    const aircraft = aircraftResult;
    
    // Create flights for the next 60 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 60);
    
    const flights = [];
    const flightFares = [];
    const flightSchedules = [];
    
    // For each route, create flights
    for (const route of routesResult) {
      // Origin and destination airport codes for flight number
      const originCode = airportIdToCode[route.origin_airport_id];
      const destCode = airportIdToCode[route.destination_airport_id];
      
      // Assign random airline and aircraft to this route
      const airline = airlines[Math.floor(Math.random() * airlines.length)];
      const selectedAircraft = aircraft[Math.floor(Math.random() * aircraft.length)];
      
      // Determine frequency (1-3 flights per day)
      const frequency = Math.floor(Math.random() * 3) + 1;
      
      // Create flight departures at different times
      const departureTimes = [];
      if (frequency >= 1) departureTimes.push('08:00:00');
      if (frequency >= 2) departureTimes.push('14:30:00');
      if (frequency >= 3) departureTimes.push('19:45:00');
      
      // For each day in the range
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // For each departure time
        for (const departureTime of departureTimes) {
          // Generate flight number
          const flightNumber = `${airline.code}${100 + Math.floor(Math.random() * 900)}`;
          
          // Create flight record
          const flight = {
            flight_number: flightNumber,
            airline_id: airline.id,
            route_id: route.id,
            aircraft_id: selectedAircraft.id,
            departure_time: `${dateStr} ${departureTime}`,
            arrival_time: calculateArrivalTime(dateStr, departureTime, route.flight_time_minutes),
            status: 'Scheduled',
            is_active: true,
          };
          
          const flightId = await insertRecord('flights', flight);
          flights.push(flightId);
          
          // Generate fare classes for this flight
          await generateFareClasses(flightId);
          
          // Create flight schedule
          flightSchedules.push({
            flight_id: flightId,
            day_of_week: currentDate.getDay(), // 0-6, 0 is Sunday
            departure_time: departureTime,
            is_active: true,
          });
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      log.progress(flights.length, routesResult.length * frequency * 60, 'Generating flights');
    }
    
    log.success(`Generated ${flights.length} flights`);
    
  } catch (error) {
    log.error(`Failed to generate sample flights: ${error}`);
    throw error;
  }
}

/**
 * Helper function to calculate arrival time
 */
function calculateArrivalTime(dateStr: string, departureTime: string, flightTimeMinutes: number) {
  const departureDateTime = new Date(`${dateStr}T${departureTime}`);
  const arrivalDateTime = new Date(departureDateTime.getTime() + flightTimeMinutes * 60000);
  return arrivalDateTime.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Generate fare classes for a flight
 */
async function generateFareClasses(flightId: number) {
  try {
    // Get base flight information to calculate fares
    const flightResult = await executeQuery<any[]>(
      `SELECT f.id, r.distance_km, a.code as airline_code, ac.model, ac.capacity_economy, ac.capacity_business, ac.capacity_first
       FROM flights f
       JOIN routes r ON f.route_id = r.id
       JOIN airlines a ON f.airline_id = a.id
       JOIN aircraft ac ON f.aircraft_id = ac.id
       WHERE f.id = ?`,
      [flightId]
    );
    
    if (flightResult.length === 0) {
      log.warning(`Flight not found: ${flightId}`);
      return;
    }
    
    const flight = flightResult[0];
    
    // Calculate base prices based on distance
    const distanceKm = flight.distance_km;
    const basePriceEconomy = calculateBaseFare(distanceKm, 'economy');
    const basePriceBusiness = calculateBaseFare(distanceKm, 'business');
    const basePriceFirst = calculateBaseFare(distanceKm, 'first');
    
    // Get fare classes
    const fareClassesResult = await executeQuery<any[]>('SELECT id, name, class_type FROM fare_classes');
    
    // Create fare entries for this flight
    const flightFares = [];
    
    for (const fareClass of fareClassesResult) {
      let basePrice = 0;
      let availableSeats = 0;
      
      // Set price and available seats based on class type
      switch (fareClass.class_type) {
        case 'economy':
          basePrice = basePriceEconomy;
          availableSeats = flight.capacity_economy;
          
          // Apply multiplier based on specific fare class
          if (fareClass.name === 'Economy Basic') {
            basePrice *= 0.8;
          } else if (fareClass.name === 'Economy Flex') {
            basePrice *= 1.2;
          }
          break;
          
        case 'business':
          basePrice = basePriceBusiness;
          availableSeats = flight.capacity_business;
          
          // Apply multiplier based on specific fare class
          if (fareClass.name === 'Business Basic') {
            basePrice *= 0.9;
          } else if (fareClass.name === 'Business Flex') {
            basePrice *= 1.1;
          }
          break;
          
        case 'first':
          basePrice = basePriceFirst;
          availableSeats = flight.capacity_first;
          break;
      }
      
      // Skip if no seats available for this class
      if (availableSeats <= 0) continue;
      
      // Create flight fare
      flightFares.push({
        flight_id: flightId,
        fare_class_id: fareClass.id,
        base_price: basePrice,
        available_seats: availableSeats,
        is_refundable: fareClass.name.includes('Flex'),
        is_changeable: fareClass.name.includes('Flex'),
        change_fee: fareClass.name.includes('Flex') ? 0 : Math.round(basePrice * 0.1),
        cancellation_fee: fareClass.name.includes('Flex') ? 0 : Math.round(basePrice * 0.2),
        baggage_allowance_kg: fareClass.class_type === 'economy' ? 23 : (fareClass.class_type === 'business' ? 32 : 40),
        meal_service: fareClass.class_type !== 'economy' || fareClass.name.includes('Flex'),
        seat_selection: fareClass.class_type !== 'economy' || fareClass.name.includes('Flex'),
        priority_boarding: fareClass.class_type !== 'economy',
        lounge_access: fareClass.class_type !== 'economy',
      });
    }
    
    // Insert flight fares
    if (flightFares.length > 0) {
      await batchInsert('flight_fares', flightFares);
    }
    
  } catch (error) {
    log.error(`Failed to generate fare classes for flight ${flightId}: ${error}`);
    throw error;
  }
}

/**
 * Calculate base fare based on distance and class
 */
function calculateBaseFare(distanceKm: number, classType: string) {
  let baseFare = 0;
  
  // Base calculation
  if (distanceKm < 500) {
    baseFare = 50 + (distanceKm * 0.15);
  } else if (distanceKm < 1000) {
    baseFare = 100 + (distanceKm * 0.12);
  } else if (distanceKm < 3000) {
    baseFare = 200 + (distanceKm * 0.10);
  } else if (distanceKm < 6000) {
    baseFare = 300 + (distanceKm * 0.08);
  } else {
    baseFare = 500 + (distanceKm * 0.07);
  }
  
  // Apply class multiplier
  if (classType === 'business') {
    baseFare *= 2.5;
  } else if (classType === 'first') {
    baseFare *= 4;
  }
  
  // Add randomness (±10%)
  const randomFactor = 0.9 + (Math.random() * 0.2);
  baseFare *= randomFactor;
  
  // Round to nearest integer
  return Math.round(baseFare);
}

/**
 * Create test users
 */
async function createTestUsers() {
  try {
    log.step('Creating test users');
    
    // Check if users already exist
    const existingUsers = await executeQuery<any[]>('SELECT COUNT(*) as count FROM users');
    if (existingUsers[0].count > 0) {
      log.warning('Users already exist in the database. Skipping users creation.');
      return;
    }
    
    // Create admin user
    const adminPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, SALT_ROUNDS);
    const adminUserId = await insertRecord('users', {
      email: 'admin@skyjourney.com',
      password: adminPassword,
      role: 'admin',
      status: 'active',
      email_verified: true,
      phone_number: '+1234567890',
      created_at: new Date(),
      last_login: new Date(),
    });
    
    await insertRecord('user_profiles', {
      user_id: adminUserId,
      first_name: 'Admin',
      last_name: 'User',
      date_of_birth: '1985-01-01',
      gender: 'male',
      address_line1: '123 Admin Street',
      city: 'New York',
      state: 'NY',
      postal_code: '10001',
      country: 'US',
      preferred_language: 'en',
      profile_image: '/images/avatar-placeholder.png',
    });
    
    log.success('Created admin user');
    
    // Create regular test users
    const testUsers = [
      {
        email: 'john.doe@example.com',
        first_name: 'John',
        last_name: 'Doe',
        gender: 'male',
        date_of_birth: '1990-05-15',
        country: 'US',
      },
      {
        email: 'jane.smith@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        gender: 'female',
        date_of_birth: '1985-08-22',
        country: 'GB',
      },
      {
        email: 'raj.kumar@example.com',
        first_name: 'Raj',
        last_name: 'Kumar',
        gender: 'male',
        date_of_birth: '1988-03-10',
        country: 'IN',
      },
      {
        email: 'priya.sharma@example.com',
        first_name: 'Priya',
        last_name: 'Sharma',
        gender: 'female',
        date_of_birth: '1992-11-28',
        country: 'IN',
      },
      {
        email: 'ahmed.ali@example.com',
        first_name: 'Ahmed',
        last_name: 'Ali',
        gender: 'male',
        date_of_birth: '1987-07-17',
        country: 'AE',
      },
    ];
    
    for (const testUser of testUsers) {
      const password = await bcrypt.hash(DEFAULT_USER_PASSWORD, SALT_ROUNDS);
      const userId = await insertRecord('users', {
        email: testUser.email,
        password,
        role: 'user',
        status: 'active',
        email_verified: true,
        created_at: new Date(),
        last_login: new Date(),
      });
      
      await insertRecord('user_profiles', {
        user_id: userId,
        first_name: testUser.first_name,
        last_name: testUser.last_name,
        date_of_birth: testUser.date_of_birth,
        gender: testUser.gender,
        country: testUser.country,
        preferred_language: 'en',
        profile_image: '/images/avatar-placeholder.png',
      });
    }
    
    log.success(`Created ${testUsers.length} test users`);
    
  } catch (error) {
    log.error(`Failed to create test users: ${error}`);
    throw error;
  }
}

/**
 * Create sample bookings
 */
async function createSampleBookings() {
  try {
    log.step('Creating sample bookings');
    
    // Check if bookings already exist
    const existingBookings = await executeQuery<any[]>('SELECT COUNT(*) as count FROM bookings');
    if (existingBookings[0].count > 0) {
      log.warning('Bookings already exist in the database. Skipping bookings creation.');
      return;
    }
    
    // Get users
    const usersResult = await executeQuery<any[]>(
      `SELECT u.id, u.email, p.first_name, p.last_name 
       FROM users u 
       JOIN user_profiles p ON u.id = p.user_id 
       WHERE u.role = 'user'`
    );
    
    if (usersResult.length === 0) {
      log.warning('No users found. Skipping bookings creation.');
      return;
    }
    
    // Get flights for the next 30 days
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);
    
    const flightsResult = await executeQuery<any[]>(
      `SELECT f.id, f.flight_number, f.departure_time, f.arrival_time, 
              r.origin_airport_id, r.destination_airport_id,
              o.code as origin_code, d.code as destination_code,
              ff.id as fare_id, ff.base_price, fc.name as fare_class, fc.class_type
       FROM flights f
       JOIN routes r ON f.route_id = r.id
       JOIN airports o ON r.origin_airport_id = o.id
       JOIN airports d ON r.destination_airport_id = d.id
       JOIN flight_fares ff ON f.id = ff.flight_id
       JOIN fare_classes fc ON ff.fare_class_id = fc.id
       WHERE f.departure_time BETWEEN ? AND ?
       AND f.status = 'Scheduled'
       AND ff.available_seats > 0
       ORDER BY f.departure_time`,
      [today.toISOString().slice(0, 19).replace('T', ' '), thirtyDaysLater.toISOString().slice(0, 19).replace('T', ' ')]
    );
    
    if (flightsResult.length === 0) {
      log.warning('No flights found. Skipping bookings creation.');
      return;
    }
    
    // Get payment methods
    const paymentMethodsResult = await executeQuery<any[]>('SELECT id, name FROM payment_methods WHERE is_active = true');
    
    if (paymentMethodsResult.length === 0) {
      log.warning('No payment methods found. Skipping bookings creation.');
      return;
    }
    
    // Get booking statuses
    const bookingStatusesResult = await executeQuery<any[]>('SELECT id, name FROM booking_status');
    
    if (bookingStatusesResult.length === 0) {
      log.warning('No booking statuses found. Skipping bookings creation.');
      return;
    }
    
    // Create 20 sample bookings
    const bookings = [];
    const bookingFlights = [];
    const passengers = [];
    const passengerSeats = [];
    const payments = [];
    
    for (let i = 0; i < 20; i++) {
      // Select a random user
      const user = usersResult[Math.floor(Math.random() * usersResult.length)];
      
      // Select a random flight
      const flight = flightsResult[Math.floor(Math.random() * flightsResult.length)];
      
      // Select a random payment method
      const paymentMethod = paymentMethodsResult[Math.floor(Math.random() * paymentMethodsResult.length)];
      
      // Select a random status (mostly confirmed)
      const randomStatusIndex = Math.random() < 0.8 ? 0 : Math.floor(Math.random() * bookingStatusesResult.length);
      const bookingStatus = bookingStatusesResult[randomStatusIndex];
      
      // Generate booking reference
      const bookingReference = generateBookingReference();
      
      // Create booking
      const bookingDate = new Date();
      bookingDate.setDate(today.getDate() - Math.floor(Math.random() * 10)); // Random date in the past 10 days
      
      const booking = {
        user_id: user.id,
        reference: bookingReference,
        status_id: bookingStatus.id,
        booking_date: bookingDate,
        total_amount: flight.base_price, // Will be updated later with passenger count
        currency_code: 'USD',
        contact_email: user.email,
        contact_phone: '+1234567890',
        notes: '',
        is_round_trip: false,
      };
      
      const bookingId = await insertRecord('bookings', booking);
      bookings.push(bookingId);
      
      // Create booking_flights
      await insertRecord('booking_flights', {
        booking_id: bookingId,
        flight_id: flight.id,
        fare_id: flight.fare_id,
      });
      
      // Generate 1-3 passengers
      const passengerCount = Math.floor(Math.random() * 3) + 1;
      let totalAmount = 0;
      
      for (let j = 0; j < passengerCount; j++) {
        // Create passenger
        const isMainPassenger = j === 0;
        const firstName = isMainPassenger ? user.first_name : `Guest${j}`;
        const lastName = isMainPassenger ? user.last_name : user.last_name;
        
        const passenger = {
          booking_id: bookingId,
          first_name: firstName,
          last_name: lastName,
          date_of_birth: '1990-01-01', // Placeholder
          nationality: 'US',
          passport_number: isMainPassenger ? 'P12345678' : `P${Math.floor(Math.random() * 10000000)}`,
          passport_expiry: '2030-01-01', // Placeholder
          phone_number: '+1234567890',
          email: isMainPassenger ? user.email : `guest${j}@example.com`,
          is_main_passenger: isMainPassenger,
        };
        
        const passengerId = await insertRecord('passengers', passenger);
        passengers.push(passengerId);
        
        // Assign a random seat
        const seatRow = Math.floor(Math.random() * 30) + 1;
        const seatLetter = String.fromCharCode(65 + Math.floor(Math.random() * 6)); // A-F
        
        await insertRecord('passenger_seats', {
          passenger_id: passengerId,
          flight_id: flight.id,
          seat_number: `${seatRow}${seatLetter}`,
          seat_type: flight.class_type,
          is_emergency_exit: Math.random() < 0.1,
          is_aisle: seatLetter === 'C' || seatLetter === 'D',
          is_window: seatLetter === 'A' || seatLetter === 'F',
        });
        
        // Add to total amount
        totalAmount += flight.base_price;
      }
      
      // Update booking with total amount
      await executeQuery(
        'UPDATE bookings SET total_amount = ? WHERE id = ?',
        [totalAmount, bookingId]
      );
      
      // Create payment
      await insertRecord('payments', {
        booking_id: bookingId,
        payment_method_id: paymentMethod.id,
        amount: totalAmount,
        currency_code: 'USD',
        payment_date: bookingDate,
        status: 'completed',
        transaction_id: `TXN${Math.floor(Math.random() * 1000000)}`,
      });
    }
    
    log.success(`Created ${bookings.length} sample bookings`);
    
  } catch (error) {
    log.error(`Failed to create sample bookings: ${error}`);
    throw error;
  }
}

/**
 * Generate a random booking reference
 */
function generateBookingReference() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar looking characters
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

/**
 * Configure system settings
 */
async function configureSystemSettings() {
  try {
    log.step('Configuring system settings');
    
    // Check if settings already exist
    const existingSettings = await executeQuery<any[]>('SELECT COUNT(*) as count FROM system_settings');
    if (existingSettings[0].count > 0) {
      log.warning('System settings already exist in the database. Skipping settings configuration.');
      return;
    }
    
    // System settings to configure
    const settings = [
      {
        key: 'site_name',
        value: 'SkyJourney',
        description: 'Name of the website',
        is_public: true,
      },
      {
        key: 'site_description',
        value: 'Global flight booking platform',
        description: 'Description of the website',
        is_public: true,
      },
      {
        key: 'contact_email',
        value: 'support@skyjourney.com',
        description: 'Contact email address',
        is_public: true,
      },
      {
        key: 'contact_phone',
        value: '+1-800-SKY-JOURNEY',
        description: 'Contact phone number',
        is_public: true,
      },
      {
        key: 'default_currency',
        value: 'USD',
        description: 'Default currency for the website',
        is_public: true,
      },
      {
        key: 'supported_currencies',
        value: 'USD,EUR,GBP,INR,AED,SGD,AUD,CAD,JPY,CNY',
        description: 'Comma-separated list of supported currencies',
        is_public: true,
      },
      {
        key: 'default_language',
        value: 'en',
        description: 'Default language for the website',
        is_public: true,
      },
      {
        key: 'supported_languages',
        value: 'en,es,fr,de,zh,ja,ar,hi',
        description: 'Comma-separated list of supported languages',
        is_public: true,
      },
      {
        key: 'booking_expiry_minutes',
        value: '30',
        description: 'Number of minutes before an unpaid booking expires',
        is_public: false,
      },
      {
        key: 'max_passengers_per_booking',
        value: '9',
        description: 'Maximum number of passengers allowed per booking',
        is_public: true,
      },
      {
        key: 'enable_seat_selection',
        value: 'true',
        description: 'Whether seat selection is enabled',
        is_public: true,
      },
      {
        key: 'enable_online_check_in',
        value: 'true',
        description: 'Whether online check-in is enabled',
        is_public: true,
      },
      {
        key: 'check_in_hours_before',
        value: '48',
        description: 'Number of hours before flight when check-in becomes available',
        is_public: true,
      },
      {
        key: 'baggage_allowance_economy',
        value: '23',
        description: 'Default baggage allowance in kg for economy class',
        is_public: true,
      },
      {
        key: 'baggage_allowance_business',
        value: '32',
        description: 'Default baggage allowance in kg for business class',
        is_public: true,
      },
      {
        key: 'baggage_allowance_first',
        value: '40',
        description: 'Default baggage allowance in kg for first class',
        is_public: true,
      },
      {
        key: 'enable_loyalty_program',
        value: 'true',
        description: 'Whether the loyalty program is enabled',
        is_public: true,
      },
      {
        key: 'loyalty_points_per_currency',
        value: '10',
        description: 'Number of loyalty points earned per currency unit spent',
        is_public: true,
      },
      {
        key: 'maintenance_mode',
        value: 'false',
        description: 'Whether the site is in maintenance mode',
        is_public: false,
      },
      {
        key: 'analytics_tracking_id',
        value: 'UA-XXXXXXXXX-X',
        description: 'Google Analytics tracking ID',
        is_public: false,
      },
    ];
    
    log.info(`Inserting ${settings.length} system settings...`);
    const settingIds = await batchInsert('system_settings', settings);
    log.success(`Inserted ${settingIds.length} system settings`);
    
  } catch (error) {
    log.error(`Failed to configure system settings: ${error}`);
    throw error;
  }
}

// Run the database initialization
initializeDatabase()
  .then(() => {
    log.success('All database initialization tasks completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    log.error(`Database initialization failed: ${error}`);
    process.exit(1);
  });

