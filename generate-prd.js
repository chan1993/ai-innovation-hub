const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, ExternalHyperlink,
  LevelFormat, TableOfContents, UnderlineType
} = require('C:/Users/KambhampatiChanakya/AppData/Roaming/npm/node_modules/docx');
const fs = require('fs');

// ─── Colours ────────────────────────────────────────────────────────────────
const BLUE   = "1E3A6E";
const ACCENT = "4F86F7";
const LIGHT  = "EBF1FB";
const GREY   = "F5F7FA";
const MID    = "6B7280";
const WHITE  = "FFFFFF";
const DARK   = "111827";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const sp = (before = 0, after = 0) => ({ spacing: { before, after } });
const border = (color = "CCCCCC") => ({ style: BorderStyle.SINGLE, size: 1, color });
const borders = (color = "CCCCCC") => ({ top: border(color), bottom: border(color), left: border(color), right: border(color) });
const noBorder = () => ({ style: BorderStyle.NONE, size: 0, color: "FFFFFF" });
const noBorders = () => ({ top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder() });

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, bold: true, size: 32, color: BLUE, font: "Arial" })],
    ...sp(400, 160),
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: ACCENT, space: 4 } },
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, size: 26, color: BLUE, font: "Arial" })],
    ...sp(280, 100),
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, bold: true, size: 22, color: ACCENT, font: "Arial" })],
    ...sp(200, 80),
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, color: DARK, font: "Arial", ...opts })],
    ...sp(80, 80),
  });
}

function bullet(text, bold = false) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text, size: 22, color: DARK, font: "Arial", bold })],
    ...sp(60, 60),
  });
}

function numbered(text) {
  return new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    children: [new TextRun({ text, size: 22, color: DARK, font: "Arial" })],
    ...sp(60, 60),
  });
}

function gap(n = 1) {
  return Array.from({ length: n }, () => new Paragraph({ children: [new TextRun("")], ...sp(0, 0) }));
}

function infoBox(text, bgColor = LIGHT) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({ children: [
      new TableCell({
        borders: { top: { style: BorderStyle.SINGLE, size: 6, color: ACCENT }, bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT }, left: { style: BorderStyle.SINGLE, size: 18, color: ACCENT }, right: noBorder() },
        shading: { fill: bgColor, type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 160, right: 160 },
        width: { size: 9360, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text, size: 20, color: BLUE, font: "Arial", italics: true })], ...sp(0, 0) })],
      })
    ]})]
  });
}

function featureRow(feature, description) {
  return new TableRow({ children: [
    new TableCell({
      borders: borders("DDDDDD"),
      shading: { fill: LIGHT, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      width: { size: 2800, type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text: feature, size: 20, bold: true, color: BLUE, font: "Arial" })], ...sp(0,0) })],
    }),
    new TableCell({
      borders: borders("DDDDDD"),
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      width: { size: 6560, type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text: description, size: 20, color: DARK, font: "Arial" })], ...sp(0,0) })],
    }),
  ]});
}

function twoColRow(a, b, header = false) {
  const fill = header ? BLUE : (a.includes("NEXT_PUBLIC") ? "F8F8F8" : "FFFFFF");
  const color = header ? WHITE : DARK;
  return new TableRow({ children: [
    new TableCell({
      borders: borders("CCCCCC"),
      shading: { fill, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      width: { size: 3400, type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text: a, size: 20, bold: header, color, font: "Arial" })], ...sp(0,0) })],
    }),
    new TableCell({
      borders: borders("CCCCCC"),
      shading: { fill: header ? BLUE : "FFFFFF", type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      width: { size: 5960, type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text: b, size: 20, bold: header, color, font: "Arial" })], ...sp(0,0) })],
    }),
  ]});
}

// ─── Document ─────────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22, color: DARK } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, font: "Arial", color: BLUE }, paragraph: { spacing: { before: 400, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, font: "Arial", color: BLUE }, paragraph: { spacing: { before: 280, after: 100 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 22, bold: true, font: "Arial", color: ACCENT }, paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 } },
    ],
  },
  sections: [
    // ── Cover Page ──────────────────────────────────────────────────────────
    {
      properties: {
        page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
      },
      children: [
        // Top colour band via a table
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [9360],
          rows: [new TableRow({ children: [new TableCell({
            borders: noBorders(),
            shading: { fill: BLUE, type: ShadingType.CLEAR },
            margins: { top: 440, bottom: 440, left: 440, right: 440 },
            width: { size: 9360, type: WidthType.DXA },
            children: [
              new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: "ZoomRx", size: 28, color: "AABFE8", font: "Arial", bold: true })], ...sp(0,0) }),
              new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: "AI Innovation Hub", size: 52, color: WHITE, font: "Arial", bold: true })], ...sp(120, 80) }),
              new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: "Product Requirements Document", size: 26, color: "AABFE8", font: "Arial" })], ...sp(0, 0) }),
            ],
          })]})],
        }),

        ...gap(2),

        infoBox("Someone at ZoomRx may have already solved what you’re working on — someone on your team figured it out last Tuesday. Discover what’s working, share what you’ve built, and earn your spot on the leaderboard."),

        ...gap(2),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [4680, 4680],
          rows: [
            new TableRow({ children: [
              new TableCell({ borders: noBorders(), width: { size: 4680, type: WidthType.DXA }, children: [
                new Paragraph({ children: [new TextRun({ text: "Version", size: 20, color: MID, font: "Arial" })], ...sp(0,40) }),
                new Paragraph({ children: [new TextRun({ text: "1.0", size: 22, bold: true, color: DARK, font: "Arial" })], ...sp(0,0) }),
              ]}),
              new TableCell({ borders: noBorders(), width: { size: 4680, type: WidthType.DXA }, children: [
                new Paragraph({ children: [new TextRun({ text: "Date", size: 20, color: MID, font: "Arial" })], ...sp(0,40) }),
                new Paragraph({ children: [new TextRun({ text: "May 2026", size: 22, bold: true, color: DARK, font: "Arial" })], ...sp(0,0) }),
              ]}),
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: noBorders(), width: { size: 4680, type: WidthType.DXA }, children: [
                new Paragraph({ children: [new TextRun({ text: "Author", size: 20, color: MID, font: "Arial" })], ...sp(80,40) }),
                new Paragraph({ children: [new TextRun({ text: "Kambhampati Chanakya", size: 22, bold: true, color: DARK, font: "Arial" })], ...sp(0,0) }),
              ]}),
              new TableCell({ borders: noBorders(), width: { size: 4680, type: WidthType.DXA }, children: [
                new Paragraph({ children: [new TextRun({ text: "Status", size: 20, color: MID, font: "Arial" })], ...sp(80,40) }),
                new Paragraph({ children: [new TextRun({ text: "Production", size: 22, bold: true, color: "16A34A", font: "Arial" })], ...sp(0,0) }),
              ]}),
            ]}),
          ],
        }),

        new Paragraph({ children: [new PageBreak()] }),
      ]
    },

    // ── Main Content ────────────────────────────────────────────────────────
    {
      properties: {
        page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } }
      },
      headers: {
        default: new Header({ children: [
          new Paragraph({
            children: [
              new TextRun({ text: "ZoomRx AI Innovation Hub  |  PRD", size: 18, color: MID, font: "Arial" }),
              new TextRun({ text: "\t", size: 18 }),
              new TextRun({ text: "Confidential", size: 18, color: MID, font: "Arial", italics: true }),
            ],
            tabStops: [{ type: "right", position: 9360 }],
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD", space: 4 } },
          })
        ]})
      },
      footers: {
        default: new Footer({ children: [
          new Paragraph({
            children: [
              new TextRun({ text: "ZoomRx Internal  •  May 2026", size: 18, color: MID, font: "Arial" }),
              new TextRun({ text: "\t", size: 18 }),
              new TextRun({ text: "Page ", size: 18, color: MID, font: "Arial" }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, color: MID, font: "Arial" }),
              new TextRun({ text: " of ", size: 18, color: MID, font: "Arial" }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: MID, font: "Arial" }),
            ],
            tabStops: [{ type: "right", position: 9360 }],
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD", space: 4 } },
          })
        ]})
      },
      children: [

        // ── 1. Executive Summary ─────────────────────────────────────────────
        h1("1. Executive Summary"),
        body("The ZoomRx AI Innovation Hub is an internal web portal that enables employees to submit, discover, and build on AI ideas across the organisation. Rather than letting individual breakthroughs remain siloed, the platform creates a shared, searchable knowledge base of AI use cases — from quick prompt tricks to fully implemented workflows."),
        body("The portal launched in May 2026 and is live at:"),
        new Paragraph({
          children: [new ExternalHyperlink({ children: [new TextRun({ text: "https://ai-innovation-hub-sable.vercel.app", size: 22, color: ACCENT, font: "Arial", underline: { type: UnderlineType.SINGLE } })], link: "https://ai-innovation-hub-sable.vercel.app" })],
          ...sp(80, 160),
        }),

        // ── 2. Problem Statement ─────────────────────────────────────────────
        h1("2. Problem Statement"),
        body("As ZoomRx teams adopt AI tools at an accelerating pace, two problems are emerging:"),
        bullet("Knowledge stays siloed — an analyst figures out a great way to use Claude for transcript summarisation, but no one else on the team ever hears about it."),
        bullet("Duplicated effort — multiple people independently solve the same problem, wasting time that could be spent on new challenges."),
        bullet("No way to measure momentum — leadership has no visibility into how widely AI is being adopted or which teams are leading the way."),
        ...gap(1),
        body("The AI Innovation Hub solves all three by giving every employee a simple place to log what they’ve tried, discover what colleagues are building, and follow step-by-step instructions to replicate proven ideas."),

        // ── 3. Goals ────────────────────────────────────────────────────────
        h1("3. Goals & Success Metrics"),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [4680, 4680],
          rows: [
            new TableRow({ children: [
              new TableCell({ borders: borders("CCCCCC"), shading: { fill: BLUE, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 140, right: 140 }, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Goal", size: 20, bold: true, color: WHITE, font: "Arial" })], ...sp(0,0) })] }),
              new TableCell({ borders: borders("CCCCCC"), shading: { fill: BLUE, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 140, right: 140 }, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Success Metric", size: 20, bold: true, color: WHITE, font: "Arial" })], ...sp(0,0) })] }),
            ]}),
            ...[
              ["Surface hidden AI knowledge", "50+ ideas submitted in the first month"],
              ["Reduce duplicated effort", "Ideas viewed and re-used by people other than the author"],
              ["Build a culture of sharing", "Leaderboard activity — repeat contributors"],
              ["Measure AI adoption", "Admin CSV export shows breadth of tools & teams"],
              ["Enable replication", "Implementation instructions viewed and acted on"],
            ].map(([g, m]) => new TableRow({ children: [
              new TableCell({ borders: borders("CCCCCC"), margins: { top: 80, bottom: 80, left: 140, right: 140 }, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: g, size: 20, color: DARK, font: "Arial" })], ...sp(0,0) })] }),
              new TableCell({ borders: borders("CCCCCC"), margins: { top: 80, bottom: 80, left: 140, right: 140 }, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: m, size: 20, color: DARK, font: "Arial" })], ...sp(0,0) })] }),
            ]})),
          ],
        }),

        // ── 4. Features ─────────────────────────────────────────────────────
        ...gap(1),
        h1("4. Features"),

        h2("4.1 Idea Submission"),
        body("Any ZoomRx employee can submit an idea through a guided form at /submit. Key fields:"),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2800, 6560],
          rows: [
            featureRow("Field", "Description"),
            featureRow("Idea Title", "Mandatory. Short name for the idea — used as the card heading throughout the app."),
            featureRow("Idea Description & Expected Leverage", "Mandatory. Combined field for describing the idea and what value it brings."),
            featureRow("AI Platform(s) Used", "Multi-select chips: Galen, Claude, ChatGPT, Gemini, Copilot, Cursor, Perplexity, Other."),
            featureRow("Stage", "Idea / In Progress / Implemented."),
            featureRow("Time to Implement", "< 5 mins, 5–15 mins, 15–30 mins, < 1 hour, 1–2 hours, 2+ hours."),
            featureRow("Tags", "Client, Automation, PowerPoint, Survey Draft, Admin Portal, SharePoint, Excel, Synapse."),
            featureRow("Points of Contact", "Comma-separated ZoomRx emails — names are auto-parsed and displayed as chips."),
            featureRow("SharePoint Link", "With a reminder to share with “Everyone at ZoomRx” to avoid access issues."),
            featureRow("Implementation Instructions", "Step-by-step instructions so others can replicate the idea without asking the author."),
            featureRow("GitHub / Gist", "Optional link to code."),
            featureRow("Reference Links", "Papers, articles, tools that inspired the idea."),
          ],
        }),

        ...gap(1),
        h2("4.2 Idea Feed & Discovery"),
        bullet("Paginated card feed on the home page, ordered by most recent."),
        bullet("Fuzzy search (Fuse.js, threshold 0.35) across title, description, and author."),
        bullet("Filter by status (Idea / In Progress / Implemented) and by tag."),
        bullet("Each card shows: title, description snippet, status badge, tags, author, likes, views, comments, time estimate, and implementation status."),

        ...gap(1),
        h2("4.3 Idea Detail Page"),
        bullet("Full idea view at /idea/[id]."),
        bullet("Increments view count on each visit."),
        bullet("Like button (one like per name, stored in localStorage)."),
        bullet("Community implementation status — “Have you tried this?” with Working / Not Working / Stuck options."),
        bullet("Comments section."),
        bullet("Similar ideas panel powered by Jaccard similarity on tokenised idea text."),
        bullet("Edit button — author-verified via email match before editing is allowed."),

        ...gap(1),
        h2("4.4 Leaderboard"),
        bullet("Project-based ranking at /leaderboard, ordered by total likes then idea count."),
        bullet("Filterable by period: All Time, This Month, This Week."),
        bullet("Each entry shows project name (clickable), stats, top 3 ideas, and contributor chips."),
        bullet("Excludes archived ideas and ideas with no title."),

        ...gap(1),
        h2("4.5 Person & Project Pages"),
        bullet("/person/[name] — all ideas by a specific contributor, with their stats summary."),
        bullet("/project/[name] — all ideas under a specific project/title group, with contributor list."),

        ...gap(1),
        h2("4.6 Admin Panel"),
        body("Accessible at /admin?key=<ADMIN_KEY>. Capabilities:"),
        bullet("View all ideas with status, likes, and comment counts."),
        bullet("Change idea status via dropdown (Idea / In Progress / Implemented / Archived)."),
        bullet("Delete ideas with a confirmation step."),
        bullet("Create and delete tags."),
        bullet("Export all ideas as a CSV file."),

        // ── 5. Tech Stack ────────────────────────────────────────────────────
        ...gap(1),
        h1("5. Tech Stack"),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [3400, 5960],
          rows: [
            twoColRow("Component", "Technology", true),
            twoColRow("Frontend Framework", "Next.js 16 (App Router) with React 19"),
            twoColRow("Language", "TypeScript"),
            twoColRow("Styling", "Tailwind CSS 4"),
            twoColRow("Database", "Supabase (PostgreSQL) with Row Level Security"),
            twoColRow("Search", "Fuse.js (fuzzy search, client-side)"),
            twoColRow("Similarity", "Jaccard similarity on tokenised text (client-side)"),
            twoColRow("Hosting", "Vercel (current) — deployable anywhere Node.js 18+ runs"),
            twoColRow("Auth", "No login required — email stored in localStorage, domain-restricted to @zoomrx.com"),
          ],
        }),

        // ── 6. Database Schema ───────────────────────────────────────────────
        ...gap(1),
        h1("6. Database Schema"),
        body("All tables live in a Supabase (PostgreSQL) project with Row Level Security enabled. Policies allow all operations for authenticated requests using the anon key."),

        h2("ideas"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2400, 2400, 4560],
          rows: [
            new TableRow({ children: [
              new TableCell({ borders: borders("CCCCCC"), shading: { fill: BLUE, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 2400, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Column", size: 20, bold: true, color: WHITE, font: "Arial" })], ...sp(0,0) })] }),
              new TableCell({ borders: borders("CCCCCC"), shading: { fill: BLUE, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 2400, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Type", size: 20, bold: true, color: WHITE, font: "Arial" })], ...sp(0,0) })] }),
              new TableCell({ borders: borders("CCCCCC"), shading: { fill: BLUE, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 4560, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Notes", size: 20, bold: true, color: WHITE, font: "Arial" })], ...sp(0,0) })] }),
            ]}),
            ...[
              ["id", "UUID", "Primary key, auto-generated"],
              ["s_no", "SERIAL", "Auto-incrementing display number"],
              ["project", "TEXT", "Idea title (mandatory)"],
              ["idea", "TEXT", "Idea description & expected leverage"],
              ["outcome", "TEXT", "Legacy field (mirrors idea for new submissions)"],
              ["person_name", "TEXT", "Parsed from email on submit"],
              ["person_email", "TEXT", "Author’s @zoomrx.com email"],
              ["status", "TEXT", "Idea | In Progress | Implemented | Archived"],
              ["views", "INTEGER", "Incremented via RPC on each page visit"],
              ["links", "JSONB", "{ github, sharepoint, references[] }"],
              ["poc_emails", "TEXT[]", "Array of ZoomRx emails for points of contact"],
              ["ai_platforms", "TEXT[]", "Selected AI tools (e.g. Claude, Galen)"],
              ["implementation_notes", "TEXT", "Step-by-step replication instructions"],
              ["time_to_implement", "TEXT", "e.g. < 5 mins, 1–2 hours"],
              ["created_at", "TIMESTAMPTZ", "Auto-set on insert"],
              ["updated_at", "TIMESTAMPTZ", "Auto-updated via trigger"],
            ].map(([col, type, note]) => new TableRow({ children: [
              new TableCell({ borders: borders("CCCCCC"), margins: { top: 60, bottom: 60, left: 120, right: 120 }, width: { size: 2400, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: col, size: 20, color: ACCENT, font: "Courier New", bold: true })], ...sp(0,0) })] }),
              new TableCell({ borders: borders("CCCCCC"), margins: { top: 60, bottom: 60, left: 120, right: 120 }, width: { size: 2400, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: type, size: 20, color: DARK, font: "Arial" })], ...sp(0,0) })] }),
              new TableCell({ borders: borders("CCCCCC"), margins: { top: 60, bottom: 60, left: 120, right: 120 }, width: { size: 4560, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: note, size: 20, color: DARK, font: "Arial" })], ...sp(0,0) })] }),
            ]})),
          ],
        }),

        ...gap(1),
        h2("Supporting tables"),
        bullet("tags — id, name, created_at"),
        bullet("idea_tags — idea_id (FK), tag_id (FK) — many-to-many join"),
        bullet("likes — id, idea_id (FK), person_name, created_at"),
        bullet("comments — id, idea_id (FK), person_name, content, created_at"),
        bullet("implementation_reports — id, idea_id (FK), person_name, status (working | not_working | stuck), created_at — UNIQUE(idea_id, person_name)"),

        // ── 7. Environment Setup ──────────────────────────────────────────────
        ...gap(1),
        h1("7. Environment Setup"),
        body("Create a .env.local file in the project root with the following variables:"),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [3800, 5560],
          rows: [
            twoColRow("Variable", "Description", true),
            twoColRow("NEXT_PUBLIC_SUPABASE_URL", "Your Supabase project URL (from Project Settings > API)"),
            twoColRow("NEXT_PUBLIC_SUPABASE_ANON_KEY", "Supabase anon/public key (from Project Settings > API)"),
            twoColRow("NEXT_PUBLIC_ALLOWED_DOMAIN", "Email domain to restrict submissions, e.g. zoomrx.com"),
            twoColRow("NEXT_PUBLIC_ADMIN_KEY", "Secret key to access /admin panel"),
          ],
        }),

        ...gap(1),
        h2("Database migrations"),
        body("Run the following SQL in Supabase SQL Editor (in order) to set up the schema from scratch, or apply the migration files in supabase/migrations/:"),
        numbered("Create the ideas table, tags, idea_tags, likes, comments, and implementation_reports tables."),
        numbered("Add the increment_views RPC function."),
        numbered("Enable Row Level Security and add permissive policies on all tables."),
        numbered("Run migration 001: adds time_to_implement column."),
        numbered("Run migration 002: adds implementation_reports table."),
        numbered("Run migration 003: adds ai_platforms[] and implementation_notes columns."),
        body("All migration files are in supabase/migrations/ in the codebase."),

        // ── 8. Deployment Options ─────────────────────────────────────────────
        ...gap(1),
        h1("8. Deployment Options"),

        h2("Option A — Custom Domain on Vercel (Recommended • Fastest)"),
        body("The application is already deployed on Vercel. To point a company domain at it:"),
        numbered("Go to vercel.com > Project Settings > Domains."),
        numbered("Add ai-hub.zoomrx.com (or any subdomain)."),
        numbered("Add the provided CNAME record to ZoomRx DNS."),
        numbered("Done — no code changes required."),
        ...gap(1),
        infoBox("This approach takes ~15 minutes and requires only a DNS change from IT. Supabase remains the database. No infrastructure to manage."),

        ...gap(1),
        h2("Option B — Self-Hosted (Azure / AWS / Docker)"),
        body("The app is a standard Next.js application and runs wherever Node.js 18+ is available."),

        h3("Azure App Service"),
        numbered("Install Azure CLI and log in."),
        numbered("Run: az webapp up --name ai-innovation-hub --runtime \"NODE:18-lts\""),
        numbered("Set the four environment variables in Azure Portal > App Service > Configuration."),
        numbered("Point a custom domain via Azure Portal > Custom Domains."),

        h3("Docker"),
        body("A Dockerfile can be added to the project for containerised deployment:"),
        new Paragraph({
          children: [new TextRun({ text: "FROM node:18-alpine\nWORKDIR /app\nCOPY . .\nRUN npm install && npm run build\nEXPOSE 3000\nCMD [\"npm\", \"start\"]", size: 18, font: "Courier New", color: DARK })],
          shading: { fill: GREY, type: ShadingType.CLEAR },
          border: { left: { style: BorderStyle.SINGLE, size: 12, color: ACCENT } },
          indent: { left: 360 },
          ...sp(120, 120),
        }),
        body("Build: docker build -t ai-innovation-hub . then docker run -p 3000:3000 --env-file .env ai-innovation-hub"),

        ...gap(1),
        h2("Option C — Internal Server (IIS / Linux)"),
        body("For on-premise hosting:"),
        numbered("Install Node.js 18+ on the server."),
        numbered("Copy the codebase and run npm install && npm run build."),
        numbered("Start with npm start (runs on port 3000 by default)."),
        numbered("Use IIS with URL Rewrite / nginx as a reverse proxy for port 80/443."),
        numbered("Set environment variables in the server’s system environment or a .env.local file."),

        // ── 9. Handover Checklist ─────────────────────────────────────────────
        ...gap(1),
        h1("9. IT Handover Checklist"),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [600, 8760],
          rows: [
            ...[
              "Obtain the codebase (GitHub repo or zip from the author)",
              "Create a Supabase project (free tier sufficient for < 50k rows) OR set up an internal PostgreSQL instance",
              "Run all database migrations in order (see Section 7)",
              "Set the four environment variables in your hosting platform",
              "Choose a deployment option (A, B, or C from Section 8)",
              "Point the company domain / subdomain to the deployment",
              "Test the /submit flow end-to-end with a @zoomrx.com email",
              "Test the /admin panel with the configured admin key",
              "Communicate the URL and one-liner to all staff",
            ].map((item) => new TableRow({ children: [
              new TableCell({ borders: noBorders(), width: { size: 600, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 0, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: "☐", size: 22, color: ACCENT, font: "Arial" })], ...sp(0,0) })] }),
              new TableCell({ borders: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "EEEEEE" }, top: noBorder(), left: noBorder(), right: noBorder() }, width: { size: 8760, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 0, right: 0 }, children: [new Paragraph({ children: [new TextRun({ text: item, size: 22, color: DARK, font: "Arial" })], ...sp(0,0) })] }),
            ]})),
          ],
        }),

        // ── 10. Roadmap ───────────────────────────────────────────────────────
        ...gap(1),
        h1("10. Future Roadmap"),
        body("The following enhancements are recommended based on early usage patterns:"),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [1400, 5560, 2400],
          rows: [
            new TableRow({ children: [
              new TableCell({ borders: borders("CCCCCC"), shading: { fill: BLUE, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 1400, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Priority", size: 20, bold: true, color: WHITE, font: "Arial" })], ...sp(0,0) })] }),
              new TableCell({ borders: borders("CCCCCC"), shading: { fill: BLUE, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 5560, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Feature", size: 20, bold: true, color: WHITE, font: "Arial" })], ...sp(0,0) })] }),
              new TableCell({ borders: borders("CCCCCC"), shading: { fill: BLUE, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 2400, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Effort", size: 20, bold: true, color: WHITE, font: "Arial" })], ...sp(0,0) })] }),
            ]}),
            ...[
              ["High", "Email digest — weekly summary of top ideas to all staff", "Medium"],
              ["High", "Department / team filter — see ideas from your specific group", "Low"],
              ["High", "SSO / Azure AD login to replace email-based identity", "High"],
              ["Medium", "Voting on roadmap — upvote ideas to prioritise implementation", "Low"],
              ["Medium", "Notifications — alert authors when someone tries their idea", "Medium"],
              ["Medium", "Rich text editor for implementation instructions (markdown)", "Low"],
              ["Low", "AI-generated tags — auto-tag on submission using Claude API", "Medium"],
              ["Low", "Analytics dashboard for leadership — adoption trends over time", "High"],
            ].map(([p, f, e]) => new TableRow({ children: [
              new TableCell({ borders: borders("CCCCCC"), margins: { top: 60, bottom: 60, left: 120, right: 120 }, width: { size: 1400, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: p, size: 20, color: p === "High" ? "DC2626" : p === "Medium" ? "D97706" : "16A34A", font: "Arial", bold: true })], ...sp(0,0) })] }),
              new TableCell({ borders: borders("CCCCCC"), margins: { top: 60, bottom: 60, left: 120, right: 120 }, width: { size: 5560, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: f, size: 20, color: DARK, font: "Arial" })], ...sp(0,0) })] }),
              new TableCell({ borders: borders("CCCCCC"), margins: { top: 60, bottom: 60, left: 120, right: 120 }, width: { size: 2400, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: e, size: 20, color: DARK, font: "Arial" })], ...sp(0,0) })] }),
            ]})),
          ],
        }),

        ...gap(2),
        infoBox("For questions about the codebase or deployment, contact Kambhampati Chanakya. The live deployment and admin credentials are held by the author and should be transferred to the designated IT owner as part of the handover."),
      ]
    }
  ]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("ZoomRx_AI_Innovation_Hub_PRD.docx", buffer);
  console.log("Done: ZoomRx_AI_Innovation_Hub_PRD.docx");
});
