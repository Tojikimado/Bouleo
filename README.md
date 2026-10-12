# Bouleo

Application Windows pour organiser des concours de pétanque.
Développée avec Electron, React et TypeScript, elle fonctionne entièrement
hors ligne, sans compte ni base de données.

## Fonctionnalités

- Tête-à-tête, doublette et triplette.
- Équipes fixes ou mêlée-démêlée.
- Génération des parties et gestion des exemptions.
- Saisie et correction des scores.
- Classement par victoires, puis goal-average, avec gestion des ex æquo.
- Sauvegarde automatique et reprise des concours.

## Développement

Prérequis : Node.js et npm.

```sh
npm ci
npm run dev
```

## Vérifications

```sh
npm test
npm run lint
npm run typecheck
npm run format:check
```

Pour formater le projet : `npm run format`.

## Compilation Windows

Depuis Windows :

```sh
npm run build:win
```

L'installateur est généré dans `release/<version>/`.
Pour compiler sans créer d'installateur : `npm run build`.

L'installateur n'est pas signé pour le moment.

## Sauvegardes

Les concours sont enregistrés en JSON dans le dossier `contests` du répertoire
Electron `userData`, généralement `%APPDATA%\Bouleo\contests` pour l'application
installée. Ils sont conservés séparément des fichiers du programme.
