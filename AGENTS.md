# Repository Guidelines

## Project Structure & Module Organization
This repository currently contains two standalone game prototypes at the repo root: `index__2_.html` and `index__3_.html`. Each file includes its own HTML, embedded CSS, and embedded JavaScript, so there is no separate `src/`, `tests/`, or `assets/` directory yet. Treat each `index__*.html` file as a self-contained variant of the same pixel-platformer concept. If shared code or media is added later, move it into clear top-level folders such as `assets/`, `scripts/`, or `styles/`.

## Build, Test, and Development Commands
There is no build step configured in this snapshot. For local development, serve the repository root with a simple static server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/index__2_.html` or `http://localhost:8000/index__3_.html` in a browser. Use browser DevTools to inspect runtime errors, canvas behavior, and network requests for external audio files.

## Coding Style & Naming Conventions
Use 4-space indentation in HTML, CSS, and JavaScript blocks to match the existing files. Prefer `const` for stable bindings and `let` for mutable state. Keep JavaScript identifiers in `camelCase` (`generateWorld`, `updateRockWall`) and reserve `UPPER_SNAKE_CASE` for true constants only if they are introduced consistently. Preserve the current structure of small helper functions and direct event listeners instead of adding framework-style abstractions.

## Testing Guidelines
No automated test framework is present. Validate changes with manual smoke tests in the browser: start the game, move, jump, attack, collect coins, and confirm that score and audio behavior still work. When adding mechanics, test both HTML variants unless the change is intentionally isolated to one file.

## Commit & Pull Request Guidelines
Git history is not available in this workspace snapshot, so follow a simple imperative commit style such as `Add fireball cooldown tuning` or `Refine enemy collision checks`. Keep commits focused on one change. Pull requests should describe gameplay impact, list the files changed, and include screenshots or short recordings for visual changes.

## Configuration & Asset Notes
Both HTML files currently depend on externally hosted audio URLs. Avoid introducing secrets or environment-specific values into the files. If offline reliability becomes important, replace remote media with versioned local assets.
