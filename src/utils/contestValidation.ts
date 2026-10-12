import type { Contest, ContestFormat } from '../types/contest'
import type { SavedContest } from '../types/storage'
import {
  assertRoundCount,
  BYE_SCORE,
  getTeamSize,
  MIN_TEAMS,
  isScore,
} from './contestRules'

export function assertId(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(value)) {
    throw new Error('Identifiant de concours ou de participant invalide.')
  }
}

function assertObject(value: unknown): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Structure du concours invalide.')
  }
}

function assertArray(value: unknown): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new Error('Liste du concours invalide.')
  }
}

function assertName(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Nom manquant.')
  }
}

function assertUnique(ids: string[]): void {
  if (new Set(ids).size !== ids.length) {
    throw new Error('Identifiants en double.')
  }
}

function assertFormat(value: unknown): asserts value is ContestFormat {
  if (value !== 'tete-a-tete' && value !== 'doublette' && value !== 'triplette') {
    throw new Error('Format de concours invalide.')
  }
}

// Retourner les identifiants permet ensuite de vérifier qui joue dans chaque partie.
function validateTeam(
  value: unknown,
  players: Map<string, string>,
  size: number,
  allowPartial: boolean,
) {
  assertObject(value)
  assertId(value.id)
  assertArray(value.players)
  if (
    value.players.length < 1 ||
    value.players.length > size ||
    (!allowPartial && value.players.length !== size)
  ) {
    throw new Error('Taille d’équipe invalide.')
  }
  const playerIds = value.players.map((player) => {
    assertObject(player)
    assertId(player.id)
    assertName(player.name)
    if (players.get(player.id) !== player.name) {
      throw new Error('Joueur inconnu ou incohérent.')
    }
    return player.id
  })
  assertUnique(playerIds)
  return { id: value.id, players: playerIds }
}

export function assertContest(value: unknown): asserts value is Contest {
  assertObject(value)
  assertId(value.id)
  assertName(value.name)
  if (typeof value.totalRounds !== 'number') {
    throw new Error('Nombre de parties invalide.')
  }
  assertRoundCount(value.totalRounds)
  assertFormat(value.format)
  if (value.mode !== 'fixed-teams' && value.mode !== 'melee-demelee') {
    throw new Error('Mode de concours invalide.')
  }
  assertArray(value.players)
  assertArray(value.teams)
  assertArray(value.rounds)
  if (
    typeof value.currentRound !== 'number' ||
    !Number.isInteger(value.currentRound) ||
    value.currentRound < 1 ||
    value.currentRound > value.totalRounds
  ) {
    throw new Error('Partie courante invalide.')
  }
  const players = new Map<string, string>()
  for (const player of value.players) {
    assertObject(player)
    assertId(player.id)
    assertName(player.name)
    if (players.has(player.id)) {
      throw new Error('Joueur en double.')
    }
    players.set(player.id, player.name)
  }
  const size = getTeamSize(value.format)
  const teams = value.teams.map((item) => validateTeam(item, players, size, false))
  assertUnique(teams.map((item) => item.id))
  const fixed = value.mode === 'fixed-teams'
  if (fixed && teams.length) {
    const ids = teams.flatMap((item) => item.players)
    assertUnique(ids)
    if (ids.length !== players.size) {
      throw new Error('Composition des équipes incohérente.')
    }
  }
  // Les anciens brouillons sans parties peuvent être repris dans le formulaire.
  if (value.rounds.length === 0) {
    if (value.currentRound !== 1) {
      throw new Error('Brouillon invalide.')
    }
    return
  }
  if (
    value.rounds.length !== value.totalRounds ||
    (fixed ? teams.length < MIN_TEAMS : players.size < size * MIN_TEAMS)
  ) {
    throw new Error('Concours incomplet.')
  }
  const roundIds: string[] = []
  const matchIds: string[] = []
  for (const [index, round] of value.rounds.entries()) {
    assertObject(round)
    assertId(round.id)
    assertArray(round.matches)
    roundIds.push(round.id)
    if (round.number !== index + 1) {
      throw new Error('Numérotation des parties invalide.')
    }
    const participants: string[] = []
    for (const match of round.matches) {
      assertObject(match)
      assertId(match.id)
      matchIds.push(match.id)
      if (match.isBye !== undefined && typeof match.isBye !== 'boolean') {
        throw new Error('Exemption invalide.')
      }
      const bye = match.teamB === null
      if (match.isBye === true && !bye) {
        throw new Error('Exemption incohérente.')
      }
      for (const score of [match.scoreA, match.scoreB]) {
        if (score !== null && !isScore(score)) {
          throw new Error('Score invalide : entier de 0 à 13 attendu.')
        }
      }
      if (
        bye &&
        (match.scoreA !== BYE_SCORE.winner || match.scoreB !== BYE_SCORE.loser)
      ) {
        throw new Error('Score d’exemption invalide.')
      }
      for (const item of bye ? [match.teamA] : [match.teamA, match.teamB]) {
        const current = validateTeam(item, players, size, bye && !fixed)
        if (fixed) {
          const original = teams.find((t) => t.id === current.id)
          if (!original || original.players.join(',') !== current.players.join(',')) {
            throw new Error('Équipe inconnue.')
          }
        }
        participants.push(...current.players)
      }
    }
    assertUnique(participants)
    if (participants.length !== players.size) {
      throw new Error('Participants manquants dans une partie.')
    }
  }
  assertUnique(roundIds)
  assertUnique(matchIds)
}

export function parseSavedContest(content: string, expectedId: string): SavedContest {
  const saved: unknown = JSON.parse(content)
  assertObject(saved)
  if (saved.version !== 1) {
    throw new Error('Version de sauvegarde non prise en charge.')
  }
  if (typeof saved.savedAt !== 'string' || !Number.isFinite(Date.parse(saved.savedAt))) {
    throw new Error('Date de sauvegarde invalide.')
  }
  assertContest(saved.contest)
  if (saved.contest.id !== expectedId) {
    throw new Error('Identifiant différent du fichier de sauvegarde.')
  }
  return { version: 1, savedAt: saved.savedAt, contest: saved.contest }
}
