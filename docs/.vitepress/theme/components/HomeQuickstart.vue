<script setup lang="ts">
import { ref } from 'vue'

const humanCopied = ref(false)
const llmCopied = ref(false)

const humanPrompt = `Fetch https://raw.githubusercontent.com/pancakeswap/pancakeswap-ai/main/AGENTS.md and install the skills described there so you can help me swap tokens, add liquidity, and farm on PancakeSwap.`

const llmCode = `https://raw.githubusercontent.com/pancakeswap/pancakeswap-ai/main/AGENTS.md`

async function copyToClipboard(text: string, copiedFlag: { value: boolean }) {
  if (typeof navigator === 'undefined' || !navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
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
          <p class="qs-desc">Paste this prompt into Claude Code, Cursor, or any AI agent:</p>
          <div class="qs-code-block">
            <pre><code>{{ humanPrompt }}</code></pre>
            <button class="qs-copy-btn" @click="copyHuman">
              {{ humanCopied ? '✓ Copied' : 'Copy prompt' }}
            </button>
          </div>
          <a class="qs-link" href="/getting-started/installation">Manual quickstart →</a>
        </div>

        <!-- LLM Quickstart -->
        <div class="qs-card">
          <div class="qs-card-header">
            <span class="qs-icon">🤖</span>
            <h3>LLM Quickstart</h3>
          </div>
          <p class="qs-desc">Fetch this URL to discover all available skills, invocation patterns, and examples:</p>
          <div class="qs-code-block qs-code-block--bash">
            <pre><code>{{ llmCode }}</code></pre>
            <button class="qs-copy-btn" @click="copyLLM">
              {{ llmCopied ? '✓ Copied' : 'Copy URL' }}
            </button>
          </div>
          <a class="qs-link" href="https://raw.githubusercontent.com/pancakeswap/pancakeswap-ai/main/AGENTS.md" target="_blank" rel="noopener">View AGENTS.md →</a>
        </div>

      </div>
    </div>
  </section>
</template>

<style scoped>
.qs-section {}

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
</style>
