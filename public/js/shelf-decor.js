(function () {
  const BUILTIN_STICKERS = [
    {
      id: 'olive-vase',
      name: 'Bình gốm lá ô-liu',
      baseWidth: 74,
      svg: `
        <svg viewBox="0 0 88 128" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <linearGradient id="piVaseBody" x1="20" y1="68" x2="68" y2="118" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#F7F4EE"/>
              <stop offset="55%" stop-color="#E7E0D4"/>
              <stop offset="100%" stop-color="#CEC4B5"/>
            </linearGradient>
          </defs>
          <ellipse cx="44" cy="123" rx="22" ry="3.5" fill="rgba(0,0,0,0.22)"/>
          <!-- Delicate stems -->
          <path d="M43 68 C40 48 32 30 22 14" stroke="#6E7866" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M45 68 C48 44 55 26 67 12" stroke="#5E6856" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M44 68 C44 46 45 28 48 10" stroke="#66715F" stroke-width="1.4" stroke-linecap="round"/>
          <!-- Olive leaves -->
          <ellipse cx="26" cy="24" rx="4.2" ry="9" transform="rotate(-38 26 24)" fill="#89997F"/>
          <ellipse cx="33" cy="37" rx="3.8" ry="8" transform="rotate(28 33 37)" fill="#77886D"/>
          <ellipse cx="22" cy="41" rx="3.8" ry="8.5" transform="rotate(-48 22 41)" fill="#96A68C"/>
          <ellipse cx="60" cy="22" rx="4" ry="8.8" transform="rotate(34 60 22)" fill="#7E8F74"/>
          <ellipse cx="53" cy="36" rx="3.6" ry="7.8" transform="rotate(-24 53 36)" fill="#6D7E64"/>
          <ellipse cx="64" cy="39" rx="3.8" ry="8.2" transform="rotate(44 64 39)" fill="#8EA084"/>
          <ellipse cx="47" cy="18" rx="3.6" ry="8" transform="rotate(8 47 18)" fill="#829378"/>
          <!-- Sculpted matte ceramic vase -->
          <path d="M35 66 H53 L55 77 C63 87 64 107 57 120 C55 122.5 50 123.5 44 123.5 C38 123.5 33 122.5 31 120 C24 107 25 87 33 77 L35 66Z" fill="url(#piVaseBody)"/>
          <ellipse cx="44" cy="66" rx="9" ry="2.2" fill="#D5CCC0"/>
        </svg>`,
    },
    {
      id: 'amber-candle',
      name: 'Nến thơm hổ phách',
      baseWidth: 58,
      svg: `
        <svg viewBox="0 0 76 108" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <radialGradient id="piGlowC" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#FFD88A" stop-opacity="0.7"/>
              <stop offset="100%" stop-color="#FF9E3D" stop-opacity="0"/>
            </radialGradient>
            <linearGradient id="piAmberJar" x1="16" y1="44" x2="60" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#A66033"/>
              <stop offset="50%" stop-color="#844720"/>
              <stop offset="100%" stop-color="#5C2F13"/>
            </linearGradient>
          </defs>
          <ellipse cx="38" cy="103" rx="22" ry="3.5" fill="rgba(0,0,0,0.24)"/>
          <circle class="candle-halo" cx="38" cy="27" r="24" fill="url(#piGlowC)"/>
          <path d="M38 15 C41.5 22 42 28 38 33 C34 28 34.5 22 38 15Z" fill="#FFB242"/>
          <path d="M38 22 C39.8 25.5 40 29 38 32 C36 29 36.2 25.5 38 22Z" fill="#FFF4CC"/>
          <line x1="38" y1="33" x2="38" y2="41" stroke="#362519" stroke-width="1.5" stroke-linecap="round"/>
          <rect x="17" y="42" width="42" height="60" rx="8" fill="url(#piAmberJar)"/>
          <rect x="21" y="46" width="5" height="50" rx="2.5" fill="rgba(255,235,205,0.24)"/>
          <rect x="22" y="59" width="32" height="26" rx="2.5" fill="#F6F1E8"/>
          <line x1="28" y1="68" x2="48" y2="68" stroke="#4D4238" stroke-width="1.4" stroke-linecap="round"/>
          <line x1="31" y1="75" x2="45" y2="75" stroke="#9C8F82" stroke-width="1.2" stroke-linecap="round"/>
          <ellipse cx="38" cy="42" rx="21" ry="3" fill="#F2E6D0"/>
        </svg>`,
    },
    {
      id: 'brass-lamp',
      name: 'Đèn đọc sách đồng',
      baseWidth: 88,
      interactive: 'lamp',
      svg: `
        <svg viewBox="0 0 100 132" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <radialGradient id="piLampWarm" cx="50%" cy="18%" r="72%">
              <stop offset="0%" stop-color="#FFE3A6" stop-opacity="0.58"/>
              <stop offset="65%" stop-color="#FFBE63" stop-opacity="0.14"/>
              <stop offset="100%" stop-color="#FFBE63" stop-opacity="0"/>
            </radialGradient>
            <linearGradient id="piBrassShade" x1="20" y1="30" x2="72" y2="60" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#DFBE7F"/>
              <stop offset="55%" stop-color="#B88E4A"/>
              <stop offset="100%" stop-color="#8A642C"/>
            </linearGradient>
          </defs>
          <ellipse cx="52" cy="128" rx="28" ry="3.8" fill="rgba(0,0,0,0.24)"/>
          <path class="lamp-glow-cone" d="M24 58 L74 58 L94 126 L8 126 Z" fill="url(#piLampWarm)"/>
          <path d="M62 122 V48 C62 32 50 25 40 34" stroke="#B68B4C" stroke-width="3.8" stroke-linecap="round"/>
          <path d="M19 58 C19 39 31 28 45 28 C59 28 70 39 70 58 H19Z" fill="url(#piBrassShade)"/>
          <ellipse cx="44.5" cy="58" rx="25.5" ry="3.8" fill="#FAF0D2"/>
          <path d="M36 122 C36 116 44 114 58 114 C72 114 80 116 80 122 V127 H36 V122Z" fill="#B08547"/>
          <path d="M39 121 H77" stroke="#E9CE93" stroke-width="1.3" stroke-linecap="round"/>
        </svg>`,
    },
    {
      id: 'ceramic-cup',
      name: 'Tách latte gốm',
      baseWidth: 66,
      svg: `
        <svg viewBox="0 0 84 94" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <linearGradient id="piCupBody" x1="18" y1="42" x2="62" y2="86" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#FAF7F2"/>
              <stop offset="65%" stop-color="#EAE3D7"/>
              <stop offset="100%" stop-color="#D4C9B9"/>
            </linearGradient>
          </defs>
          <ellipse cx="40" cy="90" rx="27" ry="3.6" fill="rgba(0,0,0,0.22)"/>
          <path d="M34 32 C31 25 37 20 35 13" stroke="currentColor" stroke-opacity="0.28" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M45 30 C42 23 48 18 46 10" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M59 50 H66 C71 50 73 55 72 61 C71 67 66 70 59 70" stroke="#DDD5C8" stroke-width="4.6" stroke-linecap="round"/>
          <path d="M18 42 H61 V71 C61 80 53 86 39.5 86 C26 86 18 80 18 71 V42Z" fill="url(#piCupBody)"/>
          <ellipse cx="39.5" cy="42" rx="21.5" ry="4.2" fill="#E6DDD0"/>
          <ellipse cx="39.5" cy="42.5" rx="17.5" ry="2.8" fill="#7D563B"/>
          <ellipse cx="40" cy="87" rx="27" ry="3" fill="#E8E1D6"/>
        </svg>`,
    },
    {
      id: 'hourglass',
      name: 'Đồng hồ cát đồng',
      baseWidth: 56,
      svg: `
        <svg viewBox="0 0 70 108" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <ellipse cx="35" cy="104" rx="21" ry="3.4" fill="rgba(0,0,0,0.22)"/>
          <line x1="17" y1="16" x2="17" y2="96" stroke="#B68B4C" stroke-width="2.4"/>
          <line x1="53" y1="16" x2="53" y2="96" stroke="#B68B4C" stroke-width="2.4"/>
          <path d="M21 18 H49 C49 38 40 48 35 55 C30 48 21 38 21 18Z" fill="rgba(235,244,248,0.5)" stroke="#9AB0B6" stroke-width="1.2"/>
          <path d="M21 94 H49 C49 74 40 64 35 57 C30 64 21 74 21 94Z" fill="rgba(235,244,248,0.5)" stroke="#9AB0B6" stroke-width="1.2"/>
          <path d="M26 36 H44 C42 44 38 50 35 53 C32 50 28 44 26 36Z" fill="#DFBE88"/>
          <path d="M23 93 H47 C45 84 40 77 35 74 C30 77 25 84 23 93Z" fill="#DFBE88"/>
          <line x1="35" y1="54" x2="35" y2="75" stroke="#DFBE88" stroke-width="1.3" stroke-dasharray="2 2"/>
          <rect x="12" y="10" width="46" height="7" rx="3" fill="#5D4433"/>
          <rect x="12" y="95" width="46" height="8" rx="3" fill="#5D4433"/>
        </svg>`,
    },
    {
      id: 'polaroid-frame',
      name: 'Khung ảnh tối giản',
      baseWidth: 74,
      svg: `
        <svg viewBox="0 0 88 106" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <ellipse cx="44" cy="102" rx="31" ry="3.4" fill="rgba(0,0,0,0.2)"/>
          <rect x="11" y="9" width="66" height="91" rx="4.5" fill="#B58E63"/>
          <rect x="16" y="14" width="56" height="81" rx="2" fill="#FAF7F2"/>
          <circle cx="44" cy="40" r="13" fill="#D99B7B" opacity="0.86"/>
          <path d="M24 81 C29 60 39 54 44 54 C49 54 59 60 64 81 Z" fill="#46574C"/>
          <path d="M32 29 Q44 43 56 27" stroke="#2D2A27" stroke-width="1.4" stroke-linecap="round"/>
        </svg>`,
    },
  ];

  const SHELF_STYLES = [
    { id: 'oak', name: 'Gỗ Sồi Sáng' },
    { id: 'walnut', name: 'Gỗ Óc Chó' },
    { id: 'birch', name: 'Gỗ Bạch Dương' },
    { id: 'slate', name: 'Kệ Đá Apple' },
    { id: 'grid', name: 'Lưới thoáng' },
    { id: 'list', name: 'Danh sách' },
  ];

  const BG_COLORS = [
    { hex: '#F5F5F7', name: 'Apple Trắng' },
    { hex: '#F6F2EB', name: 'Kem Lanh' },
    { hex: '#EFE7DC', name: 'Cát Ấm' },
    { hex: '#EAEFE9', name: 'Xanh Sương' },
    { hex: '#EAEFF5', name: 'Xanh Băng' },
    { hex: '#F4EAE8', name: 'Hồng Đất' },
    { hex: '#1B1918', name: 'Thư Viện Đêm' },
    { hex: '#000000', name: 'AMOLED Đen' },
  ];

  const DEFAULT_SHELF_CONFIG = {
    shelfStyle: 'oak',
    bgMode: 'color', // color | image
    bgColor: '#F5F5F7',
    bgAmbient: true,
    bgBlur: 0,
    bgDim: 0,
    placedStickers: [], // Freeform draggable stickers: { id, stickerId, shelfIndex, xPct, yOffset, scale, rotate, flipX }
    lampLit: true,
    updatedAt: 0,
  };

  window.PaperInkShelfDecor = {
    BUILTIN_STICKERS,
    SHELF_STYLES,
    BG_COLORS,
    DEFAULT_SHELF_CONFIG,
    getBuiltinById(id) {
      return BUILTIN_STICKERS.find((d) => d.id === id) || null;
    },
  };
})();
