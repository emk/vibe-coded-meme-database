# Meme Database (a "vibe-coding" experiment)

> **WARNING: This is an experiment with AI-written code.** Much of this code has never been looked at by a human.

A single-user database for storing, indexing and searching meme images. All meme categorization is handled automatically using a visual LLM through Ollama.

The original working version of this program was written by [Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview), with no human-written parts. Some help was provided by a human, including the spec, some general advice, and debugging help. See [CLAUDE.md](./CLAUDE.md) for Claude's notes.

![Meme database with text search bar and meme thumbnails](screenshots/meme-database.png)

## Human-written code

Other human-written bits added to make this more useful:

- Improved LLM prompt using "structured output" mode and JSON schema. This fixed OCR text extraction with gemma3:27b, which is still somewhat picky.

## Features

- Import memes from a local directory
- Automatic meme categorization with AI
- Search memes by text or keywords
- Web UI for browsing memes

## Requirements

- Node.js (v18+)
- npm
- Ollama (v0.6.0+) with the gemma3 model installed

## Getting Started

1. Clone this repository
2. Install dependencies

```bash
npm install
```

3. Configure the environment variables (optional)

Copy `.env` to `.env.local` and modify the settings as needed.

4. Start Ollama server with your preferred model

```bash
ollama serve
```

5. Import memes from a directory

```bash
npm run import /path/to/meme/folder
```

6. Start the web UI

```bash
npm run serve
```

7. Open http://localhost:3000 in your browser

## Project Structure

- `memedb/` - Database and meme files
  - `memes.sqlite3` - SQLite database containing metadata
  - `memes/$CATEGORY/$FILENAME.$EXT` - Organized meme images
- `src/` - Source code
  - `index.ts` - Main entry point and Express server
  - `scripts/` - Import script
  - `services/` - Database and AI services
  - `models/` - Data models
  - `utils/` - Utility functions
- `public/` - Web UI files

## Commands

- `npm run dev` - Start the development server
- `npm run serve` - Start the web UI server
- `npm run import <path>` - Import memes from a directory
- `npm run build` - Build the project
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## License

ISC