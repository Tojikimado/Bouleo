import type { Contest } from '../types/contest'

import ScoreInput from '../components/ScoreInput'

interface ContestPageProps {
  contest: Contest
  onBack: () => void
  onScoreChange: (
    roundId: string,
    matchId: string,
    team: 'A' | 'B',
    score: number | null,
  ) => void
}

function ContestPage({
  contest,
  onBack,
  onScoreChange,
}: ContestPageProps) {
  return (
    <main>
      <button onClick={onBack}>
        ← Retour
      </button>

      <h1>{contest.name}</h1>

      <p>
        {contest.totalRounds} parties
      </p>

      <p>
        Round actuel : {contest.currentRound}
      </p>

      {contest.rounds.map((round) => (
        <section key={round.id}>
          <h2>
            Partie {round.number}
          </h2>

          {round.matches.map((match) => (
            <div key={match.id}>
              <p>
                {match.teamA.players
                  .map((player) => player.name)
                  .join(' + ')}

                {' vs '}

                {match.teamB.players
                  .map((player) => player.name)
                  .join(' + ')}
              </p>

              <ScoreInput
                value={match.scoreA}
                onChange={(score) =>
                  onScoreChange(
                    round.id,
                    match.id,
                    'A',
                    score,
                  )
                }
              />

              <span> - </span>

              <ScoreInput
                value={match.scoreB}
                onChange={(score) =>
                  onScoreChange(
                    round.id,
                    match.id,
                    'B',
                    score,
                  )
                }
              />
            </div>
          ))}
        </section>
      ))}
    </main>
  )
}

export default ContestPage