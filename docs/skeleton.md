# Skeleton Workflow

When the user asks for a skeleton (`skeleton for <task-name>`, historically `скелет для <task-name>`), create a new topic page following this structure.

## Files Created

```md
frontend/topics/<category>/<task-name>/
├── <TaskName>.vue      # Vue page component
└── <task-name>.ts      # TypeScript implementation
```

## Vue Page Template

```vue
<template>
  <section class="demo">
    <div class="demo-card">
      <div class="demo-header">
        <p class="demo-label">{{ $t('categories.<category>.title') }}</p>
        <span class="difficulty difficulty-<difficulty>"><Difficulty> • +<xp> XP</span>
      </div>
      <h2><task-name></h2>
      <p class="demo-copy">
        <!-- Brief explanation (1-3 sentences) -->
      </p>

      <!-- Interactive demo / code example goes here -->

      <pre class="code">{{ codeExample }}</pre>

      <button class="complete-btn" :class="{ completed }" @click="onComplete">
        <span v-if="completed">{{ $t('common.completed') }}</span>
        <span v-else>{{ $t('common.complete') }} → +<xp> XP</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useProgressStore } from '@/stores/progress'

const progress = useProgressStore()
const completed = ref(progress.isModuleCompleted('<task-name>'))

function onComplete() {
  if (completed.value) return
  progress.completeModule('<task-name>', <xp>)
  completed.value = true
}

// Implementation code here

const codeExample = [
  '// Your code example here',
].join('\n')
</script>

<style scoped lang="scss">
@use '@/assets/scss/demo-page';

// Page-specific styles here
</style>
```

## TypeScript File Template

```typescript
// Implementation of the utility/function
// Export the main function used in the Vue page

export function myFunction(/* params */) {
  // Implementation
}
```

## Routing

- Import the page in `frontend/router.ts`:

  ```typescript
  import <TaskName>Demo from './topics/<category>/<task-name>/<TaskName>.vue'
  ```

- Add a route:

  ```typescript
  {
    path: '/<category>/<task-name>',
    name: '<category>-<task-name>',
    component: <TaskName>Demo,
    meta: {
      category: '<category>',
      categoryTitle: '...',
      title: '<TaskName>',
      difficulty: '<difficulty>',
      xpReward: <xp>,
    },
  }
  ```

## Meta File

Create or update `frontend/topics/<category>/<task-name>/_meta.json`:

```json
{
  "title": "<TaskName>",
  "description": "<short description>",
  "difficulty": "<easy|medium|hard>",
  "xp": <xp>,
  "order": <number>,
  "tags": ["<tag1>", "<tag2>"]
}
```

## Difficulty & XP

| Difficulty | XP  |
|------------|-----|
| easy       | 30  |
| medium     | 60  |
| hard       | 100 |

## Checks

- Run `npm run lint` to verify ESLint passes
- Run `npm run typecheck` to verify TypeScript types
- Run `npm run build` to verify production build
