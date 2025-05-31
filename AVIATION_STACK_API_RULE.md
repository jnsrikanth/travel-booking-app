# AviationStack API Endpoint Usage Rule

## Overview
The travel booking application uses AviationStack API to fetch flight data. There are two primary endpoints used for different scenarios:

1. **`/flights` endpoint**: Used for retrieving current and historical flight data
2. **`/flightsFuture` endpoint**: Used exclusively for future flight schedules

## Endpoint Selection Logic
- **Use `/flights` endpoint when**: The requested flight date is the current date or in the past
- **Use `/flightsFuture` endpoint when**: The requested flight date is in the future

## API Parameter Differences

### `/flights` Endpoint Parameters
- `dep_iata`: Origin airport IATA code
- `arr_iata`: Destination airport IATA code
- `flight_date`: Flight date in YYYY-MM-DD format

### `/flightsFuture` Endpoint Parameters
- `iataCode`: Airport IATA code (origin or destination depending on `type`)
- `type`: Either 'departure' or 'arrival' to specify if `iataCode` refers to origin or destination
- `date`: Flight date in YYYY-MM-DD format

## Response Format Differences

### `/flights` Endpoint Response Structure
```javascript
{
  "flight": { "iata": "BA123", "number": "123" },
  "airline": { "name": "British Airways", "iata": "BA" },
  "departure": {
    "iata": "LHR",
    "airport": "Heathrow Airport",
    "scheduled": "2023-05-31T14:30:00+00:00",
    "terminal": "5",
    "gate": "A10"
  },
  "arrival": {
    "iata": "JFK",
    "airport": "John F Kennedy Airport",
    "scheduled": "2023-05-31T17:45:00-04:00",
    "terminal": "8",
    "gate": "B15"
  },
  "flight_status": "scheduled"
}
```

### `/flightsFuture` Endpoint Response Structure
```javascript
{
  "airline": { "name": "British Airways", "iataCode": "BA" },
  "flight": { "number": "123" },
  "departure": {
    "iataCode": "LHR",
    "airport": "Heathrow Airport",
    "scheduled": "2023-05-31T14:30:00+00:00",
    "terminal": "5",
    "gate": "A10"
  },
  "arrival": {
    "iataCode": "JFK",
    "airport": "John F Kennedy Airport",
    "scheduled": "2023-05-31T17:45:00-04:00",
    "terminal": "8",
    "gate": "B15"
  },
  "status": "scheduled"
}
```

## Key Differences in Response Handling

1. **Field naming differences**:
   - `flight.iata` vs. `flight.number` for flight number
   - `departure.iata` vs. `departure.iataCode` for airport codes
   - `flight_status` vs. `status` for flight status

2. **Time format differences**:
   - Future flight times may be in "HH:mm" format rather than full ISO datetime
   - Additional conversion may be needed to ensure consistent datetime formatting

3. **Filtering differences**:
   - Future flights must be filtered by matching `arrival.iataCode` to the destination
   - Current flights can directly use API-level filtering with `arr_iata` parameter

## Error Handling for Future Flights

Special error codes and messages may be returned for future flight requests:

- `out_of_schedule_range`: Date is beyond airline scheduling windows
- `schedule_not_available`: Schedule data not yet published for the requested date
- `usage_limit_reached`: API usage limit reached

## Implementation Rules

1. Always check the date of the requested flight to determine which endpoint to use
2. Use proper parameter naming conventions for each endpoint
3. Handle different response structures with appropriate mapping functions
4. Implement specific error handling for future flight data errors
5. Add logging for debugging future flight data issues

## API Key and Environment Configuration

The AviationStack API key must be:
1. Properly set in the environment variables as `AVIATION_STACK_API_KEY`
2. Valid for accessing both endpoints (paid tier required for future flights)
3. Services must be restarted whenever the API key is updated

## Data Transformation Best Practices

1. Always normalize responses from both endpoints to a consistent internal format
2. Convert time strings to standard ISO datetime format when needed
3. Handle missing fields gracefully with sensible defaults
4. Apply case-insensitive matching for airport codes

