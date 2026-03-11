import DefaultTheme from 'vitepress/theme'
import HomeLayout from './HomeLayout.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout: HomeLayout,
}
