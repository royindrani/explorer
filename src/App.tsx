import { useEffect, useState } from 'react';
import { useGameLogic } from './hooks/useGameLogic';
import confetti from 'canvas-confetti';
import './index.css';

function App() {
  const {
    startWord,
    endWord,
    ladder,
    currentRow,
    status,
    errorMsg,
    handleInput,
    submitRow,
    resetGame,
    getHint,
    elapsedTime,
    optimalSteps
  } = useGameLogic();

  const [showInstructions, setShowInstructions] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showResult, setShowResult] = useState(false);

  // Show onboarding on mount
  useEffect(() => {
    setShowOnboarding(true);
  }, []);

  // Delay result modal to let animation play
  useEffect(() => {
    if (status === 'won' || status === 'lost') {
      const timer = setTimeout(() => setShowResult(true), 2000); // 2s delay for animation
      return () => clearTimeout(timer);
    } else {
      setShowResult(false);
    }
  }, [status]);

  const finishOnboarding = () => {
    // No need to set localStorage if we show every time
    setShowOnboarding(false);
  };

  // Handle physical keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== 'playing') {
        if (e.key === 'Enter' && (status === 'won' || status === 'lost')) {
          resetGame();
        }
        return;
      }

      if (e.key === 'Enter') {
        submitRow();
        return;
      }

      const currentWord = ladder[currentRow] || '';

      if (e.key === 'Backspace') {
        handleInput(currentWord.slice(0, -1));
        return;
      }

      if (/^[a-zA-Z]$/.test(e.key) && currentWord.length < 5) {
        handleInput(currentWord + e.key.toLowerCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, ladder, currentRow, handleInput, submitRow, resetGame]);

  // Trigger confetti on win
  useEffect(() => {
    if (status === 'won') {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [status]);

  const getVictoryQuote = () => {
    const quotes = [
      "You climbed that ladder like a pro! 🪜",
      "Brain power: 100% 🧠",
      "Words are your playground! 🛝",
      "Another one bites the dust! 🎶",
      "You're a wizard, Harry! 🧙‍♂️",
      "Too easy? Or are you just that good? 😎"
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  // Fix Hearts Logic: 0 hearts if lost
  const heartsCount = status === 'lost' ? 0 : (5 - currentRow);
  const hearts = Array.from({ length: 5 }, (_, i) => i < heartsCount ? '❤️' : '🤍');

  return (
    <div className="app-container">
      {/* ... Header ... */}
      <header className="header" style={{ position: 'relative' }}>
        <div className="header-icon" style={{ position: 'absolute', left: 0, cursor: 'pointer', padding: '0 15px' }} onClick={() => setShowInstructions(true)} data-tooltip="Tutorial">
          ❓
        </div>
        <span className="title">LADDER</span>
        <div style={{ position: 'absolute', right: 0, display: 'flex', gap: '15px', padding: '0 15px' }}>
          <div className="header-icon" style={{ cursor: 'pointer', fontSize: 22 }} onClick={getHint} data-tooltip="Get Hint">
            💡
          </div>
          <div className="header-icon" style={{ cursor: 'pointer', fontSize: 22 }} onClick={resetGame} data-tooltip="New Game">
            🔄
          </div>
        </div>
      </header>

      <div className="hearts-container">
        {hearts.map((h, i) => <span key={i} className={`heart ${h === '🤍' ? 'popped' : ''}`}>{h}</span>)}
      </div>

      {showOnboarding && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="onboarding-step">
              {onboardingStep === 0 && (
                <>
                  <h2>Welcome to LADDER 🪜</h2>
                  <p>The goal is to transform the <strong>Start Word</strong> into the <strong>Target Word</strong>.</p>
                  <div className="onboarding-example">
                    START: <strong>COLD</strong><br />
                    TARGET: <strong>WARM</strong>
                  </div>
                </>
              )}
              {onboardingStep === 1 && (
                <>
                  <h2>One Step at a Time 👣</h2>
                  <p>You must change exactly <strong>ONE letter</strong> to make a new valid word.</p>
                  <div className="onboarding-example">
                    COLD ➡️ CORD <span style={{ color: '#538d4e' }}>✔</span><br />
                    <span style={{ color: '#666', fontSize: '0.8em' }}>(Change L to R)</span>
                  </div>
                </>
              )}
              {onboardingStep === 2 && (
                <>
                  <h2>Watch Your Hearts ❤️</h2>
                  <p>You have **5 Chances** (Hearts) to reach the target.</p>
                  <p>If you run out of hearts, it's Game Over!</p>
                  <div className="hearts-container" style={{ fontSize: '20px' }}>
                    ❤️ ❤️ ❤️ 🤍 🤍
                  </div>
                </>
              )}

              <div className="onboarding-nav">
                <button className="btn-secondary" onClick={finishOnboarding}>Skip</button>
                <button className="btn-primary" onClick={() => {
                  if (onboardingStep < 2) setOnboardingStep(s => s + 1);
                  else finishOnboarding();
                }}>
                  {onboardingStep < 2 ? 'Next' : 'Let\'s Play!'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showInstructions && (
        <div className="modal-overlay" onClick={() => setShowInstructions(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>How to Play</h2>
              <button onClick={() => setShowInstructions(false)}>✕</button>
            </div>
            <div className="modal-content">
              <p>Transform the <strong>Start Word</strong> to the <strong>Target Word</strong>.</p>
              <p>You have <strong>5 chances</strong> (❤️).</p>
              <p>Each step must change exactly <strong>one letter</strong>.</p>
              <div style={{ background: '#333', padding: '10px', borderRadius: '8px', margin: '10px 0' }}>
                <p><strong>Example:</strong></p>
                <p>COLD ➡️ CORD ➡️ CARD ➡️ WARD ➡️ WARM</p>
              </div>
              <button onClick={() => setShowInstructions(false)} style={{
                background: '#538d4e', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', fontSize: '16px', cursor: 'pointer', width: '100%', marginTop: '10px'
              }}>
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMsg && <div className="toast">{errorMsg}</div>}

      <div className="game-board">
        {/* Start Word (Fixed) */}
        <Row word={startWord} fixed />

        {/* Editable Rows */}
        {ladder.map((word, i) => {
          // Calculate merged distance if won
          // Distance to End Row (index 5 relative to ladder start?)
          // Ladder indices 0..4. End is visually at 5.
          // Height approx 60px per row.
          const isWinningRow = i === currentRow && status === 'won';
          const distanceToTarget = (5 - i) * 60; // 57-60px approx
          const style = isWinningRow ? {
            transform: `translateY(${distanceToTarget}px)`,
            transition: 'transform 1.0s cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Bounce effect
            zIndex: 20
          } : undefined;

          return (
            <Row
              key={i}
              word={word}
              targetWord={endWord}
              active={i === currentRow && status === 'playing'}
              fixed={i < currentRow || status !== 'playing'}
              hasError={i === currentRow && !!errorMsg}
              status={isWinningRow ? 'won' : undefined}
              style={style}
            />
          );
        })}

        {/* End Word (Fixed) */}
        <Row word={endWord} fixed isTargetRow status={status === 'won' ? 'won' : undefined} />
      </div>

      <div className="status-area">
        {status === 'loading' && <div style={{ textAlign: 'center' }}>Generating Puzzle...</div>}

        {/* Result Modal for Win/Loss */}
        {showResult && (status === 'won' || status === 'lost') && (
          <div className="modal-overlay">
            <div className="modal" style={{ textAlign: 'center', maxWidth: '350px' }}>
              <h2>{status === 'won' ? '🎉 Splendid!' : '😔 Game Over'}</h2>

              {status === 'won' && (
                <div className="status-card">
                  <div style={{ marginBottom: '16px', fontSize: '20px', textAlign: 'center', fontWeight: 600 }}>
                    {startWord} ➡️ {endWord}
                  </div>
                  <div className="status-row">
                    <span>Your Moves</span> <strong>{currentRow + 1}</strong>
                  </div>
                  <div className="status-row">
                    <span>Optimal Path</span> <strong>{optimalSteps}</strong>
                  </div>
                  <div className="status-row">
                    <span>Solve Time</span> <strong>{elapsedTime.toFixed(1)}s</strong>
                  </div>
                  <div style={{ marginTop: '20px', fontStyle: 'italic', textAlign: 'center', color: 'var(--color-gold)', fontSize: '0.95em' }}>
                    "{getVictoryQuote()}"
                  </div>
                </div>
              )}

              {status === 'lost' && (
                <div className="status-card">
                  <p style={{ marginBottom: '12px', color: 'var(--color-text-dim)' }}>
                    The target word was:
                  </p>
                  <strong style={{ fontSize: '28px', color: 'var(--color-error)', display: 'block', marginBottom: '20px', letterSpacing: '2px' }}>
                    {endWord.toUpperCase()}
                  </strong>

                  <div className="status-row">
                    <span>Rarity</span>
                    <span className="rarity-badge">
                      {(() => {
                        const rareLetters = 'jqxzvk';
                        let cost = 0;
                        for (const char of endWord) if (rareLetters.includes(char)) cost++;
                        return cost > 1 ? 'Legendary 🦄' : cost > 0 ? 'Rare 💎' : 'Common 📄';
                      })()}
                    </span>
                  </div>

                  <div style={{ marginTop: '24px', fontStyle: 'italic', textAlign: 'center', color: 'var(--color-warning)', opacity: 0.8 }}>
                    "{(() => {
                      const failQuotes = [
                        "Failure is just a stepping stone to success.",
                        "Don't watch the clock; do what it does. Keep going.",
                        "Fall seven times, stand up eight.",
                        "It's not over until you win!",
                        "Keep calm and climb on. 🪜"
                      ];
                      return failQuotes[Math.floor(Math.random() * failQuotes.length)];
                    })()}"
                  </div>
                </div>
              )}

              <button onClick={resetGame} className={status === 'won' ? 'btn-play-next' : 'btn-try-again'} style={{
                padding: '12px 24px',
                fontSize: '18px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                marginTop: 20,
                width: '100%'
              }}>
                {status === 'won' ? 'Play Next Puzzle' : 'Try Again'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="keyboard-placeholder" style={{ textAlign: 'center', color: '#666', fontSize: 12 }}>
        Type to play • Enter to submit
      </div>
    </div>
  );
}

const Row = ({ word, targetWord, fixed, active, hasError, status, style, isTargetRow }: { word: string, targetWord?: string, fixed?: boolean, active?: boolean, hasError?: boolean, status?: string; style?: any; isTargetRow?: boolean }) => {
  const letters = word.split('');
  // Pad if empty
  while (letters.length < 5) letters.push('');

  return (
    <div
      className={`row ${hasError ? 'shake' : ''} ${status === 'won' && active ? 'win-anim' : ''} ${isTargetRow && status === 'won' ? 'target-won' : ''}`}
      style={style}
    >
      {letters.map((char, i) => {
        // Only show green feedback if the row is submitted (fixed)
        // AND it matches the target word.
        const isCorrect = fixed && char && targetWord && targetWord[i] === char;

        return (
          <div key={i} className={`cell ${fixed ? 'fixed' : ''} ${active ? 'active' : ''} ${char ? 'filled' : ''} ${isCorrect ? 'correct' : ''}`}>
            {char}
          </div>
        );
      })}
    </div>
  );
};

export default App;
