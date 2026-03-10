<script setup lang="ts">
import { ref } from 'vue'

const loaded = ref(false)

const bypass = import.meta.env.VITE_PLAYGROUND_BYPASS_SECRET
const playgroundUrl = `https://pancake-kitchen.pancake.run/${bypass ? `?x-vercel-protection-bypass=${bypass}` : ''}`
</script>

<template>
  <section class="pg-section">
    <div class="pg-inner">
      <div class="pg-header">
        <h2>Playground</h2>
        <p>Try PancakeSwap AI live — no setup required.</p>
      </div>
      <div class="pg-frame-wrap">
        <div v-if="!loaded" class="pg-loader">
          <span class="pg-spinner" />
          <span class="pg-loader-text">Loading playground…</span>
        </div>
        <iframe
          :src="playgroundUrl"
          title="PancakeSwap AI Playground"
          allow="clipboard-write"
          loading="lazy"
          :class="{ 'pg-iframe--ready': loaded }"
          @load="loaded = true"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.pg-section {
  padding: 64px 24px;
}

.pg-inner {
  max-width: 1152px;
  margin: 0 auto;
}

.pg-header {
  text-align: center;
  margin-bottom: 32px;
}

.pg-header h2 {
  font-size: 28px;
  font-weight: 800;
  color: var(--vp-c-text-1);
  margin: 0 0 8px;
  background: linear-gradient(135deg, var(--vp-c-brand-1), var(--vp-c-tip-1));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.pg-header p {
  font-size: 15px;
  color: var(--vp-c-text-2);
  margin: 0;
}

.pg-frame-wrap {
  position: relative;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  height: 680px;
}

.pg-loader {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: var(--vp-c-bg-alt);
}

.pg-loader-text {
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.pg-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--vp-c-divider);
  border-top-color: var(--vp-c-brand-1);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.pg-frame-wrap iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.pg-frame-wrap iframe.pg-iframe--ready {
  opacity: 1;
}

@media (max-width: 768px) {
  .pg-section {
    padding: 48px 20px;
  }

  .pg-frame-wrap {
    height: 500px;
  }
}
</style>
