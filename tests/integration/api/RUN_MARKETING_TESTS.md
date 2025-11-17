# Running Marketing Campaigns API Tests

Quick guide to run the Marketing Campaigns API integration tests.

## Prerequisites

1. **Database Running**
   ```bash
   # Check PostgreSQL is running
   psql -h localhost -U postgres -d huntaze_test -c "SELECT 1;"
   ```

2. **Environment Variables**
   ```bash
   # Verify required env vars
   echo $DATABASE_URL
   echo $NEXTAUTH_SECRET
   echo $NEXTAUTH_URL
   ```

3. **Dependencies Installed**
   ```bash
   npm install
   ```

## Quick Start

### Run All Marketing Tests
```bash
npm run test:integration -- marketing-campaigns
```

### Run Specific Test Suite
```bash
# List campaigns tests
npm run test:integration -- marketing-campaigns -t "GET /api/marketing/campaigns"

# Create campaign tests
npm run test:integration -- marketing-campaigns -t "POST /api/marketing/campaigns"

# Update campaign tests
npm run test:integration -- marketing-campaigns -t "PUT /api/marketing/campaigns"

# Delete campaign tests
npm run test:integration -- marketing-campaigns -t "DELETE /api/marketing/campaigns"

# Launch campaign tests
npm run test:integration -- marketing-campaigns -t "POST /api/marketing/campaigns/[id]/launch"
```

### Run with Coverage
```bash
npm run test:integration:coverage -- marketing-campaigns
```

### Watch Mode (for development)
```bash
npm run test:integration:watch -- marketing-campaigns
```

## Test Output

### Successful Run
```
 ✓ tests/integration/api/marketing-campaigns.integration.test.ts (50)
   ✓ GET /api/marketing/campaigns - List Campaigns (10)
     ✓ HTTP Status Codes (3)
       ✓ should return 200 OK with empty list for new user
       ✓ should return 401 Unauthorized without session
       ✓ should return 200 OK with campaigns after creating some
     ✓ Response Schema Validation (2)
       ✓ should return valid campaign list schema
       ✓ should include calculated stats for each campaign
     ✓ Filtering and Pagination (5)
       ✓ should filter by status
       ✓ should filter by channel
       ✓ should support pagination with limit
       ✓ should support pagination with offset
       ✓ should indicate hasMore correctly
   ✓ POST /api/marketing/campaigns - Create Campaign (8)
   ✓ GET /api/marketing/campaigns/[id] - Get Campaign (4)
   ✓ PUT /api/marketing/campaigns/[id] - Update Campaign (6)
   ✓ DELETE /api/marketing/campaigns/[id] - Delete Campaign (4)
   ✓ POST /api/marketing/campaigns/[id]/launch - Launch Campaign (3)
   ✓ Concurrent Access (2)
   ✓ Stats Calculation (2)
   ✓ Performance (1)

Test Files  1 passed (1)
     Tests  50 passed (50)
  Start at  16:30:00
  Duration  5.23s
```

### Coverage Report
```
File                                    | % Stmts | % Branch | % Funcs | % Lines
----------------------------------------|---------|----------|---------|--------
lib/api/services/marketing.service.ts   |   100   |   95.2   |   100   |   100
app/api/marketing/campaigns/route.ts    |   100   |   100    |   100   |   100
app/api/marketing/campaigns/[id]/route.ts|  100   |   100    |   100   |   100
----------------------------------------|---------|----------|---------|--------
All files                               |   100   |   97.5   |   100   |   100
```

## Debugging Tests

### Enable Verbose Output
```bash
npm run test:integration -- marketing-campaigns --reporter=verbose
```

### Run Single Test
```bash
npm run test:integration -- marketing-campaigns -t "should return 200 OK with empty list"
```

### Debug with Node Inspector
```bash
node --inspect-brk node_modules/.bin/vitest run marketing-campaigns
```

## Common Issues

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**:
```bash
# Start PostgreSQL
brew services start postgresql@14  # macOS
sudo systemctl start postgresql    # Linux

# Verify connection
psql -h localhost -U postgres -d huntaze_test
```

### Session/Auth Error
```
Error: NEXTAUTH_SECRET is not set
```

**Solution**:
```bash
# Set environment variable
export NEXTAUTH_SECRET="your-secret-key-here"

# Or add to .env.test
echo "NEXTAUTH_SECRET=your-secret-key" >> .env.test
```

### Test Timeout
```
Error: Test timed out in 5000ms
```

**Solution**:
```bash
# Increase timeout in test file
it('should complete', async () => {
  // ...
}, 10000); // 10 second timeout
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution**:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
export TEST_API_URL=http://localhost:3001
```

## Test Data Cleanup

Tests automatically clean up after themselves, but if needed:

```bash
# Clean test users
psql -h localhost -U postgres -d huntaze_test -c "
  DELETE FROM users WHERE email LIKE 'test-marketing-%@example.com';
"

# Clean test campaigns
psql -h localhost -U postgres -d huntaze_test -c "
  DELETE FROM marketing_campaigns WHERE name LIKE 'Test Campaign%';
"
```

## Performance Testing

### Run Performance Tests Only
```bash
npm run test:integration -- marketing-campaigns -t "Performance"
```

### Benchmark Results
```
✓ should complete within 1 second (342ms)
✓ should handle bulk operations efficiently (2.8s)
```

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run Marketing Tests
  run: npm run test:integration -- marketing-campaigns
  env:
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
    NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
```

### Docker
```bash
# Run tests in Docker
docker-compose run --rm test npm run test:integration -- marketing-campaigns
```

## Test Files

- **Main Test Suite**: `tests/integration/api/marketing-campaigns.integration.test.ts`
- **Fixtures**: `tests/integration/api/fixtures/marketing-fixtures.ts`
- **Documentation**: `tests/integration/api/marketing-api-tests.md`

## Next Steps

After tests pass:
1. Review coverage report
2. Check performance benchmarks
3. Deploy to staging
4. Run smoke tests in staging
5. Deploy to production

## Support

For issues:
1. Check [Troubleshooting Guide](./marketing-api-tests.md#troubleshooting)
2. Review [API Documentation](./marketing-api-tests.md)
3. Check test logs for details
4. Open issue on GitHub

---

**Last Updated**: November 17, 2025  
**Test Suite**: Marketing Campaigns API  
**Status**: ✅ All Tests Passing
