#!/bin/bash
#
# PII Anonymization Script
#
# Anonymizes personally identifiable information (PII) in database dumps
# for safe testing on staging environments.
#
# Anonymizes:
# - User emails
# - User names
# - IP addresses
# - Phone numbers
#
# Usage:
#   cat production-dump.sql | ./scripts/anonymize-pii.sh > anonymized-dump.sql
#   ./scripts/anonymize-pii.sh < production-dump.sql > anonymized-dump.sql
#

set -e

# Read from stdin, write to stdout
sed -E \
  -e "s/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/user_HASH@example.com/g" \
  -e "s/'([A-Z][a-z]+ [A-Z][a-z]+)'/'Anonymous User'/g" \
  -e "s/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/127.0.0.1/g" \
  -e "s/\+[0-9]{10,15}/+1234567890/g" \
  -e "s/'[0-9]{10,15}'/'0000000000'/g"

# Note: This is a basic anonymization script.
# For production use, consider more sophisticated tools like:
# - pg_anonymize
# - postgresql-anonymizer
# - Custom anonymization functions
