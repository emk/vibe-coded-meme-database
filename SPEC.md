# Meme Database Spec

This is a single-user database for storing, indexing and searching meme images. All meme categorization is handled automatically using a visual LLM and ollama.

## Data storage

The most important part of this project is the storage layout:

```
memedb/
  memes.sqlite3
  memes/$CATEGORY/$FILENAME.$EXT
  ...source code files, etc in top level directory as per normal...
```

The actual images are stored on disk in the `memes` folder with descriptive names. $CATEGORY, $FILENAME and $EXT are all lower case, and contain only alphanumeric characters and underscores. The `memes.sqlite3` file stores all metadata, including at least:

- Full OCRed text from each meme.
- Any keywords.
- The path to the meme on disk
- An SHA256 hash of each meme, making sure we don't import a meme twice.

## AI models

All metadata should be derived automatically, by asking an AI model using ollama and responding with structured output. Available AI models include:

- `gemma3:27b`: OK quality, medium speed.
- `gemma3:4b`: Fast but less capable.

Note that you will need ollama 0.6.0 to use these models.

## Importing memes

The project should have a command to import new memes from a specified folder. All memes are stored at the top level of the folder, and new memes may be added from time-to-time.

To import the memes, the user should run:

```
./import ~/path/to/meme/downloads/
```

It's OK if the command is actually something like `npm run import ...` or `uv run import ...`.

## Viewing memes

If the user runs:

```
./serve
```

...the app should open a web UI. This should have a search box on top, and image thumbnails of all matching memes below.

Again, the actual command might be slightly different depending on the development tools chosen.

## Tool choices

Please pick one or more programming languages that you're familiar with, that support ollama, and that can be used to implement all features for the project. It's better to choose one language for everything if possible.
