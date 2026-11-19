(function () {
  function escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  class DictionaryUI {
    constructor({ onSaveVocab, isWordSaved }) {
      this.onSaveVocab = onSaveVocab;
      this.isWordSaved = isWordSaved;
      this.sheet = document.getElementById('dict-sheet');
      this.backdrop = document.getElementById('dict-backdrop');
      this.body = document.getElementById('dict-body');
      this.closeBtn = document.getElementById('dict-close-btn');
      this.currentLookup = null;
      this.audioEl = null;

      this.closeBtn?.addEventListener('click', () => this.close());
      this.backdrop?.addEventListener('click', () => this.close());
    }

    isOpen() {
      return Boolean(this.sheet && this.sheet.classList.contains('open'));
    }

    close() {
      this.sheet?.classList.remove('open');
      this.backdrop?.classList.remove('open');
      if (this.audioEl) {
        try {
          this.audioEl.pause();
        } catch (_) {}
      }
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (_) {}
      }
    }

    speak(text, audioUrl) {
      if (audioUrl) {
        try {
          if (this.audioEl) this.audioEl.pause();
          this.audioEl = new Audio(audioUrl);
          this.audioEl.play().catch(() => this.speakTTS(text));
          return;
        } catch (_) {}
      }
      this.speakTTS(text);
    }

    speakTTS(text) {
      if (!('speechSynthesis' in window) || !text) return;
      try {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        utt.lang = 'en-US';
        utt.rate = 0.94;
        window.speechSynthesis.speak(utt);
      } catch (_) {}
    }

    async lookup({ query, context = '', bookId = '', bookTitle = '' }) {
      const cleaned = String(query || '').trim();
      if (!cleaned) return;

      this.sheet?.classList.add('open');
      this.backdrop?.classList.add('open');

      this.body.innerHTML = `
        <div class="dict-loading">
          <div class="dict-word-row">
            <span class="dict-word">${escHtml(cleaned.length > 48 ? cleaned.slice(0, 48) + '…' : cleaned)}</span>
          </div>
          <p class="muted-text">Đang tra từ Anh – Việt…</p>
        </div>
      `;

      const isSingleWord = /^[a-zA-Z'-]+$/.test(cleaned) && cleaned.length <= 36;
      let data = null;

      // 1) Try IndexedDB cache first (instant & works 100% offline!)
      if (isSingleWord && window.PaperInkDB) {
        try {
          const cached = await window.PaperInkDB.getDictCache(cleaned);
          if (cached) data = { ...cached, fromLocalCache: true };
        } catch (_) {}
      }

      // 2) Fetch from backend if not cached
      if (!data) {
        try {
          const res = await fetch(`/api/dict?q=${encodeURIComponent(cleaned)}`);
          if (res.ok) {
            data = await res.json();
            if (
              isSingleWord &&
              data &&
              !data.offlineError &&
              (data.viTranslation || (data.enMeanings && data.enMeanings.length)) &&
              window.PaperInkDB
            ) {
              window.PaperInkDB.setDictCache(cleaned, data).catch(() => {});
            }
          }
        } catch (_) {
          data = {
            query: cleaned,
            isSingleWord,
            offlineError: true,
          };
        }
      }

      if (!data) {
        data = { query: cleaned, isSingleWord, offlineError: true };
      }

      this.currentLookup = { data, context, bookId, bookTitle };
      this.renderResult(data, context, bookId, bookTitle);
    }

    renderResult(data, context, bookId, bookTitle) {
      const word = data.query || '';
      const alreadySaved = this.isWordSaved ? this.isWordSaved(word) : false;

      if (data.offlineError) {
        this.body.innerHTML = `
          <div class="dict-header-block">
            <div class="dict-word-row">
              <span class="dict-word">${escHtml(word)}</span>
              <button class="icon-chip" id="dict-speak-btn" title="Phát âm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
              </button>
            </div>
          </div>
          <div class="dict-offline-box">
            <p><strong>Đang ngoại tuyến</strong> — từ này chưa có trong bộ nhớ đệm offline.</p>
            <p class="muted-text">Các từ đã tra trước đó luôn xem lại được khi mất mạng. Bạn có thể lưu từ này vào sổ từ vựng để tra sau.</p>
            <button class="apple-pill-btn secondary" id="dict-save-btn" type="button">${alreadySaved ? 'Đã lưu vào Sổ từ vựng' : 'Lưu từ để tra sau'}</button>
          </div>
        `;
        this.wireActions(data, context, bookId, bookTitle);
        return;
      }

      const viDictHtml = (data.viDict || [])
        .map(
          (g) => `
          <div class="dict-pos-group">
            <span class="dict-pos-tag">${escHtml(g.pos)}</span>
            <span class="dict-pos-terms">${escHtml((g.terms || []).join(', '))}</span>
          </div>
        `
        )
        .join('');

      const enMeaningsHtml = (data.enMeanings || [])
        .map(
          (m) => `
          <div class="dict-en-group">
            <div class="dict-en-pos">${escHtml(m.posEn || m.pos)}</div>
            ${(m.definitions || [])
              .map(
                (d) => `
              <div class="dict-en-def">• ${escHtml(d.definition)}</div>
              ${d.example ? `<div class="dict-en-ex">“${escHtml(d.example)}”</div>` : ''}
            `
              )
              .join('')}
          </div>
        `
        )
        .join('');

      const isPhrase = !data.isSingleWord;

      this.body.innerHTML = `
        <div class="dict-header-block">
          <div class="dict-word-row">
            <div>
              <span class="dict-word ${isPhrase ? 'dict-phrase' : ''}">${escHtml(word)}</span>
              ${
                data.lemma && data.lemma.toLowerCase() !== word.toLowerCase()
                  ? `<span class="dict-lemma">(${escHtml(data.lemma)})</span>`
                  : ''
              }
            </div>
            <div class="dict-head-actions">
              <button class="icon-chip" id="dict-speak-btn" title="Phát âm tiếng Anh">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
              </button>
              <button class="icon-chip ${alreadySaved ? 'active' : ''}" id="dict-save-btn" title="Lưu vào Sổ từ vựng">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="${alreadySaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              </button>
            </div>
          </div>
          ${data.phonetic ? `<div class="dict-phonetic">${escHtml(data.phonetic)}</div>` : ''}
        </div>

        ${
          data.viTranslation
            ? `<div class="dict-vi-main">${escHtml(data.viTranslation)}</div>`
            : ''
        }

        ${viDictHtml ? `<div class="dict-vi-list">${viDictHtml}</div>` : ''}

        ${
          enMeaningsHtml
            ? `<details class="dict-en-details" ${!viDictHtml ? 'open' : ''}>
                 <summary>Định nghĩa tiếng Anh &amp; ví dụ</summary>
                 <div class="dict-en-wrap">${enMeaningsHtml}</div>
               </details>`
            : ''
        }

        ${
          context && data.isSingleWord
            ? `<div class="dict-context"><span>Ngữ cảnh:</span> ${escHtml(context)}</div>`
            : ''
        }
      `;

      this.wireActions(data, context, bookId, bookTitle);
    }

    wireActions(data, context, bookId, bookTitle) {
      const speakBtn = document.getElementById('dict-speak-btn');
      const saveBtn = document.getElementById('dict-save-btn');

      speakBtn?.addEventListener('click', () => {
        this.speak(data.query, data.audio);
      });

      saveBtn?.addEventListener('click', () => {
        if (!this.onSaveVocab) return;
        const firstEnDef = data.enMeanings?.[0]?.definitions?.[0]?.definition || '';
        const saved = this.onSaveVocab({
          word: data.query,
          lemma: data.lemma || data.query,
          phonetic: data.phonetic || '',
          viMeaning:
            data.viTranslation ||
            (data.viDict?.[0]?.terms || []).slice(0, 3).join(', ') ||
            '(Chưa có nghĩa — tra lại khi online)',
          enDef: firstEnDef,
          context: context || '',
          bookId,
          bookTitle,
        });
        if (saved) {
          saveBtn.classList.add('active');
          saveBtn.setAttribute('aria-pressed', 'true');
          if (saveBtn.tagName === 'BUTTON' && !saveBtn.querySelector('svg')) {
            saveBtn.textContent = 'Đã lưu vào Sổ từ vựng';
          } else {
            const poly = saveBtn.querySelector('polygon');
            if (poly) poly.setAttribute('fill', 'currentColor');
          }
        }
      });
    }
  }

  window.PaperInkDictUI = DictionaryUI;
})();
