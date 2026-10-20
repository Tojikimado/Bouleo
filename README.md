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

## Installation

Téléchargez l’installateur `Bouleo-Windows-<version>-Setup.exe` depuis les
[releases GitHub](https://github.com/Tojikimado/Bouleo/releases).

Lancez le fichier téléchargé, suivez les étapes d’installation,
puis ouvrez Bouleo depuis le raccourci créé sur le bureau ou dans le menu Démarrer.
L’application est prévue pour Windows 64 bits ; Node.js n’est pas nécessaire pour l’utiliser.

L’installateur n’est pas signé : Windows peut afficher un avertissement.
Utilisez uniquement un installateur fourni par une personne de confiance.

## Sauvegardes

Une fois les parties générées, les concours et leurs scores sont enregistrés
automatiquement sur l’ordinateur. Utilisez **Ouvrir un concours** pour les reprendre.
Les formulaires non validés ne sont pas sauvegardés.

Les fichiers JSON se trouvent dans le dossier `contests` du répertoire de données
de Bouleo, généralement `%APPDATA%\Bouleo\contests`.
Pour en conserver une copie ou les transférer sur un autre PC, fermez Bouleo
puis copiez ce dossier. La désinstallation conserve les sauvegardes.

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
