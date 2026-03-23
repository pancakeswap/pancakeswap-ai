<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { trackEvent } from '../lib/analytics'

const humanCopied = ref(false)
const llmCopied = ref(false)
const embedFrame = ref<HTMLIFrameElement | null>(null)
const gameLoadTracked = ref(false)
const viewportTracked = ref(false)

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined') {
    if (!viewportTracked.value) {
      viewportTracked.value = true
      trackEvent('pancake_town_in_viewport', {
        game_name: 'Pancake Kitchen',
      })
    }
    return
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !viewportTracked.value) {
        viewportTracked.value = true
        trackEvent('pancake_town_in_viewport', {
          game_name: 'Pancake Kitchen',
        })
        observer.disconnect()
      }
    },
    { threshold: 0.5 },
  )

  if (embedFrame.value) {
    observer.observe(embedFrame.value)
  }
})

const isFauxFullscreen = ref(false)

const humanPrompt = `Fetch https://raw.githubusercontent.com/pancakeswap/pancakeswap-ai/main/AGENTS.md and install the skills described there so you can help me swap tokens, add liquidity, and farm on PancakeSwap.`

const llmCode = `https://raw.githubusercontent.com/pancakeswap/pancakeswap-ai/main/AGENTS.md`

async function copyToClipboard(text: string, copiedFlag: { value: boolean }) {
  if (
    typeof navigator === 'undefined' ||
    !navigator.clipboard ||
    typeof navigator.clipboard.writeText !== 'function'
  ) {
    console.error('Clipboard API is not available in this environment.')
    return
  }

  try {
    await navigator.clipboard.writeText(text)
    copiedFlag.value = true
    setTimeout(() => {
      copiedFlag.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
  }
}

function copyHuman() {
  copyToClipboard(humanPrompt, humanCopied)
}

function copyLLM() {
  copyToClipboard(llmCode, llmCopied)
}

function trackGameLoad() {
  if (gameLoadTracked.value) {
    return
  }

  gameLoadTracked.value = true
  trackEvent('pancake_town_embed_loaded', {
    game_name: 'Pancake Kitchen',
    embed_src: 'https://kitchen.pancakeswap.ai/',
  })
}

function getFullscreenElement(): Element | null {
  return document.fullscreenElement ?? (document as any).webkitFullscreenElement ?? null
}

async function requestNativeFullscreen(el: HTMLElement): Promise<boolean> {
  const rfs =
    el.requestFullscreen ?? (el as any).webkitRequestFullscreen ?? (el as any).webkitEnterFullscreen
  if (rfs) {
    await rfs.call(el)
    return true
  }
  return false
}

async function exitNativeFullscreen(): Promise<boolean> {
  const efs = document.exitFullscreen ?? (document as any).webkitExitFullscreen
  if (efs) {
    await efs.call(document)
    return true
  }
  return false
}

function enterFauxFullscreen() {
  isFauxFullscreen.value = true
  document.body.style.overflow = 'hidden'
}

function exitFauxFullscreen() {
  isFauxFullscreen.value = false
  document.body.style.overflow = ''
}

async function toggleFullscreen() {
  if (typeof document === 'undefined' || !embedFrame.value) {
    return
  }

  try {
    if (isFauxFullscreen.value) {
      trackEvent('pancake_town_fullscreen_exit', {
        game_name: 'Pancake Kitchen',
      })
      exitFauxFullscreen()
      return
    }

    if (getFullscreenElement() === embedFrame.value) {
      trackEvent('pancake_town_fullscreen_exit', {
        game_name: 'Pancake Kitchen',
      })
      await exitNativeFullscreen()
      return
    }

    trackEvent('pancake_town_fullscreen_enter', {
      game_name: 'Pancake Kitchen',
    })

    const ok = await requestNativeFullscreen(embedFrame.value)
    if (!ok) {
      enterFauxFullscreen()
    }
  } catch {
    enterFauxFullscreen()
  }
}
</script>

<template>
  <section class="qs-section">
    <div class="qs-inner">
      <div class="qs-grid">
        <!-- Human Quickstart -->
        <div class="qs-card">
          <div class="qs-card-header">
            <span class="qs-icon">👤</span>
            <h3>Human Quickstart</h3>
          </div>
          <p class="qs-desc">
            Paste this prompt into Claude Code, Cursor, or any AI agent or
            <a href="/getting-started/installation">install manually</a>:
          </p>
          <div class="qs-code-block">
            <pre><code>{{ humanPrompt }}</code></pre>
            <button class="qs-copy-btn" @click="copyHuman">
              {{ humanCopied ? '✓ Copied' : 'Copy prompt' }}
            </button>
          </div>
        </div>

        <!-- LLM Quickstart -->
        <div class="qs-card">
          <div class="qs-card-header">
            <span class="qs-icon">🤖</span>
            <h3>LLM Quickstart</h3>
          </div>
          <p class="qs-desc">
            Fetch this URL to discover all available skills, invocation patterns, and examples:
          </p>
          <div class="qs-code-block qs-code-block--bash">
            <pre><code>{{ llmCode }}</code></pre>
            <button class="qs-copy-btn" @click="copyLLM">
              {{ llmCopied ? '✓ Copied' : 'Copy URL' }}
            </button>
          </div>
          <a
            class="qs-link"
            href="https://raw.githubusercontent.com/pancakeswap/pancakeswap-ai/main/AGENTS.md"
            target="_blank"
            rel="noopener"
            >View AGENTS.md →</a
          >
        </div>
      </div>
      <div class="qs-embed-card">
        <div class="qs-card-header">
          <div class="qs-embed-title">
            <span class="qs-icon">🥞</span>
            <h3>Pancake Town</h3>
          </div>
          <button
            class="qs-fullscreen-btn"
            type="button"
            aria-label="Toggle fullscreen preview"
            @click="toggleFullscreen"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              />
            </svg>
          </button>
        </div>
        <div :class="['qs-embed-frame-wrap', { 'qs-faux-fullscreen': isFauxFullscreen }]">
          <button
            v-if="isFauxFullscreen"
            class="qs-faux-close-btn"
            type="button"
            aria-label="Exit fullscreen"
            @click="toggleFullscreen"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M18 6L6 18M6 6l12 12"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              />
            </svg>
          </button>
          <iframe
            ref="embedFrame"
            class="qs-embed-frame"
            src="https://kitchen.pancakeswap.ai/"
            title="Pancake Kitchen"
            loading="lazy"
            referrerpolicy="strict-origin-when-cross-origin"
            allow="fullscreen"
            allowfullscreen
            @load="trackGameLoad"
          />
        </div>
      </div>
      <hr class="qs-divider" />
    </div>
  </section>
</template>

<style scoped>
.qs-section {
  padding: 0 24px 48px;
}

@media (min-width: 640px) {
  .qs-section {
    padding: 0 48px;
  }
}

@media (min-width: 960px) {
  .qs-section {
    padding: 0 64px;
  }
}

.qs-inner {
  max-width: 1152px;
  margin: 0 auto;
}

.qs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 768px) {
  .qs-grid {
    grid-template-columns: 1fr;
  }
}

.qs-card {
  background: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qs-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.qs-embed-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.qs-icon {
  font-size: 22px;
  line-height: 1;
}

.qs-card-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0;
}

.qs-desc {
  font-size: 14px;
  color: var(--vp-c-text-2);
  margin: 0;
  line-height: 1.5;
}

.qs-desc a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
  font-weight: 500;
}

.qs-desc a:hover {
  text-decoration: underline;
}

.qs-code-block {
  position: relative;
  background: var(--vp-code-block-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 16px;
  flex: 1;
}

.qs-code-block pre {
  margin: 0;
  padding: 0;
  background: none;
  overflow-x: auto;
}

.qs-code-block pre code {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.7;
  color: var(--vp-c-text-1);
  white-space: pre-wrap;
  word-break: break-word;
}

.qs-copy-btn {
  margin-top: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  font-family: var(--vp-font-family-base);
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid var(--vp-c-brand-1);
  background: transparent;
  color: var(--vp-c-brand-1);
  transition: background 0.15s, color 0.15s;
}

.qs-copy-btn:hover {
  background: var(--vp-c-brand-1);
  color: #fff;
}

.qs-link {
  font-size: 13px;
  color: var(--vp-c-brand-1);
  text-decoration: none;
  font-weight: 500;
}

.qs-link:hover {
  text-decoration: underline;
}

.qs-divider {
  border: none;
  border-top: 1px solid var(--vp-c-divider);
  margin: 48px 0 0;
}

.qs-embed-card {
  margin-top: 24px;
  background: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qs-fullscreen-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.qs-fullscreen-btn:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.qs-fullscreen-btn svg {
  width: 18px;
  height: 18px;
}

.qs-embed-frame-wrap {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  overflow: hidden;
  background: var(--vp-c-bg);
  aspect-ratio: 16 / 8;
}

.qs-embed-frame {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}

@media (max-width: 768px) {
  .qs-embed-frame-wrap {
    aspect-ratio: 16 / 10;
  }
}

.qs-embed-frame-wrap.qs-faux-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  border: 0;
  border-radius: 0;
  aspect-ratio: auto;
  background: #000;
}

.qs-faux-close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10000;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  cursor: pointer;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  transition: background 0.15s ease;
}

.qs-faux-close-btn:hover {
  background: rgba(0, 0, 0, 0.8);
}

.qs-faux-close-btn svg {
  width: 20px;
  height: 20px;
}
</style>
