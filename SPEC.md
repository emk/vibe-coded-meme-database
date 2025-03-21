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
- `gemma3:4b`: Fast, but too low quality to be useful.

Note that you will need ollama 0.6.0 to use these models.

## Importing memes

The project should have a command to import new memes from a specified folder. All memes are stored at the top level of the folder, and new memes may be added from time-to-time.

To import the memes, the user should run:

```
npm run import -- ~/path/to/meme/downloads/
```

## Viewing memes

If the user runs:

```
npm run serve
```

...the app should open a web UI. This should have a search box on top, and image thumbnails of all matching memes below.

## Meme Export

When the user hovers over a meme, a checkbox should appear at the top left of the meme. The border of the checkbox should be translucent, and the center should be seethrough.

```txt
+-
|☐
```

If the user clicks on the checkbox, the checkbox should display a green indicator (which should remain visible even if the mouse moves away):

```txt
+-
|☑
```

It's OK to use icons for this. Let me know if you want me to download a specific icon set, or you can just use SVG. It would neat to use round checkboxes, if you can manage that.

If any memes are checked, a non-scrolling footer should appear at the bottom of the page, displaying buttons:

```txt
[Unselect All] [Download N Memes]
```

...where N is the number of memes currently selected.

Note that the set of selected memes should persist even if the search changes, so that the user can select memes from multiple searches. This implies that the selection state is stored globally.

When the user clicks "Download N Memes", the client should POST the list of selected memes to the API. The API should respond with a zip file containing the original files for each selected meme, without any further compression (since images files are already compressed).
