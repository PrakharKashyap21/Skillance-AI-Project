# Skillhance

Skillhance is an AI Career Recommender + Chatbot project. It recommends career paths from a local dataset using a weighted scoring model, then lets the user ask a chatbot for roadmap, skills, salary, tools, and project guidance.

## Features

- Career recommendation from interests, strengths, education, work style, and skills
- Local career dataset with 12 paths
- Chatbot guidance connected to the same dataset
- Searchable career directory
- Responsive web app interface
- No API key required

## How to run

Open `index.html` in a browser, or run a local static server:

```bash
python3 -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## Project structure

```text
Skillhance/
├── index.html
├── styles.css
├── app.js
├── data/
│   └── careers.js
└── README.md
```

## How the recommendation works

Each career in `data/careers.js` includes interests, strengths, work styles, skills, education fit, demand, salary level, tools, roadmap, and next actions.

The recommender calculates a score from:

- Interest match: 35%
- Strength match: 25%
- Existing skill match: 20%
- Work style match: 10%
- Education fit: 10%

The top three careers are displayed as recommendations.

## Ideas for future upgrades

- Connect a real AI API for more natural chatbot conversations
- Store user profiles in a database
- Add login and saved career plans
- Add a larger CSV or JSON career dataset
- Add admin tools for editing careers
