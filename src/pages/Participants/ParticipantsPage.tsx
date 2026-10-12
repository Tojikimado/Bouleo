import { useState } from 'react'

import './ParticipantsPage.css'

import type {
  Contest,
  ContestFormat,
  ContestMode,
  ParticipantsDraft,
} from '../../types/contest'
import type { Player } from '../../types/player'
import type { Team } from '../../types/team'
import { getTeamSize, getMinimumParticipants, MIN_TEAMS } from '../../utils/contestRules'
import { requiresRegeneration } from '../../utils/updateContest'

interface ParticipantsPageProps {
  contest: Contest | null
  name: string
  totalRounds: number
  format: ContestFormat
  mode: ContestMode
  draft?: ParticipantsDraft | null
  onBack: (draft: ParticipantsDraft) => void
  onContinue: (players: Player[], teams: Team[]) => void
}

function ParticipantsPage({
  contest,
  draft,
  name,
  totalRounds,
  format,
  mode,
  onBack,
  onContinue,
}: ParticipantsPageProps) {
  const teamSize = getTeamSize(format)

  const minimumParticipants = getMinimumParticipants(format, mode)

  const [teams, setTeams] = useState<Team[]>(() => {
    const initialTeams = (draft ?? contest)?.teams ?? []
    const inputs = initialTeams.length
      ? initialTeams
      : Array.from({ length: MIN_TEAMS }, () => ({
          id: crypto.randomUUID(),
          players: [],
        }))
    return inputs.map((team) => ({
      id: team.id,
      players: Array.from({ length: teamSize }, (_, index) => ({
        id: team.players[index]?.id ?? crypto.randomUUID(),
        name: team.players[index]?.name ?? '',
      })),
    }))
  })

  const [players, setPlayers] = useState<Player[]>(
    () => (draft ?? contest)?.players.map((player) => ({ ...player })) ?? [],
  )

  function addTeam() {
    setTeams((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        players: Array.from({ length: teamSize }, () => ({
          id: crypto.randomUUID(),
          name: '',
        })),
      },
    ])
  }

  function updateTeamPlayer(teamId: string, playerIndex: number, name: string) {
    setTeams((current) =>
      current.map((team) => {
        if (team.id !== teamId) {
          return team
        }
        const updatedPlayers = team.players.map((player, index) => {
          if (index === playerIndex) {
            return { ...player, name }
          }
          return player
        })
        return { ...team, players: updatedPlayers }
      }),
    )
  }

  function removeTeam(teamId: string) {
    setTeams((currentTeams) => currentTeams.filter((team) => team.id !== teamId))
  }

  function addPlayer() {
    setPlayers((currentPlayers) => [
      ...currentPlayers,
      { id: crypto.randomUUID(), name: '' },
    ])
  }

  function updatePlayer(index: number, value: string) {
    setPlayers((currentPlayers) => {
      const updatedPlayers = [...currentPlayers]

      updatedPlayers[index] = { ...updatedPlayers[index], name: value }

      return updatedPlayers
    })
  }

  function removePlayer(index: number) {
    setPlayers((currentPlayers) =>
      currentPlayers.filter((_, playerIndex) => playerIndex !== index),
    )
  }

  function handleContinue() {
    if (!canContinue) {
      return
    }

    const trimName = (player: Player): Player => ({ ...player, name: player.name.trim() })
    if (mode === 'fixed-teams') {
      const resultTeams = teams.map((team) => ({
        ...team,
        players: team.players.map(trimName),
      }))
      onContinue(
        resultTeams.flatMap((team) => team.players),
        resultTeams,
      )
    } else {
      onContinue(players.map(trimName), [])
    }
  }

  const fixedPlayers = teams.flatMap((team) => team.players)

  const participantCount = mode === 'fixed-teams' ? teams.length : players.length

  const activePlayers = mode === 'fixed-teams' ? fixedPlayers : players
  const allNamesFilled = activePlayers.every((player) => player.name.trim() !== '')

  const canContinue = participantCount >= minimumParticipants && allNamesFilled
  const regenerate = requiresRegeneration(
    contest,
    { name, totalRounds, format, mode },
    activePlayers,
    mode === 'fixed-teams' ? teams : [],
  )

  return (
    <main className="participants-page">
      <div className="participants-content">
        <button className="participants-back" onClick={() => onBack({ teams, players })}>
          ← Retour
        </button>

        <div className="participants-header">
          <h1>Participants</h1>

          <p>
            {name} — {totalRounds} parties
          </p>
        </div>

        {mode === 'fixed-teams' ? (
          <>
            <div className="participants-teams-container">
              <div className="participants-grid">
                {teams.map((team, teamIndex) => (
                  <div className="team-card" key={team.id}>
                    <div className="team-card-header">
                      <h2>Équipe {teamIndex + 1}</h2>

                      {teams.length > MIN_TEAMS && (
                        <button
                          className="team-remove-button"
                          onClick={() => removeTeam(team.id)}
                        >
                          Supprimer
                        </button>
                      )}
                    </div>

                    <div className="team-card-players">
                      {team.players.map((player, playerIndex) => (
                        <input
                          key={player.id}
                          type="text"
                          aria-label={`Joueur ${playerIndex + 1}, équipe ${teamIndex + 1}`}
                          value={player.name}
                          onChange={(event) =>
                            updateTeamPlayer(team.id, playerIndex, event.target.value)
                          }
                          placeholder={
                            teamSize === 1 ? 'Nom du joueur' : `Joueur ${playerIndex + 1}`
                          }
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button className="participants-add-button" onClick={addTeam}>
              + Nouvelle équipe
            </button>
          </>
        ) : (
          <>
            <div className="players-list">
              {players.map((player, index) => (
                <div className="player-row" key={player.id}>
                  <input
                    type="text"
                    aria-label={`Joueur ${index + 1}`}
                    value={player.name}
                    onChange={(event) => updatePlayer(index, event.target.value)}
                    placeholder="Nom du joueur"
                  />

                  <button
                    className="player-remove-button"
                    onClick={() => removePlayer(index)}
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>

            <button className="participants-add-button" onClick={addPlayer}>
              + Ajouter un joueur
            </button>
          </>
        )}

        {!canContinue && (
          <p className="participants-validation">
            Minimum requis : {minimumParticipants}{' '}
            {mode === 'fixed-teams' ? 'équipes' : 'joueurs'}
          </p>
        )}

        <div className="participants-actions">
          <span>{activePlayers.length} joueurs inscrits</span>
          <button
            className="participants-continue"
            onClick={handleContinue}
            disabled={!canContinue}
          >
            {regenerate ? 'Générer les parties' : 'Continuer'} →
          </button>
        </div>
      </div>
    </main>
  )
}

export default ParticipantsPage
