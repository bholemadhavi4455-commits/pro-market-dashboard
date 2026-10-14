# Optional Testing Tasks - Quick Reference

## Status Overview

**Completed:** 1 of 19 optional tests  
**Remaining:** 18 tests  
**Documentation:** See `OPTIONAL_TESTS_GUIDE.md` for full implementation details

---

## Remaining Tasks Checklist

### Backend Tests (7 tasks)

- [ ] **Task 3.2** - Cache TTL behavior property test
  - File: `backend/src/test/cache-ttl.property.test.ts`
  - Validates: Requirements 10.1, 10.2
  
- [ ] **Task 3.4** - CompositeScore calculation property test
  - File: `backend/src/test/scoring-engine.property.test.ts`
  - Validates: Requirements 7.2, 7.3, 7.4
  
- [ ] **Task 3.5** - Sorting by CompositeScore property test
  - File: `backend/src/test/sorting.property.test.ts`
  - Validates: Requirements 2.5
  
- [ ] **Task 5.3** - Price history deduplication property test
  - File: `backend/src/test/persistence-dedup.property.test.ts`
  - Validates: Requirements 10.4
  
- [ ] **Task 6.3** - Source adapter normalization property test
  - File: `backend/src/test/aggregation.property.test.ts`
  - Validates: Requirements 2.1
  
- [ ] **Task 7.4** - Deduplication property test
  - File: `backend/src/test/deduplication.property.test.ts`
  - Validates: Requirements 2.4
  
- [ ] **Task 9.5** - API endpoints integration tests
  - File: `backend/src/test/api-endpoints.integration.test.ts`
  - Tests all REST endpoints

---

### Frontend Tests (11 tasks)

- [ ] **Task 11.3** - Input validation property test
  - File: `frontend/src/test/input-validation.property.test.ts`
  - Validates: Requirements 1.3
  
- [ ] **Task 12.3** - SearchBar unit tests
  - File: `frontend/src/components/SearchBar.test.tsx`
  - Tests debouncing, validation, category changes
  
- [ ] **Task 13.3** - Client-side sorting property test
  - File: `frontend/src/test/sorting.property.test.ts`
  - Validates: Requirements 8.2
  
- [ ] **Task 13.5** - Category filtering property test
  - File: `frontend/src/test/filtering.property.test.ts`
  - Validates: Requirements 3.2, 3.3
  
- [ ] **Task 13.7** - Lowest price identification property test
  - File: `frontend/src/test/lowest-price.property.test.ts`
  - Validates: Requirements 4.2
  
- [ ] **Task 13.9** - Listing count preservation property test
  - File: `frontend/src/test/listing-count.property.test.tsx`
  - Validates: Requirements 1.2
  
- [ ] **Task 15.3** - Star rating rendering property test
  - File: `frontend/src/test/star-rating.property.test.ts`
  - Validates: Requirements 6.4
  
- [ ] **Task 15.6** - Review truncation property test
  - File: `frontend/src/test/review-truncation.property.test.ts`
  - Validates: Requirements 6.5
  
- [ ] **Task 15.8** - Cross-source product separation property test
  - File: `frontend/src/test/cross-source.property.test.tsx`
  - Validates: Requirements 4.3
  
- [ ] **Task 17.4** - ChartBox unit tests
  - File: `frontend/src/components/ChartBox.test.tsx`
  - Tests rendering, insufficient data, range toggle
  
- [ ] **Task 19.1** - Source count accuracy property test
  - File: `frontend/src/test/source-count.property.test.ts`
  - Validates: Requirements 4.4

---

## Quick Commands

### Backend
```bash
cd backend
npm test                          # Run all tests
npm test -- <filename>            # Run specific test
npm run test:coverage             # Run with coverage
npm run test:watch                # Watch mode
```

### Frontend
```bash
cd frontend
npm test                          # Run all tests
npm test -- <filename>            # Run specific test
npm run test:coverage             # Run with coverage
npm run test:watch                # Watch mode
```

---

## Test Implementation Priority

### High Priority (Core functionality)
1. Task 9.5 - API endpoints integration tests
2. Task 3.4 - CompositeScore calculation
3. Task 7.4 - Deduplication logic
4. Task 11.3 - Input validation

### Medium Priority (User experience)
5. Task 13.3 - Client-side sorting
6. Task 13.5 - Category filtering
7. Task 12.3 - SearchBar component
8. Task 17.4 - ChartBox component

### Low Priority (Edge cases & polish)
9. Task 3.2 - Cache TTL behavior
10. Task 5.3 - Price history deduplication
11. Task 13.7 - Lowest price identification
12. Task 15.3 - Star rating rendering
13. Task 15.6 - Review truncation
14. Task 13.9 - Listing count preservation
15. Task 15.8 - Cross-source separation
16. Task 19.1 - Source count accuracy
17. Task 3.5 - Sorting correctness
18. Task 6.3 - Source adapter normalization

---

## Coverage Goals

- **Backend:** ≥85% statement coverage
- **Frontend:** ≥80% statement coverage
- **Property tests:** 100 iterations minimum
- **Integration tests:** All API endpoints

---

## Full Implementation Guide

See `OPTIONAL_TESTS_GUIDE.md` for:
- Complete test code for all 18 tasks
- Test generator implementations
- Setup instructions
- Best practices
- Example test patterns

---

## Notes

✅ Core implementation is 100% complete  
✅ Application is fully functional  
✅ Optional tests enhance coverage but are not required for MVP  
✅ Tests can be implemented incrementally  
✅ All test templates are provided in the guide  
