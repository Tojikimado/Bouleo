import type { Contest } from '../../types/contest'

import './RankingPage.css'

import { calculateRanking } from '../../utils/calculateRanking'

interface RankingPageProps {
  contest: Contest
  onBack: () => void
  onBackHome: () => void
}

function RankingPage({
  contest,
  onBack,
  onBackHome,
}: RankingPageProps) {
  const ranking = calculateRanking(contest)

  return (
    <main className="ranking-page">
      <div className="ranking-content">
        <button
          className="ranking-back"
          onClick={onBack}
        >
          ← Retour au concours
        </button>

        <div className="ranking-header">
          <h1>Classement</h1>
          <p>{contest.name}</p>
        </div>

        <div className="ranking-table-container">
          <table className="ranking-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nom</th>
                <th>Victoires</th>
                <th>Défaites</th>
                <th>Points</th>
              </tr>
            </thead>

            <tbody>
              {ranking.map((entry) => (
                <tr
                  key={entry.id}
                  className={
                    entry.rank === 1
                      ? 'ranking-first'
                      : ''
                  }
                >
                  <td className="ranking-position">
                    {entry.rank}
                  </td>

                  <td className="ranking-name">
                    {entry.name}
                  </td>

                  <td>{entry.wins}</td>

                  <td>{entry.losses}</td>

                  <td className="ranking-points">
                    {entry.goalAverage > 0
                      ? `+${entry.goalAverage}`
                      : entry.goalAverage}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ranking-actions">
          <button
            className="ranking-primary-button"
            onClick={onBackHome}
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    </main>
  )
}

export default RankingPage