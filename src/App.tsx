import { useEffect, useState } from 'react'

import './App.css'

import HomePage from './pages/Home/HomePage'
import NewContestPage from './pages/NewContest/NewContestPage'
import ParticipantsPage from './pages/Participants/ParticipantsPage'
import ContestPage from './pages/Contest/ContestPage'
import RankingPage from './pages/Ranking/RankingPage'
import OpenContestPage from './pages/OpenContest/OpenContestPage'
import ConfirmModal from './components/ConfirmModal/ConfirmModal'

import type { Contest, ContestFormat, ContestMode } from './types/contest'
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

  const [contest, setContest] =
    useState<Contest | null>(null)
  
  const [pendingStructureChange, setPendingStructureChange] = 
    useState(false)

  const [showStructureChangeModal, setShowStructureChangeModal] =
    useState(false)

  const [pendingConfiguration, setPendingConfiguration] =
    useState<{
      name: string
      rounds: number
      format: ContestFormat
      mode: ContestMode
    } | null>(null)

  useEffect(() => {
    if (!contest) {
      return
    }

    void window.bouleo.saveContest(contest)
  }, [contest])

  function handleNewContest() {
    setContest(null)
    setPage('new-contest')
  }

  function applyContestConfiguration(
    name: string,
    rounds: number,
    selectedFormat: ContestFormat,
    selectedMode: ContestMode,
  ) {
    const structureChanged =
      contest !== null &&
      contest.rounds.length > 0 &&
      (
        contest.totalRounds !== rounds ||
        contest.format !== selectedFormat ||
        contest.mode !== selectedMode
      )

    setPendingStructureChange(structureChanged)

    setContest((currentContest) => ({
      id: currentContest?.id ?? crypto.randomUUID(),
      name,
      totalRounds: rounds,
      format: selectedFormat,
      mode: selectedMode,
      players: currentContest?.players ?? [],
      teams: currentContest?.teams ?? [],
      rounds: currentContest?.rounds ?? [],
      currentRound: currentContest?.currentRound ?? 1,
    }))

    setPage('participants')
  }

  function handleContestConfiguration(
    name: string,
    rounds: number,
    selectedFormat: ContestFormat,
    selectedMode: ContestMode,
  ) {
    const structureChanged =
      contest !== null &&
      contest.rounds.length > 0 &&
      (
        contest.totalRounds !== rounds ||
        contest.format !== selectedFormat ||
        contest.mode !== selectedMode
      )

    const hasScores =
      contest?.rounds.some((round) =>
        round.matches.some(
          (match) =>
            match.scoreA !== null ||
            match.scoreB !== null,
        ),
      ) ?? false

    if (structureChanged && hasScores) {
      setPendingConfiguration({
        name,
        rounds,
        format: selectedFormat,
        mode: selectedMode,
      })

      setShowStructureChangeModal(true)

      return
    }

    applyContestConfiguration(
      name,
      rounds,
      selectedFormat,
      selectedMode,
    )
  }

  function handleCancelStructureChange() {
    setShowStructureChangeModal(false)
    setPendingConfiguration(null)
  }

  function handleConfirmStructureChange() {
    if (!pendingConfiguration) {
      return
    }

    const {
      name,
      rounds,
      format,
      mode,
    } = pendingConfiguration

    setShowStructureChangeModal(false)
    setPendingConfiguration(null)

    applyContestConfiguration(
      name,
      rounds,
      format,
      mode,
    )
  }

  function handleParticipants(
    newPlayers: Player[],
    newTeams: Team[],
  ) {
    if (!contest) {
      return
    }

    const sameIds = (
      first: string[],
      second: string[],
    ) =>
      first.length === second.length &&
      first.every((id, index) => id === second[index])

    const participantsStructureChanged =
      contest.mode === 'fixed-teams'
        ? (
            !sameIds(
              contest.teams.map((team) => team.id),
              newTeams.map((team) => team.id),
            ) ||
            contest.teams.some((team) => {
              const updatedTeam = newTeams.find(
                (candidate) => candidate.id === team.id,
              )

              return (
                !updatedTeam ||
                team.players.length !==
                  updatedTeam.players.length
              )
            })
          )
        : contest.players.length !== newPlayers.length

    const mustRegenerate =
      contest.rounds.length === 0 ||
      pendingStructureChange ||
      participantsStructureChanged

    if (mustRegenerate) {
      const hasScores =
        contest.rounds.some((round) =>
          round.matches.some(
            (match) =>
              match.scoreA !== null ||
              match.scoreB !== null,
          ),
        )

      if (
        !pendingStructureChange &&
        contest.rounds.length > 0 &&
        participantsStructureChanged &&
        hasScores &&
        !window.confirm(
          'Modifier les participants nécessitera de régénérer les parties. Tous les scores actuels seront perdus. Voulez-vous continuer ?',
        )
      ) {
        return
      }

      const regeneratedContest = createContest({
        name: contest.name,
        totalRounds: contest.totalRounds,
        format: contest.format,
        mode: contest.mode,
        players: newPlayers,
        teams: newTeams,
      })

      setContest({
        ...regeneratedContest,
        id: contest.id,
      })

      setPendingStructureChange(false)
      setPage('contest')
      return
    }

    // Aucun changement structurel :
    // on actualise les noms sans perdre les scores.
    const updatedPlayers = new Map(
      newPlayers.map((player) => [
        player.id,
        player,
      ]),
    )

    const updatedTeams = new Map(
      newTeams.map((team) => [
        team.id,
        {
          ...team,
          players: team.players.map(
            (player) =>
              updatedPlayers.get(player.id) ?? player,
          ),
        },
      ]),
    )

    setContest((currentContest) => {
      if (!currentContest) {
        return currentContest
      }

      return {
        ...currentContest,
        players: newPlayers,
        teams: newTeams,
        rounds: currentContest.rounds.map((round) => ({
          ...round,
          matches: round.matches.map((match) => ({
            ...match,
            teamA:
              updatedTeams.get(match.teamA.id) ?? {
                ...match.teamA,
                players: match.teamA.players.map(
                  (player) =>
                    updatedPlayers.get(player.id) ?? player,
                ),
              },
            teamB:
              updatedTeams.get(match.teamB.id) ?? {
                ...match.teamB,
                players: match.teamB.players.map(
                  (player) =>
                    updatedPlayers.get(player.id) ?? player,
                ),
              },
          })),
        })),
      }
    })

    setPendingStructureChange(false)
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
        contest={contest}
          onBack={() => setPage('home')}
          onContinue={
            handleContestConfiguration
          }
        />
      )}

      {page === 'participants' && (
        <ParticipantsPage
        contest={contest}
          name={contest?.name ?? ''}
          totalRounds={contest?.totalRounds ?? 0}
          format={
            contest?.format ?? 'tete-a-tete'
          }
          mode={
            contest?.mode ?? 'fixed-teams'
          }
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

      <ConfirmModal
        open={showStructureChangeModal}
        title="Modifier la configuration ?"
        message="Modifier ces paramètres nécessitera de régénérer les parties. Tous les scores actuels seront perdus."
        confirmLabel="Continuer"
        cancelLabel="Annuler"
        onConfirm={handleConfirmStructureChange}
        onCancel={handleCancelStructureChange}
      />
      
    </div>
  )
}

export default App