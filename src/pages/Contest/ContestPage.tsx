import { BYE_SCORE, isByeMatch, isMatchComplete } from '../../utils/contestRules'
import type { Contest } from '../../types/contest'
import './ContestPage.css'
import ScoreInput from '../../components/ScoreInput'

interface ContestPageProps {
  contest: Contest
  onBack: () => void
  onScoreChange: (
    roundId: string,
    matchId: string,
    team: 'A' | 'B',
    score: number | null,
  ) => void
  onNextRound: () => void
  onPreviousRound: () => void
  onShowRanking: () => void
}

function ContestPage({
  contest,
  onBack,
  onScoreChange,
  onNextRound,
  onPreviousRound,
  onShowRanking,
}: ContestPageProps) {
  const currentRound = contest.rounds.find(
    (round) => round.number === contest.currentRound,
  )

  if (!currentRound) {
    return (
      <main>
        {' '}
        <button onClick={onBack}>← Retour</button> <p>Partie introuvable.</p>{' '}
      </main>
    )
  }

  const canGoNext = currentRound.matches.every(isMatchComplete)

  const isFirstRound = contest.currentRound === 1
  const isLastRound = contest.currentRound === contest.totalRounds

  return (
    <main className="contest-page">
      {' '}
      <div className="contest-content">
        {' '}
        <button className="contest-back" onClick={onBack}>
          ← Retour{' '}
        </button>
        <div className="contest-header">
          <h1>{contest.name}</h1>

          <h2>
            Partie {contest.currentRound}
            <span> / {contest.totalRounds}</span>
          </h2>
        </div>
        <div className="contest-matches">
          {currentRound.matches.map((match, matchIndex) => {
            const isBye = isByeMatch(match)

            const validMatch = isMatchComplete(match)

            const teamAName = match.teamA.players.map((player) => player.name).join(' / ')

            const teamBName =
              match.teamB?.players.map((player) => player.name).join(' / ') ?? ''

            return (
              <div className="match-card" key={match.id}>
                <div className="match-header">
                  <h3>{`Match ${matchIndex + 1}`}</h3>
                </div>

                <div className="match-teams">
                  <div className="match-team">
                    <span className="match-team-name">{teamAName || 'Participants'}</span>

                    {isBye ? (
                      <span className="match-bye-score">{BYE_SCORE.winner}</span>
                    ) : (
                      <ScoreInput
                        value={match.scoreA}
                        onChange={(score) =>
                          onScoreChange(currentRound.id, match.id, 'A', score)
                        }
                      />
                    )}
                  </div>

                  <span className="match-separator">-</span>

                  <div className="match-team">
                    {isBye ? (
                      <span className="match-bye-score">{BYE_SCORE.loser}</span>
                    ) : (
                      <ScoreInput
                        value={match.scoreB}
                        onChange={(score) =>
                          onScoreChange(currentRound.id, match.id, 'B', score)
                        }
                      />
                    )}

                    <span className="match-team-name">{isBye ? 'X' : teamBName}</span>
                  </div>
                </div>

                {isBye && (
                  <p className="match-bye-message">Victoire attribuée automatiquement.</p>
                )}

                {!isBye &&
                  !validMatch &&
                  (match.scoreA !== null || match.scoreB !== null) && (
                    <p className="match-error">
                      Partie invalide : un des deux scores doit être égal à 13.
                    </p>
                  )}
              </div>
            )
          })}
        </div>
        {!canGoNext && (
          <p className="contest-validation">
            Terminez toutes les parties avec un score valide avant de continuer.
          </p>
        )}
        <div className="contest-navigation">
          {!isFirstRound && (
            <button className="contest-secondary-button" onClick={onPreviousRound}>
              ← Partie {contest.currentRound - 1}
            </button>
          )}

          {!isLastRound && (
            <button
              className="contest-primary-button"
              onClick={onNextRound}
              disabled={!canGoNext}
            >
              Suivant →
            </button>
          )}

          {isLastRound && (
            <button
              className="contest-primary-button"
              onClick={onShowRanking}
              disabled={!canGoNext}
            >
              Voir le classement →
            </button>
          )}
        </div>
      </div>
    </main>
  )
}

export default ContestPage
