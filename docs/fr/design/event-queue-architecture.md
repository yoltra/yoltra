# Architecture de File d'Attente d'Événements

>[ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/docs/es/design/event-queue-architecture.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/docs/pt/design/event-queue-architecture.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/docs/en/design/event-queue-architecture.md)&nbsp; |
> &nbsp; 👉 [ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/docs/fr/design/event-queue-architecture.md)

**Version:** 0.7.0
**Dernière mise à jour:** Janvier 2026
**Statut:** Stable

## Aperçu

Quo.js utilise une **file d'attente d'événements asynchrone et sérialisée** avec un gardien de réentrance pour le contrôle de contre-pression. Cette architecture garantit un ordonnancement prévisible des événements et prévient les conditions de course tout en supportant les middlewares et effets asynchrones.

## Mécanisme Central

### Structure de la File

```typescript
private readonly eventQueue: Array<{
  channel: string;
  type: string;
  payload: any;
  id: symbol;
}> = [];

private isProcessingQueue = false;
```

**Propriétés:**
- **File FIFO illimitée** - Événements mis en file dans l'ordre de réception
- **Drapeau de traitement unique** - Empêche les opérations de vidange concurrentes
- **Déduplication d'événements** - Les IDs de symboles uniques empêchent le double traitement (sécurité en Mode Strict React)

### Pipeline d'Émission

```typescript
public async emit<C, T>(
  channel: C,
  type: T,
  payload: EM[C][T]
): Promise<void>
```

**Étapes:**

1. **Génération d'ID** - Attribuer un `Symbol` unique à l'événement
2. **Mise en file** - Ajouter à `eventQueue` (se produit toujours)
3. **Vérification de contre-pression** - Si `isProcessingQueue === true`, retourner immédiatement
4. **Acquérir le verrou** - Définir `isProcessingQueue = true`
5. **Boucle de vidange** - Traiter tous les événements en file séquentiellement
6. **Libérer le verrou** - Définir `isProcessingQueue = false`

### Flux de Traitement

```
┌─────────────────────────────────────────────────────────────┐
│ emit(channel, type, payload)                                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │ Générer ID    │
         └───────┬───────┘
                 │
                 ▼
         ┌───────────────┐
         │ Mettre en file│
         └───────┬───────┘
                 │
                 ▼
         ┌────────────────────┐
         │ isProcessingQueue? │
         └───────┬────────┬───┘
                 │        │
            OUI  │        │ NON
                 │        │
                 ▼        ▼
         ┌────────┐  ┌──────────────┐
         │ Retour │  │ Flag=true    │
         └────────┘  └──────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ while(queue)  │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────────┐
                    │ Déduplication     │
                    └───────┬───────────┘
                            │
                            ▼
                    ┌───────────────────┐
                    │ Middleware        │──────────────────┐
                    │ (peut annuler)    │                  │
                    └───────┬───────────┘                  │
                            │                              │
                            │ (autorisé)                   │ (rejeté)
                            │                              │
                            ▼                              ▼
                    ┌───────────────────┐      ┌─────────────────────────┐
                    │ Reducers (sync)   │      │ Abonnés Événements Non  │
                    └───────┬───────────┘      │ Confirmés + Subs 'all'  │
                            │                  │ (phase='uncommitted')   │
                            ▼                  └─────────────┬───────────┘
                    ┌───────────────────┐                    │
                    │ Abonnés Événements│                    ▼
                    │ Confirmés + Subs  │            ┌───────────────┐
                    │ 'all' (phase=     │            │ DevTools      │
                    │   'committed')    │            │ [ANNULÉ]      │
                    └───────┬───────────┘            └───────┬───────┘
                            │                                │
                            ▼                                ▼
                    ┌───────────────────┐            ┌───────────────┐
                    │ Effets (async)    │            │ Continuer Loop│
                    └───────┬───────────┘            └───────────────┘
                            │
                            ▼
                    ┌───────────────────┐
                    │ Abonnés Grossiers │
                    │ (si état changé)  │
                    └───────┬───────────┘
                            │
                            ▼
                    ┌───────────────────┐
                    │ DevTools          │
                    └───────┬───────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Flag=false    │
                    └───────────────┘
```

## Modèle de Contre-pression

### Gardien de Réentrance

Le store utilise un **drapeau booléen** (`isProcessingQueue`) pour implémenter la contre-pression:

```typescript
if (this.isProcessingQueue) return;  // Contre-pression appliquée ici
```

**Mécanisme:**

- **Premier appel `emit()`** acquiert le verrou et commence la vidange
- **Appels subséquents `emit()`** (pendant la vidange) mettent en file et retournent immédiatement
- **Appels imbriqués `emit()`** (depuis middleware/effets) sont mis en file pour traitement ultérieur

### Modèle d'Exécution

Quo.js utilise un modèle de **"passage de témoin"** où le premier appel débloqué à `emit()` consomme toute la file:

```
Chronologie:

T0: emit('event1') [Composant A]
    → isProcessingQueue = false
    → Acquérir le verrou
    → Commencer la boucle de vidange
   
T1: emit('event2') [Middleware pendant event1]
    → isProcessingQueue = true (BLOQUÉ)
    → Mise en file uniquement
    → Retour immédiat
   
T2: emit('event3') [Effet pendant event1]
    → isProcessingQueue = true (BLOQUÉ)
    → Mise en file uniquement
    → Retour immédiat
   
T3: La boucle de vidange continue [emit('event1') original]
    → Traiter event1
    → Traiter event2 (récupéré de la file)
    → Traiter event3 (récupéré de la file)
    → Libérer le verrou
    → Retourner
```

**Propriété Clé:** Il n'y a **pas de thread consommateur séparé ou worker**. La consommation de la file est entièrement pilotée par les appels à `emit()`.

## Garanties d'Ordonnancement

### Ordonnancement FIFO

Les événements sont traités dans un ordre strict de mise en file:

```typescript
await emit('ui', 'event1', p1);  // Mis en file à l'index 0
await emit('ui', 'event2', p2);  // Mis en file à l'index 1
await emit('ui', 'event3', p3);  // Mis en file à l'index 2

// Ordre de traitement: event1 → event2 → event3 (garanti)
```

### Sérialisation

Les événements ne se traitent **jamais** de manière concurrente:

```typescript
while (this.eventQueue.length) {
  const event = this.eventQueue.shift()!;
 
  // Déduplication
  if (this.processedEventIds.has(event.id)) continue;
  this.processedEventIds.add(event.id);
 
  // Middleware (async)
  for (const mw of this.middleware) {
    const ok = await mw(state, event, emit);  // ← Attend chacun
    if (!ok) break;
  }
 
  // Reducers (sync)
  this.reducerBus.emit(event.channel, event.type, event.payload);
 
  // Effets (async)
  await this.notifyEffects(event);  // ← Attend la complétion
 
  // Abonnés (sync)
  if (stateChanged) this.listeners.forEach(l => l());
 
  // DevTools (sync)
  this.devtools?.send(action, state);
}
```

**Propriété:** L'événement suivant dans la file ne commence pas à être traité avant que l'événement actuel ne complète tout son pipeline (y compris les effets asynchrones).

### Sécurité de Réentrance

Les appels imbriqués à `emit()` pendant le traitement des événements sont sûrs:

```typescript
// Middleware qui émet
const middleware: MiddlewareFunction = async (state, event, emit) => {
  if (event.type === 'fetchData') {
    await emit('ui', 'loading', true);     // ← Emit imbriqué
    const data = await fetch('/api');
    await emit('data', 'loaded', data);    // ← Emit imbriqué
  }
  return true;
};

// Code utilisateur
await emit('api', 'fetchData', { url: '/todos' });
// Résultat: 'fetchData' → 'loading' → 'loaded' (dans l'ordre)
```

## Modèle de Concurrence

### JavaScript Mono-thread

La boucle d'événements de JavaScript garantit qu'un seul appel à `emit()` s'exécute à la fois:

```typescript
// Composant A (microtâche 1)
emit('event1');

// Composant B (microtâche 2)
emit('event2');

// Exécution réelle:
// 1. emit('event1') s'exécute jusqu'à la fin (ou cède à await)
// 2. emit('event2') s'exécute (peut se mettre en file si event1 est toujours en vidange)
```

### Planification de Microtâches

Async/await place les continuations dans la file de microtâches:

```typescript
async function exemple() {
  await emit('event1');  // Cède ici
  // Continuation planifiée comme microtâche
  console.log('après event1');
}
```

**Implication:** Plusieurs appels à `emit()` depuis différents composants peuvent s'entrelacer aux limites d'await, mais l'ordonnancement de la file est préservé.

## Déduplication d'Événements

### Protection du Mode Strict React

React 18+ Mode Strict exécute les effets deux fois en développement:

```typescript
useEffect(() => {
  emit('analytics', 'pageView', { page });  // Se déclenche 2x en dev!
}, [page]);
```

**Solution:** Le suivi des IDs d'événements empêche le double traitement:

```typescript
private readonly processedEventIds = new Set<symbol>();

// Dans la boucle de vidange:
if (this.processedEventIds.has(event.id)) continue;  // Sauter le duplicata
this.processedEventIds.add(event.id);
```

### Stratégie de Nettoyage

Les IDs sont périodiquement effacés pour éviter les fuites de mémoire:

```typescript
// Constructeur
this.eventIdCleanupTimer = setInterval(() => {
  this.processedEventIds.clear();
}, cleanupInterval);  // 30s dev, 5min prod

// Disposition
public dispose(): void {
  if (this.eventIdCleanupTimer) {
    clearInterval(this.eventIdCleanupTimer);
    this.eventIdCleanupTimer = null;
  }
  this.processedEventIds.clear();
}
```

**Hypothèse:** Les événements plus anciens que l'intervalle de nettoyage ne seront jamais réémis (sûr pour la plupart des applications).

## Caractéristiques de Performance

### Complexité Temporelle

| Opération | Complexité | Notes |
|-----------|------------|-------|
| `emit()` mise en file | O(1) | Push de tableau |
| `emit()` vidange (file vide) | O(n×m) | n = événements, m = middleware+effets |
| `emit()` vidange (file a des événements) | O(1) | Retourne immédiatement |
| Déduplication d'événements | O(1) | Recherche dans Set |
| Pipeline de middleware | O(k) | k = nombre de middlewares |
| Dispatch de reducer | O(1) | Émission directe EventBus |
| Dispatch d'effet | O(1) | Recherche dans Map par clé |

### Complexité Spatiale

| Structure | Complexité | Notes |
|-----------|------------|-------|
| `eventQueue` | O(n) | n = événements en file (illimité) |
| `processedEventIds` | O(m) | m = événements depuis dernier nettoyage |
| `middleware` | O(k) | k = middlewares enregistrés |
| `effects` | O(e) | e = effets enregistrés |

### Goulots d'Étranglement

1. **Reducers Lents** - Bloquent toute la file (synchrone)
2. **Middleware Lent** - Bloque le traitement des événements (async mais séquentiel)
3. **Effets Lents** - Bloquent l'événement suivant dans la file (async mais séquentiel)
4. **Croissance de la File** - Utilisation mémoire illimitée si les événements se mettent en file plus vite que le traitement

## Modes de Défaillance

### Débordement de File (Croissance Illimitée)

**Scénario:** Les événements se mettent en file plus vite qu'ils ne peuvent être traités.

```typescript
// Cas pathologique: Émission récursive
registerEffect({
  events: [['ui', 'tick']],
  effect: async (evt, getState, emit) => {
    await emit('ui', 'tick', evt.payload + 1);  // Récursion infinie!
  }
});

emit('ui', 'tick', 0);  // La file croît sans limite
```

**Symptômes:**
- Utilisation mémoire croissante
- Performance dégradée
- Éventuel crash OOM

**Mitigation:** L'application doit éviter les boucles infinies. Le store n'a pas de protection intégrée.

### Famine de la Boucle d'Événements

**Scénario:** Un reducer de longue durée bloque la boucle d'événements.

```typescript
reducer: (state, event) => {
  // Calcul synchrone et coûteux
  for (let i = 0; i < 1e9; i++) {
    // Travail intensif CPU
  }
  return { ...state, result: i };
}
```

**Symptômes:**
- UI gelée
- Autres événements bloqués dans la file
- Mauvaise expérience utilisateur

**Mitigation:** Garder les reducers rapides et purs. Déplacer les calculs lourds vers les effets ou Web Workers.

### Annulation de Middleware

**Scénario:** Le middleware annule l'événement en retournant `false`.

```typescript
const authMiddleware: MiddlewareFunction = (state, event) => {
  if (!state.auth.isAuthenticated) {
    console.warn('Événement non autorisé:', event);
    return false;  // Annuler la propagation
  }
  return true;
};
```

**Comportement:**
- L'événement est retiré de la file mais pas traité
- Les reducers et effets ne voient jamais l'événement
- Les abonnés ne sont pas notifiés
- L'événement est perdu (pas de mécanisme de réessai)

**Considération:** S'assurer que l'annulation est intentionnelle et correctement enregistrée.

### Erreurs d'Effets

**Scénario:** Un effet lève une erreur.

```typescript
registerEffect({
  events: [['api', 'fetch']],
  effect: async (evt) => {
    const res = await fetch(evt.payload.url);
    const data = await res.json();  // Peut lever si pas JSON
    // ...
  }
});
```

**Comportement:**
- L'erreur est capturée et enregistrée: `console.error("Erreur d'effet:", err);`
- Les autres effets s'exécutent toujours
- La vidange de la file continue
- L'application doit gérer l'état d'erreur via des événements d'erreur

**Meilleure Pratique:** Les effets doivent capturer les erreurs et émettre des événements d'échec:

```typescript
effect: async (evt, getState, emit) => {
  try {
    const data = await fetchData(evt.payload.url);
    await emit('api', 'fetchSuccess', data);
  } catch (error) {
    await emit('api', 'fetchFailure', { error: error.message });
  }
}
```

## Abonnements aux Événements (v0.7.0+)

### Aperçu

Les abonnements aux événements fournissent un moyen d'observer les événements sans affecter le flux d'événements. Contrairement au middleware (qui peut annuler des événements) et aux effets (qui s'exécutent après le pipeline d'événements), les abonnements aux événements sont purement observationnels.

### Phases d'Abonnement

| Phase | Quand Notifié | Cas d'Usage |
|-------|---------------|-------------|
| `'committed'` | Après reducers, avant effets | Réagir aux changements d'état réussis |
| `'uncommitted'` | Après rejet du middleware | Réagir aux événements bloqués |
| `'all'` | Les deux phases (avec paramètre phase) | Logging, analytiques, débogage |

### Ordre de Traitement

**Pour les événements confirmés:**
```
Middleware (autorise) → Reducers → Subs d'Événements Confirmés → Effets → Abonnés Grossiers
```

**Pour les événements non confirmés:**
```
Middleware (rejette) → Subs d'Événements Non Confirmés → DevTools [ANNULÉ]
```

### Signature du Handler

```typescript
type EventSubscriptionHandler = (
  event: EventUnion<EM>,
  getState: () => S,
  emit: Emit<EM>,
  phase: 'committed' | 'uncommitted'
) => void | Promise<void>;
```

**Paramètres:**
- `event` - L'objet d'événement complet `{ channel, type, payload, id }`
- `getState` - Retourne l'état actuel (après reducers pour confirmés, inchangé pour non confirmés)
- `emit` - Permet d'émettre de nouveaux événements depuis le handler
- `phase` - La phase qui a déclenché cette notification

### Gestion des Erreurs

Les erreurs d'abonnement aux événements sont capturées et enregistrées, permettant aux autres abonnements de continuer:

```typescript
// Si un abonnement lève une erreur, les autres s'exécutent quand même
store.onEvent('ui', 'click', () => { throw new Error('boom'); });
store.onEvent('ui', 'click', () => { console.log('s\'exécute quand même'); }); // ✅
```

### Exemple d'Utilisation

```typescript
// Événements confirmés (par défaut)
store.onEvent('ui', 'save', (event, getState, emit, phase) => {
  console.log('Sauvegarde confirmée, nouvel état:', getState());
});

// Événements non confirmés
store.onEvent('ui', 'delete', (event, getState, emit, phase) => {
  console.log('Suppression bloquée par le middleware');
}, 'uncommitted');

// Tous les événements
store.onEvent('ui', 'action', (event, getState, emit, phase) => {
  analytics.track(`event_${phase}`, { type: event.type });
}, 'all');
```

## Comparaison avec d'Autres Bibliothèques

### Redux (Synchrone)

```typescript
// Redux: Traitement immédiat et synchrone
dispatch({ type: 'ADD_TODO', payload: todo });
// ↑ Bloque jusqu'à ce que tous les reducers se terminent
// ↑ Pas de file, pas de support async

const state = store.getState();  // Reflète immédiatement le changement
```

**Propriétés:**
- ✅ Timing prévisible
- ✅ Modèle mental simple
- ❌ Pas de support de middleware async (nécessite redux-thunk/saga)
- ❌ Bloque la boucle d'événements si le reducer est lent

### Zustand (Synchrone)

```typescript
// Zustand: Mises à jour d'état immédiates et synchrones
set({ todos: [...todos, newTodo] });
// ↑ Mutation synchrone + notification

get().todos;  // A immédiatement le nouveau todo
```

**Propriétés:**
- ✅ Surcharge minimale
- ✅ API simple
- ❌ Pas de modèles async intégrés
- ❌ Pas de garanties d'ordonnancement d'événements avec mises à jour concurrentes

### XState (Modèle d'Acteur)

```typescript
// XState: Boîte aux lettres d'acteur asynchrone
actor.send({ type: 'FETCH' });
actor.send({ type: 'UPDATE' });
// ↑ Événements mis en file dans la boîte aux lettres de l'acteur
// ↑ Traités de manière asynchrone par la machine à états

// Plusieurs acteurs peuvent traiter simultanément
```

**Propriétés:**
- ✅ Vrai traitement concurrent (plusieurs acteurs)
- ✅ Sémantique de machine à états async intégrée
- ❌ Modèle mental complexe
- ❌ Surcharge mémoire plus élevée (une boîte aux lettres par acteur)

### Quo.js (File Asynchrone)

```typescript
// Quo.js: File asynchrone sérialisée
await emit('todo', 'add', todo);
// ↑ Retourne une promesse quand le traitement est terminé
// ↑ Mis en file si un autre événement est en traitement

await emit('todo', 'delete', id);
// ↑ Garanti de traiter après 'add'
```

**Propriétés:**
- ✅ Support de middleware/effets async
- ✅ Garanties strictes d'ordonnancement
- ✅ Sûr pour la réentrance
- ❌ File illimitée (risque mémoire)
- ❌ Pas de traitement parallèle (file unique)

## Justification de la Conception

### Pourquoi Asynchrone?

**Exigence:** Supporter les middlewares et effets asynchrones sans bloquer l'application.

**Alternative Considérée:** Modèle synchrone (comme Redux)
- **Rejetée:** Nécessite une couche d'orchestration async séparée (thunks, sagas)
- **Choisie:** Support async intégré via type de retour `Promise<void>`

### Pourquoi File Unique?

**Exigence:** Garantir l'ordonnancement des événements pour des transitions d'état prévisibles.

**Alternative Considérée:** Plusieurs files (par canal ou par reducer)
- **Rejetée:** Sémantique d'ordonnancement complexe, conditions de course potentielles
- **Choisie:** File unique assure un ordonnancement global

### Pourquoi Gardien de Réentrance?

**Exigence:** Prévenir la corruption de la file par des appels imbriqués à `emit()`.

**Alternative Considérée:** Interdire les emits imbriqués (lever une erreur)
- **Rejetée:** Casse les modèles courants (middleware émettant des événements)
- **Choisie:** Mettre en file et différer les événements imbriqués

### Pourquoi Pas de Limite de File?

**Exigence:** Ne jamais abandonner d'événements en production (risque de perte de données).

**Alternative Considérée:** Buffer circulaire de taille fixe avec politique de débordement
- **Considérée:** Pourrait abandonner des événements ou lever des erreurs en débordement
- **Choisie:** File illimitée priorise la correction sur la sécurité mémoire
- **Futur:** Peut ajouter des limites optionnelles avec des politiques configurables


-------


## Annexe: Référence d'Implémentation

### Boucle d'Événements Centrale

```typescript
public async emit<C extends keyof EM, T extends keyof EM[C]>(
  channel: C,
  type: T,
  payload: EM[C][T],
): Promise<void> {
  const id = Symbol("event");
 
  this.eventQueue.push({
    channel: channel as string,
    type: type as string,
    payload,
    id,
  });

  if (this.isProcessingQueue) return;

  this.isProcessingQueue = true;
  try {
    while (this.eventQueue.length) {
      const { channel, type, payload, id } = this.eventQueue.shift()!;

      if (this.processedEventIds.has(id)) {
        continue;
      }

      this.processedEventIds.add(id);

      const event = { channel, type, payload, id } as Event<EM, C, T>;
      let propagate = true;

      for (const mw of this.middleware) {
        try {
          const ok = await mw(this.state, event, this.emit);
          if (!ok) {
            propagate = false;
            break;
          }
        } catch (err) {
          console.error("Erreur de middleware:", err);
          propagate = false;
          break;
        }
      }

      if (!propagate) {
        this.devtools?.send(
          { type: `Channel: ${channel} - Type: ${type} [ANNULÉ]`, payload },
          this.state,
        );
        continue;
      }

      const stateBefore = this.state;
      this.reducerBus.emit(channel as C, type as T, payload);
      const stateAfter = this.state;
      const anySliceChanged = stateBefore !== stateAfter;

      await this.notifyEffects(event as any);

      if (anySliceChanged) {
        this.listeners.forEach((l) => l());
      }

      this.devtools?.send(
        { type: `Channel: ${channel} - Type: ${type}`, payload },
        this.state,
      );
    }
  } catch (err) {
    console.error("Erreur de file emit:", err);
  } finally {
    this.isProcessingQueue = false;
  }
}
```

### Déduplication d'Événements

```typescript
private readonly processedEventIds = new Set<symbol>();
private eventIdCleanupTimer: ReturnType<typeof setInterval> | null = null;

constructor(spec: StoreSpec<R, S, EM>) {
  // ...
 
  const cleanupInterval =
    process.env.NODE_ENV === "production" ? 5 * 60 * 1000 : 30 * 1000;
   
  this.eventIdCleanupTimer = setInterval(() => {
    this.processedEventIds.clear();
  }, cleanupInterval);
}

public dispose(): void {
  if (this.eventIdCleanupTimer) {
    clearInterval(this.eventIdCleanupTimer);
    this.eventIdCleanupTimer = null;
  }
  this.processedEventIds.clear();
}
```

---

## Glossaire

**Contre-pression**: Mécanisme pour prévenir le débordement de file en ralentissant ou bloquant la production d'événements.

**Passage de Témoin**: Modèle d'exécution où le contrôle se transfère d'une opération async à une autre.

**Boucle de Vidange**: La boucle `while` qui traite tous les événements en file séquentiellement.

**FIFO**: First-In-First-Out - les événements sont traités dans l'ordre de mise en file.

**Réentrance**: Propriété permettant à une fonction d'être appelée pendant qu'elle est déjà en exécution.

**Sérialisation**: Traiter les événements un à la fois, jamais de manière concurrente.

---

## Historique des Révisions

| Version | Date | Changements |
|---------|------|---------|
| 0.7.0 | 2026-01 | Ajout de la fonctionnalité Abonnements aux Événements (phases committed/uncommitted/all) |
| 0.5.0 | 2026-01 | Documentation initiale de l'architecture de file async |

---

**Auteur**: Équipe Quo.js 
**Licence**: MIT 
**Dépôt**: https://github.com/quojs/quo