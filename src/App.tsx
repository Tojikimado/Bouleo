import { useEffect, useState } from 'react'

import './App.css'

import HomePage from './pages/Home/HomePage'
import NewContestPage from './pages/NewContest/NewContestPage'
import ParticipantsPage from './pages/Participants/ParticipantsPage'
import ContestPage from './pages/Contest/ContestPage'
import RankingPage from './pages/Ranking/RankingPage'
import OpenContestPage from './pages/OpenContest/OpenContestPage'

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
  | 'ranking'
  | 'open-contest'

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

  useEffect(() => {
    if (!contest) {
      return
    }

    void window.bouleo.saveContest(contest)
  }, [contest])

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

  function handleNextRound() {
    setContest((currentContest) => {
      if (!currentContest) {
        return currentContest
      }

      if (
        currentContest.currentRound >=
        currentContest.totalRounds
      ) {
        return currentContest
      }

      return {
        ...currentContest,
        currentRound:
          currentContest.currentRound + 1,
      }
    })
  }

  function handlePreviousRound() {
    setContest((currentContest) => {
      if (!currentContest) {
        return currentContest
      }

      if (currentContest.currentRound <= 1) {
        return currentContest
      }

      return {
        ...currentContest,
        currentRound:
          currentContest.currentRound - 1,
      }
    })
  }

  function handleShowRanking() {
    setPage('ranking')
  }

  return (
    <div className="app">
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
          onNextRound={handleNextRound}
          onPreviousRound={handlePreviousRound}
          onShowRanking={handleShowRanking}
        />
      )}

      {page === 'ranking' && contest && (
        <RankingPage
          contest={contest}
          onBack={() => setPage('contest')}
          onBackHome={() => setPage('home')}
        />
      )}

      {page === 'home' && (
        <HomePage
          onNewContest={handleNewContest}
          onOpenContest={() =>
            setPage('open-contest')
          }
        />
      )}

      {page === 'open-contest' && (
        <OpenContestPage
          onBack={() => setPage('home')}
          onOpenContest={(loadedContest) => {
      setContest(loadedContest)
      setPage('contest')
    }}
        />
      )}
    </div>
  )
}

export default App