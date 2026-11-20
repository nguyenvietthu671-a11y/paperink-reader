(function () {
  const COVER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="600" height="900">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1E2B37"/>
      <stop offset="55%" stop-color="#283A4A"/>
      <stop offset="100%" stop-color="#16202A"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="38%" r="46%">
      <stop offset="0%" stop-color="#E7C27D" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#E7C27D" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="600" height="900" fill="url(#bg)"/>
  <rect width="600" height="900" fill="url(#glow)"/>
  <rect x="34" y="34" width="532" height="832" rx="14" fill="none" stroke="#DFC089" stroke-opacity="0.45" stroke-width="2"/>
  <rect x="48" y="48" width="504" height="804" rx="10" fill="none" stroke="#DFC089" stroke-opacity="0.22" stroke-width="1"/>
  <text x="300" y="138" text-anchor="middle" fill="#DFC089" font-family="Georgia, serif" font-size="22" letter-spacing="6" opacity="0.88">SHERLOCK HOLMES · #1</text>
  <line x1="210" y1="168" x2="390" y2="168" stroke="#DFC089" stroke-opacity="0.45" stroke-width="1.2"/>
  <text x="300" y="290" text-anchor="middle" fill="#F8F3E8" font-family="Georgia, serif" font-size="60" font-weight="600">A Scandal</text>
  <text x="300" y="362" text-anchor="middle" fill="#F8F3E8" font-family="Georgia, serif" font-size="60" font-weight="600">in Bohemia</text>
  <g transform="translate(300 520)" fill="none" stroke="#DFC089" stroke-width="2.4" opacity="0.88">
    <circle cx="0" cy="0" r="64" stroke-opacity="0.35"/>
    <circle cx="-10" cy="-10" r="34"/>
    <line x1="15" y1="15" x2="54" y2="54" stroke-width="5" stroke-linecap="round"/>
    <circle cx="-10" cy="-10" r="16" stroke-opacity="0.45"/>
  </g>
  <line x1="220" y1="680" x2="380" y2="680" stroke="#DFC089" stroke-opacity="0.45" stroke-width="1.2"/>
  <text x="300" y="742" text-anchor="middle" fill="#F4EFE6" font-family="Georgia, serif" font-size="30" letter-spacing="1.5">Arthur Conan Doyle</text>
  <text x="300" y="794" text-anchor="middle" fill="#DFC089" font-family="-apple-system, sans-serif" font-size="16" letter-spacing="4" opacity="0.72">PAPERINK CLASSIC EDITION</text>
</svg>`;

  const CHAPTERS = [
    {
      id: 'ch1',
      title: 'Chapter I — The Masked Visitor',
      html: `<h1>Chapter I</h1>
<p class="epub-heading">The Masked Visitor</p>
<p>To Sherlock Holmes she is always <em>the</em> woman. I have seldom heard him mention her under any other name. In his eyes she eclipses and predominates the whole of her sex. It was not that he felt any emotion akin to love for Irene Adler. All emotions, and that one particularly, were abhorrent to his cold, precise, but admirably balanced mind.</p>
<p>He was, I take it, the most perfect reasoning and observing machine that the world has seen, but as a lover he would have placed himself in a false position. He never spoke of the softer passions, save with a gibe and a sneer. They were admirable things for the observer—excellent for drawing the veil from men’s motives and actions. But for the trained reasoner to admit such intrusions into his own delicate and finely adjusted temperament was to introduce a distracting factor which might throw a doubt upon all his mental results.</p>
<p>One night—it was on the twentieth of March, 1888—I was returning from a journey to a patient, when my way led me through Baker Street. As I passed the well-remembered door, which must always be associated in my mind with my wooing, and with the dark incidents of the Study in Scarlet, I was seized with a keen desire to see Holmes again, and to know how he was employing his extraordinary powers.</p>
<p>His rooms were brilliantly lit, and, even as I looked up, I saw his tall, spare figure pass twice in a dark silhouette against the blind. He was pacing the room swiftly, eagerly, with his head sunk upon his chest and his hands clasped behind him. To me, who knew his every mood and habit, his attitude and manner told their own story. He was at work again.</p>
<p>“Wedlock suits you,” he remarked, as I sank into the armchair beside the fire. “I think, Watson, that you have put on seven and a half pounds since I saw you.” He held a sheet of thick pink-tinted notepaper to the lamp. “A client will call upon us at a quarter to eight tonight—a gentleman whose business concerns one of the great royal houses of Europe.”</p>`,
    },
    {
      id: 'ch2',
      title: 'Chapter II — The Photograph in Briony Lodge',
      html: `<h1>Chapter II</h1>
<p class="epub-heading">The Photograph in Briony Lodge</p>
<p>When the heavy carriage halted outside Baker Street, a man of remarkable stature stepped into the firelight, wearing a cloak lined with flame-colored silk and a dark vizard mask across his upper face. Though he introduced himself as Count Von Kramm, Holmes instantly recognized him as Wilhelm Gottsreich Sigismond von Ormstein, Grand Duke of Cassel-Felstein and hereditary King of Bohemia.</p>
<p>Five years earlier in Warsaw, the King had become acquainted with the celebrated opera singer Irene Adler. Now, on the eve of his royal betrothal, she possessed a cabinet photograph of the two of them together—a single image capable of ending the alliance if sent to his future bride’s family. Every discreet attempt to purchase or recover the photograph had failed.</p>
<p>“She has the face of the most beautiful of women, and the mind of the most resolute of men,” the King confessed with a troubled sigh. “Rather than I should marry another woman, there are no lengths to which she would not go.”</p>
<p>The next morning found Holmes disguised as a genial, out-of-work groom lounging near Serpentine Mews in St. John’s Wood. Quietly observing Briony Lodge, he witnessed Irene Adler depart in haste with Godfrey Norton, a young lawyer of the Inner Temple—and, by a remarkable twist of fate, Holmes himself was summoned inside the Church of St. Monica to serve as their unexpected wedding witness.</p>
<p>“It was the most preposterous position in which I ever found myself in my life,” Holmes chuckled that evening over his pipe. “Now, Watson, we must arrange a small theatrical diversion outside Briony Lodge. When a woman thinks her house is on fire, her instinct is at once to rush to the thing which she values most.”</p>`,
    },
    {
      id: 'ch3',
      title: 'Chapter III — Outwitted at Baker Street',
      html: `<h1>Chapter III</h1>
<p class="epub-heading">Outwitted at Baker Street</p>
<p>The staged commotion in Serpentine Avenue unfolded exactly as Sherlock Holmes had calculated. Disguised as an amiable clergyman who had been injured defending the lady’s carriage, Holmes was carried gently into the drawing-room of Briony Lodge. At Watson’s signal through the open window, a harmless plumber’s smoke-rocket filled the parlor with curling gray vapor and cries of “Fire!”</p>
<p>In that single unguarded heartbeat, Irene Adler darted straight toward a sliding recess beside the bell-pull—revealing the exact hiding-place of the precious photograph. Satisfied, Holmes rose quietly, reassured the household that it was a false alarm, and slipped back into the London dusk.</p>
<p>Yet as we unlocked the door of 221B Baker Street, a slim youth in an ulster overcoat hurried past us in the lamplight and called softly: “Good-night, Mister Sherlock Holmes.” Holmes froze on the pavement, staring down the empty street. “I’ve heard that voice before,” he murmured. “Now, I wonder who the deuce that could have been?”</p>
<p>At dawn, Holmes, Watson, and the King hastened to Briony Lodge only to find the shutters drawn and the house abandoned. Inside the secret recess lay not the compromising cabinet portrait, but a solitary photograph of Irene Adler in evening dress—accompanied by a polite letter addressed directly to Sherlock Holmes.</p>
<blockquote>“You did, indeed, completely take me in. Until after the alarm of fire, I had not a suspicion. Then I recalled how I had been warned against you, followed you to Baker Street in walking-clothes, and made sure that I was really an object of interest to the celebrated Mr. Sherlock Holmes. The King may rest assured: I love and am loved by a better man than he, and I keep the photograph only as a safeguard.”</blockquote>
<p>And that was how a great scandal threatened to affect the kingdom of Bohemia, and how the best plans of Mr. Sherlock Holmes were beaten by a woman’s wit. Whenever he speaks of Irene Adler, it is always under the honorable title of <em>the</em> woman.</p>`,
    },
  ];

  async function buildSampleEpubBlob() {
    if (!window.JSZip) throw new Error('JSZip not loaded');
    const zip = new window.JSZip();
    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
    zip.file(
      'META-INF/container.xml',
      `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
    );

    zip.file('OEBPS/cover.svg', COVER_SVG);

    const manifestItems = [
      `<item id="cover-image" href="cover.svg" media-type="image/svg+xml" properties="cover-image"/>`,
      `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    ];
    const spineItems = [];
    const navItems = [];

    for (const ch of CHAPTERS) {
      manifestItems.push(`<item id="${ch.id}" href="${ch.id}.xhtml" media-type="application/xhtml+xml"/>`);
      spineItems.push(`<itemref idref="${ch.id}"/>`);
      navItems.push(`<li><a href="${ch.id}.xhtml">${ch.title}</a></li>`);
      zip.file(
        `OEBPS/${ch.id}.xhtml`,
        `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head><title>${ch.title}</title></head>
<body>${ch.html}</body>
</html>`
      );
    }

    zip.file(
      'OEBPS/nav.xhtml',
      `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en">
<head><title>Table of Contents</title></head>
<body>
  <nav epub:type="toc"><ol>${navItems.join('')}</ol></nav>
</body>
</html>`
    );

    const description =
      'When the hereditary King of Bohemia seeks to recover an indiscreet photograph from the brilliant opera singer Irene Adler, Sherlock Holmes and Dr. Watson embark on an unforgettable duel of wits in Victorian London. (Bản mẫu cổ điển thuộc phạm vi công cộng để bạn trải nghiệm ngay Apple Curl, bút S Pen, tùy chỉnh phông chữ & từ điển Anh–Việt trên PaperInk.)';

    zip.file(
      'OEBPS/content.opf',
      `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">paperink-demo-bohemia-1891</dc:identifier>
    <dc:title>A Scandal in Bohemia</dc:title>
    <dc:creator>Arthur Conan Doyle</dc:creator>
    <dc:language>en</dc:language>
    <dc:subject>Mystery &amp; Detective</dc:subject>
    <dc:subject>Classic Literature</dc:subject>
    <dc:description>${description}</dc:description>
    <meta name="calibre:series" content="Sherlock Holmes"/>
    <meta name="calibre:series_index" content="1"/>
    <meta name="cover" content="cover-image"/>
  </metadata>
  <manifest>${manifestItems.join('\n')}</manifest>
  <spine>${spineItems.join('\n')}</spine>
</package>`
    );

    const epubBlob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
    const coverBlob = new Blob([COVER_SVG], { type: 'image/svg+xml' });

    return {
      id: 'demo_scandal_in_bohemia',
      title: 'A Scandal in Bohemia',
      author: 'Arthur Conan Doyle',
      series: 'Sherlock Holmes',
      seriesIndex: 1,
      genres: ['Mystery & Detective', 'Classic Literature'],
      description,
      language: 'en',
      fileName: 'A Scandal in Bohemia - Arthur Conan Doyle.epub',
      size: epubBlob.size,
      savedAt: Date.now(),
      isLocalImport: true,
      isDemoSample: true,
      coverBlob,
      epubBlob,
    };
  }

  window.PaperInkDemoBook = { buildSampleEpubBlob };
})();
