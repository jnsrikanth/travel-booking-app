# AviationStack API Usage Guidelines

## Endpoint Selection
- Use the `/flights` endpoint for real-time and historical flight data (current day and past flights)
- Use the `/flightsFuture` endpoint exclusively for future flight schedules (flights beyond the current date)
- Never use mock data as fallback for flight data retrieval

## API Key Requirements
- A paid tier API key is required for accessing future flight schedules via the `/flightsFuture` endpoint
- The free tier only supports current and historical flight data via the `/flights` endpoint
- Ensure API keys are properly configured in environment variables or secure configuration

## Parameter Differences
- The endpoints have different parameter requirements:
  - `/flights` uses `flight_date` for date filtering
  - `/flightsFuture` uses `scheduled_date` for date filtering
- Additional parameters may differ between endpoints; consult AviationStack documentation

## Response Structure Handling
- Response schemas differ between endpoints and must be normalized
- Future flight data includes specific schedule information not present in current flight data
- Handle codeshare information appropriately in both endpoints

## Error Handling
- Implement robust error handling for API-specific error codes
- Provide clear logging for API failures, especially permission errors on future flight data
- Validate date inputs before determining which endpoint to use
- Error out explicitly if flight data cannot be retrieved, rather than falling back to mock data

## Implementation Requirements
- Date validation must determine which endpoint to use
- Normalize response formats when integrating data from different endpoints
- Maintain complete logging of API interactions for debugging

