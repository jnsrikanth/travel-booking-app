// Use require instead of import for scripts
const db = require('../lib/db');
const { getPool, closePool, executeQuery } = db;

/**
 * Database seeding script
 * Populates the database with initial data
 */
async function seedDatabase() {
  console.log('Starting database seeding...');
  
  try {
    // Insert default booking statuses
    await seedBookingStatuses();
    
    // Insert default payment methods
    await seedPaymentMethods();
    
    // Insert default social auth providers
    await seedSocialAuthProviders();
    
    // Insert sample countries, cities and airports
    await seedLocationData();
    
    // Insert sample airlines and aircraft
    await seedAirlineData();
    
    // Insert sample fare classes
    await seedFareClasses();
    
    // Insert system settings
    await seedSystemSettings();
    
    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

async function seedBookingStatuses() {
  console.log('Seeding booking statuses...');
  
  const statuses = [
    { name: 'pending', description: 'Booking created but payment not confirmed' },
    { name: 'confirmed', description: 'Booking confirmed with successful payment' },
    { name: 'payment_failed', description: 'Payment failed for this booking' },
    { name: 'cancelled', description: 'Booking cancelled by customer or system' },
    { name: 'completed', description: 'Travel completed' },
    { name: 'no_show', description: 'Customer did not show up for the flight' }
  ];
  
  for (const status of statuses) {
    // Check if status already exists
    const existing = await executeQuery(
      'SELECT id FROM booking_status WHERE name = ?',
      [status.name]
    );
    
    if (Array.isArray(existing) && existing.length === 0) {
      await executeQuery(
        'INSERT INTO booking_status (name, description) VALUES (?, ?)',
        [status.name, status.description]
      );
      console.log(`  - Added booking status: ${status.name}`);
    } else {
      console.log(`  - Booking status already exists: ${status.name}`);
    }
  }
}

async function seedPaymentMethods() {
  console.log('Seeding payment methods...');
  
  const methods = [
    { name: 'Credit Card', code: 'credit_card', is_active: true },
    { name: 'Debit Card', code: 'debit_card', is_active: true },
    { name: 'UPI', code: 'upi', is_active: true },
    { name: 'NetBanking', code: 'netbanking', is_active: true },
    { name: 'RazorPay', code: 'razorpay', is_active: true },
    { name: 'PayTM', code: 'paytm', is_active: true },
    { name: 'Google Pay', code: 'gpay', is_active: true },
    { name: 'Amazon Pay', code: 'amazon_pay', is_active: true }
  ];
  
  for (const method of methods) {
    // Check if method already exists
    const existing = await executeQuery(
      'SELECT id FROM payment_methods WHERE code = ?',
      [method.code]
    );
    
    if (Array.isArray(existing) && existing.length === 0) {
      await executeQuery(
        'INSERT INTO payment_methods (name, code, is_active) VALUES (?, ?, ?)',
        [method.name, method.code, method.is_active]
      );
      console.log(`  - Added payment method: ${method.name}`);
    } else {
      console.log(`  - Payment method already exists: ${method.name}`);
    }
  }
}

async function seedSocialAuthProviders() {
  console.log('Seeding social auth providers...');
  
  const providers = [
    { name: 'Google', icon_url: '/images/auth/google.png', is_active: true },
    { name: 'Facebook', icon_url: '/images/auth/facebook.png', is_active: true },
    { name: 'Apple', icon_url: '/images/auth/apple.png', is_active: true }
  ];
  
  for (const provider of providers) {
    // Check if provider already exists
    const existing = await executeQuery(
      'SELECT id FROM social_auth_providers WHERE name = ?',
      [provider.name]
    );
    
    if (Array.isArray(existing) && existing.length === 0) {
      await executeQuery(
        'INSERT INTO social_auth_providers (name, icon_url, is_active) VALUES (?, ?, ?)',
        [provider.name, provider.icon_url, provider.is_active]
      );
      console.log(`  - Added social auth provider: ${provider.name}`);
    } else {
      console.log(`  - Social auth provider already exists: ${provider.name}`);
    }
  }
}

async function seedLocationData() {
  console.log('Seeding location data...');
  
  // India
  const indiaId = await getOrCreateCountry('India', 'IN');
  
  // Cities in India
  const delhiId = await getOrCreateCity(indiaId, 'New Delhi', 'Asia/Kolkata');
  const mumbaiId = await getOrCreateCity(indiaId, 'Mumbai', 'Asia/Kolkata');
  const bangaloreId = await getOrCreateCity(indiaId, 'Bangalore', 'Asia/Kolkata');
  const chennaiId = await getOrCreateCity(indiaId, 'Chennai', 'Asia/Kolkata');
  const hyderabadId = await getOrCreateCity(indiaId, 'Hyderabad', 'Asia/Kolkata');
  const kochiId = await getOrCreateCity(indiaId, 'Kochi', 'Asia/Kolkata');
  
  // Airports in India
  await getOrCreateAirport(delhiId, 'Indira Gandhi International Airport', 'DEL', 28.5561, 77.0994);
  await getOrCreateAirport(mumbaiId, 'Chhatrapati Shivaji Maharaj International Airport', 'BOM', 19.0896, 72.8656);
  await getOrCreateAirport(bangaloreId, 'Kempegowda International Airport', 'BLR', 13.1986, 77.7066);
  await getOrCreateAirport(chennaiId, 'Chennai International Airport', 'MAA', 12.9941, 80.1709);
  await getOrCreateAirport(hyderabadId, 'Rajiv Gandhi International Airport', 'HYD', 17.2403, 78.4294);
  await getOrCreateAirport(kochiId, 'Cochin International Airport', 'COK', 10.1520, 76.3919);
  
  // USA
  const usaId = await getOrCreateCountry('United States', 'US');
  
  // Cities in USA
  const newYorkId = await getOrCreateCity(usaId, 'New York', 'America/New_York');
  const losAngelesId = await getOrCreateCity(usaId, 'Los Angeles', 'America/Los_Angeles');
  
  // Airports in USA
  await getOrCreateAirport(newYorkId, 'John F. Kennedy International Airport', 'JFK', 40.6413, -73.7781);
  await getOrCreateAirport(losAngelesId, 'Los Angeles International Airport', 'LAX', 33.9416, -118.4085);
  
  // UK
  const ukId = await getOrCreateCountry('United Kingdom', 'GB');
  
  // Cities in UK
  const londonId = await getOrCreateCity(ukId, 'London', 'Europe/London');
  
  // Airports in UK
  await getOrCreateAirport(londonId, 'Heathrow Airport', 'LHR', 51.4700, -0.4543);
  
  console.log('Location data seeding completed');
}

async function seedAirlineData() {
  console.log('Seeding airline data...');
  
  const indiaId = await getCountryIdByCode('IN');
  
  // Airlines
  const airlinesData = [
    { name: 'Air India', code: 'AI', logo_url: '/images/airlines/air-india.png', country_id: indiaId },
    { name: 'IndiGo', code: 'IG', logo_url: '/images/airlines/indigo.png', country_id: indiaId },
    { name: 'SpiceJet', code: 'SG', logo_url: '/images/airlines/spicejet.png', country_id: indiaId },
    { name: 'Vistara', code: 'UK', logo_url: '/images/airlines/vistara.png', country_id: indiaId }
  ];
  
  for (const airline of airlinesData) {
    // Check if airline already exists
    const existing = await executeQuery(
      'SELECT id FROM airlines WHERE code = ?',
      [airline.code]
    );
    
    if (Array.isArray(existing) && existing.length === 0) {
      await executeQuery(
        'INSERT INTO airlines (name, code, logo_url, country_id, is_active) VALUES (?, ?, ?, ?, ?)',
        [airline.name, airline.code, airline.logo_url, airline.country_id, true]
      );
      console.log(`  - Added airline: ${airline.name}`);
      
      // Add some aircraft for this airline
      const airlineId = await getAirlineIdByCode(airline.code);
      if (airlineId) {
        await addSampleAircraft(airlineId);
      }
    } else {
      console.log(`  - Airline already exists: ${airline.name}`);
    }
  }
  
  console.log('Airline data seeding completed');
}

async function seedFareClasses() {
  console.log('Seeding fare classes...');
  
  const fareClasses = [
    { 
      name: 'Economy', 
      code: 'ECON', 
      description: 'Standard economy class seating with basic amenities', 
      benefits: JSON.stringify(['Standard seat selection', 'One carry-on bag', 'Complimentary non-alcoholic beverages']) 
    },
    { 
      name: 'Premium Economy', 
      code: 'PREM', 
      description: 'Enhanced economy experience with extra legroom and amenities', 
      benefits: JSON.stringify(['Extra legroom seats', 'Priority boarding', 'One checked bag', 'Premium meal service']) 
    },
    { 
      name: 'Business', 
      code: 'BUS', 
      description: 'Business class with premium service and comfortable seating', 
      benefits: JSON.stringify(['Fully reclining seats', 'Priority check-in and boarding', 'Two checked bags', 'Premium dining', 'Lounge access']) 
    },
    { 
      name: 'First Class', 
      code: 'FIRST', 
      description: 'First class experience with the highest level of comfort and service', 
      benefits: JSON.stringify(['Private suite or pod', 'Lie-flat beds', 'Gourmet dining', 'Premium beverages', 'Exclusive lounge access', 'Chauffeur service']) 
    }
  ];
  
  for (const fareClass of fareClasses) {
    // Check if fare class already exists
    const existing = await executeQuery(
      'SELECT id FROM fare_classes WHERE code = ?',
      [fareClass.code]
    );
    
    if (Array.isArray(existing) && existing.length === 0) {
      await executeQuery(
        'INSERT INTO fare_classes (name, code, description, benefits, is_active) VALUES (?, ?, ?, ?, ?)',
        [fareClass.name, fareClass.code, fareClass.description, fareClass.benefits, true]
      );
      console.log(`  - Added fare class: ${fareClass.name}`);
    } else {
      console.log(`  - Fare class already exists: ${fareClass.name}`);
    }
  }
}

async function seedSystemSettings() {
  console.log('Seeding system settings...');
  
  const settings = [
    { 
      setting_key: 'default_currency', 
      setting_value: 'INR', 
      description: 'Default currency for prices and transactions' 
    },
    { 
      setting_key: 'baggage_price_per_kg', 
      setting_value: '500', 
      description: 'Default price per kg for excess baggage in INR' 
    },
    { 
      setting_key: 'advance_booking_days', 
      setting_value: '365', 
      description: 'Maximum number of days in advance for booking' 
    },
    { 
      setting_key: 'default_search_results_limit', 
      setting_value: '20', 
      description: 'Default number of results to show in search' 
    },
    { 
      setting_key: 'loyalty_points_per_inr', 
      setting_value: '10', 
      description: 'Loyalty points earned per INR spent' 
    },
    { 
      setting_key: 'maintenance_mode', 
      setting_value: 'false', 
      description: 'Whether the system is in maintenance mode' 
    }
  ];
  
  for (const setting of settings) {
    // Check if setting already exists
    const existing = await executeQuery(
      'SELECT id FROM system_settings WHERE setting_key = ?',
      [setting.setting_key]
    );
    
    if (Array.isArray(existing) && existing.length === 0) {
      await executeQuery(
        'INSERT INTO system_settings (setting_key, setting_value, description) VALUES (?, ?, ?)',
        [setting.setting_key, setting.setting_value, setting.description]
      );
      console.log(`  - Added system setting: ${setting.setting_key}`);
    } else {
      console.log(`  - System setting already exists: ${setting.setting_key}`);
    }
  }
}

// Helper functions for seeding

async function getOrCreateCountry(name: string, code: string): Promise<number> {
  const existing = await executeQuery('SELECT id FROM countries WHERE code = ?', [code]);
  
  if (Array.isArray(existing) && existing.length > 0) {
    return existing[0].id;
  }
  
  const result = await executeQuery(
    'INSERT INTO countries (name, code) VALUES (?, ?)',
    [name, code]
  );
  
  console.log(`  - Added country: ${name}`);
  return result.insertId;
}

async function getOrCreateCity(countryId: number, name: string, timezone: string): Promise<number> {
  const existing = await executeQuery(
    'SELECT id FROM cities WHERE name = ? AND country_id = ?', 
    [name, countryId]
  );
  
  if (Array.isArray(existing) && existing.length > 0) {
    return existing[0].id;
  }
  
  const result = await executeQuery(
    'INSERT INTO cities (country_id, name, timezone) VALUES (?, ?, ?)',
    [countryId, name, timezone]
  );
  
  console.log(`  - Added city: ${name}`);
  return result.insertId;
}

async function getOrCreateAirport(
  cityId: number, 
  name: string, 
  code: string, 
  latitude: number, 
  longitude: number
): Promise<number> {
  const existing = await executeQuery('SELECT id FROM airports WHERE code = ?', [code]);
  
  if (Array.isArray(existing) && existing.length > 0) {
    return existing[0].id;
  }
  
  const result = await executeQuery(
    'INSERT INTO airports (city_id, name, code, latitude, longitude, is_active) VALUES (?, ?, ?, ?, ?, ?)',
    [cityId, name, code, latitude, longitude, true]
  );
  
  console.log(`  - Added airport: ${name} (${code})`);
  return result.insertId;
}

async function getCountryIdByCode(code: string): Promise<number> {
  const result = await executeQuery('SELECT id FROM countries WHERE code = ?', [code]);
  
  if (Array.isArray(result) && result.length > 0) {
    return result[0].id;
  }
  
  throw new Error(`Country with code ${code} not found`);
}

async function getAirlineIdByCode(code: string): Promise<number | null> {
  const result = await executeQuery('SELECT id FROM airlines WHERE code = ?', [code]);
  
  if (Array.isArray(result) && result.length > 0) {
    return result[0].id;
  }
  
  return null;
}

async function addSampleAircraft(airlineId: number): Promise<void> {
  const models = [
    { model: 'Boeing 737-800', seats: 189 },
    { model: 'Airbus A320-200', seats: 180 },
    { model: 'Boeing 787-9 Dreamliner', seats: 280 },
    { model: 'Airbus A321neo', seats: 220 }
  ];
  
  for (let i = 0; i < 2; i++) {
    const randomModel = models[Math.floor(Math.random() * models.length)];
    const regNumber = `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const existing = await executeQuery(
      'SELECT id FROM aircraft WHERE registration_number = ?',
      [regNumber]
    );
    
    if (Array.isArray(existing) && existing.length === 0) {
      await executeQuery(
        'INSERT INTO aircraft (airline_id, model, registration_number, total_seats, manufacturing_year, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [airlineId, randomModel.model, regNumber, randomModel.seats, 2015 + Math.floor(Math.random() * 8), true]
      );
      console.log(`  - Added aircraft: ${randomModel.model} (${regNumber})`);
    }
  }
}

// Run the seeding
seedDatabase();

