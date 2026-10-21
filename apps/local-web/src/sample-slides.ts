const slides = [
  [
    '01 / A clear starting point',
    'Ideas become<br>presentations.',
    'Three sample slides to explore the canvas. Your generated decks will arrive in a later milestone.',
  ],
  [
    '02 / Make room for the story',
    'One thought.<br>One slide.',
    'Move between slides, adjust the canvas width, or go fullscreen to focus on the presentation.',
  ],
  [
    '03 / Ready for what comes next',
    'A place for<br>your next idea.',
    'This is sample content. It is independent of your chats and does not publish or save a generated deck.',
  ],
]

export const sampleAssets = Object.fromEntries(
  slides.map(([eyebrow, title, description], index) => [
    `/samples/${index + 1}.html`,
    {
      contentType: 'text/html; charset=utf-8',
      sandboxed: true,
      body: `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sample slide ${index + 1}</title><style>
body{margin:0;background:#132e2a;color:#f7f2e8;font-family:system-ui,sans-serif;height:100vh;display:grid;align-content:center;box-sizing:border-box;padding:5vw}small{font-size:1.8vw;color:#c2dc80;letter-spacing:.1em}h1{font-size:8vw;line-height:1.05;font-weight:500;letter-spacing:-.05em;margin:3.5vw 0}p{font-size:2.4vw;line-height:1.5;max-width:80%;color:#becbc5;margin:0}</style><small>${eyebrow}</small><h1>${title}</h1><p>${description}</p></html>`,
    },
  ]),
)
