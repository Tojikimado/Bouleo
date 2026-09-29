import type { Player } from '../types/player'
import type { Team } from '../types/team'

interface PairHistory {
  [playerId: string]: {
    [otherPlayerId: string]: number
  }
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array]

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))

    ;[result[i], result[j]] = [result[j], result[i]]
  }

  return result
}

function getPairCount(
  history: PairHistory,
  playerA: string,
  playerB: string,
): number {
  return history[playerA]?.[playerB] ?? 0
}

function addPair(
  history: PairHistory,
  playerA: string,
  playerB: string,
): void {
  history[playerA] ??= {}
  history[playerB] ??= {}

  history[playerA][playerB] =
    (history[playerA][playerB] ?? 0) + 1

  history[playerB][playerA] =
    (history[playerB][playerA] ?? 0) + 1
}

function createTeam(players: Player[]): Team {
  return {
    id: crypto.randomUUID(),
    players,
  }
}

function calculateTeammateScore(
  teams: Team[],
  history: PairHistory,
): number {
  let score = 0

  for (const team of teams) {
    for (let i = 0; i < team.players.length; i++) {
      for (let j = i + 1; j < team.players.length; j++) {
        score += getPairCount(
          history,
          team.players[i].id,
          team.players[j].id,
        )
      }
    }
  }

  return score
}

function calculateOpponentScore(
  teams: Team[],
  history: PairHistory,
): number {
  let score = 0

  for (let i = 0; i < teams.length; i += 2) {
    const teamA = teams[i]
    const teamB = teams[i + 1]

    for (const playerA of teamA.players) {
      for (const playerB of teamB.players) {
        const count = getPairCount(
          history,
          playerA.id,
          playerB.id,
        )

        score += count
      }
    }
  }

  return score
}

function generateCandidateTeams(
  players: Player[],
  teamSize: 1|  2 | 3,
): Team[] {
  const shuffledPlayers = shuffle(players)
  const teams: Team[] = []

  for (let i = 0; i < shuffledPlayers.length; i += teamSize) {
    teams.push(
      createTeam(
        shuffledPlayers.slice(i, i + teamSize),
      ),
    )
  }

  return teams
}

export function generateMeleeTeams(
  players: Player[],
  teamSize: 1 | 2 | 3,
  numberOfRounds: number,
): Team[][] {
  if (players.length % teamSize !== 0) {
    throw new Error(
      'Le nombre de joueurs ne permet pas de former des équipes complètes.',
    )
  }

  if (numberOfRounds < 1) {
    throw new Error('Il faut au moins une partie.')
  }

  const teammateHistory: PairHistory = {}
  const opponentHistory: PairHistory = {}

  const rounds: Team[][] = []

  for (let round = 0; round < numberOfRounds; round++) {
    let bestTeams: Team[] | null = null
    let bestTeammateScore = Infinity
    let bestOpponentScore = Infinity

    const attempts = 5000

    for (let attempt = 0; attempt < attempts; attempt++) {
      const candidateTeams = generateCandidateTeams(
        players,
        teamSize,
      )

      const teammateScore = calculateTeammateScore(
        candidateTeams,
        teammateHistory,
      )

      const opponentScore = calculateOpponentScore(
        candidateTeams,
        opponentHistory,
      )

      /*
       * Les coéquipiers sont prioritaires.
       *
       * Une composition avec 0 répétition de coéquipier
       * sera toujours préférée à une composition avec
       * 1 répétition, même si cette dernière a moins
       * de répétitions d'adversaires.
       */
      if (
        teammateScore < bestTeammateScore ||
        (
          teammateScore === bestTeammateScore &&
          opponentScore < bestOpponentScore
        )
      ) {
        bestTeams = candidateTeams
        bestTeammateScore = teammateScore
        bestOpponentScore = opponentScore
      }

      /*
       * Pour un round parfait concernant les coéquipiers,
       * inutile de continuer à chercher une meilleure
       * composition sur ce critère.
       *
       * On garde cependant les essais précédents pour
       * l'aléatoire et la comparaison des adversaires.
       */
    }

    if (!bestTeams) {
      throw new Error(
        'Impossible de générer les équipes.',
      )
    }

    // Enregistrer les coéquipiers.
    for (const team of bestTeams) {
      for (let i = 0; i < team.players.length; i++) {
        for (let j = i + 1; j < team.players.length; j++) {
          addPair(
            teammateHistory,
            team.players[i].id,
            team.players[j].id,
          )
        }
      }
    }

    // Enregistrer les adversaires.
    for (let i = 0; i < bestTeams.length; i += 2) {
      const teamA = bestTeams[i]
      const teamB = bestTeams[i + 1]

      for (const playerA of teamA.players) {
        for (const playerB of teamB.players) {
          addPair(
            opponentHistory,
            playerA.id,
            playerB.id,
          )
        }
      }
    }

    rounds.push(bestTeams)
  }

  return rounds
}