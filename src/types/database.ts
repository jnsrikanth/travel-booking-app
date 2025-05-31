import { RowDataPacket } from 'mysql2';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  statusCode: number;
  errorCode?: string;
  details?: any;
  
  constructor(message: string, statusCode: number = 500, errorCode?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
    this.errorCode = errorCode;
    this.details = details;
  }
}

/**
 * Database connection error
 */
export class DatabaseConnectionError extends ApiError {
  constructor(message: string = 'Database connection failed', details?: any) {
    super(message, 503, 'DB_CONNECTION_ERROR', details);
    this.name = 'DatabaseConnectionError';
  }
}

/**
 * Database query error
 */
export class DatabaseQueryError extends ApiError {
  constructor(message: string = 'Database query failed', details?: any) {
    super(message, 500, 'DB_QUERY_ERROR', details);
    this.name = 'DatabaseQueryError';
  }
}

/**
 * Record not found error
 */
export class RecordNotFoundError extends ApiError {
  constructor(entity: string, id?: string | number) {
    const message = id 
      ? `${entity} with ID ${id} not found` 
      : `${entity} not found`;
    super(message, 404, 'RECORD_NOT_FOUND');
    this.name = 'RecordNotFoundError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends ApiError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * User-related interfaces
 */
/**
 * Base entity interface with common fields
 */
export interface BaseEntity extends RowDataPacket {
  id: number;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * User-related interfaces
 */
export interface User extends BaseEntity {
  email: string;
  password_hash: string;
  phone_number: string;
  is_verified: boolean;
  is_active: boolean;
  last_login_at: Date | null;
}

export interface UserProfile extends BaseEntity {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  date_of_birth: Date | null;
  gender: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  profile_picture_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserSocialAuth extends BaseEntity {
  id: number;
  user_id: number;
  provider_id: number;
  provider_user_id: string;
  created_at: Date;
  last_used_at: Date | null;
}

export interface UserPreference extends BaseEntity {
  id: number;
  user_id: number;
  preferred_language: string;
  currency: string;
  seat_preference: string | null;
  meal_preference: string | null;
  notification_preferences: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserLoyalty extends BaseEntity {
  id: number;
  user_id: number;
  loyalty_program_id: number;
  loyalty_tier_id: number;
  points: number;
  membership_number: string;
  expiry_date: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Flight-related interfaces
 */
export interface Country extends BaseEntity {
  id: number;
  name: string;
  code: string;
}

export interface City extends BaseEntity {
  id: number;
  country_id: number;
  name: string;
  timezone: string;
}

export interface Airport extends BaseEntity {
  id: number;
  city_id: number;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
}

export interface Airline extends BaseEntity {
  id: number;
  name: string;
  code: string;
  logo_url: string | null;
  country_id: number;
  is_active: boolean;
}

export interface Aircraft extends BaseEntity {
  id: number;
  airline_id: number;
  model: string;
  registration_number: string;
  total_seats: number;
  manufacturing_year: number | null;
  is_active: boolean;
}

export interface Route extends BaseEntity {
  id: number;
  origin_airport_id: number;
  destination_airport_id: number;
  distance_km: number;
  flight_time_minutes: number;
  is_active: boolean;
}

export interface FareClass extends BaseEntity {
  id: number;
  name: string;
  code: string;
  description: string | null;
  benefits: string | null;
  is_active: boolean;
}

export interface Flight extends BaseEntity {
  id: number;
  airline_id: number;
  route_id: number;
  flight_number: string;
  departure_time: Date;
  arrival_time: Date;
  aircraft_id: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface FlightSchedule extends BaseEntity {
  id: number;
  flight_id: number;
  day_of_week: number;
  start_date: Date;
  end_date: Date | null;
  is_active: boolean;
}

export interface FlightFare extends BaseEntity {
  id: number;
  flight_id: number;
  fare_class_id: number;
  base_price: number;
  available_seats: number;
  created_at: Date;
  updated_at: Date;
}

export interface SeatMap extends BaseEntity {
  id: number;
  aircraft_id: number;
  seat_number: string;
  seat_type: string;
  fare_class_id: number;
  is_emergency_exit: boolean;
  is_aisle: boolean;
  is_window: boolean;
  is_active: boolean;
}

/**
 * Booking-related interfaces
 */
export interface BookingStatus extends BaseEntity {
  id: number;
  name: string;
  description: string | null;
}

export interface Booking extends BaseEntity {
  id: number;
  user_id: number;
  booking_reference: string;
  status_id: number;
  total_amount: number;
  currency: string;
  booking_date: Date;
  contact_email: string;
  contact_phone: string;
  created_at: Date;
  updated_at: Date;
}

export interface BookingStatusHistory extends BaseEntity {
  id: number;
  booking_id: number;
  status_id: number;
  changed_at: Date;
  changed_by: number | null;
  notes: string | null;
}

export interface BookingFlight extends BaseEntity {
  id: number;
  booking_id: number;
  flight_id: number;
  fare_class_id: number;
}

export interface Passenger extends BaseEntity {
  id: number;
  booking_id: number;
  first_name: string;
  last_name: string;
  date_of_birth: Date | null;
  gender: string | null;
  passport_number: string | null;
  passport_expiry: Date | null;
  nationality: string | null;
  passenger_type: string;
}

export interface PassengerSeat extends BaseEntity {
  id: number;
  passenger_id: number;
  booking_flight_id: number;
  seat_map_id: number;
}

export interface Baggage extends BaseEntity {
  id: number;
  passenger_id: number;
  booking_flight_id: number;
  baggage_type: string;
  weight_kg: number | null;
  price: number;
}

export interface PaymentMethod extends BaseEntity {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
}

export interface Payment extends BaseEntity {
  id: number;
  booking_id: number;
  payment_method_id: number;
  transaction_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_date: Date;
  gateway_response: string | null;
}

export interface Refund extends BaseEntity {
  id: number;
  payment_id: number;
  amount: number;
  reason: string;
  status: string;
  refund_date: Date;
  processed_by: number | null;
  transaction_id: string | null;
}

export interface UserSavedTrip extends BaseEntity {
  id: number;
  user_id: number;
  origin_airport_id: number;
  destination_airport_id: number;
  departure_date: Date | null;
  return_date: Date | null;
  passengers: number;
  fare_class_id: number | null;
  name: string | null;
  created_at: Date;
}

export interface SearchHistory extends BaseEntity {
  id: number;
  user_id: number | null;
  origin_airport_id: number;
  destination_airport_id: number;
  departure_date: Date;
  return_date: Date | null;
  passengers: number;
  fare_class_id: number | null;
  search_date: Date;
  session_id: string | null;
}

export interface UserActivityLog extends BaseEntity {
  id: number;
  user_id: number;
  activity_type: string;
  activity_data: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

export interface SystemSetting extends BaseEntity {
  setting_key: string;
  setting_value: string;
  description: string | null;
}

/**
 * Additional type definitions for flight search and booking
 */

export interface FlightSearchParams {
  originAirportCode: string;
  destinationAirportCode: string;
  departureDate: string;
  returnDate?: string;
  passengers?: number;
  fareClass?: string;
  airline?: string;
  maxPrice?: number;
  sortBy?: 'price' | 'departure' | 'duration';
  sortOrder?: 'asc' | 'desc';
}

export interface FlightSearchResult {
  outboundFlights: FlightDetails[];
  returnFlights?: FlightDetails[];
}

export interface FlightDetails {
  id: number;
  flightNumber: string;
  airlineName: string;
  airlineLogo: string | null;
  origin: string;
  originCode: string;
  originCity: string;
  destination: string;
  destinationCode: string;
  destinationCity: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  fareClass: string;
  price: number;
  availableSeats: number;
}

export interface PassengerDetails {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  passportNumber?: string;
  passportExpiry?: string;
  nationality?: string;
  passengerType: 'adult' | 'child' | 'infant';
  seatPreference?: 'window' | 'aisle' | 'middle' | 'no_preference';
  mealPreference?: string;
}

export interface BookingRequest {
  userId: number;
  flights: {
    flightId: number;
    fareClassId: number;
  }[];
  passengers: PassengerDetails[];
  paymentMethodId: number;
  totalAmount: number;
  contactEmail?: string;
  contactPhone?: string;
}

export interface BookingResponse {
  bookingId: number;
  bookingReference: string;
  status: string;
  flights: FlightDetails[];
  passengers: {
    id: number;
    firstName: string;
    lastName: string;
    passengerType: string;
  }[];
  totalAmount: number;
  currency: string;
  paymentStatus: string;
}

