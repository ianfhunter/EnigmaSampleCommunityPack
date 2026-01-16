# Enigma Sample Community Pack

A standalone example demonstrating how to create community packs for [Enigma](https://github.com/ianfhunter/Enigma).

## Features

This pack includes:

- **Daily Number** - A number guessing game with server-generated daily challenges
  - Backend API for challenge generation
  - Leaderboard system
  - User statistics tracking
  - Uses the **Enigma SDK** for shared components

## Using the Enigma SDK

Community packs can import shared components, hooks, and utilities from the `@enigma` SDK:

```javascript
import {
  // Components
  GameHeader,
  Timer,
  GiveUpButton,
  StatsPanel,
  GameResult,
  DifficultySelector,

  // Hooks
  useTimer,
  useGameStats,
  usePersistedState,
  useKeyboardInput,

  // Utilities
  renderIcon,
  createPackApi,

  // Seeding (for reproducible puzzles)
  createSeededRNG,
  seededShuffle,
  getTodaysSeed,
} from '@enigma';
```

### API Helper

Use `createPackApi()` for easy backend communication:

```javascript
const api = createPackApi('my-pack-id');

// GET request
const data = await api.get('/leaderboard');

// POST request (auto-handles CSRF tokens)
await api.post('/submit-score', { score: 100 });
```

## Installation

### Method 1: Via Game Store (Recommended)

1. In Enigma, go to **Game Store** → **Community Packs**
2. Add this repository URL:
   ```
   git@github.com:ianfhunter/EnigmaSampleCommunityPack.git
   ```
3. Click **Install**

### Method 2: Local Development

For developing your own pack with hot-reload:

1. Add as a local source in Enigma:
   ```
   file:///path/to/your/pack
   ```
   Or create a symlink:
   ```bash
   ln -s /path/to/your/pack /path/to/Enigma/.plugins/your-pack-id
   ```

2. Changes will auto-reload via Vite HMR!

## Pack Structure

```
sample-community/
├── manifest.js              # Pack metadata and game definitions
├── README.md
├── backend/
│   └── plugin.js            # Backend API routes and database migrations
└── games/
    └── DailyNumber/         # Game component
        ├── index.jsx        # Uses @enigma SDK
        └── DailyNumber.module.css
```

## Creating Your Own Pack

### 1. manifest.js - Pack Metadata

```javascript
const myPack = {
  id: 'my-pack-id',           // Unique ID (used for API routes)
  name: 'My Awesome Pack',
  description: 'Description of your pack',
  type: 'community',
  version: '1.0.0',
  author: 'Your Name',
  icon: '🎮',
  color: '#8b5cf6',
  hasBackend: true,           // Set true if you have backend/plugin.js

  categories: [
    {
      name: 'Category Name',
      icon: '🎯',
      games: [
        {
          slug: 'my-game',
          title: 'My Game',
          description: 'Game description',
          icon: '🎮',
          component: () => import('./games/MyGame'),
        },
      ],
    },
  ],

  // Helper getters
  get allGames() { ... },
  getGameBySlug(slug) { ... },
};

export default myPack;
```

### 2. backend/plugin.js - Backend API

```javascript
export default {
  name: 'my-pack-id',  // Must match manifest.id

  migrations: [
    {
      version: 1,
      up: `CREATE TABLE IF NOT EXISTS my_data (...)`
    }
  ],

  register(router, context) {
    // Public endpoint
    router.get('/data', (req, res) => {
      const rows = context.db.all('SELECT * FROM my_data');
      res.json({ data: rows });
    });

    // Authenticated endpoint
    router.post('/save', context.requireAuth, (req, res) => {
      const user = context.getCurrentUser(req);
      context.db.run('INSERT INTO my_data ...', [user.id, ...]);
      res.json({ success: true });
    });
  }
};
```

### 3. games/MyGame/index.jsx - Game Component

```javascript
import { useState } from 'react';
import {
  GameHeader,
  GiveUpButton,
  useGameStats,
  createPackApi,
  createSeededRNG,
  getTodaysSeed,
} from '@enigma';

const api = createPackApi('my-pack-id');

export default function MyGame() {
  const { stats, recordWin, recordLoss } = useGameStats('my-game');
  const [seed] = useState(() => getTodaysSeed('my-game'));
  const rng = createSeededRNG(seed);

  // ... game logic using rng for reproducible randomness

  return (
    <div>
      <GameHeader title="My Game" />
      {/* game UI */}
      <GiveUpButton onGiveUp={() => recordLoss()} />
    </div>
  );
}
```

## API Routes

When installed, this pack's API is available at:
- `GET /api/packs/sample-community/daily-challenge`
- `POST /api/packs/sample-community/guess`
- `POST /api/packs/sample-community/submit-score` (requires auth)
- `GET /api/packs/sample-community/leaderboard`
- `GET /api/packs/sample-community/my-stats` (requires auth)

## Versioning

Community packs use semantic versioning:

```bash
# Create a release tag
git tag v1.0.0
git push origin v1.0.0
```

Users can then update to new versions via the Game Store.

## License

MIT - Feel free to use this as a template for your own packs!
