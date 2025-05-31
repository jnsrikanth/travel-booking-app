/**
 * AVIATIONSTACK API USAGE RULE
 * 
 * This rule defines the proper way to use the AviationStack API in our application.
 * It serves as a reference for all developers working on the flight data functionality.
 */

module.exports = {
  rule: {
    name: "AviationStack API Usage Rule",
    version: "1.0",
    lastUpdated: new Date().toISOString(),
    description: "Enforces correct AviationStack API usage in the travel booking application",
    
    requirements: [
      // 1. Endpoint Selection
      {
        id: "endpoint-selection",
        description: "Select the correct endpoint based on flight date",
        details: [
          "Use /flights endpoint ONLY for current day and historical flight data",
          "Use /flightsFuture endpoint EXCLUSIVELY for future flight schedules",
          "Validate date input to determine the correct endpoint",
          "Properly handle the different response formats between endpoints"
        ]
      },
      
      // 2. API Key Configuration
      {
        id: "api-key-config",
        description: "Proper API key configuration is mandatory",
        details: [
          "A paid tier API key is REQUIRED for future flight schedule access",
          "Store API keys securely in environment variables",
          "Validate API key presence before making requests",
          "Handle API key permission errors explicitly"
        ]
      },
      
      // 3. No Mock Data
      {
        id: "no-mock-data",
        description: "Never use mock data for flight information",
        details: [
          "ALWAYS use real AviationStack API data for flight schedules",
          "Return empty results rather than falling back to mock data",
          "Provide clear error messages when API data cannot be retrieved",
          "The ONLY exception is pricing data, which AviationStack does not provide"
        ]
      },
      
      // 4. Error Handling
      {
        id: "error-handling",
        description: "Implement proper error handling for all API interactions",
        details: [
          "Validate all input parameters before API requests",
          "Log detailed error information for debugging",
          "Return explicit error messages to API consumers",
          "Provide context about empty results (reasons and suggestions)",
          "Handle API rate limits and service unavailability gracefully"
        ]
      }
    ],
    
    enforcement: "All developers must adhere to these rules when working with flight data APIs"
  }
};

