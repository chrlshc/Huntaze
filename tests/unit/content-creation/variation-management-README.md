# Variation Management Tests - Task 10.1

## Overview

This directory contains comprehensive tests for the A/B testing variation management system (Task 10.1 from `.kiro/specs/content-creation/tasks.md`).

**Status**: ✅ Tests Created (Awaiting Implementation)

## Test Files

### 1. `variation-management-task-10-1-status.test.ts`
**Purpose**: Validate Task 10.1 implementation status

**Coverage** (80+ tests):
- API endpoint for creating variations
- Variation storage in database
- UI for creating up to 5 variations
- Side-by-side comparison display
- Variation limits and validation
- Integration with content system
- Complete implementation validation

**Key Validations**:
- ✅ POST /api/content/variations endpoint exists
- ✅ GET /api/content/variations endpoint exists
- ✅ content_variations table in database
- ✅ VariationManager component exists
- ✅ Maximum 5 variations enforced
- ✅ Side-by-side comparison view
- ✅ Variation differences highlighted

### 2. `../integration/content-creation/variation-management-workflow.test.ts`
**Purpose**: Integration tests for complete variation workflow

**Coverage** (60+ tests):
- Creating variations through API
- Listing variations for content
- Updating variation data
- Deleting variations
- Enforcing 5 variation limit
- Side-by-side comparison functionality
- Authentication and authorization
- Error handling
- Database operations
- Performance considerations

**Key Workflows**:
- ✅ Complete CRUD cycle
- ✅ User ownership validation
- ✅ Limit enforcement
- ✅ Error handling
- ✅ UI integration

### 3. `../services/variationService.test.ts`
**Purpose**: Unit tests for variation service layer

**Coverage** (40+ tests):
- createVariation with validation
- listVariations for content
- updateVariation data
- deleteVariation
- getVariationCount
- compareVariations
- Business rules enforcement
- Error handling

**Key Features**:
- ✅ Mocked database operations
- ✅ Validation logic testing
- ✅ Authorization checks
- ✅ Error scenarios
- ✅ Business rule enforcement

### 4. `../components/VariationManager.test.tsx`
**Purpose**: Unit tests for VariationManager UI component

**Coverage** (50+ tests):
- Component rendering
- Variation list display
- Creating variations
- Deleting variations
- Side-by-side comparison
- Loading states
- Error handling
- Accessibility
- User experience

**Key UI Features**:
- ✅ Variation count display
- ✅ Create button with limit enforcement
- ✅ Delete buttons for each variation
- ✅ Comparison grid layout
- ✅ Error messages
- ✅ Loading indicators

## Requirements Covered

Based on `.kiro/specs/content-creation/requirements.md` - Requirement 9:

### Requirement 9.1 - Create Up to 5 Variations
- ✅ API endpoint for creating variations
- ✅ Validation for maximum 5 variations
- ✅ Variation storage in database
- ✅ UI for creating variations

### Requirement 9.2 - Highlight Differences
- ✅ Side-by-side comparison view
- ✅ Difference highlighting
- ✅ Variation preview rendering
- ✅ Clear labeling of variations

### Requirement 9.3 - Support Different Types
- ✅ Text variations
- ✅ Image variations
- ✅ Posting time variations

### Requirement 9.4 - Even Distribution
- 🔄 Distribution logic (Task 10.2)
- 🔄 Audience splitting (Task 10.2)

### Requirement 9.5 - Performance Metrics
- 🔄 Metrics tracking (Task 10.3)
- 🔄 Statistical significance (Task 10.3)

## Running Tests

### Prerequisites

Install testing dependencies if not already installed:
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### Run all variation management tests:
```bash
npx vitest run tests/unit/content-creation/variation-management-task-10-1-status.test.ts
npx vitest run tests/integration/content-creation/variation-management-workflow.test.ts
npx vitest run tests/unit/services/variationService.test.ts
npx vitest run tests/unit/components/VariationManager.test.tsx
```

### Run specific test file:
```bash
npx vitest run tests/unit/content-creation/variation-management-task-10-1-status.test.ts
```

### Watch mode:
```bash
npx vitest tests/unit/content-creation/variation-management-task-10-1-status.test.ts
```

### With coverage:
```bash
npx vitest run tests/unit/content-creation/ --coverage
```

## Test Results

**Expected Results** (once implementation is complete):

**Total Tests**: 230+
**Status**: 🔄 Awaiting Implementation

### Breakdown:
- `variation-management-task-10-1-status.test.ts`: 80 tests
- `variation-management-workflow.test.ts`: 60 tests
- `variationService.test.ts`: 40 tests
- `VariationManager.test.tsx`: 50 tests

## Implementation Checklist

### Backend (API & Database)
- [ ] Create `app/api/content/variations/route.ts`
  - [ ] POST endpoint for creating variations
  - [ ] GET endpoint for listing variations
  - [ ] Validation for max 5 variations
  - [ ] User authentication
  - [ ] Error handling

- [ ] Create `app/api/content/variations/[id]/route.ts`
  - [ ] GET endpoint for single variation
  - [ ] PUT/PATCH endpoint for updating
  - [ ] DELETE endpoint for deletion
  - [ ] Authorization checks

- [ ] Verify `content_variations` table exists
  - [ ] id (PRIMARY KEY)
  - [ ] content_id (FOREIGN KEY)
  - [ ] user_id (FOREIGN KEY)
  - [ ] variation_name (VARCHAR)
  - [ ] variation_data (JSONB)
  - [ ] variation_index (INTEGER)
  - [ ] created_at (TIMESTAMP)
  - [ ] updated_at (TIMESTAMP)

- [ ] Create variation service layer
  - [ ] createVariation function
  - [ ] listVariations function
  - [ ] updateVariation function
  - [ ] deleteVariation function
  - [ ] getVariationCount function
  - [ ] compareVariations function

### Frontend (UI Components)
- [ ] Create `components/content/VariationManager.tsx`
  - [ ] Variation list display
  - [ ] Create variation form
  - [ ] Edit variation functionality
  - [ ] Delete variation with confirmation
  - [ ] Variation count display (X / 5)
  - [ ] Loading states
  - [ ] Error messages

- [ ] Create side-by-side comparison view
  - [ ] Grid layout for variations
  - [ ] Variation preview rendering
  - [ ] Difference highlighting
  - [ ] Clear labeling

- [ ] Integrate with content editor
  - [ ] Add "Manage Variations" button
  - [ ] Modal or panel for variation management
  - [ ] Context passing (content_id)

## API Specification

### POST /api/content/variations
**Create a new variation**

Request:
```json
{
  "content_id": 100,
  "variation_name": "Variation A",
  "variation_data": {
    "text": "Alternative text content",
    "image_url": "https://example.com/image.jpg",
    "scheduled_time": "2024-11-01T10:00:00Z"
  }
}
```

Response:
```json
{
  "success": true,
  "variation": {
    "id": 1,
    "content_id": 100,
    "variation_name": "Variation A",
    "variation_data": { ... },
    "variation_index": 0,
    "created_at": "2024-10-31T12:00:00Z"
  }
}
```

Errors:
- 400: Validation error (missing fields, limit exceeded)
- 401: Not authenticated
- 403: Not authorized (not content owner)
- 500: Server error

### GET /api/content/variations?content_id=100
**List all variations for content**

Response:
```json
{
  "success": true,
  "variations": [
    {
      "id": 1,
      "content_id": 100,
      "variation_name": "Variation A",
      "variation_data": { ... },
      "variation_index": 0,
      "created_at": "2024-10-31T12:00:00Z"
    },
    {
      "id": 2,
      "content_id": 100,
      "variation_name": "Variation B",
      "variation_data": { ... },
      "variation_index": 1,
      "created_at": "2024-10-31T12:05:00Z"
    }
  ],
  "count": 2
}
```

### PUT /api/content/variations/[id]
**Update a variation**

Request:
```json
{
  "variation_name": "Updated Variation A",
  "variation_data": {
    "text": "Updated text content"
  }
}
```

Response:
```json
{
  "success": true,
  "variation": {
    "id": 1,
    "variation_name": "Updated Variation A",
    "variation_data": { ... },
    "updated_at": "2024-10-31T13:00:00Z"
  }
}
```

### DELETE /api/content/variations/[id]
**Delete a variation**

Response:
```json
{
  "success": true,
  "message": "Variation deleted successfully"
}
```

## Database Schema

```sql
CREATE TABLE content_variations (
  id SERIAL PRIMARY KEY,
  content_id INTEGER NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  variation_name VARCHAR(255) NOT NULL,
  variation_data JSONB NOT NULL,
  variation_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_content_variations_content_id ON content_variations(content_id);
CREATE INDEX idx_content_variations_user_id ON content_variations(user_id);
CREATE INDEX idx_content_variations_created_at ON content_variations(created_at);

-- Ensure max 5 variations per content
CREATE OR REPLACE FUNCTION check_variation_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM content_variations WHERE content_id = NEW.content_id) >= 5 THEN
    RAISE EXCEPTION 'Maximum 5 variations allowed per content item';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_variation_limit
  BEFORE INSERT ON content_variations
  FOR EACH ROW
  EXECUTE FUNCTION check_variation_limit();
```

## UI Mockup

```
┌─────────────────────────────────────────────────────────────┐
│ Variation Manager                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 2 / 5 variations                                           │
│                                                             │
│ [+ Create Variation]                                       │
│                                                             │
│ ┌─────────────────┐  ┌─────────────────┐                 │
│ │ Variation A     │  │ Variation B     │                 │
│ │                 │  │                 │                 │
│ │ Content text... │  │ Different text..│                 │
│ │                 │  │                 │                 │
│ │ [Edit] [Delete] │  │ [Edit] [Delete] │                 │
│ └─────────────────┘  └─────────────────┘                 │
│                                                             │
│ ─────────────────────────────────────────────────────────  │
│                                                             │
│ Side-by-Side Comparison                                    │
│                                                             │
│ ┌──────────────┬──────────────┐                           │
│ │ Variation A  │ Variation B  │                           │
│ ├──────────────┼──────────────┤                           │
│ │ Content      │ Different    │ ← Highlighted difference  │
│ │ text...      │ text...      │                           │
│ │              │              │                           │
│ │ Image A      │ Image B      │ ← Highlighted difference  │
│ └──────────────┴──────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

## Next Steps

### Immediate (Task 10.1)
1. Implement API endpoints
2. Create database table and triggers
3. Build VariationManager component
4. Implement comparison view
5. Run tests to validate

### Future (Task 10.2 & 10.3)
1. Implement distribution logic
2. Add performance tracking
3. Build analytics dashboard
4. Implement winner recommendation

## References

- **Spec**: `.kiro/specs/content-creation/`
- **Requirements**: `.kiro/specs/content-creation/requirements.md` (Requirement 9)
- **Design**: `.kiro/specs/content-creation/design.md`
- **Tasks**: `.kiro/specs/content-creation/tasks.md` (Task 10.1)

---

**Created**: November 1, 2025
**Status**: ✅ Tests Created - Ready for Implementation
**Next**: Implement variation management system

