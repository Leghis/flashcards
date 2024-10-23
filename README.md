# FlashCards - Application d'Apprentissage par Cartes Mémoire

## Description
FlashCards est une application web moderne d'apprentissage par cartes mémoire, conçue pour faciliter l'apprentissage des langues, particulièrement l'anglais et le français. Elle utilise un système sophistiqué de répétition espacée et de suivi des progrès pour optimiser la mémorisation à long terme.

## Fonctionnalités Principales

### Système d'Apprentissage
- Cartes recto-verso interactives
- Alternance automatique entre anglais-français et français-anglais
- Système de progression rigoureux basé sur :
    - Minimum de 10 tentatives par mot
    - Taux de réussite requis de 80%
    - Séquence de 5 réussites consécutives nécessaire
- Pénalités pour les erreurs (-10% par erreur)

### Suivi des Progrès
- Statistiques détaillées par mot
- Indicateur de progression en pourcentage
- Système de "maîtrise" des mots
- Historique des performances

### Interface Utilisateur
- Design moderne et responsive
- Animations fluides
- Retours visuels instantanés
- Mode sombre/clair automatique

## Prérequis Techniques
- Node.js (version 16.x ou supérieure)
- npm ou yarn
- Navigateur web moderne

## Installation

```bash
# Cloner le repository
git clone [URL_DU_REPO]

# Installer les dépendances
npm install
# ou
yarn install

# Lancer le serveur de développement
npm run dev
# ou
yarn dev
```

## Structure du Projet
```
/
├── components/         # Composants React réutilisables
├── styles/            # Fichiers CSS et styles
├── lib/              # Fonctions utilitaires
├── types/            # Définitions TypeScript
└── app/              # Pages et layout principal
```

## Technologies Utilisées
- Next.js 13+
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion (animations)
- Shadcn/ui (composants UI)

## Algorithme d'Apprentissage

### Calcul de la Progression
```javascript
Progression = (Taux de réussite × 100) - (Nombre d'erreurs × 10)
```

### Critères de Maîtrise
- Minimum 10 tentatives
- Taux de réussite ≥ 80%
- 5 réussites consécutives

## Personnalisation

### Modification des Seuils
```typescript
const MASTERY_THRESHOLD = 10;    // Nombre minimum de tentatives
const MASTERY_RATIO = 0.8;       // Taux de réussite requis (80%)
const CONSECUTIVE_SUCCESS = 5;    // Réussites consécutives nécessaires
```

## Utilisation

1. Lancer l'application
2. Ajouter des mots via le bouton "Nouveau mot"
3. Cliquer sur les cartes pour les retourner
4. Indiquer si le mot est acquis ou non
5. Suivre sa progression dans les statistiques

## Développement

### Scripts Disponibles
```bash
npm run dev      # Mode développement
npm run build    # Construction production
npm run start    # Démarrage production
npm run lint     # Vérification du code
```

### Tests
```bash
npm run test     # Lancer les tests
```

## Déploiement

L'application peut être déployée sur Vercel :

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Leghis/flashcards)

## Contribution
Les contributions sont les bienvenues ! Voir `CONTRIBUTING.md` pour les détails.

## Licence
Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## Support
Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Contacter l'équipe de développement

## Remerciements
- Équipe Next.js
- Contributeurs
- Communauté open source

---

Créé avec ❤️ par Ayina Maerik

[Lien vers la démo en direct](https://flashcards-mu-nine.vercel.app/)