# Testing Strategy for Meme-DB

## Testing Philosophy

- **Test Real Databases**: Use real SQLite test databases rather than mocks for database tests.
- **Minimal Mocking**: Only mock external services (like Ollama API/LLM) and API interactions for frontend tests.
- **Isolate Tests**: Each test should be independent and not affect others.

## Test Structure

### Backend Tests

1. **Database Service Tests**
   - Use a temporary SQLite database file for each test suite
   - Run real migrations on the test database
   - Test all database service methods with real queries
   - Validate FTS5 search functionality with actual SQLite FTS queries

2. **API Route Tests**
   - Use SuperTest to test Express endpoints
   - Set up test database with sample data
   - Test all routes including error handling and edge cases
   - For routes requiring file access, use temporary test files

3. **Utility Function Tests**
   - Test standalone utility functions with direct assertions

### Frontend Tests

1. **Hook Tests**
   - Mock API responses but test real hook logic
   - Test state transitions and error handling

2. **Component Tests**
   - Use React Testing Library
   - Focus on user interactions and component rendering
   - Mock API calls but test real component behavior

### Integration Tests

- Test key workflows that combine multiple components
- Use a test database with realistic sample data

## Test Setup

- Create a separate test database for each test suite
- Provide utility functions for test database setup/teardown
- Use Vitest's setup/teardown hooks for proper cleanup

## Test Data

- Create sample meme data for tests
- Include test images for file operations
- Structure test data to cover various edge cases

## Environment

- Configure a separate test environment
- Use environment variables to control test behavior