# Travel Booking Backend

Backend server for the travel booking application.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create `.env` file from example:
   ```
   cp .env.example .env
   ```

3. Add your AviationStack API key to the `.env` file:
   ```
   AVIATION_STACK_API_KEY=your_api_key_here
   ```

4. Start the server:
   ```
   npm start
   ```

## Configuration

### Data Source

By default, the application uses the AviationStack API for real flight and airport data. 

For development/testing purposes, you can enable mock data by setting:

```
USE_MOCK_DATA=true
```

in your `.env` file. This should only be used for development purposes.

## API Endpoints

### Airport Search
```
GET /api/airports?keyword=LAX
```

### Flight Search
```
GET /api/flights?originLocationCode=DFW&destinationLocationCode=LAX&departureDate=2025-05-30&adults=1&travelClass=ECONOMY
```

### Health Check
```
GET /health
```

## Development

Run the development server with hot reload:

```
npm run dev
```

