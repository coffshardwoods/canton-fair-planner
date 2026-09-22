# Canton Fair Planner

Mobile-first static planner for Canton Fair booth shortlisting, route planning, and shared Martin/Pete research.

The site is designed for GitHub Pages and has no build step. Open `index.html` locally or publish the `main` branch with GitHub Pages.

## Files

```text
index.html              App shell
style.css               Mobile-first styling
app.js                  JSON loading, filters, cards, route view
manifest.json           Installable PWA manifest
service-worker.js       Offline cache
icons/icon.svg          App icon
data/exhibitors.json    Shared exhibitor facts
data/martin.json        Martin shortlist and notes
data/pete.json          Pete shortlist and notes
data/phase-1-guide-summary.json
                        Lightweight reference data from the Phase 1 buyer guide
references/             Original source PDFs and research documents
```

## Data Model

`data/exhibitors.json` is the shared factual source. Only add real exhibitors when the company, hall, booth, phase, and source have been confirmed from a reliable Canton Fair source.

```json
{
  "id": "unique-exhibitor-id",
  "demo": false,
  "company": "Confirmed company name",
  "phase": "Phase 1 / Phase 2 / Phase 3 / TBC",
  "hall": "Confirmed hall or TBC",
  "booth": "Confirmed booth or TBC",
  "zone": "Optional route grouping",
  "category": "Timber Stacking / Automation",
  "products": ["Robotic stacking", "Conveyors"],
  "website": "https://example.com",
  "source": "URL or note showing where details were confirmed"
}
```

`data/martin.json` and `data/pete.json` are personal shortlist layers. They should refer to shared exhibitors using `exhibitorId`.

```json
{
  "exhibitorId": "unique-exhibitor-id",
  "priority": "high",
  "status": "to review",
  "reason": "Why this booth matters",
  "interests": ["Stacking workflow", "After-sales support"],
  "questions": ["What timber sizes can the system handle?"],
  "notes": "Visit notes or follow-up status"
}
```

Accepted priorities are `high`, `medium`, and `low`. Status text is flexible; useful examples are `to review`, `must visit`, `visited`, `follow up`, `parked`, and `skip`.

## Instructions For Pete's AI

Pete's AI can safely edit `data/pete.json` without changing the website code.

Rules:

1. Do not edit `index.html`, `app.js`, `style.css`, `manifest.json`, or `service-worker.js` unless explicitly asked.
2. Do not invent Canton Fair exhibitors, halls, or booth numbers.
3. If an exhibitor is missing, add it to `data/exhibitors.json` only when details are confirmed from a reliable source.
4. Mark uncertain values as `TBC`.
5. Use the existing category `Timber Stacking / Automation` for timber stacking, handling, conveyors, scanning, optimisation, robotics, and automation.
6. Keep Pete-specific reasons, questions, priority, status, and notes in `data/pete.json`.

## Reference Documents

Original source documents live in `references/`. The Phase 1 buyer guide PDF is stored there as source material and is summarised in `data/phase-1-guide-summary.json` for the app's Reference view.

Reference documents are useful for hall, area, product-zone, service, and navigation context. They should not be used to create exhibitor records unless they include confirmed company, hall, and booth details.

When using reference documents:

1. Keep the original PDF in `references/`.
2. Add or update a small JSON summary in `data/`.
3. Mark clearly what the document can and cannot be used for.
4. Do not turn product zones into exhibitor cards.
5. Do not invent booth numbers from maps or category layouts.

## Local Use

Because the browser fetches JSON files, the most reliable local preview is a small static web server from the repository folder:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## GitHub Pages Deployment

To publish:

1. Open the repository on GitHub: `coffshardwoods/canton-fair-planner`.
2. Go to `Settings` > `Pages`.
3. Under `Build and deployment`, set `Source` to `Deploy from a branch`.
4. Set `Branch` to `main` and folder to `/root`.
5. Save.

After GitHub Pages finishes deploying, the site should be available at:

```text
https://coffshardwoods.github.io/canton-fair-planner/
```

## Demo Data Notice

The starter records are clearly marked as demo placeholders. They are included only to prove the filters, cards, route view, and PWA shell work. Replace them with confirmed Canton Fair data before relying on the planner at the fair.
