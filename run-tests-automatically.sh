#!/bin/bash

# Automated Testing Script
# This will run tests every hour and save results

LOG_FILE="test-results-$(date +%Y%m%d).log"
echo "Starting automated testing at $(date)" >> $LOG_FILE

# Function to run tests
run_tests() {
    echo "=== Test Run $(date) ===" >> $LOG_FILE
    
    # Check if backend is running
    if ! curl -s http://localhost:4000/health > /dev/null; then
        echo "Starting backend server..." >> $LOG_FILE
        cd backend
        npm start > /dev/null 2>&1 &
        sleep 10
        cd ..
    fi
    
    # Run comprehensive tests
    cd backend
    node tests/comprehensive-api-test.js >> ../$LOG_FILE 2>&1
    cd ..
    
    echo "Test completed at $(date)" >> $LOG_FILE
    echo "----------------------------------------" >> $LOG_FILE
}

# Run tests every hour
while true; do
    run_tests
    echo "Sleeping for 1 hour..."
    sleep 3600  # 1 hour
done
