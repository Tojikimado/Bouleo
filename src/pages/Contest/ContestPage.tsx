import {
  BYE_SCORE,
  FORMAT_LABELS,
  MODE_LABELS,
  WINNING_SCORE,
  isByeMatch,
  isMatchComplete,
} from '../../utils/contestRules'
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
      <main className="contest-page">
        <button onClick={onBack}>← Retour</button> <p>Partie introuvable.</p>
      </main>
    )
  }

  const canGoNext = currentRound.matches.every(isMatchComplete)
  const completedMatches = currentRound.matches.filter(isMatchComplete).length

  const isFirstRound = contest.currentRound === 1
  const isLastRound = contest.currentRound === contest.totalRounds

  return (
    <main className="contest-page">
      <div className="contest-content">
        <button className="contest-back" onClick={onBack}>
          ← Participants
        </button>
        <div className="contest-header">
          <h1>{contest.name}</h1>
          <p>
            {FORMAT_LABELS[contest.format]} · {MODE_LABELS[contest.mode]} ·{' '}
            {contest.players.length} joueurs
          </p>
        </div>
        <div className="contest-round">
          <h2>
            Partie {contest.currentRound}
            <span> / {contest.totalRounds}</span>
          </h2>
          <span>
            {completedMatches} matchs terminés sur {currentRound.matches.length}
          </span>
        </div>
        <div className="contest-matches">
          {currentRound.matches.map((match, matchIndex) => {
            const isBye = isByeMatch(match)

            const validMatch = isMatchComplete(match)
            const invalidMatch =
              !isBye && !validMatch && match.scoreA !== null && match.scoreB !== null
            const statusId = `match-status-${match.id}`
            let statusText = 'À saisir'
            let statusClass = 'match-pending'
            if (isBye) {
              statusText = 'Exemption'
              statusClass = 'match-valid'
            } else if (validMatch) {
              statusText = '✓ Terminé'
              statusClass = 'match-valid'
            } else if (invalidMatch) {
              statusText =
                'Le gagnant doit avoir 13 points, son adversaire entre 0 et 12.'
              statusClass = 'match-error'
            } else if (match.scoreA !== null || match.scoreB !== null) {
              statusText = 'Saisie en cours'
            }

            const teamAName = match.teamA.players.map((player) => player.name).join(' / ')

            const teamBName =
              match.teamB?.players.map((player) => player.name).join(' / ') ?? ''

            return (
              <div
                className={`match-card${validMatch ? ' is-complete' : ''}`}
                key={match.id}
              >
                <div className="match-header">
                  <h3>{`Match ${matchIndex + 1}`}</h3>
                  <span
                    id={statusId}
                    className={statusClass}
                    role={invalidMatch ? 'alert' : 'status'}
                  >
                    {statusText}
                  </span>
                </div>

                <div className="match-teams">
                  <div className="match-team">
                    <span className="match-team-name">
                      {match.teamA.players.map((player) => (
                        <span key={player.id}>{player.name}</span>
                      ))}
                    </span>

                    {isBye ? (
                      <span className="match-bye-score">{BYE_SCORE.winner}</span>
                    ) : (
                      <ScoreInput
                        label={`Score de ${teamAName}, match ${matchIndex + 1}`}
                        invalid={invalidMatch}
                        describedBy={statusId}
                        winner={validMatch && match.scoreA === WINNING_SCORE}
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
                        label={`Score de ${teamBName}, match ${matchIndex + 1}`}
                        invalid={invalidMatch}
                        describedBy={statusId}
                        winner={validMatch && match.scoreB === WINNING_SCORE}
                        value={match.scoreB}
                        onChange={(score) =>
                          onScoreChange(currentRound.id, match.id, 'B', score)
                        }
                      />
                    )}

                    <span className="match-team-name">
                      {isBye
                        ? 'Exempte'
                        : match.teamB?.players.map((player) => (
                            <span key={player.id}>{player.name}</span>
                          ))}
                    </span>
                  </div>
                </div>

                {isBye && (
                  <p className="match-bye-message">Victoire attribuée automatiquement.</p>
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
              Partie suivante →
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
