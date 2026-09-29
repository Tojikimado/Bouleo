import { useState } from 'react'

import HomePage from './pages/HomePage'
import NewContestPage from './pages/NewContestPage'
import ParticipantsPage from './pages/ParticipantsPage'
import ContestPage from './pages/ContestPage'

import type {
  Contest,
  ContestFormat,
  ContestMode,
} from './types/contest'
import type { Player } from './types/player'
import type { Team } from './types/team'

import { createContest } from './utils/createContest'

type Page =
  | 'home'
  | 'new-contest'
  | 'participants'
  | 'contest'

function App() {
  const [page, setPage] =
    useState<Page>('home')

  const [contestName, setContestName] =
    useState('')

  const [totalRounds, setTotalRounds] =
    useState(6)

  const [format, setFormat] =
    useState<ContestFormat>('tete-a-tete')

  const [mode, setMode] =
    useState<ContestMode>('fixed-teams')

  const [contest, setContest] =
    useState<Contest | null>(null)

  function handleNewContest() {
    setPage('new-contest')
  }

  function handleContestConfiguration(
    name: string,
    rounds: number,
    selectedFormat: ContestFormat,
    selectedMode: ContestMode,
  ) {
    setContestName(name)
    setTotalRounds(rounds)
    setFormat(selectedFormat)
    setMode(selectedMode)

    setPage('participants')
  }

  function handleParticipants(
    newPlayers: Player[],
    newTeams: Team[],
  ) {
    const newContest = createContest({
      name: contestName,
      totalRounds,
      format,
      mode,
      players: newPlayers,
      teams: newTeams,
    })

    setContest(newContest)
    setPage('contest')
  }

  function handleScoreChange(
    roundId: string,
    matchId: string,
    team: 'A' | 'B',
    score: number | null,
  ) {
    setContest((currentContest) => {
      if (!currentContest) {
        return currentContest
      }

      return {
        ...currentContest,
        rounds: currentContest.rounds.map(
          (round) => {
            if (round.id !== roundId) {
              return round
            }

            return {
              ...round,
              matches: round.matches.map(
                (match) => {
                  if (match.id !== matchId) {
                    return match
                  }

                  return {
                    ...match,
                    ...(team === 'A'
                      ? { scoreA: score }
                      : { scoreB: score }),
                  }
                },
              ),
            }
          },
        ),
      }
    })
  }

  return (
    <>
      {page === 'new-contest' && (
        <NewContestPage
          onBack={() => setPage('home')}
          onContinue={
            handleContestConfiguration
          }
        />
      )}

      {page === 'participants' && (
        <ParticipantsPage
          name={contestName}
          totalRounds={totalRounds}
          format={format}
          mode={mode}
          onBack={() =>
            setPage('new-contest')
          }
          onContinue={handleParticipants}
        />
      )}

      {page === 'contest' && contest && (
        <ContestPage
          contest={contest}
          onBack={() =>
            setPage('participants')
          }
          onScoreChange={handleScoreChange}
        />
      )}

      {page === 'home' && (
        <HomePage
          onNewContest={handleNewContest}
        />
      )}
    </>
  )
}

export default App