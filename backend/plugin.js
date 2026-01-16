/**
 * Sample Community Pack - Backend Plugin
 *
 * This demonstrates how community packs can add backend functionality.
 * The plugin can:
 * - Register API routes
 * - Access its own ISOLATED database (cannot touch core tables!)
 * - Use authentication via context.requireAuth
 * - Access limited user info via context.core APIs
 * - Run database migrations on its isolated database
 *
 * Routes are mounted at /api/packs/{pack-id}/
 * For this pack: /api/packs/sample-community/
 *
 * 🔒 SECURITY: This plugin has its own SQLite database.
 *    It CANNOT access users, sessions, or other core data directly.
 *    Use context.core.* APIs for read-only access to user info.
 */

export default {
  name: 'sample-community',
  version: '1.0.0',

  /**
   * Database migrations for this plugin
   * Run automatically when the plugin loads
   * NOTE: These run on the plugin's ISOLATED database, not the core database!
   */
  migrations: [
    {
      version: 1,
      up: `
        CREATE TABLE IF NOT EXISTS daily_number_scores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          date TEXT NOT NULL,
          attempts INTEGER NOT NULL,
          won INTEGER NOT NULL DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_daily_number_date
        ON daily_number_scores(date);

        CREATE INDEX IF NOT EXISTS idx_daily_number_user
        ON daily_number_scores(user_id, date);
      `
    }
  ],

  /**
   * Register routes for this plugin
   * Routes are mounted at /api/packs/sample-community/
   */
  register(router, context) {

    /**
     * Get today's challenge
     * Returns a hint about the secret number (but not the number itself!)
     */
    router.get('/daily-challenge', (req, res) => {
      const today = new Date().toISOString().split('T')[0];
      const secretNumber = generateDailyNumber(today);

      res.json({
        date: today,
        hint: `The number is between 1 and 100`,
        range: { min: 1, max: 100 }
      });
    });

    /**
     * Make a guess
     */
    router.post('/guess', (req, res) => {
      const { guess, date } = req.body;

      if (!guess || typeof guess !== 'number') {
        return res.status(400).json({ error: 'Invalid guess' });
      }

      const today = new Date().toISOString().split('T')[0];
      const targetDate = date || today;
      const secretNumber = generateDailyNumber(targetDate);

      let result;
      if (guess === secretNumber) {
        result = 'correct';
      } else if (guess < secretNumber) {
        result = 'higher';
      } else {
        result = 'lower';
      }

      res.json({
        guess,
        result,
        date: targetDate
      });
    });

    /**
     * Submit final score (requires auth)
     */
    router.post('/submit-score', context.requireAuth, (req, res) => {
      const { attempts, won, date } = req.body;
      const user = context.getCurrentUser(req);
      const today = date || new Date().toISOString().split('T')[0];

      // Check if user already submitted for today
      // NOTE: Using plugin's isolated database (context.db)
      const existing = context.db.get(
        'SELECT id FROM daily_number_scores WHERE user_id = ? AND date = ?',
        [user.id, today]
      );

      if (existing) {
        return res.status(400).json({ error: 'Already submitted for today' });
      }

      // Save score to plugin's isolated database
      context.db.run(
        'INSERT INTO daily_number_scores (user_id, date, attempts, won) VALUES (?, ?, ?, ?)',
        [user.id, today, attempts, won ? 1 : 0]
      );

      res.json({ success: true });
    });

    /**
     * Get leaderboard for today
     * NOTE: We can't JOIN with users table directly (isolated database)
     *       Instead, we fetch scores first, then use context.core.getUsers()
     */
    router.get('/leaderboard', (req, res) => {
      const today = new Date().toISOString().split('T')[0];

      // Fetch scores from plugin's isolated database
      const scores = context.db.all(`
        SELECT
          user_id,
          attempts,
          won
        FROM daily_number_scores
        WHERE date = ? AND won = 1
        ORDER BY attempts ASC
        LIMIT 10
      `, [today]);

      // Get usernames via the secure core API (read-only access)
      const userIds = scores.map(s => s.user_id).filter(Boolean);
      const usernameMap = context.core.getUsernameMap(userIds);

      res.json({
        date: today,
        leaderboard: scores.map((s, i) => ({
          rank: i + 1,
          username: usernameMap.get(s.user_id) || 'Anonymous',
          attempts: s.attempts
        }))
      });
    });

    /**
     * Get user's stats
     */
    router.get('/my-stats', context.requireAuth, (req, res) => {
      const user = context.getCurrentUser(req);

      // Query plugin's isolated database
      const stats = context.db.get(`
        SELECT
          COUNT(*) as total_games,
          SUM(won) as wins,
          AVG(CASE WHEN won = 1 THEN attempts END) as avg_attempts
        FROM daily_number_scores
        WHERE user_id = ?
      `, [user.id]);

      res.json({
        totalGames: stats?.total_games || 0,
        wins: stats?.wins || 0,
        avgAttempts: stats?.avg_attempts ? Math.round(stats.avg_attempts * 10) / 10 : null
      });
    });
  }
};

/**
 * Generate a deterministic "random" number based on date
 * This ensures everyone gets the same number on the same day
 */
function generateDailyNumber(dateString) {
  // Simple hash of the date string
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Convert to number between 1 and 100
  return Math.abs(hash % 100) + 1;
}
