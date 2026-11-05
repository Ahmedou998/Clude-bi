# Architecture

- Next.js App Router : rendu web et routes API.
- Prisma : accès typé à PostgreSQL.
- PostgreSQL : données relationnelles et contraintes.
- Zod : validation des entrées API.
- Vitest : tests unitaires de validation.
- Render : service web et base de données.
- GitHub Actions : CI sur push et pull request.

## Flux de données
Client → route API Next.js → validation Zod → Prisma → PostgreSQL.

Les routes d'écriture sont actuellement non authentifiées. Avant toute exposition publique, l'identité doit provenir d'une session validée côté serveur et chaque action doit vérifier les droits sur la ressource.
