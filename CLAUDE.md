# CLAUDE.md

## Build/Test/Run Commands
```
# Install dependencies
npm install

# Run backend development server
npm run dev

# Run React frontend development server
npm run dev:client

# Run both backend and frontend in development mode
npm run dev:all

# Import memes
npm run import <path>

# Build and serve production web UI
npm run serve

# Run database migrations
npm run migrate

# Clear database (use with caution)
npm run clear-db

# Run tests
npm test

# Run specific test
npm test -- -t "test name"

# Lint code
npm run lint

# Run linting and build (recommended before committing)
npm run check
```

## Project Overview
This is a single-user database for storing, indexing and searching meme images. All meme categorization is handled automatically using a visual LLM and ollama.

The complete project specification is available in `SPEC.md`. Detailed documentation for the Ollama API is provided in `OLLAMA_API_DOCS.md`.

### Key Features
- Automatic meme categorization using Ollama AI models (gemma3:27b or gemma3:4b)
- Text extraction from meme images
- Keyword generation and categorization
- Search functionality for finding memes by text, description, or keywords
- Web UI for browsing and searching the meme collection
- Duplicate detection using SHA256 hash

### File Structure
```
memedb/
  memes.sqlite3           # SQLite database storing meme metadata
  memes/$CATEGORY/$FILENAME.$EXT  # Organized meme storage
```

### Technology Stack
- **Backend**: Node.js with Express.js, TypeScript
- **Database**: SQLite via better-sqlite3 with Kysely for type-safe queries and migrations
- **AI Integration**: Ollama API for image analysis
- **Image Processing**: Sharp for thumbnail generation
- **Frontend**: React, TypeScript, Vite

## Code Style Guidelines
- **Language**: TypeScript for both backend and frontend
- **Formatting**: Use Prettier with 2-space indentation
- **Imports**: Group imports (1. node modules, 2. local modules) and sort alphabetically
- **Naming**: camelCase for variables/functions, PascalCase for classes/components
- **Error Handling**: Use typed errors and async/await with try/catch
- **Components**: React functional components with hooks
- **Database**: Use a typed SQLite wrapper with prepared statements
- **AI Integration**: Abstract Ollama API calls through a service layer
- **Types**: Prefer interfaces over types, use explicit return types

## API Endpoints
- `GET /api/memes` - Get all memes or search with query parameter `?q=search_term`
- `GET /api/memes/:id` - Get a specific meme by ID
- `GET /images/:category/:filename` - Serve meme image files

## Environment Variables
- `PORT` - Server port (default: 3000)
- `DB_PATH` - Path to SQLite database (default: './memedb/memes.sqlite3')
- `MEME_DIR` - Directory for storing meme files (default: './memedb/memes')
- `OLLAMA_HOST` - Ollama API host (default: 'http://localhost:11434')
- `AI_MODEL` - AI model to use (default: 'gemma3:27b', options: 'gemma3:27b', 'gemma3:4b')

## Development Principles
- **No Shortcuts**: Never cut corners when facing problems. Stop, analyze errors carefully, and find the proper solution.
- **Collaborative Problem Solving**: When hitting an issue, work through it methodically together rather than implementing quick workarounds.
- **Root Cause Analysis**: Identify the underlying cause of errors, rather than masking symptoms.
- **Documentation**: When complex solutions are needed, consult proper documentation instead of guessing.
- **Testing**: Ensure all fixes are properly tested before moving on.
- **Code Quality**: Maintain high standards even when solving difficult problems.

## Testing Strategy

### Running Tests
```bash
# Run all tests
npm test

# Run server-side tests (database and API)
npm run test:server

# Run client-side tests (React components and hooks)
npm run test:client

# Run a specific test file
npm test -- path/to/test.test.ts

# Run tests with a specific name pattern
npm test -- -t "pattern"

# Run tests with coverage report
npm test -- --coverage
```

### Testing Philosophy
- **Real Database Tests**: Database tests use real SQLite databases instead of mocks.
- **Minimal Mocking**: Only mock external services (Ollama API) and API calls for frontend tests.
- **Independent Tests**: Each test should be isolated and not affect other tests.

### Test Structure
- **Backend Tests**: Use temporary SQLite databases with real migrations.
- **API Tests**: Test Express routes with SuperTest.
- **Frontend Tests**: Test React hooks and components with React Testing Library.

### Before Committing Code
Always run linting, tests, and build before committing:
```bash
npm run check  # Runs lint, test, and build in sequence
```