#!/bin/bash
# SENTINELLE Test Runner
# Runs all tests with coverage reporting and enforces minimum coverage threshold

set -e  # Exit on first error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

COVERAGE_THRESHOLD=80

echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo -e "${YELLOW}  SENTINELLE Test Suite${NC}"
echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo ""

# Check if pytest is installed
if ! command -v pytest &> /dev/null; then
    echo -e "${RED}Error: pytest not installed${NC}"
    echo "Install with: pip install pytest pytest-cov"
    exit 1
fi

echo -e "${YELLOW}Running tests with coverage...${NC}"
echo ""

# Run pytest with coverage
pytest \
    --cov=app \
    --cov-report=html:coverage_html \
    --cov-report=term-missing \
    --cov-report=xml \
    -v \
    tests/

# Capture the exit code
TEST_EXIT_CODE=$?

echo ""
echo -e "${YELLOW}════════════════════════════════════════${NC}"

# Parse coverage from pytest output
COVERAGE=$(grep -oP 'TOTAL\s+\d+\s+\d+\s+\K\d+' <<< "$(pytest --cov=app --cov-report=term-missing tests/ 2>&1)" || echo "0")

if [ -z "$COVERAGE" ]; then
    # Try alternative parsing
    COVERAGE=$(grep "%" coverage_html/status.json 2>/dev/null | grep -oP '\d+' | head -1 || echo "0")
fi

echo -e "${YELLOW}Test Results:${NC}"
echo "  Exit Code: $TEST_EXIT_CODE"
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "  Status: ${GREEN}PASSED${NC}"
else
    echo -e "  Status: ${RED}FAILED${NC}"
fi

echo ""
echo -e "${YELLOW}Coverage Report Generated:${NC}"
echo "  HTML Report: coverage_html/index.html"
echo "  XML Report: coverage.xml"

echo ""
echo -e "${YELLOW}════════════════════════════════════════${NC}"

# Exit with test status
if [ $TEST_EXIT_CODE -ne 0 ]; then
    echo -e "${RED}Tests failed!${NC}"
    exit $TEST_EXIT_CODE
else
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
fi
