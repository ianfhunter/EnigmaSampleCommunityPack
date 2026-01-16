/**
 * Daily Number - Sample Community Game
 *
 * Demonstrates how community pack games can use:
 * - The Enigma SDK (@enigma) for shared components and utilities
 * - Backend APIs through createPackApi
 *
 * This game uses the backend plugin at /api/packs/sample-community/
 */

import { useState, useEffect, useCallback } from 'react';
import {
  GameHeader,
  GiveUpButton,
  StatsPanel,
  GameResult,
  createPackApi,
} from '@enigma';
import styles from './DailyNumber.module.css';

// Create API client for this pack
const api = createPackApi('sample-community');

export default function DailyNumber() {
  const [challenge, setChallenge] = useState(null);
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch today's challenge
  useEffect(() => {
    api.get('/daily-challenge')
      .then(data => {
        setChallenge(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load challenge. Is the backend running?');
        setLoading(false);
      });

    // Fetch leaderboard
    api.get('/leaderboard')
      .then(data => setLeaderboard(data.leaderboard || []))
      .catch(() => {});

    // Fetch user stats
    api.get('/my-stats')
      .then(data => setMyStats(data))
      .catch(() => {});
  }, []);

  // Make a guess
  const handleGuess = useCallback(async () => {
    const numGuess = parseInt(guess, 10);
    if (isNaN(numGuess) || numGuess < 1 || numGuess > 100) {
      return;
    }

    try {
      const data = await api.post('/guess', {
        guess: numGuess,
        date: challenge?.date
      });

      setAttempts(prev => [...prev, { guess: numGuess, result: data.result }]);
      setGuess('');

      if (data.result === 'correct') {
        setWon(true);
        setGameOver(true);

        // Submit score
        api.post('/submit-score', {
          attempts: attempts.length + 1,
          won: true,
          date: challenge?.date
        }).catch(() => {});
      }
    } catch (err) {
      setError('Failed to submit guess');
    }
  }, [guess, challenge, attempts]);

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleGuess();
    }
  };

  // Give up
  const handleGiveUp = () => {
    setGameOver(true);
    setWon(false);
  };

  // Play again (reset state)
  const handlePlayAgain = () => {
    setAttempts([]);
    setGameOver(false);
    setWon(false);
    setGuess('');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <GameHeader title="Daily Number" />
        <div className={styles.loading}>Loading challenge...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <GameHeader title="Daily Number" />
        <div className={styles.error}>
          <p>{error}</p>
          <p className={styles.hint}>
            This game requires the backend plugin system. Make sure the Enigma backend is running.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <GameHeader
        title="🔢 Daily Number"
        instructions="Guess the secret number between 1 and 100!"
      />

      <div className={styles.game}>
        <div className={styles.challengeInfo}>
          <h2>🎯 Daily Challenge</h2>
          <p className={styles.date}>{challenge?.date}</p>
          <p className={styles.hint}>{challenge?.hint}</p>
        </div>

        {!gameOver ? (
          <div className={styles.guessArea}>
            <div className={styles.inputGroup}>
              <input
                type="number"
                min="1"
                max="100"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter your guess (1-100)"
                className={styles.input}
                autoFocus
              />
              <button onClick={handleGuess} className={styles.guessButton}>
                Guess
              </button>
            </div>

            <GiveUpButton
              onGiveUp={handleGiveUp}
              requireConfirm={true}
              className={styles.giveUpButton}
            />
          </div>
        ) : (
          <GameResult
            state={won ? 'won' : 'gaveup'}
            message={won
              ? `You got it in ${attempts.length} ${attempts.length === 1 ? 'attempt' : 'attempts'}!`
              : 'Better luck tomorrow!'
            }
            stats={won ? [
              { label: 'Attempts', value: attempts.length },
            ] : []}
            actions={[
              { label: 'Play Again', onClick: handlePlayAgain, primary: true },
            ]}
          />
        )}

        {attempts.length > 0 && (
          <div className={styles.attempts}>
            <h3>Your Attempts</h3>
            <div className={styles.attemptList}>
              {attempts.map((a, i) => (
                <div
                  key={i}
                  className={`${styles.attempt} ${styles[a.result]}`}
                >
                  <span className={styles.attemptNumber}>{a.guess}</span>
                  <span className={styles.attemptResult}>
                    {a.result === 'correct' ? '✅' : a.result === 'higher' ? '⬆️ Higher' : '⬇️ Lower'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.sidebar}>
          {leaderboard.length > 0 && (
            <div className={styles.leaderboard}>
              <h3>🏆 Today's Leaderboard</h3>
              <ol className={styles.leaderboardList}>
                {leaderboard.map((entry, i) => (
                  <li key={i}>
                    <span className={styles.rank}>#{entry.rank}</span>
                    <span className={styles.username}>{entry.username}</span>
                    <span className={styles.score}>{entry.attempts} guesses</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {myStats && (
            <StatsPanel
              stats={[
                { label: 'Games', value: myStats.totalGames, icon: '🎮' },
                { label: 'Wins', value: myStats.wins, icon: '🏆' },
                { label: 'Avg Guesses', value: myStats.avgAttempts || '-', icon: '📊' },
              ]}
              layout="grid"
            />
          )}
        </div>
      </div>
    </div>
  );
}
