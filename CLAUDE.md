# Media List

Personal media tracking site — books, movies, TV, articles, etc.

## Architecture

- **Data**: Two hand-edited JSON files in `data/` — `media.json` and `recommenders.json`
- **Validation**: `scripts/validate.py` checks both files against schemas in `schema/`, plus cross-validates that `recommended_by` references exist
- **CI**: GitHub Actions runs validation on every PR to `main`
- **Frontend**: Static HTML/CSS/JS site in `site/` served via GitHub Pages

## Directory Layout

```
data/
  media.json          # All media items in a single file
  recommenders.json   # People who recommend things
schema/
  media.schema.json
  recommenders.schema.json
scripts/
  validate.py         # Schema + cross-reference validation
site/
  index.html, style.css, app.js
.github/workflows/
  validate.yml        # CI on PRs to main
  deploy.yml          # Deploy site on push to main
```

## Data Format

### media.json

Array of media items. Each item requires:

- `title` (string, required)
- `category` (string, optional): one of `"book"`, `"movie"`, `"tv"`, `"series"`, `"game"`, `"topic"`, `"music"`, `"podcast"`, `"article"`, `"other"`
- `status` (string, required): one of `"done"`, `"in-progress"`, `"queued"`

Optional fields:

- `rating` (integer): 1-5
- `recommended_by` (array of strings): initials of recommenders — each must match an entry in `recommenders.json`
- `notes` (string)
- `date_added` (string): ISO 8601 date
- `date_finished` (string): ISO 8601 date
- `tags` (array of unique strings)
- `author` (string)
- `director` (string)
- `year` (integer)
- `url` (string, URI)

No additional properties allowed — schema is strict.

### recommenders.json

Array of recommender objects. Each requires:

- `initial` (string, required): short identifier used in media items' `recommended_by`
- `full_name` (string, required)

No additional properties allowed.

## Workflows

- **validate.yml**: Runs `scripts/validate.py` on PRs targeting `main`
- **deploy.yml**: Deploys `site/` to GitHub Pages on push to `main`

## Commands

- `python scripts/validate.py` — validate all data and cross-references

## Conventions

- Python 3.10+, only external dep is `jsonschema`
- Keep JSON files human-readable (pretty-printed, sorted keys)
- Site is plain HTML/CSS/JS — no build toolchain

## Adding entries

When the user asks to add a single media entry or recommender, assume the full flow:
commit on a branch, push, open a PR to `main`, and actively watch it until it
merges (poll CI, merge when green, or surface failures). Don't stop at the file
edit.
