import DefaultTheme from 'vitepress/theme'
import { useRoute } from 'vitepress'
import { watch } from 'vue'
import HomeLayout from './HomeLayout.vue'
import { trackPageView } from './lib/analytics'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout: HomeLayout,
  setup() {
    const route = useRoute()

    watch(
      () => route.path,
      (path) => {
        trackPageView(path)
      },
      { immediate: true },
    )
  },
}
