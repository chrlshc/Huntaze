# Workers Tests

## Overview

This directory contains unit tests for background workers that handle scheduled tasks and data processing.

## Test Status

### Analytics Snapshot Worker
**Status**: ⚠️ Partial Coverage (Integration tests recommended)

The analytics snapshot worker is complex and tightly coupled with database operations. Due to the singleton pattern and direct database calls, comprehensive unit testing is challenging.

**Recommendation**: Create integration tests instead:
- `tests/integration/workers/analyticsSnapshotWorker.test.ts`
- Use a test database
- Test actual database interactions
- Verify snapshot creation end-to-end

## Running Tests

### Run all worker tests:
```bash
npx vitest run tests/unit/workers/
```

### Run specific test file:
```bash
npx vitest run tests/unit/workers/analyticsSnapshotWorker.test.ts
```

## Test Coverage

Current coverage focuses on:
- Repository layer (analyticsSnapshotsRepository)
- Service layer (metricsAggregationService)
- API endpoints (analytics routes)

## Next Steps

1. **Create Integration Tests**
   - Set up test database
   - Test complete snapshot collection flow
   - Verify data persistence

2. **Refactor Worker for Testability**
   - Inject dependencies instead of importing
   - Make database pool injectable
   - Separate business logic from data access

3. **Add E2E Tests**
   - Test scheduled execution
   - Verify cron job integration
   - Test error recovery

## Related Tests

- `tests/unit/db/repositories/analyticsSnapshotsRepository.test.ts` - ✅ Complete
- `tests/unit/services/metricsAggregationService.test.ts` - Future
- `tests/integration/workers/` - Future

## References

- **Spec**: `.kiro/specs/advanced-analytics/`
- **Tasks**: `.kiro/specs/advanced-analytics/tasks.md`

---

**Created**: October 31, 2025
**Status**: ⚠️ Partial - Integration tests recommended
**Next**: Create integration test suite

