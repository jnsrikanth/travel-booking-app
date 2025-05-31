# SkyJourney - Real-time Flight Booking System

A comprehensive flight booking system built with Next.js, Node.js, MySQL, and Redis, integrated with the Amadeus API for real-time flight data.

## Features

- Real-time flight search using Amadeus API
- Global airport database
- One-way and return flight booking
- User authentication and booking management
- Redis caching for improved performance
- Fully containerized with Docker

## Prerequisites

- Docker and Docker Compose
- Amadeus API credentials (Sign up at https://developers.amadeus.com)

## Environment Setup

1. Clone the repository
2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Update the .env file with your Amadeus API credentials:
   ```
   AMADEUS_API_KEY=your_api_key
   AMADEUS_API_SECRET=your_api_secret
   ```

## Getting Started

1. Build and start the containers:
   ```bash
   docker-compose up --build
   ```

2. The application will be available at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000

## Services

- Frontend (Next.js) - Port 3000
- Backend (Node.js/Express) - Port 4000
- MySQL Database - Port 3306
- Redis Cache - Port 6379

## Development

The project uses Docker volumes for development, allowing real-time code changes without rebuilding containers.

### Frontend Development

The Next.js frontend is configured with hot-reloading. Any changes to the frontend code will be immediately reflected in the browser.

### Backend Development

The backend uses nodemon for development, automatically restarting when changes are detected.

## Database

The MySQL database is initialized with the following tables:
- airports: Global airport database
- users: User management
- bookings: Flight bookings
- passengers: Passenger information

Data persists between container restarts using Docker volumes.

## API Documentation

### Flight Search
```
POST /api/flights/search
Body: {
  "from": "airport_code",
  "to": "airport_code",
  "departureDate": "YYYY-MM-DD",
  "returnDate": "YYYY-MM-DD",
  "passengers": number,
  "class": "ECONOMY|PREMIUM_ECONOMY|BUSINESS|FIRST"
}
```

### Airport Search
```
GET /api/flights/airports?keyword=city_name
```

## Testing

To run tests:
```bash
docker-compose run frontend npm test
docker-compose run backend npm test
```

## Production Deployment

For production deployment:
1. Update environment variables for production
2. Build production images:
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```
3. Deploy using your preferred container orchestration platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License
