import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import PptxGenJS from 'pptxgenjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const docsDir = path.join(repoRoot, 'docs', 'presentation');
const screenshotsDir = path.join(docsDir, 'screenshots');
const videosDir = path.join(docsDir, 'videos');
const deckPath = path.join(docsDir, 'SLIDE_DECK_2H.md');
const notesPath = path.join(docsDir, 'SPEAKER_NOTES_2H.md');
const codeSnippetsPath = path.join(docsDir, 'CODE_SNIPPETS.md');
const outputPath = path.join(docsDir, 'ATS_Resume_Analyzer_2hr_Master_Presentation.pptx');

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.mov', '.m4v', '.webm']);

const theme = {
  bg: '0D1117',
  panel: '111827',
  panelAlt: '172033',
  accent: '38BDF8',
  accentTwo: 'F59E0B',
  text: 'E5E7EB',
  muted: '9CA3AF',
  success: '34D399',
  border: '334155',
  lightPanel: 'F8FAFC',
  lightText: '0F172A',
};

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'OpenAI Codex';
pptx.company = 'ATS Resume Analyzer';
pptx.subject = 'ATS Resume Analyzer master presentation';
pptx.title = 'ATS Resume Analyzer - 2 Hour Presentation';
pptx.lang = 'en-US';
pptx.theme = {
  headFontFace: 'Aptos Display',
  bodyFontFace: 'Aptos',
  lang: 'en-US',
};

function assertFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required file: ${filePath}`);
  }
}

function read(filePath) {
  assertFile(filePath);
  return fs.readFileSync(filePath, 'utf8');
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function listFiles(dirPath, predicate = () => true) {
  if (!exists(dirPath)) {
    return [];
  }

  return fs
    .readdirSync(dirPath)
    .map((entry) => path.join(dirPath, entry))
    .filter((entry) => fs.statSync(entry).isFile() && predicate(entry))
    .sort((a, b) => a.localeCompare(b));
}

function trimBullet(line) {
  return line.replace(/^[-*]\s+/, '').trim();
}

function parseDeckSlides(markdown) {
  const lines = markdown.split(/\r?\n/);
  const slides = [];
  let current = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (/^## Slide \d+\s+—\s+/.test(line)) {
      if (current) {
        slides.push(current);
      }
      const match = line.match(/^## Slide (\d+)\s+—\s+(.*)$/);
      current = {
        number: Number(match[1]),
        title: match[2].trim(),
        bullets: [],
        body: [],
        images: [],
      };
      continue;
    }

    if (!current) {
      continue;
    }

    const imageMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imageMatch) {
      current.images.push({
        alt: imageMatch[1].trim(),
        src: imageMatch[2].trim(),
      });
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      current.bullets.push(trimBullet(line));
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      current.bullets.push(line.replace(/^\d+\.\s+/, '').trim());
      continue;
    }

    if (line.trim() === '---') {
      continue;
    }

    if (line.trim()) {
      current.body.push(line.trim());
    }
  }

  if (current) {
    slides.push(current);
  }

  return slides;
}

function parseSpeakerNotes(markdown) {
  const lines = markdown.split(/\r?\n/);
  const notesBySlide = new Map();
  const notesByRange = [];
  let currentRange = null;
  let currentLines = [];

  const flush = () => {
    if (!currentRange) {
      return;
    }
    const content = currentLines.join('\n').trim();
    notesByRange.push({
      start: currentRange[0],
      end: currentRange[1],
      content,
    });
    currentRange = null;
    currentLines = [];
  };

  for (const line of lines) {
    const rangeMatch = line.match(/^## Segment [A-Z] \(Slides (\d+)–(\d+),/);
    if (rangeMatch) {
      flush();
      currentRange = [Number(rangeMatch[1]), Number(rangeMatch[2])];
      continue;
    }

    const slideMatch = line.match(/^- Slide (\d+):\s*(.*)$/);
    if (slideMatch) {
      const slideNumber = Number(slideMatch[1]);
      const existing = notesBySlide.get(slideNumber) || [];
      existing.push(slideMatch[2].trim());
      notesBySlide.set(slideNumber, existing);
      continue;
    }

    if (currentRange) {
      currentLines.push(line);
    }
  }

  flush();

  return {
    notesBySlide,
    notesByRange,
  };
}

function parseCodeSnippets(markdown) {
  const sections = markdown.split(/^###\s+/m).slice(1);
  return sections.map((section) => {
    const lines = section.split(/\r?\n/);
    const titleLine = lines.shift() || 'Snippet';
    const title = titleLine.trim();
    const fileLine = lines.find((line) => line.startsWith('**File:**')) || '';
    const whyIndex = lines.findIndex((line) => line.startsWith('**Why it matters:**'));
    const file = fileLine.replace('**File:**', '').replace(/`/g, '').trim();
    const why = whyIndex >= 0 ? lines[whyIndex].replace('**Why it matters:**', '').trim() : '';
    const codeMatch = section.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
    return {
      title,
      file,
      why,
      code: codeMatch ? codeMatch[1].trim() : '',
    };
  });
}

function buildNotes(slide, noteMaps) {
  const direct = noteMaps.notesBySlide.get(slide.number) || [];
  const range = noteMaps.notesByRange.find((entry) => slide.number >= entry.start && slide.number <= entry.end);
  const sections = [
    `Slide ${slide.number}: ${slide.title}`,
  ];

  if (slide.bullets.length) {
    sections.push('Key slide points:');
    sections.push(...slide.bullets.map((bullet) => `- ${bullet}`));
  }

  if (direct.length) {
    sections.push('');
    sections.push('Suggested narration:');
    sections.push(...direct.map((line) => `- ${line}`));
  }

  if (range?.content) {
    sections.push('');
    sections.push('Segment guidance:');
    sections.push(range.content);
  }

  return sections.join('\n');
}

function normalizeDeckImage(imageSrc) {
  const cleaned = imageSrc.replace(/^\.\//, '');
  const candidate = path.join(docsDir, cleaned);
  return exists(candidate) ? candidate : null;
}

function ensureMp4(videoPath) {
  const ext = path.extname(videoPath).toLowerCase();
  if (ext === '.mp4') {
    return videoPath;
  }

  const mp4Path = videoPath.replace(/\.[^.]+$/, '.mp4');
  if (exists(mp4Path)) {
    return mp4Path;
  }

  const ffmpeg = spawnSync(
    'ffmpeg',
    ['-y', '-i', videoPath, '-movflags', 'faststart', '-pix_fmt', 'yuv420p', mp4Path],
    { stdio: 'inherit' }
  );

  if (ffmpeg.status !== 0) {
    throw new Error(`ffmpeg failed to convert ${videoPath}`);
  }

  return mp4Path;
}

function addFullBackground(slide, color = theme.bg) {
  slide.background = { color };
}

function addTitle(slide, title, subtitle = '') {
  slide.addText(title, {
    x: 0.5,
    y: 0.35,
    w: 12.3,
    h: 0.5,
    color: theme.text,
    fontFace: 'Aptos Display',
    fontSize: 24,
    bold: true,
    margin: 0,
  });

  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.55,
      y: 0.9,
      w: 12.1,
      h: 0.3,
      color: theme.muted,
      fontSize: 10,
      italic: true,
      margin: 0,
    });
  }

  slide.addShape(pptx.ShapeType.line, {
    x: 0.5,
    y: 1.18,
    w: 3.3,
    h: 0,
    line: {
      color: theme.accent,
      width: 2,
    },
  });
}

function addBulletColumn(slide, items, options = {}) {
  const x = options.x ?? 0.7;
  const y = options.y ?? 1.45;
  const w = options.w ?? 5.6;
  const h = options.h ?? 5.2;
  const fontSize = options.fontSize ?? 18;

  const runs = [];
  items.forEach((item) => {
    runs.push({
      text: item,
      options: {
        breakLine: true,
        bullet: { indent: fontSize * 0.75 },
      },
    });
  });

  slide.addText(runs, {
    x,
    y,
    w,
    h,
    color: theme.text,
    fontSize,
    valign: 'top',
    margin: 0.08,
    breakLine: false,
    fit: 'shrink',
  });
}

function addBodyText(slide, text, options = {}) {
  slide.addText(text, {
    x: options.x ?? 0.7,
    y: options.y ?? 1.45,
    w: options.w ?? 5.6,
    h: options.h ?? 1.2,
    color: options.color ?? theme.muted,
    fontSize: options.fontSize ?? 14,
    margin: 0,
    fit: 'shrink',
  });
}

function addImageGrid(slide, images, options = {}) {
  const cols = options.cols ?? 2;
  const gapX = options.gapX ?? 0.25;
  const gapY = options.gapY ?? 0.32;
  const startX = options.x ?? 6.45;
  const startY = options.y ?? 1.55;
  const totalW = options.w ?? 6.4;
  const totalH = options.h ?? 5.45;
  const cardW = (totalW - gapX * (cols - 1)) / cols;
  const rows = Math.ceil(images.length / cols);
  const cardH = (totalH - gapY * Math.max(rows - 1, 0)) / Math.max(rows, 1);

  images.forEach((imagePath, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);

    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: cardW,
      h: cardH,
      rectRadius: 0.08,
      line: { color: theme.border, width: 1 },
      fill: { color: theme.panelAlt },
    });
    slide.addImage({
      path: imagePath,
      x: x + 0.05,
      y: y + 0.05,
      w: cardW - 0.1,
      h: cardH - 0.22,
      sizing: 'contain',
    });
    slide.addText(path.basename(imagePath, path.extname(imagePath)).replace(/-/g, ' '), {
      x: x + 0.08,
      y: y + cardH - 0.16,
      w: cardW - 0.16,
      h: 0.12,
      color: theme.muted,
      fontSize: 8,
      align: 'center',
      margin: 0,
    });
  });
}

function addCodeSlide(snippet, index) {
  const slide = pptx.addSlide();
  addFullBackground(slide);
  addTitle(slide, `Code Deep Dive ${index + 1}: ${snippet.title}`, snippet.file);
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.55,
    y: 1.45,
    w: 12.2,
    h: 4.9,
    rectRadius: 0.06,
    line: { color: '1F2937', width: 1 },
    fill: { color: '0B1220' },
  });
  slide.addText(snippet.code || '// code unavailable', {
    x: 0.72,
    y: 1.62,
    w: 11.85,
    h: 4.45,
    fontFace: 'Courier New',
    fontSize: 10,
    color: 'D1FAE5',
    margin: 0,
    fit: 'shrink',
    valign: 'top',
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.7,
    y: 6.45,
    w: 12,
    h: 0.6,
    rectRadius: 0.06,
    line: { color: theme.border, width: 1 },
    fill: { color: theme.panel },
  });
  slide.addText(`Why it matters: ${snippet.why || 'Representative implementation detail used in the project walk-through.'}`, {
    x: 0.9,
    y: 6.6,
    w: 11.6,
    h: 0.28,
    fontSize: 13,
    color: theme.text,
    margin: 0,
    fit: 'shrink',
  });
  slide.addNotes(`Code slide for ${snippet.title}\n\nFile: ${snippet.file}\n\nExplain the implementation intent, then connect it back to reliability, security, or UX.`);
}

function addMediaSlide(title, subtitle, mediaPath, noteText) {
  const slide = pptx.addSlide();
  addFullBackground(slide);
  addTitle(slide, title, subtitle);
  slide.addMedia({
    type: 'video',
    path: mediaPath,
    x: 0.7,
    y: 1.5,
    w: 11.8,
    h: 5.9,
  });
  slide.addNotes(noteText);
}

function addGallerySlide(title, subtitle, imagePaths, noteText) {
  const slide = pptx.addSlide();
  addFullBackground(slide);
  addTitle(slide, title, subtitle);
  addImageGrid(slide, imagePaths, {
    x: 0.65,
    y: 1.45,
    w: 12.1,
    h: 5.8,
    cols: imagePaths.length > 4 ? 3 : 2,
  });
  slide.addNotes(noteText);
}

function collectScreenshotSets() {
  const groups = {};
  for (const themeName of ['light', 'dark']) {
    for (const deviceName of ['desktop', 'mobile']) {
      const dirPath = path.join(screenshotsDir, themeName, deviceName);
      const key = `${themeName}-${deviceName}`;
      groups[key] = listFiles(dirPath, (filePath) => IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase()));
    }
  }
  return groups;
}

function collectVideos() {
  const files = listFiles(videosDir, (filePath) => VIDEO_EXTENSIONS.has(path.extname(filePath).toLowerCase()));
  const videos = new Map();

  for (const filePath of files) {
    const baseName = path.basename(filePath, path.extname(filePath));
    videos.set(baseName, filePath);
  }

  return videos;
}

const deckSlides = parseDeckSlides(read(deckPath));
const notes = parseSpeakerNotes(read(notesPath));
const codeSnippets = parseCodeSnippets(read(codeSnippetsPath));
const screenshotSets = collectScreenshotSets();
const videos = collectVideos();

const titleSlide = pptx.addSlide();
addFullBackground(titleSlide, '08111D');
titleSlide.addShape(pptx.ShapeType.rect, {
  x: 0,
  y: 0,
  w: 13.33,
  h: 7.5,
  fill: {
    color: '0B1220',
    transparency: 5,
  },
  line: { color: '0B1220', transparency: 100 },
});
titleSlide.addShape(pptx.ShapeType.roundRect, {
  x: 0.65,
  y: 0.85,
  w: 12.05,
  h: 5.95,
  rectRadius: 0.08,
  fill: { color: theme.panelAlt, transparency: 8 },
  line: { color: theme.border, width: 1.2 },
});
titleSlide.addText('ATS Resume Analyzer', {
  x: 1.0,
  y: 1.3,
  w: 8.8,
  h: 0.7,
  color: 'F8FAFC',
  fontFace: 'Aptos Display',
  fontSize: 28,
  bold: true,
  margin: 0,
});
titleSlide.addText('AI-powered candidate-side ATS optimization platform', {
  x: 1.0,
  y: 2.03,
  w: 8.8,
  h: 0.36,
  color: theme.accent,
  fontSize: 17,
  margin: 0,
});
titleSlide.addText(
  [
    { text: 'Presentation scope\n', options: { bold: true, color: theme.text } },
    { text: 'Architecture, UX, security, admin tooling, testing, Docker, live demos, and roadmap\n', options: { color: theme.text } },
    { text: '\nWalkthrough evidence\n', options: { bold: true, color: theme.text } },
    { text: 'Embedded tour videos plus light/dark desktop/mobile screenshots\n', options: { color: theme.text } },
    { text: '\nDelivery target\n', options: { bold: true, color: theme.text } },
    { text: 'Approximately 2 hours including discussion pauses and code deep dives', options: { color: theme.text } },
  ],
  {
    x: 1.02,
    y: 2.8,
    w: 5.2,
    h: 2.7,
    fontSize: 15,
    margin: 0,
    fit: 'shrink',
  }
);

const heroImages = [
  path.join(screenshotsDir, 'light', 'desktop', '03-dashboard-analysis.png'),
  path.join(screenshotsDir, 'dark', 'desktop', '16-admin-console.png'),
  path.join(screenshotsDir, 'light', 'mobile', '05-analysis-results-mobile.png'),
];
addImageGrid(titleSlide, heroImages.filter(exists), {
  x: 6.7,
  y: 1.35,
  w: 5.45,
  h: 4.7,
  cols: 1,
  gapY: 0.18,
});
titleSlide.addNotes(
  [
    'Opening talk track:',
    '- Start with the problem statement and who this system is for.',
    '- Explain that the deck includes both system design and product proof.',
    '- Mention the use of OpenRouter free routing, admin controls, and end-to-end automation.',
    '- Set expectation that screenshots are deterministic captures from Playwright and videos are embedded backups for the live demo.',
  ].join('\n')
);

const agendaSlide = pptx.addSlide();
addFullBackground(agendaSlide);
addTitle(agendaSlide, 'Presentation Roadmap', '120-minute pacing guide');
agendaSlide.addTable(
  [
    [{ text: 'Segment' }, { text: 'Time' }, { text: 'Focus' }],
    [{ text: 'Opening + Problem Framing' }, { text: '18 min' }, { text: 'Need, users, goals, constraints' }],
    [{ text: 'Architecture + Core Design' }, { text: '20 min' }, { text: 'Frontend, backend, queue, data model' }],
    [{ text: 'Security + Resilience' }, { text: '23 min' }, { text: 'Auth, sessions, rate limits, errors' }],
    [{ text: 'Frontend + UX Architecture' }, { text: '20 min' }, { text: 'Routing, state, async UX, admin console' }],
    [{ text: 'Testing + Quality' }, { text: '12 min' }, { text: 'Backend, E2E, visual tours, regression safety' }],
    [{ text: 'Walkthrough + Media' }, { text: '15 min' }, { text: 'Product screenshots, dark/light modes, demo videos' }],
    [{ text: 'Code Review + Roadmap + Q&A' }, { text: '12 min' }, { text: 'Risks, mitigations, future work' }],
  ],
  {
    x: 0.7,
    y: 1.55,
    w: 12.0,
    h: 4.7,
    colW: [3.2, 1.2, 7.6],
    rowH: 0.52,
    border: { pt: 1, color: theme.border },
    fill: theme.panel,
    color: theme.text,
    fontSize: 13,
    margin: 0.08,
    autoFit: false,
    bold: true,
  }
);
agendaSlide.addNotes(
  [
    'Use this slide to establish control over timing.',
    'Invite the audience to interrupt at segment boundaries rather than every slide.',
    'Call out that live demo risk is mitigated by embedded media in the deck.',
  ].join('\n')
);

for (const slideData of deckSlides) {
  const slide = pptx.addSlide();
  addFullBackground(slide);
  addTitle(slide, `Slide ${slideData.number}: ${slideData.title}`, 'Generated from docs/presentation/SLIDE_DECK_2H.md');

  const resolvedImages = slideData.images
    .map((image) => normalizeDeckImage(image.src))
    .filter(Boolean);

  const bodyLines = slideData.body.filter((line) => !/^`{3}/.test(line));
  const bodyText = bodyLines.join('\n');

  if (resolvedImages.length >= 4) {
    addBulletColumn(slide, slideData.bullets.length ? slideData.bullets : ['Use the visuals on the right to narrate this workflow.'], {
      x: 0.7,
      y: 1.55,
      w: 4.4,
      h: 5.0,
      fontSize: 16,
    });
    if (bodyText) {
      addBodyText(slide, bodyText, {
        x: 0.75,
        y: 5.95,
        w: 4.25,
        h: 0.85,
        fontSize: 10,
      });
    }
    addImageGrid(slide, resolvedImages, {
      x: 5.3,
      y: 1.45,
      w: 7.2,
      h: 5.7,
      cols: 2,
    });
  } else if (resolvedImages.length > 0) {
    addBulletColumn(slide, slideData.bullets.length ? slideData.bullets : ['Use the visual evidence to anchor your explanation.'], {
      x: 0.7,
      y: 1.55,
      w: 4.6,
      h: 4.8,
      fontSize: 17,
    });
    if (bodyText) {
      addBodyText(slide, bodyText, {
        x: 0.75,
        y: 5.95,
        w: 4.45,
        h: 0.8,
        fontSize: 10,
      });
    }
    addImageGrid(slide, resolvedImages, {
      x: 5.55,
      y: 1.62,
      w: 6.7,
      h: 5.2,
      cols: resolvedImages.length > 1 ? 2 : 1,
    });
  } else {
    if (slideData.bullets.length) {
      addBulletColumn(slide, slideData.bullets, {
        x: 0.75,
        y: 1.55,
        w: 5.85,
        h: 4.9,
        fontSize: slideData.bullets.length > 5 ? 15 : 18,
      });
    }
    if (bodyText) {
      addBodyText(slide, bodyText, {
        x: 0.78,
        y: slideData.bullets.length ? 6.0 : 1.8,
        w: 5.8,
        h: slideData.bullets.length ? 0.7 : 1.7,
        fontSize: slideData.bullets.length ? 10 : 16,
        color: slideData.bullets.length ? theme.muted : theme.text,
      });
    }

    const visualPanel = slide.addShape(pptx.ShapeType.roundRect, {
      x: 6.95,
      y: 1.55,
      w: 5.3,
      h: 5.3,
      rectRadius: 0.08,
      line: { color: theme.border, width: 1 },
      fill: { color: theme.panel },
    });
    void visualPanel;
    slide.addText(
      [
        { text: 'Presenter emphasis\n', options: { bold: true, color: theme.accent } },
        {
          text:
            'Use this space to speak to trade-offs, architecture choices, and how this slide connects to the live product evidence later in the deck.',
          options: { color: theme.text },
        },
      ],
      {
        x: 7.3,
        y: 2.0,
        w: 4.55,
        h: 1.35,
        fontSize: 16,
        margin: 0,
        fit: 'shrink',
      }
    );

    slide.addShape(pptx.ShapeType.roundRect, {
      x: 7.25,
      y: 3.75,
      w: 4.7,
      h: 2.0,
      rectRadius: 0.06,
      line: { color: theme.border, width: 1 },
      fill: { color: theme.panelAlt },
    });
    slide.addText(`Slide ${slideData.number}\n${slideData.title}`, {
      x: 7.55,
      y: 4.1,
      w: 4.1,
      h: 0.7,
      fontSize: 20,
      bold: true,
      color: theme.text,
      align: 'center',
      valign: 'mid',
      margin: 0,
    });
  }

  slide.addNotes(buildNotes(slideData, notes));
}

const desiredVideos = [
  {
    title: 'Embedded Demo Video: User Journey (Light Mode)',
    key: 'tour-user-desktop-light',
    note: 'Narrate login, signup, dashboard setup, model selection, resume management, history, and analysis result flow.',
  },
  {
    title: 'Embedded Demo Video: User Journey (Dark Mode)',
    key: 'tour-user-desktop-dark',
    note: 'Use this to show that the same workflow remains legible and polished in dark theme.',
  },
  {
    title: 'Embedded Demo Video: Admin Journey (Light Mode)',
    key: 'tour-admin-desktop-light',
    note: 'Highlight user search, profile edits, password reset, session revocation, and audit visibility.',
  },
  {
    title: 'Embedded Demo Video: Admin Journey (Dark Mode)',
    key: 'tour-admin-desktop-dark',
    note: 'Use as a backup demo route and to reinforce role-based access plus theme coverage.',
  },
];

for (const item of desiredVideos) {
  const sourcePath = videos.get(item.key) || videos.get(item.key.replace(/-light|-dark/, ''));
  if (!sourcePath) {
    continue;
  }
  const mp4Path = ensureMp4(sourcePath);
  addMediaSlide(item.title, path.basename(mp4Path), mp4Path, item.note);
}

const gallerySets = [
  {
    title: 'Light Theme Desktop Gallery',
    subtitle: 'All desktop screens captured by @tour',
    files: screenshotSets['light-desktop'],
  },
  {
    title: 'Dark Theme Desktop Gallery',
    subtitle: 'All desktop screens captured by @tour',
    files: screenshotSets['dark-desktop'],
  },
  {
    title: 'Light Theme Mobile Gallery',
    subtitle: 'Mobile responsive coverage',
    files: screenshotSets['light-mobile'],
  },
  {
    title: 'Dark Theme Mobile Gallery',
    subtitle: 'Mobile responsive coverage',
    files: screenshotSets['dark-mobile'],
  },
];

for (const gallery of gallerySets) {
  const chunkSize = gallery.files.length > 9 ? 9 : 6;
  for (let index = 0; index < gallery.files.length; index += chunkSize) {
    const page = Math.floor(index / chunkSize) + 1;
    const chunk = gallery.files.slice(index, index + chunkSize);
    addGallerySlide(
      `${gallery.title} — Page ${page}`,
      gallery.subtitle,
      chunk,
      `Walk the audience through these ${gallery.title.toLowerCase()} captures. Explain layout consistency, responsive behavior, and UI state coverage.`
    );
  }
}

for (const [index, snippet] of codeSnippets.entries()) {
  addCodeSlide(snippet, index);
}

await pptx.writeFile({ fileName: outputPath });
console.log(`Presentation written to ${outputPath}`);
