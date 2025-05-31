#!/usr/bin/env python3
"""
AviationStack API Test Script

This script tests connectivity to the AviationStack API by:
1. Loading the API key from a .env file
2. Making a test request to the AviationStack API real-time flights endpoint
3. Providing clear feedback about API connectivity and any errors
4. Displaying rate limit information

Usage:
    python test_aviation_api.py
"""

import os
import sys
import json
import requests
from dotenv import load_dotenv
from datetime import datetime


# ANSI color codes for prettier console output
class Colors:
    RESET = '\033[0m'
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'


# API constants
AVIATION_STACK_BASE_URL = 'http://api.aviationstack.com/v1'


def print_header(title):
    """Print a section header to the console"""
    print(f"\n{Colors.BLUE}{Colors.BOLD}=== {title} ==={Colors.RESET}")


def print_result(success, message, data=None):
    """Print a test result to the console"""
    icon = "✓" if success else "✗"
    color = Colors.GREEN if success else Colors.RED
    print(f"{color}{icon} {message}{Colors.RESET}")
    
    if data:
        if isinstance(data, dict) or isinstance(data, list):
            print(json.dumps(data, indent=2))
        else:
            print(data)


def display_rate_limit_info(response):
    """Display rate limit information from the API response"""
    if not response or not response.headers:
        print(f"{Colors.YELLOW}No response headers available to check rate limits{Colors.RESET}")
        return
    
    print(f"\n{Colors.BLUE}{Colors.BOLD}=== API Rate Limit Information ==={Colors.RESET}")
    
    # Common rate limit header patterns
    rate_limit_headers = {
        'x-ratelimit-limit': 'Rate Limit Total',
        'x-ratelimit-remaining': 'Rate Limit Remaining',
        'x-ratelimit-reset': 'Rate Limit Reset Time',
        'ratelimit-limit': 'Rate Limit Total',
        'ratelimit-remaining': 'Rate Limit Remaining',
        'ratelimit-reset': 'Rate Limit Reset Time',
    }
    
    found_rate_limit_info = False
    
    # Check for rate limit headers
    for header, description in rate_limit_headers.items():
        if header in response.headers:
            print(f"{Colors.CYAN}{description}: {Colors.RESET}{response.headers[header]}")
            found_rate_limit_info = True
    
    # If none of the expected headers were found, display all headers for investigation
    if not found_rate_limit_info:
        print(f"{Colors.YELLOW}No standard rate limit headers found. All response headers:{Colors.RESET}")
        for header, value in response.headers.items():
            print(f"{Colors.CYAN}{header}: {Colors.RESET}{value}")


def verify_api_key():
    """Verify the API key is configured"""
    print_header("Verifying API Key Configuration")
    
    api_key = os.getenv('AVIATION_STACK_API_KEY')
    if not api_key:
        print_result(False, "AVIATION_STACK_API_KEY environment variable is not set")
        print(f"""
{Colors.YELLOW}To set up your API key:{Colors.RESET}
1. Sign up at https://aviationstack.com/ to get an API key
2. Create a .env file in the project root if it doesn't exist
3. Add the following line to your .env file:
   AVIATION_STACK_API_KEY=your_api_key_here
4. Run this test again
""")
        return False
    
    print_result(True, "API key is configured")
    return True


def test_real_time_flights():
    """Test the real-time flights endpoint"""
    print_header("Testing Real-time Flights API")
    
    api_key = os.getenv('AVIATION_STACK_API_KEY')
    if not api_key:
        return False
    
    print(f"{Colors.CYAN}Fetching real-time flights data...{Colors.RESET}")
    
    params = {
        'access_key': api_key,
        'limit': 2  # Only request a small amount of data for testing
    }
    
    try:
        response = requests.get(f"{AVIATION_STACK_BASE_URL}/flights", params=params)
        response.raise_for_status()  # Raise an exception for HTTP errors
        
        data = response.json()
        
        # Check for API error response
        if 'error' in data:
            error = data['error']
            print_result(False, f"API returned an error: {error.get('message', 'Unknown error')}")
            
            print(f"\n{Colors.YELLOW}{Colors.BOLD}API Error Details:{Colors.RESET}")
            print(f"Code: {error.get('code', 'N/A')}")
            print(f"Message: {error.get('message', 'N/A')}")
            print(f"Info: {error.get('info', 'No additional info')}")
            
            # Check specifically for subscription/access related errors
            if error.get('code') == 'function_access_restricted':
                print(f"\n{Colors.RED}{Colors.BOLD}This endpoint is not available on your current subscription plan.{Colors.RESET}")
                print(f"{Colors.YELLOW}Consider upgrading your AviationStack plan to access this feature.{Colors.RESET}")
            
            display_rate_limit_info(response)
            return False
        
        # If we have valid data
        if 'data' in data and isinstance(data['data'], list):
            flights_count = len(data['data'])
            if flights_count > 0:
                print_result(True, f"Successfully retrieved {flights_count} flights", data['data'][0])
                print(f"\n{Colors.GREEN}{Colors.BOLD}API ACCESS CONFIRMED:{Colors.RESET} Your subscription can access the flights endpoint.")
            else:
                print_result(True, "API request successful, but no flights were returned")
        else:
            print_result(False, "Unexpected API response format")
        
        display_rate_limit_info(response)
        return True
        
    except requests.exceptions.HTTPError as e:
        print_result(False, f"HTTP Error: {str(e)}")
        
        if e.response.status_code == 401:
            print(f"{Colors.RED}Authentication failed. Please check your API key.{Colors.RESET}")
        elif e.response.status_code == 403:
            print(f"{Colors.RED}Access forbidden. Your subscription plan may not include this endpoint.{Colors.RESET}")
        elif e.response.status_code == 429:
            print(f"{Colors.RED}Rate limit exceeded. Please try again later or upgrade your plan.{Colors.RESET}")
        
        # Display rate limit information if available
        display_rate_limit_info(e.response)
        return False
        
    except requests.exceptions.ConnectionError:
        print_result(False, "Connection Error: Failed to connect to the API server")
        print(f"{Colors.YELLOW}Please check your internet connection and try again.{Colors.RESET}")
        return False
        
    except requests.exceptions.Timeout:
        print_result(False, "Timeout Error: The request timed out")
        print(f"{Colors.YELLOW}The API server took too long to respond. Please try again later.{Colors.RESET}")
        return False
        
    except requests.exceptions.RequestException as e:
        print_result(False, f"Request Error: {str(e)}")
        return False
        
    except ValueError as e:
        print_result(False, f"JSON Parsing Error: {str(e)}")
        print(f"{Colors.YELLOW}Failed to parse the API response as JSON.{Colors.RESET}")
        return False


def test_airports_search():
    """Test the airports search endpoint"""
    print_header("Testing Airports Search API")
    
    api_key = os.getenv('AVIATION_STACK_API_KEY')
    if not api_key:
        return False
    
    search_term = "London"
    print(f"{Colors.CYAN}Searching for airports matching: '{search_term}'{Colors.RESET}")
    
    params = {
        'access_key': api_key,
        'search': search_term,
        'limit': 5
    }
    
    try:
        response = requests.get(f"{AVIATION_STACK_BASE_URL}/airports", params=params)
        response.raise_for_status()
        
        data = response.json()
        
        # Check for API error response
        if 'error' in data:
            error = data['error']
            print_result(False, f"API returned an error: {error.get('message', 'Unknown error')}")
            
            print(f"\n{Colors.YELLOW}{Colors.BOLD}API Error Details:{Colors.RESET}")
            print(f"Code: {error.get('code', 'N/A')}")
            print(f"Message: {error.get('message', 'N/A')}")
            print(f"Info: {error.get('info', 'No additional info')}")
            
            # Check specifically for subscription/access related errors
            if error.get('code') == 'function_access_restricted':
                print(f"\n{Colors.RED}{Colors.BOLD}This endpoint is not available on your current subscription plan.{Colors.RESET}")
                print(f"{Colors.YELLOW}Consider upgrading your AviationStack plan to access this feature.{Colors.RESET}")
            
            display_rate_limit_info(response)
            return False
        
        # If we have valid data
        if 'data' in data and isinstance(data['data'], list):
            airports_count = len(data['data'])
            if airports_count > 0:
                print_result(True, f"Successfully found {airports_count} airports matching '{search_term}'", data['data'][0])
                print(f"\n{Colors.GREEN}{Colors.BOLD}API ACCESS CONFIRMED:{Colors.RESET} Your subscription can access the airports endpoint.")
            else:
                print_result(True, f"API request successful, but no airports were found matching '{search_term}'")
        else:
            print_result(False, "Unexpected API response format")
        
        display_rate_limit_info(response)
        return True
        
    except requests.exceptions.HTTPError as e:
        print_result(False, f"HTTP Error: {str(e)}")
        
        if e.response.status_code == 401:
            print(f"{Colors.RED}Authentication failed. Please check your API key.{Colors.RESET}")
        elif e.response.status_code == 403:
            print(f"{Colors.RED}Access forbidden. Your subscription plan may not include this endpoint.{Colors.RESET}")
        elif e.response.status_code == 429:
            print(f"{Colors.RED}Rate limit exceeded. Please try again later or upgrade your plan.{Colors.RESET}")
        
        # Display rate limit information if available
        display_rate_limit_info(e.response)
        return False
        
    except Exception as e:
        print_result(False, f"Error: {str(e)}")
        return False


def run_tests():
    """Main test function"""
    print(f"{Colors.BOLD}{Colors.MAGENTA}AviationStack API Test Script{Colors.RESET}")
    print(f"{Colors.MAGENTA}Running tests at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.RESET}")
    
    try:
        # Step 1: Verify API key
        api_key_valid = verify_api_key()
        if not api_key_valid:
            print(f"\n{Colors.RED}{Colors.BOLD}Tests aborted due to missing API key.{Colors.RESET}")
            sys.exit(1)
        
        # Step 2: Test real-time flights API
        flights_test_passed = test_real_time_flights()
        
        # Step 3: Test airports search API
        airports_test_passed = test_airports_search()
        
        # Print test summary
        print_header("Test Summary")
        print_result(flights_test_passed, "Real-time flights API access test")
        print_result(airports_test_passed, "Airports search API access test")
        
        all_passed = api_key_valid and flights_test_passed and airports_test_passed
        
        # Provide clear next steps based on test results
        if all_passed:
            print(f"\n{Colors.GREEN}{Colors.BOLD}✓ API ACCESS VERIFIED{Colors.RESET}\n")
            print(f"{Colors.GREEN}Your AviationStack API key is working with all tested endpoints.{Colors.RESET}")
            print(f"{Colors.CYAN}Next steps:{Colors.RESET}")
            print("1. Ensure the API key is properly set in your application's .env file")
            print("2. Configure your application to use the real API instead of mock data")
            print("3. Monitor your API usage to stay within your subscription limits\n")
        else:
            print(f"\n{Colors.YELLOW}{Colors.BOLD}⚠ API ACCESS ISSUES DETECTED{Colors.RESET}\n")
            print(f"{Colors.YELLOW}There were problems accessing one or more AviationStack API endpoints.{Colors.RESET}")
            print(f"{Colors.CYAN}Troubleshooting steps:{Colors.RESET}")
            print("1. Verify your API key is correct")
            print("2. Check if your subscription plan includes the endpoints you need")
            print("3. If endpoints are not available, consider using the mock service")
            print("4. For paid endpoints, consider upgrading your subscription plan\n")
        
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Test interrupted by user.{Colors.RESET}")
        sys.exit(1)
        
    except Exception as e:
        print(f"{Colors.RED}Unexpected error running tests: {str(e)}{Colors.RESET}")
        sys.exit(1)


if __name__ == "__main__":
    # Load environment variables from .env file
    load_dotenv()
    
    # Run the tests
    run_tests()

