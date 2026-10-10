import { useState } from 'react'

import './ParticipantsPage.css'

import type { Contest, ContestFormat, ContestMode } from '../../types/contest'
import type { Player } from '../../types/player'
import type { Team } from '../../types/team'

interface ParticipantsPageProps {
  contest: Contest | null
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
  contest,
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

  const [teams, setTeams] = useState<TeamInput[]>(
    contest?.teams.length
      ? contest.teams.map((team) => ({
          id: team.id,
          players: Array.from(
            { length: teamSize },
            (_, index) =>
              team.players[index]?.name ?? '',
          ),
        }))
      : [
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
        ],
  )

  const [players, setPlayers] = useState<string[]>(
    contest?.players.map(
      (player) => player.name,
    ) ?? [],
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

        const existingTeam = contest?.teams.find(
          (team) => team.id === inputTeam.id,
        )

        for (
          let playerIndex = 0;
          playerIndex < inputTeam.players.length;
          playerIndex++
        ) {
          const playerName = inputTeam.players[playerIndex]

          const existingPlayer =
            existingTeam?.players[playerIndex]

          const player: Player = {
            id: existingPlayer?.id ?? crypto.randomUUID(),
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
      players.map((playerName, index) => ({
        id:
          contest?.players[index]?.id ??
          crypto.randomUUID(),
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
    <main className="participants-page">
      <div className="participants-content">
        <button
          className="participants-back"
          onClick={onBack}
        >
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
            <div
              className={`participants-teams-container ${
                teams.length >=
                  (format === 'tete-a-tete'
                    ? 13
                    : format === 'doublette'
                      ? 10
                      : 7)
                  ? 'is-scrollable'
                  : ''
              }`}
            >
          <div className="participants-grid">
            {teams.map((team, teamIndex) => (
              <div
                className="team-card"
                key={team.id}
              >
                <div className="team-card-header">
                  <h2>
                    Équipe {teamIndex + 1}
                  </h2>

                  {teams.length > 4 && (
                    <button
                      className="team-remove-button"
                      onClick={() =>
                        removeTeam(team.id)
                      }
                    >
                      Supprimer
                    </button>
                  )}
                </div>

                <div className="team-card-players">
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
                </div>
              </div>
            ))}
          </div>
        </div>

            <button
              className="participants-add-button"
              onClick={addTeam}
            >
              + Nouvelle équipe
            </button>
          </>
        ) : (
          <>
            <div
              className={`players-list ${
                players.length >= 8 ? 'is-scrollable' : ''
              }`}
            >
              {players.map((player, index) => (
                <div
                  className="player-row"
                  key={index}
                >
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
                    className="player-remove-button"
                    onClick={() =>
                      removePlayer(index)
                    }
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>

            <button
              className="participants-add-button"
              onClick={addPlayer}
            >
              + Ajouter un joueur
            </button>
          </>
        )}

        {!canContinue && (
          <p className="participants-validation">
            Minimum requis : {minimumParticipants}{' '}
            {mode === 'fixed-teams'
              ? 'équipes'
              : 'joueurs'}
          </p>
        )}

        <button
          className="participants-continue"
          onClick={handleContinue}
          disabled={!canContinue}
        >
          Continuer →
        </button>
      </div>
    </main>
  )
}

export default ParticipantsPage