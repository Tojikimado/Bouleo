import { useState } from 'react'

import './App.css'

import HomePage from './pages/Home/HomePage'
import NewContestPage from './pages/NewContest/NewContestPage'
import ParticipantsPage from './pages/Participants/ParticipantsPage'
import ContestPage from './pages/Contest/ContestPage'
import RankingPage from './pages/Ranking/RankingPage'
import OpenContestPage from './pages/OpenContest/OpenContestPage'
import ConfirmModal from './components/ConfirmModal/ConfirmModal'

import type {
  Contest,
  ContestFormat,
  ContestMode,
  ContestConfiguration,
  ParticipantsDraft,
} from './types/contest'
import type { Player } from './types/player'
import type { Team } from './types/team'

import {
  requiresRegeneration,
  updateContest,
  setMatchScore,
  moveRound,
  hasRecordedScores,
} from './utils/updateContest'
import { useContestSaving } from './utils/useContestSaving'

type Page =
  'home' | 'new-contest' | 'participants' | 'contest' | 'ranking' | 'open-contest'

function App() {
  const [page, setPage] = useState<Page>('home')

  const [contest, setContest] = useState<Contest | null>(null)

  const [configuration, setConfiguration] = useState<ContestConfiguration | null>(null)
  const [pendingContest, setPendingContest] = useState<Contest | null>(null)
  const [editError, setEditError] = useState('')
  const [participantsDraft, setParticipantsDraft] = useState<ParticipantsDraft | null>(
    null,
  )
  const saving = useContestSaving(contest)
  const activeConfiguration = configuration ?? contest

  function handleNewContest() {
    if (saving.failed) {
      return
    }
    setContest(null)
    setConfiguration(null)
    setParticipantsDraft(null)
    setEditError('')
    setPage('new-contest')
  }

  function handleContestConfiguration(
    name: string,
    totalRounds: number,
    format: ContestFormat,
    mode: ContestMode,
  ) {
    // Le brouillon ne remplace jamais le concours sauvegardé avant validation.
    setConfiguration({ name, totalRounds, format, mode })
    setPage('participants')
  }

  function commitContest(next: Contest) {
    setContest(next)
    setConfiguration(null)
    setPendingContest(null)
    setParticipantsDraft(null)
    setEditError('')
    setPage('contest')
  }

  function handleParticipants(players: Player[], teams: Team[]) {
    const config = configuration ?? contest
    if (!config) {
      return
    }
    try {
      const regenerate = requiresRegeneration(contest, config, players, teams)
      const next = updateContest(contest, config, players, teams)
      if (regenerate && contest && hasRecordedScores(contest)) {
        setPendingContest(next)
      } else {
        commitContest(next)
      }
    } catch (error) {
      setEditError(
        error instanceof Error ? error.message : 'Impossible de préparer le concours.',
      )
    }
  }

  function handleScoreChange(
    roundId: string,
    matchId: string,
    team: 'A' | 'B',
    score: number | null,
  ) {
    setContest((current) =>
      current ? setMatchScore(current, roundId, matchId, team, score) : null,
    )
  }

  function changeRound(direction: -1 | 1) {
    setContest((current) => (current ? moveRound(current, direction) : null))
  }

  function goHome() {
    setConfiguration(null)
    setParticipantsDraft(null)
    setEditError('')
    setPage('home')
  }

  async function showSavedContests() {
    try {
      await saving.flush()
      setPage('open-contest')
    } catch {
      // Le message de sauvegarde propose de reessayer sans perdre les modifications.
    }
  }

  function openContest(loaded: Contest) {
    setConfiguration(null)
    setParticipantsDraft(null)
    setEditError('')
    setContest(loaded)
    setPage(loaded.rounds.length ? 'contest' : 'participants')
  }

  function handleShowRanking() {
    setPage('ranking')
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-brand">Bouleo</span>
        <span>Gestion de concours de pétanque</span>
      </header>
      {saving.status && (
        <div className="save-status" role={saving.failed ? 'alert' : 'status'}>
          {saving.status}
          {saving.failed && (
            <button type="button" onClick={saving.retry}>
              Réessayer
            </button>
          )}
        </div>
      )}
      {editError && (
        <p className="edit-error" role="alert">
          {editError}
        </p>
      )}
      {page === 'new-contest' && (
        <NewContestPage
          contest={activeConfiguration}
          onBack={goHome}
          onContinue={handleContestConfiguration}
        />
      )}

      {page === 'participants' && activeConfiguration && (
        <ParticipantsPage
          contest={contest}
          draft={participantsDraft}
          name={activeConfiguration.name}
          totalRounds={activeConfiguration.totalRounds}
          format={activeConfiguration.format}
          mode={activeConfiguration.mode}
          onBack={(draft) => {
            setParticipantsDraft(draft)
            setPage('new-contest')
          }}
          onContinue={handleParticipants}
        />
      )}

      {page === 'contest' && contest && (
        <ContestPage
          contest={contest}
          onBack={() => setPage('participants')}
          onScoreChange={handleScoreChange}
          onNextRound={() => changeRound(1)}
          onPreviousRound={() => changeRound(-1)}
          onShowRanking={handleShowRanking}
        />
      )}

      {page === 'ranking' && contest && (
        <RankingPage
          contest={contest}
          onBack={() => setPage('contest')}
          onBackHome={goHome}
        />
      )}

      {page === 'home' && (
        <HomePage onNewContest={handleNewContest} onOpenContest={showSavedContests} />
      )}

      {page === 'open-contest' && (
        <OpenContestPage onBack={goHome} onOpenContest={openContest} />
      )}

      <footer className="app-footer">
        <span>Pétanque sportive Saint-Porquier</span>
        <span>Vos concours sont enregistrés sur cet ordinateur</span>
      </footer>
      <ConfirmModal
        open={pendingContest !== null}
        title="Régénérer les parties ?"
        message="Modifier ces paramètres nécessitera de régénérer les parties. Tous les scores actuels seront perdus."
        confirmLabel="Continuer"
        cancelLabel="Annuler"
        onConfirm={() => {
          if (pendingContest) {
            commitContest(pendingContest)
          }
        }}
        onCancel={() => setPendingContest(null)}
      />
    </div>
  )
}

export default App
