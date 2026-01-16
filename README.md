# Enigma Sample Community Pack

A standalone example demonstrating how to create community packs for [Enigma](https://github.com/ianfhunter/Enigma).

## Features

This pack includes:

- **Daily Number** - A number guessing game with server-generated daily challenges
  - Backend API for challenge generation
  - Leaderboard system
  - User statistics tracking

## Installation

### Method 1: Copy to Enigma

1. Copy this entire directory to your Enigma installation's `src/packs/` folder:
   ```bash
   cp -r . /path/to/Enigma/src/packs/sample-community
   ```

2. Import the pack in `src/packs/registry.js`:
   ```javascript
   // Add import
   import sampleCommunityPack from './sample-community/manifest';

   // Add to communityPacks array
   export const communityPacks = [
     sampleCommunityPack,
   ];
   ```

3. Mount the pack files in `docker-compose.yml` (if using Docker):
   ```yaml
   enigma-backend:
     volumes:
       # ... existing volumes ...
       - ./src/packs:/app/packs:ro
   ```

4. Restart the Enigma backend to load the plugin

### Method 2: Symlink (Development)

For development, you can symlink instead of copying:

```bash
ln -s /path/to/EnigmaSampleCommunityPack /path/to/Enigma/src/packs/sample-community
```

## Pack Structure

```
sample-community/
├── manifest.js              # Pack metadata and game definitions
├── backend/
│   └── plugin.js            # Backend API routes and database migrations
├── components/
│   └── GameHeader/          # Shared UI components
│       ├── index.js
│       ├── GameHeader.jsx
│       └── GameHeader.module.css
└── games/
    └── DailyNumber/         # Game component
        ├── index.jsx
        └── DailyNumber.module.css
```

## Creating Your Own Pack

1. **manifest.js** - Define pack metadata:
   - `id`: Unique identifier (used for API routes)
   - `type`: Set to `'community'` for backend-enabled packs
   - `hasBackend`: Set to `true` if you have backend code
   - `categories`: Array of game categories with game definitions

2. **backend/plugin.js** - Backend functionality:
   - `name`: Must match the pack `id`
   - `migrations`: Database schema changes
   - `register(router, context)`: Route handlers

3. **games/*/index.jsx** - React components for each game

## API Routes

When installed, this pack's API is available at:
- `GET /api/packs/sample-community/daily-challenge`
- `POST /api/packs/sample-community/guess`
- `POST /api/packs/sample-community/submit-score` (requires auth)
- `GET /api/packs/sample-community/leaderboard`
- `GET /api/packs/sample-community/my-stats` (requires auth)

## License

MIT - Feel free to use this as a template for your own packs!
