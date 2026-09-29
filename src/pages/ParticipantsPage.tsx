import { useState } from 'react'

import type {
  ContestFormat,
  ContestMode,
} from '../types/contest'
import type { Player } from '../types/player'
import type { Team } from '../types/team'

interface ParticipantsPageProps {
  name: string
  totalRounds: number
  format: ContestFormat
  mode: ContestMode
  onBack: () => void
  onContinue: (
    players: Player[],
    teams: Team[],
  ) => void
}

interface TeamInput {
  id: string
  players: string[]
}

function getTeamSize(
  format: ContestFormat,
): number {
  switch (format) {
    case 'tete-a-tete':
      return 1

    case 'doublette':
      return 2

    case 'triplette':
      return 3
  }
}

function getMinimumParticipants(
  format: ContestFormat,
  mode: ContestMode,
): number {
  if (mode === 'fixed-teams') {
    return 4
  }

  switch (format) {
    case 'tete-a-tete':
      return 4

    case 'doublette':
      return 8

    case 'triplette':
      return 12
  }
}

function ParticipantsPage({
  name,
  totalRounds,
  format,
  mode,
  onBack,
  onContinue,
}: ParticipantsPageProps) {
  const teamSize = getTeamSize(format)

  const minimumParticipants =
    getMinimumParticipants(format, mode)

  const [teams, setTeams] = useState<TeamInput[]>([
    {
      id: crypto.randomUUID(),
      players: Array(teamSize).fill(''),
    },
    {
      id: crypto.randomUUID(),
      players: Array(teamSize).fill(''),
    },
    {
      id: crypto.randomUUID(),
      players: Array(teamSize).fill(''),
    },
    {
      id: crypto.randomUUID(),
      players: Array(teamSize).fill(''),
    },
  ])

  const [players, setPlayers] = useState<string[]>(
    [],
  )

  function addTeam() {
    setTeams((currentTeams) => [
      ...currentTeams,
      {
        id: crypto.randomUUID(),
        players: Array(teamSize).fill(''),
      },
    ])
  }

  function updateTeamPlayer(
    teamId: string,
    playerIndex: number,
    value: string,
  ) {
    setTeams((currentTeams) =>
      currentTeams.map((team) => {
        if (team.id !== teamId) {
          return team
        }

        const updatedPlayers = [...team.players]

        updatedPlayers[playerIndex] = value

        return {
          ...team,
          players: updatedPlayers,
        }
      }),
    )
  }

  function removeTeam(teamId: string) {
    setTeams((currentTeams) =>
      currentTeams.filter(
        (team) => team.id !== teamId,
      ),
    )
  }

  function addPlayer() {
    setPlayers((currentPlayers) => [
      ...currentPlayers,
      '',
    ])
  }

  function updatePlayer(
    index: number,
    value: string,
  ) {
    setPlayers((currentPlayers) => {
      const updatedPlayers = [...currentPlayers]

      updatedPlayers[index] = value

      return updatedPlayers
    })
  }

  function removePlayer(index: number) {
    setPlayers((currentPlayers) =>
      currentPlayers.filter(
        (_, playerIndex) =>
          playerIndex !== index,
      ),
    )
  }

  function handleContinue() {
    if (!canContinue) {
      return
    }

    if (mode === 'fixed-teams') {
      const allPlayers: Player[] = []
      const resultTeams: Team[] = []

      for (const inputTeam of teams) {
        const teamPlayers: Player[] = []

        for (const playerName of inputTeam.players) {
          const player: Player = {
            id: crypto.randomUUID(),
            name: playerName.trim(),
          }

          allPlayers.push(player)
          teamPlayers.push(player)
        }

        resultTeams.push({
          id: inputTeam.id,
          players: teamPlayers,
        })
      }

      onContinue(
        allPlayers,
        resultTeams,
      )

      return
    }

    const resultPlayers: Player[] =
      players.map((playerName) => ({
        id: crypto.randomUUID(),
        name: playerName.trim(),
      }))

    onContinue(resultPlayers, [])
  }

  const fixedPlayers = teams.flatMap(
    (team) => team.players,
  )

  const participantCount =
    mode === 'fixed-teams'
      ? teams.length
      : players.length

  const allNamesFilled =
    mode === 'fixed-teams'
      ? fixedPlayers.every(
          (player) => player.trim() !== '',
        )
      : players.every(
          (player) => player.trim() !== '',
        )

  const canContinue =
    participantCount >= minimumParticipants &&
    allNamesFilled

  return (
    <main>
      <button onClick={onBack}>
        ← Retour
      </button>

      <h1>Participants</h1>

      <p>
        {name} — {totalRounds} parties
      </p>

      {mode === 'fixed-teams' ? (
        <>
          {teams.map((team, teamIndex) => (
            <div key={team.id}>
              <h2>
                Équipe {teamIndex + 1}
              </h2>

              {team.players.map(
                (player, playerIndex) => (
                  <input
                    key={playerIndex}
                    type="text"
                    value={player}
                    onChange={(event) =>
                      updateTeamPlayer(
                        team.id,
                        playerIndex,
                        event.target.value,
                      )
                    }
                    placeholder={
                      teamSize === 1
                        ? 'Nom du joueur'
                        : `Joueur ${playerIndex + 1}`
                    }
                  />
                ),
              )}

              {teams.length > 4 && (
                <button
                  onClick={() =>
                    removeTeam(team.id)
                  }
                >
                  Supprimer l'équipe
                </button>
              )}
            </div>
          ))}

          <button onClick={addTeam}>
            + Nouvelle équipe
          </button>
        </>
      ) : (
        <>
          {players.map((player, index) => (
            <div key={index}>
              <input
                type="text"
                value={player}
                onChange={(event) =>
                  updatePlayer(
                    index,
                    event.target.value,
                  )
                }
                placeholder="Nom du joueur"
              />

              <button
                onClick={() =>
                  removePlayer(index)
                }
              >
                Supprimer
              </button>
            </div>
          ))}

          <button onClick={addPlayer}>
            + Ajouter un joueur
          </button>
        </>
      )}

      {!canContinue && (
        <p>
          Minimum requis : {minimumParticipants}{' '}
          {mode === 'fixed-teams'
            ? 'équipes'
            : 'joueurs'}
        </p>
      )}

      <button
        onClick={handleContinue}
        disabled={!canContinue}
      >
        Continuer →
      </button>
    </main>
  )
}

export default ParticipantsPage