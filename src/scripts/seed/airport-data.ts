import { executeQuery, getConnection } from '../../lib/db';
import { RowDataPacket, OkPacket } from 'mysql2';

interface Country extends RowDataPacket {
  id: number;
  name: string;
  code: string;
}

interface City {
  id: number;
  country_id: number;
  name: string;
  timezone: string;
}

interface Airport {
  city_id: number;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
}

/**
 * Seed countries data
 */
async function seedCountries(): Promise<Map<string, number>> {
  console.log('Seeding countries data...');
  
  // Country data: name, ISO code
  const countriesData = [
    // Indian Subcontinent
    { name: 'India', code: 'IN' },
    { name: 'Pakistan', code: 'PK' },
    { name: 'Bangladesh', code: 'BD' },
    { name: 'Sri Lanka', code: 'LK' },
    { name: 'Nepal', code: 'NP' },
    
    // Middle East
    { name: 'United Arab Emirates', code: 'AE' },
    { name: 'Saudi Arabia', code: 'SA' },
    { name: 'Qatar', code: 'QA' },
    { name: 'Bahrain', code: 'BH' },
    { name: 'Oman', code: 'OM' },
    { name: 'Israel', code: 'IL' },
    
    // Southeast Asia
    { name: 'Singapore', code: 'SG' },
    { name: 'Malaysia', code: 'MY' },
    { name: 'Thailand', code: 'TH' },
    { name: 'Indonesia', code: 'ID' },
    { name: 'Philippines', code: 'PH' },
    { name: 'Vietnam', code: 'VN' },
    
    // East Asia
    { name: 'China', code: 'CN' },
    { name: 'Japan', code: 'JP' },
    { name: 'South Korea', code: 'KR' },
    { name: 'Hong Kong', code: 'HK' },
    
    // Europe
    { name: 'United Kingdom', code: 'GB' },
    { name: 'France', code: 'FR' },
    { name: 'Germany', code: 'DE' },
    { name: 'Italy', code: 'IT' },
    { name: 'Spain', code: 'ES' },
    { name: 'Netherlands', code: 'NL' },
    { name: 'Switzerland', code: 'CH' },
    { name: 'Sweden', code: 'SE' },
    { name: 'Norway', code: 'NO' },
    { name: 'Denmark', code: 'DK' },
    { name: 'Ireland', code: 'IE' },
    { name: 'Portugal', code: 'PT' },
    { name: 'Greece', code: 'GR' },
    { name: 'Austria', code: 'AT' },
    { name: 'Belgium', code: 'BE' },
    
    // North America
    { name: 'United States', code: 'US' },
    { name: 'Canada', code: 'CA' },
    { name: 'Mexico', code: 'MX' },
    
    // South America
    { name: 'Brazil', code: 'BR' },
    { name: 'Argentina', code: 'AR' },
    { name: 'Colombia', code: 'CO' },
    { name: 'Peru', code: 'PE' },
    { name: 'Chile', code: 'CL' },
    
    // Oceania
    { name: 'Australia', code: 'AU' },
    { name: 'New Zealand', code: 'NZ' },
    
    // Africa
    { name: 'South Africa', code: 'ZA' },
    { name: 'Egypt', code: 'EG' },
    { name: 'Morocco', code: 'MA' },
    { name: 'Kenya', code: 'KE' },
    { name: 'Nigeria', code: 'NG' },
    { name: 'Ethiopia', code: 'ET' },
  ];
  
  // Map to store country_id by country code
  const countryMap = new Map<string, number>();
  
  // Check which countries already exist
  const existingCountries = await executeQuery<Country[]>(
    'SELECT id, code FROM countries'
  );
  
  // Add existing countries to the map
  existingCountries.forEach(country => {
    countryMap.set(country.code, country.id);
  });
  
  // Insert countries that don't exist yet
  for (const country of countriesData) {
    if (!countryMap.has(country.code)) {
      // For INSERT, the result is OkPacket or ResultSetHeader, not Country[]
      // Let's use a more appropriate type or 'any' if the structure is not critical here.
      // OkPacket is a good choice for insert results.
      const result = await executeQuery<OkPacket>(
        'INSERT INTO countries (name, code) VALUES (?, ?)',
        [country.name, country.code]
      );
      
      // OkPacket has insertId
      if (result && result.insertId) {
        countryMap.set(country.code, result.insertId);
        console.log(`Added country: ${country.name}`);
      }
    }
  }
  
  console.log(`Total countries: ${countryMap.size}`);
  return countryMap;
}

/**
 * Seed cities data
 */
async function seedCities(countryMap: Map<string, number>): Promise<Map<string, number>> {
  console.log('Seeding cities data...');
  
  // City data: country code, name, timezone
  const citiesData = [
    // India (more cities for Indian emphasis)
    { country_code: 'IN', name: 'Delhi', timezone: 'Asia/Kolkata' },
    { country_code: 'IN', name: 'Mumbai', timezone: 'Asia/Kolkata' },
    { country_code: 'IN', name: 'Bangalore', timezone: 'Asia/Kolkata' },
    { country_code: 'IN', name: 'Chennai', timezone: 'Asia/Kolkata' },
    { country_code: 'IN', name: 'Hyderabad', timezone: 'Asia/Kolkata' },
    { country_code: 'IN', name: 'Kolkata', timezone: 'Asia/Kolkata' },
    { country_code: 'IN', name: 'Ahmedabad', timezone: 'Asia/Kolkata' },
    { country_code: 'IN', name: 'Pune', timezone: 'Asia/Kolkata' },
    { country_code: 'IN', name: 'Jaipur', timezone: 'Asia/Kolkata' },
    { country_code: 'IN', name: 'Lucknow', timezone: 'Asia/Kolkata' },
    { country_code: 'IN', name: 'Kochi', timezone: 'Asia/Kolkata' },
    { country_code: 'IN', name: 'Goa', timezone: 'Asia/Kolkata' },
    { country_code: 'IN', name: 'Trivandrum', timezone: 'Asia/Kolkata' },
    { country_code: 'IN', name: 'Guwahati', timezone: 'Asia/Kolkata' },
    { country_code: 'IN', name: 'Amritsar', timezone: 'Asia/Kolkata' },
    
    // Pakistan
    { country_code: 'PK', name: 'Karachi', timezone: 'Asia/Karachi' },
    { country_code: 'PK', name: 'Lahore', timezone: 'Asia/Karachi' },
    { country_code: 'PK', name: 'Islamabad', timezone: 'Asia/Karachi' },
    
    // Bangladesh
    { country_code: 'BD', name: 'Dhaka', timezone: 'Asia/Dhaka' },
    { country_code: 'BD', name: 'Chittagong', timezone: 'Asia/Dhaka' },
    
    // Sri Lanka
    { country_code: 'LK', name: 'Colombo', timezone: 'Asia/Colombo' },
    
    // Nepal
    { country_code: 'NP', name: 'Kathmandu', timezone: 'Asia/Kathmandu' },
    
    // Middle East
    { country_code: 'AE', name: 'Dubai', timezone: 'Asia/Dubai' },
    { country_code: 'AE', name: 'Abu Dhabi', timezone: 'Asia/Dubai' },
    { country_code: 'SA', name: 'Riyadh', timezone: 'Asia/Riyadh' },
    { country_code: 'SA', name: 'Jeddah', timezone: 'Asia/Riyadh' },
    { country_code: 'QA', name: 'Doha', timezone: 'Asia/Qatar' },
    { country_code: 'BH', name: 'Manama', timezone: 'Asia/Bahrain' },
    { country_code: 'OM', name: 'Muscat', timezone: 'Asia/Muscat' },
    { country_code: 'IL', name: 'Tel Aviv', timezone: 'Asia/Jerusalem' },
    
    // Southeast Asia
    { country_code: 'SG', name: 'Singapore', timezone: 'Asia/Singapore' },
    { country_code: 'MY', name: 'Kuala Lumpur', timezone: 'Asia/Kuala_Lumpur' },
    { country_code: 'TH', name: 'Bangkok', timezone: 'Asia/Bangkok' },
    { country_code: 'ID', name: 'Jakarta', timezone: 'Asia/Jakarta' },
    { country_code: 'ID', name: 'Bali', timezone: 'Asia/Makassar' },
    { country_code: 'PH', name: 'Manila', timezone: 'Asia/Manila' },
    { country_code: 'VN', name: 'Ho Chi Minh City', timezone: 'Asia/Ho_Chi_Minh' },
    { country_code: 'VN', name: 'Hanoi', timezone: 'Asia/Ho_Chi_Minh' },
    
    // East Asia
    { country_code: 'CN', name: 'Beijing', timezone: 'Asia/Shanghai' },
    { country_code: 'CN', name: 'Shanghai', timezone: 'Asia/Shanghai' },
    { country_code: 'CN', name: 'Guangzhou', timezone: 'Asia/Shanghai' },
    { country_code: 'JP', name: 'Tokyo', timezone: 'Asia/Tokyo' },
    { country_code: 'JP', name: 'Osaka', timezone: 'Asia/Tokyo' },
    { country_code: 'KR', name: 'Seoul', timezone: 'Asia/Seoul' },
    { country_code: 'HK', name: 'Hong Kong', timezone: 'Asia/Hong_Kong' },
    
    // Europe
    { country_code: 'GB', name: 'London', timezone: 'Europe/London' },
    { country_code: 'FR', name: 'Paris', timezone: 'Europe/Paris' },
    { country_code: 'DE', name: 'Frankfurt', timezone: 'Europe/Berlin' },
    { country_code: 'DE', name: 'Munich', timezone: 'Europe/Berlin' },
    { country_code: 'IT', name: 'Rome', timezone: 'Europe/Rome' },
    { country_code: 'IT', name: 'Milan', timezone: 'Europe/Rome' },
    { country_code: 'ES', name: 'Madrid', timezone: 'Europe/Madrid' },
    { country_code: 'ES', name: 'Barcelona', timezone: 'Europe/Madrid' },
    { country_code: 'NL', name: 'Amsterdam', timezone: 'Europe/Amsterdam' },
    { country_code: 'CH', name: 'Zurich', timezone: 'Europe/Zurich' },
    { country_code: 'CH', name: 'Geneva', timezone: 'Europe/Zurich' },
    { country_code: 'SE', name: 'Stockholm', timezone: 'Europe/Stockholm' },
    { country_code: 'NO', name: 'Oslo', timezone: 'Europe/Oslo' },
    { country_code: 'DK', name: 'Copenhagen', timezone: 'Europe/Copenhagen' },
    { country_code: 'IE', name: 'Dublin', timezone: 'Europe/Dublin' },
    { country_code: 'PT', name: 'Lisbon', timezone: 'Europe/Lisbon' },
    { country_code: 'GR', name: 'Athens', timezone: 'Europe/Athens' },
    { country_code: 'AT', name: 'Vienna', timezone: 'Europe/Vienna' },
    { country_code: 'BE', name: 'Brussels', timezone: 'Europe/Brussels' },
    
    // North America
    { country_code: 'US', name: 'New York', timezone: 'America/New_York' },
    { country_code: 'US', name: 'Los Angeles', timezone: 'America/Los_Angeles' },
    { country_code: 'US', name: 'Chicago', timezone: 'America/Chicago' },
    { country_code: 'US', name: 'San Francisco', timezone: 'America/Los_Angeles' },
    { country_code: 'US', name: 'Miami', timezone: 'America/New_York' },
    { country_code: 'US', name: 'Dallas', timezone: 'America/Chicago' },
    { country_code: 'US', name: 'Houston', timezone: 'America/Chicago' },
    { country_code: 'US', name: 'Seattle', timezone: 'America/Los_Angeles' },
    { country_code: 'US', name: 'Atlanta', timezone: 'America/New_York' },
    { country_code: 'CA', name: 'Toronto', timezone: 'America/Toronto' },
    { country_code: 'CA', name: 'Vancouver', timezone: 'America/Vancouver' },
    { country_code: 'CA', name: 'Montreal', timezone: 'America/Montreal' },
    { country_code: 'MX', name: 'Mexico City', timezone: 'America/Mexico_City' },
    
    // South America
    { country_code: 'BR', name: 'Sao Paulo', timezone: 'America/Sao_Paulo' },
    { country_code: 'BR', name: 'Rio de Janeiro', timezone: 'America/Sao_Paulo' },
    { country_code: 'AR', name: 'Buenos Aires', timezone: 'America/Argentina/Buenos_Aires' },
    { country_code: 'CO', name: 'Bogota', timezone: 'America/Bogota' },
    { country_code: 'PE', name: 'Lima', timezone: 'America/Lima' },
    { country_code: 'CL', name: 'Santiago', timezone: 'America/Santiago' },
    
    // Oceania
    { country_code: 'AU', name: 'Sydney', timezone: 'Australia/Sydney' },
    { country_code: 'AU', name: 'Melbourne', timezone: 'Australia/Melbourne' },
    { country_code: 'AU', name: 'Brisbane', timezone: 'Australia/Brisbane' },
    { country_code: 'NZ', name: 'Auckland', timezone: 'Pacific/Auckland' },
    
    // Africa
    { country_code: 'ZA', name: 'Johannesburg', timezone: 'Africa/Johannesburg' },
    { country_code: 'ZA', name: 'Cape Town', timezone: 'Africa/Johannesburg' },
    { country_code: 'EG', name: 'Cairo', timezone: 'Africa/Cairo' },
    { country_code: 'MA', name: 'Casablanca', timezone: 'Africa/Casablanca' },
    { country_code: 'KE', name: 'Nairobi', timezone: 'Africa/Nairobi' },
    { country_code: 'NG', name: 'Lagos', timezone: 'Africa/Lagos' },
    { country_code: 'ET', name: 'Addis Ababa', timezone: 'Africa/Addis_Ababa' },
  ];
  
  // Map to store city_id by country_code and city name
  const cityMap = new Map<string, number>();
  
  // Check which cities already exist
  // Define CityRow extending RowDataPacket if not already done, or use an inline type
  interface CityRow extends RowDataPacket { id: number; country_id: number; name: string; }
  const existingCities = await executeQuery<CityRow[]>(
    'SELECT id, country_id, name FROM cities'
  );
  
  // Create a map of existing cities
  const existingCityMap = new Map<string, number>();
  existingCities.forEach(city => {
    const key = `${city.country_id}-${city.name}`;
    existingCityMap.set(key, city.id);
  });
  
  // Insert cities that don't exist yet
  for (const city of citiesData) {
    const countryId = countryMap.get(city.country_code);
    
    if (countryId) {
      const key = `${countryId}-${city.name}`;
      
      if (!existingCityMap.has(key)) {
        const result = await executeQuery<OkPacket>(
          'INSERT INTO cities (country_id, name, timezone) VALUES (?, ?, ?)',
          [countryId, city.name, city.timezone]
        );
        
        if (result && result.insertId) {
          cityMap.set(`${city.country_code}-${city.name}`, result.insertId);
          console.log(`Added city: ${city.name}, ${city.country_code}`);
        }
      } else {
        // Store the existing city id in our cityMap
        cityMap.set(`${city.country_code}-${city.name}`, existingCityMap.get(key)!);
      }
    }
  }
  
  console.log(`Total cities processed: ${cityMap.size}`);
  return cityMap;
}

/**
 * Seed airports data
 */
async function seedAirports(cityMap: Map<string, number>): Promise<void> {
  console.log('Seeding airports data...');
  
  // Airport data: country code, city name, airport name, IATA code, lat, long
  const airportsData = [
    // India (more airports for Indian emphasis)
    { country_code: 'IN', city_name: 'Delhi', name: 'Indira Gandhi International Airport', code: 'DEL', latitude: 28.5561, longitude: 77.0994 },
    { country_code: 'IN', city_name: 'Mumbai', name: 'Chhatrapati Shivaji Maharaj International Airport', code: 'BOM', latitude: 19.0896, longitude: 72.8656 },
    { country_code: 'IN', city_name: 'Bangalore', name: 'Kempegowda International Airport', code: 'BLR', latitude: 13.1986, longitude: 77.7066 },
    { country_code: 'IN', city_name: 'Chennai', name: 'Chennai International Airport', code: 'MAA', latitude: 12.9941, longitude: 80.1709 },
    { country_code: 'IN', city_name: 'Hyderabad', name: 'Rajiv Gandhi International Airport', code: 'HYD', latitude: 17.2403, longitude: 78.4294 },
    { country_code: 'IN', city_name: 'Kolkata', name: 'Netaji Subhas Chandra Bose International Airport', code: 'CCU', latitude: 22.6547, longitude: 88.4467 },
    { country_code: 'IN', city_name: 'Ahmedabad', name: 'Sardar Vallabhbhai Patel International Airport', code: 'AMD', latitude: 23.0735, longitude: 72.6347 },
    { country_code: 'IN', city_name: 'Pune', name: 'Pune International Airport', code: 'PNQ', latitude: 18.5793, longitude: 73.9089 },
    { country_code: 'IN', city_name: 'Jaipur', name: 'Jaipur International Airport', code: 'JAI', latitude: 26.8242, longitude: 75.8122 },
    { country_code: 'IN', city_name: 'Lucknow', name: 'Chaudhary Charan Singh International Airport', code: 'LKO', latitude: 26.7606, longitude: 80.8893 },
    { country_code: 'IN', city_name: 'Kochi', name: 'Cochin International Airport', code: 'COK', latitude: 10.1517, longitude: 76.3922 },
    { country_code: 'IN', city_name: 'Goa', name: 'Goa International Airport', code: 'GOI', latitude: 15.3808, longitude: 73.8314 },
    { country_code: 'IN', city_name: 'Trivandrum', name: 'Trivandrum International Airport', code: 'TRV', latitude: 8.4822, longitude: 76.9200 },
    { country_code: 'IN', city_name: 'Guwahati', name: 'Lokpriya Gopinath Bordoloi International Airport', code: 'GAU', latitude: 26.1061, longitude: 91.5864 },
    { country_code: 'IN', city_name: 'Amritsar', name: 'Sri Guru Ram Dass Jee International Airport', code: 'ATQ', latitude: 31.7096, longitude: 74.7973 },
    
    // Pakistan
    { country_code: 'PK', city_name: 'Karachi', name: 'Jinnah International Airport', code: 'KHI', latitude: 24.9006, longitude: 67.1683 },
    { country_code: 'PK', city_name: 'Lahore', name: 'Allama Iqbal International Airport', code: 'LHE', latitude: 31.5217, longitude: 74.4037 },
    { country_code: 'PK', city_name: 'Islamabad', name: 'Islamabad International Airport', code: 'ISB', latitude: 33.6162, longitude: 73.0996 },
    
    // Bangladesh
    { country_code: 'BD', city_name: 'Dhaka', name: 'Hazrat Shahjalal International Airport', code: 'DAC', latitude: 23.8431, longitude: 90.4008 },
    { country_code: 'BD', city_name: 'Chittagong', name: 'Shah Amanat International Airport', code: 'CGP', latitude: 22.2495, longitude: 91.8131 },
    
    // Sri Lanka
    { country_code: 'LK', city_name: 'Colombo', name: 'Bandaranaike International Airport', code: 'CMB', latitude: 7.1808, longitude: 79.8841 },
    
    // Nepal
    { country_code: 'NP', city_name: 'Kathmandu', name: 'Tribhuvan International Airport', code: 'KTM', latitude: 27.6981, longitude: 85.3592 },
    
    // Middle East
    { country_code: 'AE', city_name: 'Dubai', name: 'Dubai International Airport', code: 'DXB', latitude: 25.2528, longitude: 55.3644 },
    { country_code: 'AE', city_name: 'Abu Dhabi', name: 'Abu Dhabi International Airport', code: 'AUH', latitude: 24.4428, longitude: 54.6511 },
    { country_code: 'SA', city_name: 'Riyadh', name: 'King Khalid International Airport', code: 'RUH', latitude: 24.9578, longitude: 46.6992 },
    { country_code: 'SA', city_name: 'Jeddah', name: 'King Abdulaziz International Airport', code: 'JED', latitude: 21.6790, longitude: 39.1572 },
    { country_code: 'QA', city_name: 'Doha', name: 'Hamad International Airport', code: 'DOH', latitude: 25.2609, longitude: 51.6138 },
    { country_code: 'BH', city_name: 'Manama', name: 'Bahrain International Airport', code: 'BAH', latitude: 26.2707, longitude: 50.6336 },
    { country_code: 'OM', city_name: 'Muscat', name: 'Muscat International Airport', code: 'MCT', latitude: 23.5933, longitude: 58.2844 },
    { country_code: 'IL', city_name: 'Tel Aviv', name: 'Ben Gurion Airport', code: 'TLV', latitude: 32.0114, longitude: 34.8866 },
    
    // Southeast Asia
    { country_code: 'SG', city_name: 'Singapore', name: 'Singapore Changi Airport', code: 'SIN', latitude: 1.3644, longitude: 103.9915 },
    { country_code: 'MY', city_name: 'Kuala Lumpur', name: 'Kuala Lumpur International Airport', code: 'KUL', latitude: 2.7456, longitude: 101.7099 },
    { country_code: 'TH', city_name: 'Bangkok', name: 'Suvarnabhumi Airport', code: 'BKK', latitude: 13.6900, longitude: 100.7501 },
    { country_code: 'ID', city_name: 'Jakarta', name: 'Soekarno-Hatta International Airport', code: 'CGK', latitude: -6.1275, longitude: 106.6537 },
    { country_code: 'ID', city_name: 'Bali', name: 'Ngurah Rai International Airport', code: 'DPS', latitude: -8.7467, longitude: 115.1667 },
    { country_code: 'PH', city_name: 'Manila', name: 'Ninoy Aquino International Airport', code: 'MNL', latitude: 14.5086, longitude: 121.0197 },
    { country_code: 'VN', city_name: 'Ho Chi Minh City', name: 'Tan Son Nhat International Airport', code: 'SGN', latitude: 10.8188, longitude: 106.6519 },
    { country_code: 'VN', city_name: 'Hanoi', name: 'Noi Bai International Airport', code: 'HAN', latitude: 21.2187, longitude: 105.8041 },
    
    // East Asia
    { country_code: 'CN', city_name: 'Beijing', name: 'Beijing Capital International Airport', code: 'PEK', latitude: 40.0799, longitude: 116.6031 },
    { country_code: 'CN', city_name: 'Shanghai', name: 'Shanghai Pudong International Airport', code: 'PVG', latitude: 31.1443, longitude: 121.8083 },
    { country_code: 'CN', city_name: 'Guangzhou', name: 'Guangzhou Baiyun International Airport', code: 'CAN', latitude: 23.3959, longitude: 113.3080 },
    { country_code: 'JP', city_name: 'Tokyo', name: 'Narita International Airport', code: 'NRT', latitude: 35.7647, longitude: 140.3863 },
    { country_code: 'JP', city_name: 'Tokyo', name: 'Tokyo Haneda Airport', code: 'HND', latitude: 35.5494, longitude: 139.7798 },
    { country_code: 'JP', city_name: 'Osaka', name: 'Kansai International Airport', code: 'KIX', latitude: 34.4375, longitude: 135.2440 },
    { country_code: 'KR', city_name: 'Seoul', name: 'Incheon International Airport', code: 'ICN', latitude: 37.4602, longitude: 126.4407 },
    { country_code: 'HK', city_name: 'Hong Kong', name: 'Hong Kong International Airport', code: 'HKG', latitude: 22.3080, longitude: 113.9185 },
    
    // Europe
    { country_code: 'GB', city_name: 'London', name: 'Heathrow Airport', code: 'LHR', latitude: 51.4700, longitude: -0.4543 },
    { country_code: 'GB', city_name: 'London', name: 'Gatwick Airport', code: 'LGW', latitude: 51.1537, longitude: -0.1821 },
    { country_code: 'FR', city_name: 'Paris', name: 'Charles de Gaulle Airport', code: 'CDG', latitude: 49.0097, longitude: 2.5479 },
    { country_code: 'DE', city_name: 'Frankfurt', name: 'Frankfurt Airport', code: 'FRA', latitude: 50.0379, longitude: 8.5622 },
    { country_code: 'DE', city_name: 'Munich', name: 'Munich Airport', code: 'MUC', latitude: 48.3537, longitude: 11.7860 },
    { country_code: 'IT', city_name: 'Rome', name: 'Leonardo da Vinci–Fiumicino Airport', code: 'FCO', latitude: 41.8003, longitude: 12.2389 },
    { country_code: 'IT', city_name: 'Milan', name: 'Milan Malpensa Airport', code: 'MXP', latitude: 45.6306, longitude: 8.7281 },
    { country_code: 'ES', city_name: 'Madrid', name: 'Adolfo Suárez Madrid–Barajas Airport', code: 'MAD', latitude: 40.4983, longitude: -3.5676 },
    { country_code: 'ES', city_name: 'Barcelona', name: 'Barcelona–El Prat Airport', code: 'BCN', latitude: 41.2974, longitude: 2.0833 },
    { country_code: 'NL', city_name: 'Amsterdam', name: 'Amsterdam Airport Schiphol', code: 'AMS', latitude: 52.3105, longitude: 4.7683 },
    { country_code: 'CH', city_name: 'Zurich', name: 'Zurich Airport', code: 'ZRH', latitude: 47.4582, longitude: 8.5556 },
    { country_code: 'CH', city_name: 'Geneva', name: 'Geneva Airport', code: 'GVA', latitude: 46.2370, longitude: 6.1089 },
    { country_code: 'SE', city_name: 'Stockholm', name: 'Stockholm Arlanda Airport', code: 'ARN', latitude: 59.6519, longitude: 17.9186 },
    { country_code: 'NO', city_name: 'Oslo', name: 'Oslo Airport, Gardermoen', code: 'OSL', latitude: 60.1976, longitude: 11.1004 },
    { country_code: 'DK', city_name: 'Copenhagen', name: 'Copenhagen Airport', code: 'CPH', latitude: 55.6180, longitude: 12.6560 },
    { country_code: 'IE', city_name: 'Dublin', name: 'Dublin Airport', code: 'DUB', latitude: 53.4213, longitude: -6.2700 },
    { country_code: 'PT', city_name: 'Lisbon', name: 'Lisbon Airport', code: 'LIS', latitude: 38.7742, longitude: -9.1342 },
    { country_code: 'GR', city_name: 'Athens', name: 'Athens International Airport', code: 'ATH', latitude: 37.9364, longitude: 23.9445 },
    { country_code: 'AT', city_name: 'Vienna', name: 'Vienna International Airport', code: 'VIE', latitude: 48.1102, longitude: 16.5697 },
    { country_code: 'BE', city_name: 'Brussels', name: 'Brussels Airport', code: 'BRU', latitude: 50.9014, longitude: 4.4844 },
    
    // North America
    { country_code: 'US', city_name: 'New York', name: 'John F. Kennedy International Airport', code: 'JFK', latitude: 40.6413, longitude: -73.7781 },
    { country_code: 'US', city_name: 'New York', name: 'Newark Liberty International Airport', code: 'EWR', latitude: 40.6925, longitude: -74.1687 },
    { country_code: 'US', city_name: 'Los Angeles', name: 'Los Angeles International Airport', code: 'LAX', latitude: 33.9416, longitude: -118.4085 },
    { country_code: 'US', city_name: 'Chicago', name: "Chicago O'Hare International Airport", code: 'ORD', latitude: 41.9742, longitude: -87.9073 },
    { country_code: 'US', city_name: 'San Francisco', name: 'San Francisco International Airport', code: 'SFO', latitude: 37.6213, longitude: -122.3790 },
    { country_code: 'US', city_name: 'Miami', name: 'Miami International Airport', code: 'MIA', latitude: 25.7932, longitude: -80.2906 },
    { country_code: 'US', city_name: 'Dallas', name: 'Dallas/Fort Worth International Airport', code: 'DFW', latitude: 32.8998, longitude: -97.0403 },
    { country_code: 'US', city_name: 'Houston', name: 'George Bush Intercontinental Airport', code: 'IAH', latitude: 29.9902, longitude: -95.3368 },
    { country_code: 'US', city_name: 'Seattle', name: 'Seattle-Tacoma International Airport', code: 'SEA', latitude: 47.4502, longitude: -122.3088 },
    { country_code: 'US', city_name: 'Atlanta', name: 'Hartsfield-Jackson Atlanta International Airport', code: 'ATL', latitude: 33.6407, longitude: -84.4277 },
    { country_code: 'CA', city_name: 'Toronto', name: 'Toronto Pearson International Airport', code: 'YYZ', latitude: 43.6777, longitude: -79.6248 },
    { country_code: 'CA', city_name: 'Vancouver', name: 'Vancouver International Airport', code: 'YVR', latitude: 49.1967, longitude: -123.1815 },
    { country_code: 'CA', city_name: 'Montreal', name: 'Montréal-Pierre Elliott Trudeau International Airport', code: 'YUL', latitude: 45.4706, longitude: -73.7408 },
    { country_code: 'MX', city_name: 'Mexico City', name: 'Mexico City International Airport', code: 'MEX', latitude: 19.4361, longitude: -99.0719 },
    
    // South America
    { country_code: 'BR', city_name: 'Sao Paulo', name: 'São Paulo/Guarulhos International Airport', code: 'GRU', latitude: -23.4356, longitude: -46.4731 },
    { country_code: 'BR', city_name: 'Rio de Janeiro', name: 'Rio de Janeiro/Galeão International Airport', code: 'GIG', latitude: -22.8100, longitude: -43.2510 },
    { country_code: 'AR', city_name: 'Buenos Aires', name: 'Ministro Pistarini International Airport', code: 'EZE', latitude: -34.8222, longitude: -58.5358 },
    { country_code: 'CO', city_name: 'Bogota', name: 'El Dorado International Airport', code: 'BOG', latitude: 4.7016, longitude: -74.1469 },
    { country_code: 'PE', city_name: 'Lima', name: 'Jorge Chávez International Airport', code: 'LIM', latitude: -12.0219, longitude: -77.1143 },
    { country_code: 'CL', city_name: 'Santiago', name: 'Santiago International Airport', code: 'SCL', latitude: -33.3930, longitude: -70.7858 },
    
    // Oceania
    { country_code: 'AU', city_name: 'Sydney', name: 'Sydney Airport', code: 'SYD', latitude: -33.9399, longitude: 151.1753 },
    { country_code: 'AU', city_name: 'Melbourne', name: 'Melbourne Airport', code: 'MEL', latitude: -37.6690, longitude: 144.8410 },
    { country_code: 'AU', city_name: 'Brisbane', name: 'Brisbane Airport', code: 'BNE', latitude: -27.3942, longitude: 153.1218 },
    { country_code: 'NZ', city_name: 'Auckland', name: 'Auckland Airport', code: 'AKL', latitude: -37.0082, longitude: 174.7850 },
    
    // Africa
    { country_code: 'ZA', city_name: 'Johannesburg', name: 'O. R. Tambo International Airport', code: 'JNB', latitude: -26.1392, longitude: 28.2460 },
    { country_code: 'ZA', city_name: 'Cape Town', name: 'Cape Town International Airport', code: 'CPT', latitude: -33.9649, longitude: 18.6017 },
    { country_code: 'EG', city_name: 'Cairo', name: 'Cairo International Airport', code: 'CAI', latitude: 30.1219, longitude: 31.4056 },
    { country_code: 'MA', city_name: 'Casablanca', name: 'Mohammed V International Airport', code: 'CMN', latitude: 33.3675, longitude: -7.5900 },
    { country_code: 'KE', city_name: 'Nairobi', name: 'Jomo Kenyatta International Airport', code: 'NBO', latitude: -1.3192, longitude: 36.9278 },
    { country_code: 'NG', city_name: 'Lagos', name: 'Murtala Muhammed International Airport', code: 'LOS', latitude: 6.5774, longitude: 3.3214 },
    { country_code: 'ET', city_name: 'Addis Ababa', name: 'Addis Ababa Bole International Airport', code: 'ADD', latitude: 8.9778, longitude: 38.7993 },
  ];
  
  // Check which airports already exist
  interface AirportCodeRow extends RowDataPacket { code: string; }
  const existingAirports = await executeQuery<AirportCodeRow[]>(
    'SELECT code FROM airports'
  );
  
  // Create a set of existing airport codes
  const existingAirportCodes = new Set<string>();
  existingAirports.forEach(airport => {
    existingAirportCodes.add(airport.code);
  });
  
  // Insert airports that don't exist yet
  for (const airport of airportsData) {
    const cityId = cityMap.get(`${airport.country_code}-${airport.city_name}`);
    
    if (cityId && !existingAirportCodes.has(airport.code)) {
      await executeQuery(
        'INSERT INTO airports (city_id, name, code, latitude, longitude, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [cityId, airport.name, airport.code, airport.latitude, airport.longitude, true]
      );
      
      console.log(`Added airport: ${airport.name} (${airport.code})`);
    }
  }
  
  console.log(`Processed ${airportsData.length} airports`);
}

/**
 * Main function to seed all airport-related data
 */
export async function seedAirportData(): Promise<void> {
  try {
    console.log('Starting airport data seeding...');
    
    // Get a connection and start transaction
    const connection = await getConnection();
    await connection.beginTransaction();
    
    try {
      // Seed countries, cities, and airports in sequence
      const countryMap = await seedCountries();
      const cityMap = await seedCities(countryMap);
      await seedAirports(cityMap);
      
      // Commit the transaction
      await connection.commit();
      console.log('Airport data seeding completed successfully');
    } catch (error) {
      // Rollback the transaction on error
      await connection.rollback();
      console.error('Error during airport data seeding, transaction rolled back:', error);
      throw error;
    } finally {
      // Always release the connection
      connection.release();
    }
  } catch (error) {
    console.error('Airport data seeding failed:', error);
    throw error;
  }
}

// Export for use in other scripts
export default seedAirportData;

