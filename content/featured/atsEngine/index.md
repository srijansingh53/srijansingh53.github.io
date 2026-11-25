---
date: '2026-06-01'
title: 'ATS Engine'
cover: './score.webp'
github: 'https://github.com/srijansingh53/ats-engine'
tech:
  - Claude API
  - LLM structured extraction
  - Python
  - Flask
  - React
  - Docker
showInProjects: false
---

An AI-powered resume screener that scores a resume against a software engineering job description out of 100, explains every point and ranks fixes by estimated gain. Claude extracts the JD and resume into structured JSON and judges rubrics with quoted evidence, while deterministic Python does all the scoring. It runs a skill gate, an 8-dimension fit breakdown and integrity checks for hidden text and keyword stuffing, and caches LLM calls so re-scoring stays stable.
