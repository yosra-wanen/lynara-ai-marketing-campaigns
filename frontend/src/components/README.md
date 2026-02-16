# Composants Lynara Campaign

Architecture des composants réutilisables, inspirée Orbitly CRM.

## Structure

```
components/
├── ui/           # Composants de base
│   ├── Button
│   ├── Input
│   ├── Card
│   ├── Badge
│   └── Avatar
├── layout/       # Structure de page
│   ├── Sidebar
│   ├── Header
│   ├── PageHeader
│   └── MainLayout
└── shared/       # Composants métier
    ├── SearchInput
    ├── DataTable
    ├── Tabs
    └── TextAreaWithSuggestion
```

## Utilisation

```tsx
import { Button, Card, Sidebar, DataTable } from '@/components';
```

## Design System

- **Police** : Nunito (200, 300, 400, 600, 700, 800)
- **Couleurs** : `@/lib/design-system`
- **Variants** : CVA (class-variance-authority)
