<script lang="ts" setup>
import { useCvState } from '~/data/useCvState'

const { formSettings } = useCvState()
</script>

<template>
  <section
    v-if="formSettings.displayAbout"
    class="cv__section cv__section--main"
  >
    <h4
      class="cv__section-title cv__section-title--main"
      :class="formSettings.layout === 'one-column' && 'sr-only'"
    >
      {{ $t("about-me") }}
    </h4>
    <CvTextEditor
      v-model="formSettings.aboutme"
      :read-only="true"
      class="font-light"
    />
  </section>
</template>
