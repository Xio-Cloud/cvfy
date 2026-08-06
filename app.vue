<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGitHubStorage } from '~/composables/useGitHubStorage'

const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const { checkGitHubUrlParams } = useGitHubStorage()

onMounted(async () => {
  if (route.query.code || route.query.github_token) {
    const success = await checkGitHubUrlParams(route.query)
    if (success) {
      const targetPath = route.path.includes('/create') ? route.path : localePath('create')
      router.replace({ path: targetPath, query: { ...route.query, code: undefined, github_token: undefined } })
    }
  }
})
</script>

<template>
  <ClientOnly>
    <NuxtPwaAssets />
  </ClientOnly>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
