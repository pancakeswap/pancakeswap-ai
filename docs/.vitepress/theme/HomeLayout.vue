<script setup>
import DefaultTheme from 'vitepress/theme'
import HomeQuickstart from './components/HomeQuickstart.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #home-features-before>
      <HomeQuickstart />
    </template>
  </Layout>
</template>

