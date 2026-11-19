const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const POS_VI_MAP = {
  noun: 'Danh từ',
  verb: 'Động từ',
  adjective: 'Tính từ',
  adverb: 'Trạng từ',
  preposition: 'Giới từ',
  conjunction: 'Liên từ',
  pronoun: 'Đại từ',
  interjection: 'Thán từ',
  exclamation: 'Thán từ',
  article: 'Mạo từ',
  abbreviation: 'Viết tắt',
  phrase: 'Cụm từ',
};

function cleanQuery(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/^[^a-zA-Z0-9\u00C0-\u024F']+/, '')
    .replace(/[^a-zA-Z0-9\u00C0-\u024F'.!?\-]+$/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 600);
}

function getLemmaCandidates(word) {
  const w = word.toLowerCase();
  const cands = [w];
  if (w.endsWith("'s")) cands.push(w.slice(0, -2));
  if (w.endsWith('ies') && w.length > 4) cands.push(w.slice(0, -3) + 'y');
  if (w.endsWith('ied') && w.length > 4) cands.push(w.slice(0, -3) + 'y');
  if (w.endsWith('ing') && w.length > 5) {
    cands.push(w.slice(0, -3));
    cands.push(w.slice(0, -3) + 'e');
    if (w[w.length - 4] === w[w.length - 5]) cands.push(w.slice(0, -4));
  }
  if (w.endsWith('ed') && w.length > 4) {
    cands.push(w.slice(0, -2));
    cands.push(w.slice(0, -1));
    if (w[w.length - 3] === w[w.length - 4]) cands.push(w.slice(0, -3));
  }
  if (w.endsWith('es') && w.length > 4) cands.push(w.slice(0, -2));
  if (w.endsWith('s') && w.length > 3 && !w.endsWith('ss')) cands.push(w.slice(0, -1));
  return [...new Set(cands)];
}

async function fetchJsonWithTimeout(url, timeoutMs = 4500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'PaperInkReader/1.0',
        Accept: 'application/json',
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (_) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchVietnameseTranslation(text) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&dt=bd&q=${encodeURIComponent(text)}`;
  const data = await fetchJsonWithTimeout(url, 5000);
  if (!Array.isArray(data)) return null;

  let translation = '';
  if (Array.isArray(data[0])) {
    translation = data[0]
      .map((seg) => (Array.isArray(seg) && typeof seg[0] === 'string' ? seg[0] : ''))
      .join('')
      .trim();
  }

  const viDict = [];
  if (Array.isArray(data[1])) {
    for (const block of data[1]) {
      if (!Array.isArray(block)) continue;
      const posEn = String(block[0] || '').toLowerCase();
      const posVi = POS_VI_MAP[posEn] || posEn;
      const terms = Array.isArray(block[1]) ? block[1].slice(0, 6) : [];
      if (terms.length > 0) {
        viDict.push({ pos: posVi, posEn, terms });
      }
    }
  }

  return { translation, viDict };
}

async function fetchEnglishEntry(word) {
  const candidates = getLemmaCandidates(word);
  for (const cand of candidates.slice(0, 3)) {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cand)}`;
    const data = await fetchJsonWithTimeout(url, 3500);
    if (Array.isArray(data) && data.length > 0) {
      const entry = data[0];
      let phonetic = entry.phonetic || '';
      let audio = '';
      if (Array.isArray(entry.phonetics)) {
        for (const ph of entry.phonetics) {
          if (!phonetic && ph.text) phonetic = ph.text;
          if (!audio && ph.audio) audio = ph.audio;
        }
      }
      const meanings = [];
      if (Array.isArray(entry.meanings)) {
        for (const m of entry.meanings.slice(0, 3)) {
          const defs = (m.definitions || []).slice(0, 2).map((d) => ({
            definition: d.definition || '',
            example: d.example || '',
          }));
          if (defs.length) {
            meanings.push({
              pos: POS_VI_MAP[String(m.partOfSpeech || '').toLowerCase()] || m.partOfSpeech || '',
              posEn: m.partOfSpeech || '',
              definitions: defs,
            });
          }
        }
      }
      return {
        lemma: entry.word || cand,
        phonetic,
        audio,
        meanings,
      };
    }
  }
  return null;
}

class DictionaryService {
  constructor(dataDir) {
    this.cacheFile = path.join(dataDir, 'dict-cache.json');
    this.cache = new Map();
    this.saveTimer = null;
  }

  async init() {
    await fsp.mkdir(path.dirname(this.cacheFile), { recursive: true });
    try {
      const raw = await fsp.readFile(this.cacheFile, 'utf8');
      const obj = JSON.parse(raw);
      for (const [k, v] of Object.entries(obj)) {
        this.cache.set(k, v);
      }
    } catch (_) {}
  }

  scheduleSave() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      const entries = Array.from(this.cache.entries()).slice(-5000);
      const obj = Object.fromEntries(entries);
      fsp.writeFile(this.cacheFile, JSON.stringify(obj), 'utf8').catch(() => {});
    }, 500);
  }

  async lookup(rawQuery) {
    const query = cleanQuery(rawQuery);
    if (!query) return { error: 'empty_query' };

    const isSingleWord = /^[a-zA-Z'-]+$/.test(query) && query.length <= 36;
    const cacheKey = isSingleWord ? query.toLowerCase() : null;

    if (cacheKey && this.cache.has(cacheKey)) {
      return { ...this.cache.get(cacheKey), cached: true };
    }

    const [viRes, enRes] = await Promise.all([
      fetchVietnameseTranslation(query),
      isSingleWord ? fetchEnglishEntry(query) : Promise.resolve(null),
    ]);

    if (!viRes && !enRes) {
      return {
        query,
        isSingleWord,
        offlineError: true,
        viTranslation: '',
        viDict: [],
        phonetic: '',
        audio: '',
        enMeanings: [],
      };
    }

    const result = {
      query,
      lemma: enRes?.lemma || query,
      isSingleWord,
      viTranslation: viRes?.translation || '',
      viDict: viRes?.viDict || [],
      phonetic: enRes?.phonetic || '',
      audio: enRes?.audio || '',
      enMeanings: enRes?.meanings || [],
    };

    if (cacheKey && (result.viTranslation || result.enMeanings.length > 0)) {
      this.cache.set(cacheKey, result);
      this.scheduleSave();
    }

    return result;
  }
}

module.exports = { DictionaryService };
