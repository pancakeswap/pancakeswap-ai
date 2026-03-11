import DefaultTheme from 'vitepress/theme'
import HomeQuickstart from './components/HomeQuickstart.vue'
import './custom.css'

export default {
  ...DefaultTheme,
  enhanceApp(ctx) {
    DefaultTheme.enhanceApp?.(ctx)
    ctx.app.component('HomeQuickstart', HomeQuickstart)
}
}
