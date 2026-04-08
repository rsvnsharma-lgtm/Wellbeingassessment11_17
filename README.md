# Mhitr Wellbeing Check-in
**Your self-care companion · Ages 11–17**

A psychometric wellbeing check-in tool for adolescents aged 11–17, built with an SDQ-aligned 5-scale structure and AI-powered personalised reporting.

---

## Live Demo
Deploy via GitHub Pages — see setup instructions below.

---

## Features

- **5 SDQ-aligned wellbeing scales** — Emotional Symptoms, Conduct & Behaviour, Hyperactivity & Focus, Peer Relationships, Prosocial Behaviour
- **Validated banding** — Scores use published SDQ norm thresholds (Close to normal / Some risk / High risk)
- **AI-powered insights** — Claude generates a warm, personalised 3-paragraph narrative per student
- **Risk flagging** — Specific high-concern responses trigger counsellor alerts
- **PDF download** — Full branded report with Mhitr logo, scale scores, AI narrative, tips, and clinical disclaimer
- **SDQ-ready architecture** — Swap in official SDQ questions with a single array replacement

---

## SDQ Licensing Note

This tool uses an **SDQ-inspired** question bank. The official Strengths and Difficulties Questionnaire (SDQ) questions are copyright of YouthinMind Ltd and **cannot be used in digital tools without authorisation**.

To upgrade to the validated SDQ:
1. Contact YouthinMind at **youthinmind@gmail.com** to obtain a digital licence
2. Replace the `questions` arrays inside `QUESTION_BANK` in `app.js`
3. All scoring, banding, AI narrative, PDF, and radar chart update automatically

---

## Project Structure

```
mhitr-wellbeing/
├── index.html          # Main app (all screens + UI)
├── app.js              # Question bank, scoring, AI call, PDF export
├── assets/
│   └── logo.png        # Mhitr logo
├── docs/               # (optional) GitHub Pages docs
└── README.md
```

---

## Deploy to GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Set source to **main branch / root**
4. Your app will be live at `https://<your-username>.github.io/<repo-name>/`

---

## API Key Setup

The app calls the Anthropic API directly from the browser. For production use:

> **Important**: Never expose a real API key in client-side code for a public-facing tool. Use a lightweight backend proxy (e.g. Vercel serverless function, Cloudflare Worker) that holds the key server-side.

For **development/demo only**, you can add your key temporarily to the fetch call in `app.js`:
```js
headers: {
  'Content-Type': 'application/json',
  'x-api-key': 'YOUR_KEY_HERE',   // ⚠️ dev only
  'anthropic-version': '2023-06-01'
}
```

---

## Clinical & Ethical Notes

- This tool is for **wellbeing awareness and reflection only**
- It does **not** constitute a clinical diagnosis
- Risk flags are heuristic — not validated clinical thresholds
- Always have a qualified school counsellor review flagging logic before deployment
- Recommend parental consent flow for under-13s in real-world use
- All data stays in the browser — no student data is stored or transmitted (except to the Anthropic API for AI report generation)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML/CSS/JS (no framework, no build step) |
| AI | Anthropic Claude API (claude-sonnet-4) |
| PDF | jsPDF (CDN) |
| Charts | Canvas API (hand-rolled radar chart) |
| Hosting | GitHub Pages |

---

## Roadmap

- [ ] Teacher/parent report version
- [ ] SDQ official questions (pending YouthinMind licence)
- [ ] Age-split norms (11–13 vs 14–17)
- [ ] School admin dashboard
- [ ] Longitudinal tracking (repeat check-ins)
- [ ] Multilingual support (Hindi, Tamil, etc.)

---

## Credits & References

- **SDQ** — Goodman, R. (1997). The Strengths and Difficulties Questionnaire. *Journal of Child Psychology and Psychiatry*, 38, 581–586. [sdqinfo.org](https://www.sdqinfo.org)
- **WEMWBS** — Clarke et al. (2011). BMC Public Health. [PMC3141456](https://pmc.ncbi.nlm.nih.gov/articles/PMC3141456/)
- **AI** — Powered by [Anthropic Claude](https://www.anthropic.com)

---

© 2025 Mhitr · Your self-care companion
