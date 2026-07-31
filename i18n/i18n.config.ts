import ar from './locales/ar.json'
import az from './locales/az.json'
import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import id from './locales/id.json'
import nl from './locales/nl.json'
import pt from './locales/pt.json'
import vi from './locales/vi.json'
import zh from './locales/zh.json'

// You can use `defineI18nConfig` to get type inferences for ozhions to pass to vue-i18n.
export default defineI18nConfig(() => {
  return {
    legacy: false,
    fallbackLocale: 'en',
    locale: 'en',
    messages: {
      ar,
      az,
      de,
      en,
      es,
      fr,
      id,
      nl,
      pt,
      vi,
      zh,
    },
  }
})
