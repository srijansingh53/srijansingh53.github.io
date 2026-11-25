import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { graphql, Link } from 'gatsby';
import { GatsbyImage, getImage } from 'gatsby-plugin-image';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import { email, socialMedia } from '@config';
import { Icon } from '@components/icons';

/*
 * v2 — recruiter-focused redesign, direction from ui-ux-pro-max:
 *   pattern: scroll-triggered storytelling (career journey) · style: bento grid + aurora hero
 *   colors: monochrome zinc + blue accent · type: "Geometric Modern" (Outfit + Work Sans)
 * Content comes from the 2026 résumé, with employer-confidential details (revenue share,
 * client names, internal product names) left out on purpose.
 * Every effect has a static final state: no JS and prefers-reduced-motion both show full content.
 */

const THEME_KEY = 'v2-theme';

// Runs before first paint: applies saved/system theme and flags that motion effects may run.
const initScript = `(function(){var d=document.documentElement;try{var t=localStorage.getItem('${THEME_KEY}');if(t!=='dark'){t='light'}d.setAttribute('data-theme',t)}catch(e){d.setAttribute('data-theme','light')}if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('v2-motion')}})();`;

const prefersReducedMotion = () =>
  typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ styles */

const GlobalStyleV2 = createGlobalStyle`
  :root[data-theme='dark'] {
    --bg: #09090b;
    --bg-2: #0f0f13;
    --card: #141418;
    --card-2: #1c1c21;
    --fg: #fafafa;
    --fg-muted: #a1a1aa;
    --border: #27272a;
    --accent: #60a5fa;
    --violet: #a78bfa;
    --cyan: #22d3ee;
    --green: #4ade80;
    --btn-bg: #60a5fa;
    --btn-fg: #09090b;
    --glow: rgba(96, 165, 250, 0.16);
    --aurora-1: rgba(59, 130, 246, 0.45);
    --aurora-2: rgba(139, 92, 246, 0.38);
    --aurora-3: rgba(34, 211, 238, 0.22);
    --shadow: 0 24px 60px -30px rgba(0, 0, 0, 0.9);
    color-scheme: dark;
  }

  :root,
  :root[data-theme='light'] {
    --bg: #fafafa;
    --bg-2: #f4f4f5;
    --card: #ffffff;
    --card-2: #f4f4f5;
    --fg: #09090b;
    --fg-muted: #52525b;
    --border: #e4e4e7;
    --accent: #2563eb;
    --violet: #7c3aed;
    --cyan: #0891b2;
    --green: #15803d;
    --btn-bg: #2563eb;
    --btn-fg: #ffffff;
    --glow: rgba(37, 99, 235, 0.1);
    --aurora-1: rgba(59, 130, 246, 0.28);
    --aurora-2: rgba(139, 92, 246, 0.22);
    --aurora-3: rgba(34, 211, 238, 0.2);
    --shadow: 0 24px 60px -30px rgba(24, 24, 27, 0.25);
    color-scheme: light;
  }

  :root {
    --font-head: 'Outfit', system-ui, sans-serif;
    --font-body: 'Work Sans', system-ui, sans-serif;
    --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    --radius: 20px;
    --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
    --max: 1160px;
  }

  *, *::before, *::after { box-sizing: border-box; }

  html { scroll-behavior: smooth; scroll-padding-top: 88px; }

  body {
    margin: 0;
    background: var(--bg);
    color: var(--fg);
    font-family: var(--font-body);
    font-size: 17px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    transition: background-color 250ms var(--ease), color 250ms var(--ease);
  }

  a { color: inherit; }
  img { max-width: 100%; }
  svg[role='img'] { fill: currentColor; vertical-align: middle; }

  :focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 3px;
    border-radius: 6px;
  }

  /* scroll reveal: only hidden when JS + motion are both available */
  .v2-motion [data-reveal] {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 600ms var(--ease), transform 600ms var(--ease);
    transition-delay: var(--delay, 0ms);
  }
  .v2-motion [data-reveal].is-in {
    opacity: 1;
    transform: none;
  }

  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    *, *::before, *::after {
      animation: none !important;
      transition: none !important;
    }
  }
`;

const Container = styled.div`
  width: 100%;
  max-width: var(--max);
  margin: 0 auto;
  padding: 0 24px;

  @media (max-width: 480px) {
    padding: 0 16px;
  }
`;

const SkipLink = styled.a`
  position: absolute;
  left: -999px;
  top: 8px;
  z-index: 100;
  padding: 10px 16px;
  border-radius: 10px;
  background: var(--btn-bg);
  color: var(--btn-fg);
  font-weight: 600;
  &:focus {
    left: 8px;
  }
`;

const Progress = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 30;
  height: 3px;
  background: linear-gradient(90deg, var(--accent), var(--violet), var(--cyan));
  transform: scaleX(var(--p, 0));
  transform-origin: 0 50%;
`;

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid ${({ $scrolled }) => ($scrolled ? 'var(--border)' : 'transparent')};
  background: ${({ $scrolled }) =>
    $scrolled ? 'color-mix(in srgb, var(--bg) 80%, transparent)' : 'transparent'};
  backdrop-filter: ${({ $scrolled }) => ($scrolled ? 'blur(14px)' : 'none')};
  transition: background-color 250ms var(--ease), border-color 250ms var(--ease);

  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    height: 72px;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-family: var(--font-head);
    font-size: 18px;
    font-weight: 600;
    text-decoration: none;
  }

  .mark {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--accent), var(--violet));
    color: var(--btn-fg);
    font-size: 15px;
    font-weight: 700;
  }

  nav ul {
    display: flex;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  nav a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 12px;
    border-radius: 10px;
    color: var(--fg-muted);
    font-size: 15px;
    font-weight: 500;
    text-decoration: none;
    transition: color 200ms var(--ease), background-color 200ms var(--ease);

    &:hover {
      color: var(--fg);
      background: var(--card-2);
    }
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  @media (max-width: 960px) {
    nav {
      display: none;
    }
  }

  @media (max-width: 480px) {
    .brand .name,
    .hide-sm {
      display: none;
    }
  }
`;

const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--card);
  color: var(--fg);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: border-color 200ms var(--ease), color 200ms var(--ease);

  &:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const Button = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  padding: 0 22px;
  border: 1px solid ${({ $primary }) => ($primary ? 'transparent' : 'var(--border)')};
  border-radius: 12px;
  background: ${({ $primary }) => ($primary ? 'var(--btn-bg)' : 'var(--card)')};
  color: ${({ $primary }) => ($primary ? 'var(--btn-fg)' : 'var(--fg)')};
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: ${({ $primary }) => ($primary ? '0 10px 30px -10px var(--accent)' : 'none')};
  transition: transform 200ms var(--ease), border-color 200ms var(--ease),
    box-shadow 200ms var(--ease);

  &:hover {
    transform: translateY(-2px);
    border-color: ${({ $primary }) => ($primary ? 'transparent' : 'var(--accent)')};
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    width: 18px;
    height: 18px;
  }

  &.sm {
    min-height: 44px;
    padding: 0 16px;
    font-size: 14px;
  }
`;

const drift = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  33% { transform: translate3d(6%, -8%, 0) scale(1.08); }
  66% { transform: translate3d(-6%, 6%, 0) scale(0.95); }
`;

const ping = keyframes`to { transform: scale(2.6); opacity: 0; }`;

const HeroWrap = styled.section`
  position: relative;
  overflow: hidden;
  margin-top: -72px;
  padding: 152px 0 96px;

  .aurora {
    position: absolute;
    inset: -20% -10% auto;
    height: 760px;
    z-index: -1;
    filter: blur(70px);
    pointer-events: none;
  }

  .aurora span {
    position: absolute;
    border-radius: 50%;
    animation: ${drift} 14s ease-in-out infinite;
  }

  .aurora span:nth-child(1) {
    top: 5%;
    left: 8%;
    width: 46%;
    height: 60%;
    background: var(--aurora-1);
  }
  .aurora span:nth-child(2) {
    top: 18%;
    right: 6%;
    width: 42%;
    height: 56%;
    background: var(--aurora-2);
    animation-delay: -5s;
  }
  .aurora span:nth-child(3) {
    top: 45%;
    left: 35%;
    width: 34%;
    height: 40%;
    background: var(--aurora-3);
    animation-delay: -9s;
  }

  .grid-bg {
    position: absolute;
    inset: 0;
    z-index: -1;
    background-image: linear-gradient(var(--border) 1px, transparent 1px),
      linear-gradient(90deg, var(--border) 1px, transparent 1px);
    background-size: 56px 56px;
    mask-image: radial-gradient(ellipse 70% 60% at 50% 30%, #000 30%, transparent 75%);
    opacity: 0.5;
  }

  .inner {
    display: grid;
    grid-template-columns: 1.15fr 1fr;
    gap: 56px;
    align-items: center;

    @media (max-width: 960px) {
      grid-template-columns: 1fr;
    }
  }

  .pill {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 6px 14px 6px 8px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: color-mix(in srgb, var(--card) 70%, transparent);
    color: var(--fg-muted);
    font-size: 14px;
    font-weight: 500;
  }

  .dot {
    position: relative;
    width: 10px;
    height: 10px;
    margin-left: 4px;
    border-radius: 50%;
    background: #22c55e;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: #22c55e;
      animation: ${ping} 1.8s ease-out infinite;
    }
  }

  h1 {
    margin: 24px 0 0;
    font-family: var(--font-head);
    font-size: clamp(44px, 7vw, 84px);
    font-weight: 700;
    letter-spacing: -0.035em;
    line-height: 1;
  }

  .role {
    display: block;
    margin-top: 14px;
    color: var(--accent);
    font-size: clamp(26px, 3.6vw, 40px);
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.15;
  }

  .lead {
    max-width: 560px;
    margin: 24px 0 0;
    color: var(--fg-muted);
    font-size: 19px;
  }

  .lead strong {
    color: var(--fg);
    font-weight: 600;
  }

  .cta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 36px;
  }

  .socials {
    display: flex;
    gap: 4px;
    margin: 28px 0 0;
    padding: 0;
    list-style: none;

    a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      color: var(--fg-muted);
      transition: color 200ms var(--ease), background-color 200ms var(--ease);

      &:hover {
        color: var(--accent);
        background: var(--card-2);
      }
    }

    svg {
      width: 20px;
      height: 20px;
    }
  }
`;

const typeIn = keyframes`
  from { opacity: 0; transform: translateX(-6px); }
  to { opacity: 1; transform: none; }
`;
const blink = keyframes`50% { opacity: 0; }`;

const Terminal = styled.figure`
  margin: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: color-mix(in srgb, var(--card) 85%, transparent);
  box-shadow: var(--shadow);
  backdrop-filter: blur(12px);
  overflow: hidden;

  .chrome {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 18px;
    border-bottom: 1px solid var(--border);
    color: var(--fg-muted);
    font-family: var(--font-mono);
    font-size: 12.5px;
  }

  .chrome i {
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: var(--border);
  }

  .chrome span {
    margin-left: 8px;
  }

  pre {
    margin: 0;
    padding: 22px 22px 26px;
    font-family: var(--font-mono);
    font-size: 14px;
    line-height: 1.75;
  }

  .ln {
    display: block;
    padding-left: 4ch;
    text-indent: -4ch; /* wrapped JSON continues under the value, not the margin */
    white-space: pre-wrap;
  }

  .v2-motion & .ln {
    opacity: 0;
    animation: ${typeIn} 400ms var(--ease) forwards;
    animation-delay: calc(500ms + var(--i) * 140ms);
  }

  .prompt {
    color: var(--green);
  }
  .cmd {
    color: var(--fg);
    font-weight: 600;
  }
  .out {
    color: var(--fg-muted);
  }
  .key {
    color: var(--accent);
  }
  .str {
    color: var(--violet);
  }

  .cursor {
    display: inline-block;
    width: 9px;
    height: 1.1em;
    margin-left: 4px;
    vertical-align: text-bottom;
    background: var(--fg);
    animation: ${blink} 1.1s steps(1) infinite;
  }

  @media (max-width: 480px) {
    pre {
      font-size: 12.5px;
    }
  }
`;

const Section = styled.section`
  padding: 112px 0;

  @media (max-width: 720px) {
    padding: 72px 0;
  }

  .head {
    max-width: 720px;
    margin-bottom: 48px;
  }

  .kicker {
    display: inline-block;
    margin: 0 0 12px;
    color: var(--accent);
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  h2 {
    margin: 0;
    font-family: var(--font-head);
    font-size: clamp(32px, 4.5vw, 52px);
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1.08;
  }

  .sub {
    margin: 16px 0 0;
    color: var(--fg-muted);
    font-size: 18px;
  }
`;

// Card with a cursor-following spotlight (position set by the page-level pointer handler).
const Tile = styled.div`
  position: relative;
  padding: 28px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: radial-gradient(
      420px circle at var(--mx, -999px) var(--my, -999px),
      var(--glow),
      transparent 60%
    ),
    var(--card);
  transition: border-color 250ms var(--ease), transform 250ms var(--ease);

  &:hover {
    border-color: color-mix(in srgb, var(--accent) 55%, var(--border));
  }
`;

const Recruiter = styled(Tile)`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 28px;
  align-items: center;
  margin-top: -24px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }

  .avatar {
    width: 112px;
    height: 112px;
    border-radius: 24px;
    overflow: hidden;

    .gatsby-image-wrapper {
      width: 100%;
      height: 100%;
    }
    box-shadow: 0 0 0 4px var(--card), 0 0 0 5px var(--border);
  }

  .label {
    margin: 0 0 14px;
    color: var(--fg-muted);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  dl {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 20px 28px;
    margin: 0;

    @media (max-width: 960px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    @media (max-width: 420px) {
      grid-template-columns: 1fr;
    }
  }

  dt {
    color: var(--fg-muted);
    font-size: 13px;
  }

  dd {
    margin: 2px 0 0;
    font-weight: 600;
    line-height: 1.4;
  }

  .open {
    color: var(--green);
  }
`;

const About = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 48px;
  align-items: start;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }

  .text p {
    margin: 0 0 18px;
    color: var(--fg-muted);
    font-size: 18px;
  }

  .text p:first-child {
    color: var(--fg);
    font-family: var(--font-head);
    font-size: 24px;
    font-weight: 600;
  }

  .text a {
    color: var(--accent);
    font-weight: 600;
  }

  .side {
    display: grid;
    gap: 16px;
  }

  .side h3 {
    margin: 0;
    font-family: var(--font-head);
    font-size: 18px;
    font-weight: 600;
  }

  .side p {
    margin: 4px 0 0;
    color: var(--fg-muted);
    font-size: 15px;
  }

  .side .ico {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin-bottom: 14px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--accent) 14%, transparent);
    color: var(--accent);
  }

  .side .ico svg {
    width: 22px;
    height: 22px;
  }
`;

const Bento = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-auto-rows: minmax(180px, auto);
  gap: 16px;

  @media (max-width: 960px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }

  ${Tile} {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 16px;
  }

  .wide {
    grid-column: span 2;
    @media (max-width: 560px) {
      grid-column: span 1;
    }
  }

  .tall {
    grid-row: span 2;
    @media (max-width: 960px) {
      grid-row: span 1;
    }
  }

  .num {
    font-family: var(--font-head);
    font-size: clamp(40px, 5vw, 56px);
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1;
  }

  .num.accent {
    color: var(--accent);
  }

  .shift {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 10px;
    font-family: var(--font-head);
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .shift .from {
    color: var(--fg-muted);
    font-size: 24px;
    text-decoration: line-through;
    text-decoration-thickness: 2px;
  }

  .shift .arrow {
    color: var(--accent);
    font-size: 22px;
  }

  .shift .to {
    font-size: clamp(36px, 4.4vw, 48px);
    line-height: 1;
  }

  .what {
    margin: 0;
    font-weight: 600;
    line-height: 1.35;
  }

  .how {
    margin: 6px 0 0;
    color: var(--fg-muted);
    font-size: 15px;
    line-height: 1.5;
  }

  .tag {
    align-self: flex-start;
    padding: 4px 10px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--violet) 16%, transparent);
    color: var(--violet);
    font-size: 12.5px;
    font-weight: 600;
  }

  /* animated stat bars in the AI tile */
  .bars {
    display: grid;
    gap: 14px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .bars .row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 14.5px;
  }

  .bars .row span {
    color: var(--fg-muted);
  }

  .bars .row strong {
    font-family: var(--font-head);
  }

  .bars .track {
    height: 8px;
    margin-top: 6px;
    border-radius: 999px;
    background: var(--card-2);
    overflow: hidden;
  }

  .bars .fill {
    height: 100%;
    width: var(--w);
    border-radius: inherit;
    background: linear-gradient(90deg, var(--accent), var(--violet));
    transition: width 1.2s var(--ease) var(--d, 200ms);
  }

  .v2-motion & .fill {
    width: 0;
  }

  .v2-motion & .is-in .fill {
    width: var(--w);
  }

  .team {
    display: flex;
    margin-top: 10px;
  }

  .team span {
    width: 32px;
    height: 32px;
    margin-right: -8px;
    border: 3px solid var(--card);
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), var(--violet));
    opacity: calc(1 - var(--i) * 0.1);
  }
`;

const Journey = styled.div`
  .stairs {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    align-items: end;
    gap: 10px;
    margin: 0 0 24px;
    padding: 0;
    list-style: none;

    @media (max-width: 720px) {
      display: flex;
      overflow-x: auto;
      padding-bottom: 8px;
      scroll-snap-type: x mandatory;
    }
  }

  .stairs li {
    @media (max-width: 720px) {
      flex: 0 0 150px;
      scroll-snap-align: start;
    }
  }

  .step {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    width: 100%;
    height: calc(96px + var(--lvl) * 34px);
    padding: 16px;
    border: 1px solid var(--border);
    border-radius: 16px;
    background: var(--card);
    color: var(--fg);
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition: border-color 250ms var(--ease), background-color 250ms var(--ease),
      transform 250ms var(--ease);

    &:hover {
      border-color: var(--accent);
      transform: translateY(-3px);
    }

    &[aria-selected='true'] {
      border-color: transparent;
      background: linear-gradient(160deg, var(--accent), var(--violet));
      color: var(--btn-fg);
    }

    &[aria-selected='true'] .yr,
    &[aria-selected='true'] .co {
      color: inherit;
      opacity: 0.85;
    }
  }

  .yr {
    color: var(--accent);
    font-family: var(--font-mono);
    font-size: 12.5px;
  }

  .ttl {
    margin-top: 4px;
    font-family: var(--font-head);
    font-size: 16px;
    font-weight: 600;
    line-height: 1.25;
  }

  .co {
    margin-top: 2px;
    color: var(--fg-muted);
    font-size: 13px;
  }

  .panel {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 40px;

    @media (max-width: 860px) {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  }

  .panel h3 {
    margin: 0;
    font-family: var(--font-head);
    font-size: 26px;
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }

  .panel .meta {
    margin: 10px 0 0;
    color: var(--fg-muted);
    font-size: 15px;
  }

  .panel .meta a {
    color: var(--accent);
    font-weight: 600;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }

  .points {
    display: grid;
    gap: 14px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .points li {
    position: relative;
    padding-left: 28px;
    color: var(--fg-muted);
  }

  .points li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.55em;
    width: 12px;
    height: 12px;
    border-radius: 4px;
    background: linear-gradient(135deg, var(--accent), var(--violet));
  }

  .points strong {
    color: var(--fg);
    font-weight: 600;
  }
`;

const Skills = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 960px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }

  .ico {
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    margin-bottom: 18px;
    border-radius: 14px;
    background: color-mix(in srgb, var(--accent) 14%, transparent);
    color: var(--accent);
  }

  .ico svg {
    width: 24px;
    height: 24px;
  }

  h3 {
    margin: 0;
    font-family: var(--font-head);
    font-size: 20px;
    font-weight: 600;
  }

  p {
    margin: 6px 0 0;
    color: var(--fg-muted);
    font-size: 15px;
  }
`;

const Chips = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 18px 0 0;
  padding: 0;
  list-style: none;

  li {
    padding: 5px 12px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: var(--bg-2);
    color: var(--fg-muted);
    font-size: 13.5px;
    font-weight: 500;
    white-space: nowrap;
  }
`;

const Featured = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }

  ${Tile} {
    display: flex;
    flex-direction: column;
    padding: 0;
    overflow: hidden;
  }

  /* Newest project spans the full row so an odd count leaves no gap. */
  ${Tile}:first-child {
    grid-column: 1 / -1;
  }

  .shot {
    position: relative;
    overflow: hidden;
    border-bottom: 1px solid var(--border);
    background: var(--bg-2);
  }

  .shot .gatsby-image-wrapper {
    transition: transform 600ms var(--ease);
  }

  ${Tile}:hover .shot .gatsby-image-wrapper {
    transform: scale(1.04);
  }

  .content {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 24px 28px 28px;
  }
`;

const ProjectGrid = styled.ul`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;

  @media (max-width: 960px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }

  ${Tile} {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
`;

const ProjectBody = styled.div`
  display: contents;

  .top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .badge {
    display: inline-block;
    margin-bottom: 8px;
    padding: 3px 10px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--violet) 16%, transparent);
    color: var(--violet);
    font-size: 12.5px;
    font-weight: 600;
  }

  h3 {
    margin: 0;
    font-family: var(--font-head);
    font-size: 20px;
    font-weight: 600;
    line-height: 1.3;
    overflow-wrap: anywhere;
  }

  .desc {
    flex: 1;
    margin-top: 10px;
    color: var(--fg-muted);
    font-size: 15.5px;

    p {
      margin: 0;
    }

    a {
      color: var(--accent);
    }
  }

  .links {
    display: flex;
    flex-shrink: 0;
    margin: -8px -10px 0 0;

    a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 10px;
      color: var(--fg-muted);
      transition: color 200ms var(--ease), background-color 200ms var(--ease);

      &:hover {
        color: var(--accent);
        background: var(--card-2);
      }
    }

    svg {
      width: 20px;
      height: 20px;
    }
  }
`;

const MoreRow = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 32px;
`;

const Recognition = styled.ul`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin: 16px 0 0;
  padding: 0;
  list-style: none;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }

  ${Tile} {
    display: flex;
    gap: 16px;
    align-items: center;
    padding: 20px 22px;
    height: 100%;
  }

  .trophy {
    display: grid;
    flex-shrink: 0;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--violet) 16%, transparent);
    color: var(--violet);
  }

  .trophy svg {
    width: 22px;
    height: 22px;
  }

  strong {
    display: block;
    font-family: var(--font-head);
    font-weight: 600;
    line-height: 1.3;
  }

  span {
    color: var(--fg-muted);
    font-size: 14px;
  }
`;

const ContactPanel = styled.div`
  position: relative;
  overflow: hidden;
  padding: clamp(36px, 6vw, 72px);
  border-radius: 28px;
  background: linear-gradient(135deg, #1d4ed8, #6d28d9 55%, #0e7490);
  color: #ffffff;
  isolation: isolate;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background-image: radial-gradient(rgba(255, 255, 255, 0.18) 1px, transparent 1px);
    background-size: 22px 22px;
    mask-image: linear-gradient(120deg, transparent 20%, #000 90%);
  }

  h2 {
    max-width: 760px;
    margin: 0;
    font-family: var(--font-head);
    font-size: clamp(32px, 5vw, 56px);
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1.05;
  }

  p {
    max-width: 600px;
    margin: 20px 0 0;
    color: rgba(255, 255, 255, 0.88);
    font-size: 18px;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 36px;
  }

  ${Button} {
    border-color: rgba(255, 255, 255, 0.35);
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    box-shadow: none;
  }

  ${Button}.solid {
    border-color: transparent;
    background: #ffffff;
    color: #1e1b4b;
  }

  .status {
    min-height: 1.5em;
    margin: 14px 0 0;
    font-size: 14px;
  }
`;

const Footer = styled.footer`
  padding: 40px 0;
  color: var(--fg-muted);
  font-size: 14px;

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-top: 28px;
    border-top: 1px solid var(--border);
  }

  a {
    color: var(--fg);
    font-weight: 500;
  }
`;

/* ------------------------------------------------------------------- icons */

const Svg = ({ children }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true">
    {children}
  </svg>
);
Svg.propTypes = { children: PropTypes.node.isRequired };

const icons = {
  sun: (
    <Svg>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </Svg>
  ),
  moon: (
    <Svg>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </Svg>
  ),
  download: (
    <Svg>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </Svg>
  ),
  mail: (
    <Svg>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </Svg>
  ),
  copy: (
    <Svg>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </Svg>
  ),
  code: (
    <Svg>
      <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
    </Svg>
  ),
  db: (
    <Svg>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
    </Svg>
  ),
  cloud: (
    <Svg>
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z" />
    </Svg>
  ),
  activity: (
    <Svg>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </Svg>
  ),
  users: (
    <Svg>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  ),
  sparkles: (
    <Svg>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
    </Svg>
  ),
  award: (
    <Svg>
      <circle cx="12" cy="8" r="7" />
      <path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12" />
    </Svg>
  ),
  cap: (
    <Svg>
      <path d="M22 10 12 5 2 10l10 5 10-5z" />
      <path d="M6 12v5c3 2 9 2 12 0v-5" />
    </Svg>
  ),
  briefcase: (
    <Svg>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </Svg>
  ),
};

/* -------------------------------------------------------------------- data */

const navLinks = [
  { name: 'About', url: '#about' },
  { name: 'Impact', url: '#impact' },
  { name: 'Journey', url: '#journey' },
  { name: 'Skills', url: '#skills' },
  { name: 'Projects', url: '#projects' },
  { name: 'Contact', url: '#contact' },
];

// Career steps from the résumé, oldest first. Employer-confidential specifics are omitted.
const career = [
  {
    year: '2020',
    title: 'Machine Learning Engineer Intern',
    company: 'Investwell',
    url: 'https://investwell.app/',
    range: 'Jul 2020 – Aug 2020',
    location: 'Remote',
    points: [
      'Built an intelligent CAPTCHA breaker used as a form pre-filling tool, using morphological techniques and letter de-skewing in a processing pipeline.',
      'Added a continuous-learning module that fine-tunes the pre-trained model on new data, integrated with the inference pipeline in the existing Flask microservice.',
    ],
  },
  {
    year: '2021',
    title: 'Software Development Intern',
    company: 'GoComet India',
    url: 'https://gocomet.com/',
    range: 'Jan 2021 – Jun 2021',
    location: 'Remote',
    points: [
      'Categorised carriers by performance and update frequency on the client dashboard, <strong>cutting data-lag queries by 70%</strong>.',
      'Integrated global shipping-line and 3PL vendor APIs, <strong>raising coverage by 300%</strong> and adding air tracking.',
      'Built normalisation layers that map disparate tracking data into internal schemas.',
    ],
  },
  {
    year: '2021',
    title: 'Software Development Engineer I',
    company: 'GoComet India',
    url: 'https://gocomet.com/',
    range: 'Jul 2021 – Mar 2023',
    location: 'Remote',
    points: [
      'Automated a tracking ingestion pipeline that extracts data from email PDF attachments with OCR (AWS Textract), plus SFTP batch transfer and webhook triggers, <strong>growing integration capabilities by 30%</strong>.',
      'Built data features from vessel AIS coordinates, port dwell times and carrier free-time policies to estimate delayed-pickup costs, each <strong>becoming a billable product</strong>.',
      'Established <strong>200+ resilient data integrations with a 90% success rate</strong>, kept to strict SLAs with dashboards and alerting.',
    ],
  },
  {
    year: '2023',
    title: 'Software Development Engineer II',
    company: 'GoComet India',
    url: 'https://gocomet.com/',
    range: 'Apr 2023 – Mar 2026',
    location: 'Bengaluru',
    points: [
      'Owned the migration of a location-mapping service, managing a freelancer: <strong>accuracy 95% → 98%</strong> and <strong>30% more global coverage</strong>.',
      'Made ETL sync <strong>~25% faster</strong> at 1k+ records/min by removing N+1 patterns and adding an observer-based data flow, <strong>halving PostgreSQL storage</strong>.',
      'Delivered the backend of a driver-facing mobile tracking app in a single quarter (auth middleware, geofencing, tracking flow), <strong>adopted by 100+ drivers</strong>.',
      'Introduced SLA definitions and New Relic triage dashboards; tuned queries and indexes so list API response time dropped <strong>from 3s to 800ms</strong>.',
      'Automated issue assignment and escalation via Slack: <strong>first response >24h → ~2h</strong>, resolution 3–4 days → ~1 day.',
    ],
  },
  {
    year: '2026',
    title: 'Software Development Engineer III',
    company: 'GoComet India',
    url: 'https://gocomet.com/',
    range: 'Apr 2026 – Present',
    location: 'Bengaluru',
    points: [
      '<strong>Technical and delivery lead for a 7-member platform team</strong>: architecture decisions, OKR planning, task allocation, and L1 technical interviews for Tech Lead and SDE hiring.',
      'Pioneered an <strong>agentic AI root-cause-analysis bot on Slack</strong> (Claude Agent SDK), live org-wide: ~300 queries/week, 75% first-answer accuracy, <strong>80% less engineering time</strong> on client queries.',
      'Spearheading a monolith-to-microservices migration: fixed ~150 cross-engine calls, isolated infra per team, <strong>scaled peak traffic 4K → 17K RPM</strong>, <strong>cut CI build time 60%</strong> and enabled daily deploys.',
      'Brought in AI code review (PR review SLAs down to minutes) and a weekly agentic security audit, <strong>cutting vulnerability fix time from ~1 month to ~1 week</strong>.',
      'Guided an external vendor collaboration to ship a new platform vertical’s <strong>MVP in 3 months</strong>, now used by 3 clients.',
    ],
  },
];

const skillGroups = [
  {
    icon: 'code',
    title: 'Languages & frameworks',
    blurb: 'Backend-first, comfortable across the stack.',
    items: ['Ruby', 'Ruby on Rails', 'Python', 'Django', 'FastAPI', 'Flask', 'JavaScript', 'React', 'Node.js', 'C++'],
  },
  {
    icon: 'db',
    title: 'Data & messaging',
    blurb: 'Stores, queues and pipelines tuned for throughput.',
    items: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Kafka', 'SQS', 'SNS', 'Sidekiq'],
  },
  {
    icon: 'cloud',
    title: 'Cloud & infrastructure',
    blurb: 'Shipping, scaling and running services in production.',
    items: ['Docker', 'Kubernetes', 'GCP', 'AWS', 'Lambda', 'Jenkins', 'GitHub Actions', 'Microservices'],
  },
  {
    icon: 'activity',
    title: 'Observability',
    blurb: 'SLAs, dashboards and alerting so teams see problems first.',
    items: ['New Relic', 'Sentry', 'OpenTelemetry', 'Metabase', 'SLA design'],
  },
  {
    icon: 'sparkles',
    title: 'AI engineering',
    blurb: 'Building and running agentic AI in production.',
    items: [
      'Agentic AI',
      'AI agents',
      'Claude Agent SDK',
      'LLM APIs',
      'MCP & tool calling',
      'Prompt engineering',
      'Structured outputs',
      'Claude Code',
      'OpenAI Codex',
      'N8N',
      'Windmill',
      'CodeRabbit',
    ],
  },
  {
    icon: 'users',
    title: 'Leadership',
    blurb: 'Leading and mentoring a team of 7 engineers.',
    items: ['Technical direction', 'Delivery planning', 'OKRs', 'Hiring interviews', 'Mentoring', 'Vendor collaboration'],
  },
];

const recognition = [
  { title: 'Smart India Hackathon 2020', note: 'Grand finale, software edition (atithi)' },
  { title: 'Google Build for Digital India', note: 'Regional shortlist, 2020 (FORID)' },
  { title: 'Analytics Vidhya challenge', note: 'Top 50 on the leaderboard (Twitter sentiment)' },
];

const PROJECTS_SHOWN = 6;

/* ------------------------------------------------------------------- parts */

const ThemeToggle = () => {
  const [theme, setTheme] = useState(null); // unknown until mounted

  useEffect(() => {
    setTheme(document.documentElement.getAttribute('data-theme') || 'light');
  }, []);

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (e) {
      // storage blocked: still switches for this visit
    }
    setTheme(next);
  };

  const label = theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme';
  return (
    <IconButton type="button" onClick={toggle} aria-label={label} title={label}>
      {theme === 'light' ? icons.moon : icons.sun}
    </IconButton>
  );
};

// Counts up when scrolled into view; renders the final value on the server and under reduced motion.
const CountUp = ({ to, suffix }) => {
  const ref = useRef(null);
  const [val, setVal] = useState(to);

  useEffect(() => {
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      return undefined;
    }
    let raf;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }
        io.disconnect();
        const start = performance.now();
        const tick = now => {
          const t = Math.min((now - start) / 1400, 1);
          setVal(Math.round(to * (1 - Math.pow(1 - t, 3))));
          if (t < 1) {
            raf = requestAnimationFrame(tick);
          }
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(ref.current);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to]);

  return (
    <span ref={ref} aria-label={`${to}${suffix}`}>
      <span aria-hidden="true">
        {val}
        {suffix}
      </span>
    </span>
  );
};
CountUp.propTypes = { to: PropTypes.number.isRequired, suffix: PropTypes.string };
CountUp.defaultProps = { suffix: '' };

// Hero graphic: a personal "profile" terminal whose lines type in one by one.
// Lines are wrapped in keyed spans when rendered, so they need no keys here.
/* eslint-disable react/jsx-key */
const terminalLines = [
  <>
    <span className="prompt">~ $</span> <span className="cmd">whoami</span>
  </>,
  <span className="out">srijan singh — software engineer (SDE-3)</span>,
  <>
    <span className="prompt">~ $</span> <span className="cmd">cat profile.json</span>
  </>,
  <span className="out">{'{'}</span>,
  <>
    {'  '}
    <span className="key">&quot;focus&quot;</span>: [<span className="str">&quot;backend&quot;</span>,{' '}
    <span className="str">&quot;distributed systems&quot;</span>,{' '}
    <span className="str">&quot;AI agents&quot;</span>],
  </>,
  <>
    {'  '}
    <span className="key">&quot;stack&quot;</span>: [<span className="str">&quot;Rails&quot;</span>,{' '}
    <span className="str">&quot;Python&quot;</span>, <span className="str">&quot;Kafka&quot;</span>,{' '}
    <span className="str">&quot;PostgreSQL&quot;</span>],
  </>,
  <>
    {'  '}
    <span className="key">&quot;experience&quot;</span>: <span className="str">&quot;5+ years&quot;</span>,
  </>,
  <>
    {'  '}
    <span className="key">&quot;leads&quot;</span>:{' '}
    <span className="str">&quot;a team of 7 engineers&quot;</span>,
  </>,
  <>
    {'  '}
    <span className="key">&quot;open_to&quot;</span>:{' '}
    <span className="str">&quot;on-site · hybrid · remote&quot;</span>,
  </>,
  <>
    {'  '}
    <span className="key">&quot;learning&quot;</span>: [<span className="str">&quot;multi-agent systems&quot;</span>,{' '}
    <span className="str">&quot;RAG&quot;</span>, <span className="str">&quot;LLM evals&quot;</span>]
  </>,
  <span className="out">{'}'}</span>,
  <>
    <span className="prompt">~ $</span>
    <span className="cursor" aria-hidden="true" />
  </>,
];
/* eslint-enable react/jsx-key */

const ProfileTerminal = () => (
  <Terminal data-reveal style={{ '--delay': '200ms' }}>
    <div className="chrome" aria-hidden="true">
      <i />
      <i />
      <i />
      <span>srijan@bengaluru: ~</span>
    </div>
    <pre aria-label="Profile summary: software engineer SDE-3 focused on backend, distributed systems and AI agents; Rails, Python, Kafka, PostgreSQL; 5+ years of experience; leads a team of 7 engineers; open to on-site, hybrid or remote roles.">
      {terminalLines.map((line, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <span className="ln" key={i} style={{ '--i': i }} aria-hidden="true">
          {line}
        </span>
      ))}
    </pre>
  </Terminal>
);

const ProjectLinks = ({ github, external, title }) => (
  <div className="links">
    {github && (
      <a href={github} aria-label={`${title} source on GitHub`} target="_blank" rel="noopener noreferrer">
        <Icon name="GitHub" />
      </a>
    )}
    {external && external !== github && (
      <a href={external} aria-label={`More about ${title}`} target="_blank" rel="noopener noreferrer">
        <Icon name="External" />
      </a>
    )}
  </div>
);
ProjectLinks.propTypes = {
  github: PropTypes.string,
  external: PropTypes.string,
  title: PropTypes.string.isRequired,
};

const awardFor = company =>
  ({ 'SIH 2020': 'SIH 2020 finalist', 'BFDI 2020': 'Google BFDI regionals' })[company];

const JourneyTabs = () => {
  const [active, setActive] = useState(career.length - 1);
  const tabs = useRef([]);
  const job = career[active];

  const onKeyDown = e => {
    const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    let next = null;
    if (dir) {
      next = (active + dir + career.length) % career.length;
    } else if (e.key === 'Home') {
      next = 0;
    } else if (e.key === 'End') {
      next = career.length - 1;
    }
    if (next !== null) {
      e.preventDefault();
      setActive(next);
      tabs.current[next].focus();
    }
  };

  return (
    <Journey>
      <ul className="stairs" role="tablist" aria-label="Career steps" onKeyDown={onKeyDown}>
        {career.map((c, i) => (
          <li key={c.title} role="presentation" data-reveal style={{ '--delay': `${i * 80}ms` }}>
            <button
              ref={el => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`step-${i}`}
              className="step"
              style={{ '--lvl': i }}
              aria-selected={active === i}
              aria-controls="step-panel"
              tabIndex={active === i ? 0 : -1}
              onClick={() => setActive(i)}>
              <span className="yr">{c.year}</span>
              <span className="ttl">{c.title}</span>
              <span className="co">{c.company}</span>
            </button>
          </li>
        ))}
      </ul>

      <Tile id="step-panel" role="tabpanel" aria-labelledby={`step-${active}`} data-spot>
        <div className="panel">
          <div>
            <h3>{job.title}</h3>
            <p className="meta">
              <a href={job.url} target="_blank" rel="noopener noreferrer">
                {job.company}
              </a>
              <br />
              {job.range} · {job.location}
            </p>
          </div>
          <ul className="points">
            {job.points.map(p => (
              <li key={p} dangerouslySetInnerHTML={{ __html: p }} />
            ))}
          </ul>
        </div>
      </Tile>
    </Journey>
  );
};

const CopyEmail = () => {
  const [status, setStatus] = useState('');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setStatus('Email copied to clipboard.');
    } catch (e) {
      setStatus(`Couldn't copy, it's ${email}`);
    }
    setTimeout(() => setStatus(''), 3000);
  };

  return (
    <>
      <Button as="button" type="button" onClick={copy}>
        {icons.copy}
        Copy email
      </Button>
      <p className="status" role="status" aria-live="polite">
        {status}
      </p>
    </>
  );
};

/* -------------------------------------------------------------------- page */

const V2Page = ({ data }) => {
  const featured = data.featured.nodes;
  const projects = data.projects.nodes.slice(0, PROJECTS_SHOWN);
  const linkedin = socialMedia.find(s => s.name === 'Linkedin');
  const [scrolled, setScrolled] = useState(false);
  const progressRef = useRef(null);

  // Scroll progress bar + header state, batched to one frame.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progressRef.current) {
        progressRef.current.style.setProperty('--p', max > 0 ? window.scrollY / max : 0);
      }
      setScrolled(window.scrollY > 8);
    };
    const onScroll = () => {
      if (!raf) {
        raf = requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Scroll reveal for every [data-reveal] element.
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('is-in'));
      return undefined;
    }
    const io = new IntersectionObserver(
      entries =>
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Spotlight: feed pointer position to the hovered card.
  const onPointerMove = e => {
    const el = e.target.closest && e.target.closest('[data-spot]');
    if (!el) {
      return;
    }
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  return (
    <>
      <Helmet>
        <html lang="en" />
        <title>Srijan Singh · Software Engineer (SDE-3)</title>
        <meta
          name="description"
          content="Srijan Singh — Software Engineer (SDE-3) in Bengaluru with 5+ years in backend, distributed systems and AI agents in production. Résumé, impact, experience and projects."
        />
        <script>{initScript}</script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&family=Work+Sans:wght@400;500;600&display=swap"
        />
      </Helmet>
      <GlobalStyleV2 />

      <SkipLink href="#main">Skip to content</SkipLink>
      <Progress ref={progressRef} aria-hidden="true" />

      <Header $scrolled={scrolled}>
        <Container className="bar">
          <a href="#top" className="brand" aria-label="Srijan Singh — back to top">
            <span className="mark" aria-hidden="true">
              SS
            </span>
            <span className="name">Srijan Singh</span>
          </a>
          <nav aria-label="Sections">
            <ul>
              {navLinks.map(({ name, url }) => (
                <li key={name}>
                  <a href={url}>{name}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="actions">
            <ThemeToggle />
            <Button $primary className="sm hide-sm" href="/resume.pdf" target="_blank" rel="noopener noreferrer">
              Résumé
            </Button>
          </div>
        </Container>
      </Header>

      <main id="main" onPointerMove={onPointerMove}>
        <HeroWrap id="top" aria-labelledby="hero-title">
          <div className="aurora" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="grid-bg" aria-hidden="true" />
          <Container className="inner">
            <div>
              <span className="pill" data-reveal>
                <span className="dot" aria-hidden="true" />
                Open to work · SDE-3 · Bengaluru, India
              </span>
              <h1 id="hero-title" data-reveal style={{ '--delay': '80ms' }}>
                Srijan Singh
                <span className="role">Backend &amp; distributed systems engineer, building AI agents in production.</span>
              </h1>
              <p className="lead" data-reveal style={{ '--delay': '160ms' }}>
                <strong>5+ years</strong> in a hyper-growth B2B logistics startup. I lead and mentor a{' '}
                <strong>team of 7 engineers</strong>, scale backend services, and build org-wide AI
                systems.
              </p>
              <div className="cta" data-reveal style={{ '--delay': '240ms' }}>
                <Button $primary href="/resume.pdf" target="_blank" rel="noopener noreferrer">
                  {icons.download}
                  Download résumé
                </Button>
                <Button href={`mailto:${email}`}>
                  {icons.mail}
                  Email me
                </Button>
              </div>
              <ul className="socials" aria-label="Profiles" data-reveal style={{ '--delay': '320ms' }}>
                {socialMedia.map(({ name, url }) => (
                  <li key={name}>
                    <a href={url} aria-label={name} target="_blank" rel="noopener noreferrer">
                      <Icon name={name} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <ProfileTerminal />
          </Container>
        </HeroWrap>

        <Container>
          <Recruiter data-spot data-reveal aria-label="At a glance">
            <div className="avatar">
              <GatsbyImage image={getImage(data.avatar)} alt="Portrait of Srijan Singh" />
            </div>
            <div>
              <p className="label">At a glance, for recruiters</p>
              <dl>
                <div>
                  <dt>Current role</dt>
                  <dd>SDE-3, GoComet</dd>
                </div>
                <div>
                  <dt>Focus</dt>
                  <dd>Backend, distributed systems &amp; AI agents</dd>
                </div>
                <div>
                  <dt>Track record</dt>
                  <dd>Intern → SDE-3, 3 promotions since 2021</dd>
                </div>
                <div>
                  <dt>Availability</dt>
                  <dd>
                    <span className="open">Open to work</span> · on-site, hybrid or remote
                  </dd>
                </div>
              </dl>
            </div>
          </Recruiter>
        </Container>

        <Section id="about" aria-labelledby="about-title">
          <Container>
            <div className="head" data-reveal>
              <p className="kicker">About</p>
              <h2 id="about-title">A little about me</h2>
            </div>
            <About>
              <div className="text" data-reveal>
                <p>Hello! I&apos;m a Software Engineer based in Bengaluru, India.</p>
                <p>
                  I&apos;m a Software Engineer (SDE-3) with 5+ years of experience in a hyper-growth B2B
                  logistics startup. I specialize in building scalable, high-impact systems across
                  multiple products with a strong focus on backend, distributed systems, and
                  performance optimization.
                </p>
                <p>
                  Currently working as a Software Development Engineer III at{' '}
                  <a href="https://gocomet.com/" target="_blank" rel="noopener noreferrer">
                    GoComet India
                  </a>
                  , where I lead technical and delivery initiatives for the Platform team.
                </p>
                <p>
                  Lately I&apos;ve gone deep on <strong>agentic AI</strong>: I build LLM-powered agents
                  that call tools over MCP, reason over production data and ship real outcomes,
                  like an AI root-cause-analysis agent on Slack built with the Claude Agent SDK.
                  I work AI-native every day with Claude Code and Codex, and on my own time I build
                  generative AI products such as an LLM-based resume screener.
                </p>
              </div>
              <div className="side">
                <Tile data-spot data-reveal style={{ '--delay': '80ms' }}>
                  <div className="ico">{icons.cap}</div>
                  <h3>B.Tech, IIIT Jabalpur</h3>
                  <p>Indian Institute of Information Technology, Design and Manufacturing · 2017–2021 · CPI 8.7</p>
                </Tile>
                <Tile data-spot data-reveal style={{ '--delay': '160ms' }}>
                  <div className="ico">{icons.briefcase}</div>
                  <h3>Looking for</h3>
                  <p>Senior and lead backend, platform or AI-engineering roles. On-site, hybrid or remote.</p>
                </Tile>
                <Tile data-spot data-reveal style={{ '--delay': '240ms' }}>
                  <div className="ico">{icons.sparkles}</div>
                  <h3>Learning now</h3>
                  <p>Multi-agent orchestration, RAG pipelines, LLM evals and context engineering for reliable AI agents.</p>
                </Tile>
              </div>
            </About>
          </Container>
        </Section>

        <Section id="impact" aria-labelledby="impact-title">
          <Container>
            <div className="head" data-reveal>
              <p className="kicker">Impact</p>
              <h2 id="impact-title">Numbers I&apos;ve moved</h2>
              <p className="sub">Measured outcomes from production systems I built or led.</p>
            </div>

            <Bento>
              <Tile className="wide tall" data-spot data-reveal>
                <span className="tag">AI agent in production</span>
                <div>
                  <div className="num accent">
                    ~<CountUp to={300} />
                  </div>
                  <p className="what">queries a week, handled by the AI root-cause-analysis bot I pioneered</p>
                  <p className="how">
                    Built on the Claude Agent SDK and live on Slack across support, ops, product and
                    engineering.
                  </p>
                </div>
                <ul className="bars">
                  {[
                    { k: 'Less engineering time on client queries', v: 80 },
                    { k: 'First-answer accuracy', v: 75 },
                    { k: 'Faster resolution', v: 70 },
                  ].map((b, i) => (
                    <li key={b.k}>
                      <div className="row">
                        <span>{b.k}</span>
                        <strong>{b.v}%</strong>
                      </div>
                      <div className="track" aria-hidden="true">
                        <div className="fill" style={{ '--w': `${b.v}%`, '--d': `${300 + i * 150}ms` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </Tile>

              <Tile className="wide" data-spot data-reveal style={{ '--delay': '80ms' }}>
                <div className="shift">
                  <span className="from">4K</span>
                  <span className="arrow" aria-hidden="true">
                    →
                  </span>
                  <span className="to">17K RPM</span>
                </div>
                <div>
                  <p className="what">Peak traffic handled after the microservices migration</p>
                  <p className="how">Fixed ~150 cross-engine calls and isolated queues, caches and pods per team.</p>
                </div>
              </Tile>

              <Tile data-spot data-reveal style={{ '--delay': '120ms' }}>
                <div className="num">
                  <CountUp to={60} suffix="%" />
                </div>
                <div>
                  <p className="what">Faster CI builds</p>
                  <p className="how">Unlocking daily deployments.</p>
                </div>
              </Tile>

              <Tile data-spot data-reveal style={{ '--delay': '160ms' }}>
                <div className="shift">
                  <span className="from">3s</span>
                  <span className="arrow" aria-hidden="true">
                    →
                  </span>
                  <span className="to">800ms</span>
                </div>
                <div>
                  <p className="what">List API response time</p>
                  <p className="how">Execution plans and index restructuring.</p>
                </div>
              </Tile>

              <Tile className="wide" data-spot data-reveal style={{ '--delay': '80ms' }}>
                <div className="shift">
                  <span className="from">&gt;24h</span>
                  <span className="arrow" aria-hidden="true">
                    →
                  </span>
                  <span className="to">~2h</span>
                </div>
                <div>
                  <p className="what">First-response SLA on client issues</p>
                  <p className="how">
                    Resolution cut from 3–4 days to ~1 day by automating assignment and escalation
                    through Slack.
                  </p>
                </div>
              </Tile>

              <Tile data-spot data-reveal style={{ '--delay': '120ms' }}>
                <div className="num">
                  <CountUp to={7} />
                </div>
                <div>
                  <p className="what">Engineers led &amp; mentored</p>
                  <div className="team" aria-hidden="true">
                    {[0, 1, 2, 3, 4, 5, 6].map(i => (
                      <span key={i} style={{ '--i': i }} />
                    ))}
                  </div>
                </div>
              </Tile>

              <Tile data-spot data-reveal style={{ '--delay': '160ms' }}>
                <div className="shift">
                  <span className="from">1 mo</span>
                  <span className="arrow" aria-hidden="true">
                    →
                  </span>
                  <span className="to">1 wk</span>
                </div>
                <div>
                  <p className="what">Time to find &amp; fix vulnerabilities</p>
                  <p className="how">Weekly agentic AI security audits.</p>
                </div>
              </Tile>

              <Tile className="wide" data-spot data-reveal style={{ '--delay': '80ms' }}>
                <div className="shift">
                  <span className="from">1–2h</span>
                  <span className="arrow" aria-hidden="true">
                    →
                  </span>
                  <span className="to">~15 min</span>
                </div>
                <div>
                  <p className="what">Test-file rewrites during the migration</p>
                  <p className="how">Using a custom Claude skill for test-case segregation.</p>
                </div>
              </Tile>

              <Tile data-spot data-reveal style={{ '--delay': '120ms' }}>
                <div className="num">
                  <CountUp to={50} suffix="%" />
                </div>
                <div>
                  <p className="what">Less PostgreSQL storage</p>
                  <p className="how">With ~25% faster ETL sync.</p>
                </div>
              </Tile>

              <Tile data-spot data-reveal style={{ '--delay': '160ms' }}>
                <div className="num">
                  <CountUp to={200} suffix="+" />
                </div>
                <div>
                  <p className="what">Data integrations</p>
                  <p className="how">At a 90% success rate.</p>
                </div>
              </Tile>
            </Bento>
          </Container>
        </Section>

        <Section id="journey" aria-labelledby="journey-title">
          <Container>
            <div className="head" data-reveal>
              <p className="kicker">Journey</p>
              <h2 id="journey-title">From intern to SDE-3</h2>
              <p className="sub">Five steps, one climb. Pick a step to see what I owned there.</p>
            </div>
            <JourneyTabs />
          </Container>
        </Section>

        <Section id="skills" aria-labelledby="skills-title">
          <Container>
            <div className="head" data-reveal>
              <p className="kicker">Skills</p>
              <h2 id="skills-title">What I bring to a team</h2>
            </div>
            <Skills>
              {skillGroups.map((g, i) => (
                <Tile key={g.title} data-spot data-reveal style={{ '--delay': `${(i % 3) * 80}ms` }}>
                  <div className="ico">{icons[g.icon]}</div>
                  <h3>{g.title}</h3>
                  <p>{g.blurb}</p>
                  <Chips aria-label={`${g.title} skills`}>
                    {g.items.map(s => (
                      <li key={s}>{s}</li>
                    ))}
                  </Chips>
                </Tile>
              ))}
            </Skills>
          </Container>
        </Section>

        <Section id="projects" aria-labelledby="projects-title">
          <Container>
            <div className="head" data-reveal>
              <p className="kicker">Projects</p>
              <h2 id="projects-title">Things I&apos;ve built on my own</h2>
              <p className="sub">Generative AI tools, hackathon finals, ML research implementations and full-stack apps.</p>
            </div>

            <Featured>
              {featured.map(({ frontmatter: f, html }, i) => (
                <Tile as="article" key={f.title} data-spot data-reveal style={{ '--delay': `${i * 80}ms` }}>
                  <div className="shot">
                    <GatsbyImage image={getImage(f.cover)} alt={`${f.title} screenshot`} />
                  </div>
                  <ProjectBody>
                    <div className="content">
                      <div className="top">
                        <div>
                          <span className="badge">Featured</span>
                          <h3>{f.title}</h3>
                        </div>
                        <ProjectLinks github={f.github} external={f.external} title={f.title} />
                      </div>
                      <div className="desc" dangerouslySetInnerHTML={{ __html: html }} />
                      {f.tech && (
                        <Chips aria-label="Tech used">
                          {f.tech.map(t => (
                            <li key={t}>{t}</li>
                          ))}
                        </Chips>
                      )}
                    </div>
                  </ProjectBody>
                </Tile>
              ))}
            </Featured>

            <ProjectGrid>
              {projects.map(({ frontmatter: f, html }, i) => (
                <li key={f.title} data-reveal style={{ '--delay': `${(i % 3) * 80}ms` }}>
                  <Tile as="article" data-spot>
                    <ProjectBody>
                      <div className="top">
                        <div>
                          {awardFor(f.company) && <span className="badge">{awardFor(f.company)}</span>}
                          <h3>{f.title}</h3>
                        </div>
                        <ProjectLinks github={f.github} external={f.external} title={f.title} />
                      </div>
                      <div className="desc" dangerouslySetInnerHTML={{ __html: html }} />
                      {f.tech && (
                        <Chips aria-label="Tech used">
                          {f.tech.slice(0, 4).map(t => (
                            <li key={t}>{t}</li>
                          ))}
                        </Chips>
                      )}
                    </ProjectBody>
                  </Tile>
                </li>
              ))}
            </ProjectGrid>

            <Recognition aria-label="Recognition">
              {recognition.map((r, i) => (
                <li key={r.title} data-reveal style={{ '--delay': `${i * 80}ms` }}>
                  <Tile data-spot>
                    <span className="trophy" aria-hidden="true">
                      {icons.award}
                    </span>
                    <div>
                      <strong>{r.title}</strong>
                      <span>{r.note}</span>
                    </div>
                  </Tile>
                </li>
              ))}
            </Recognition>

            <MoreRow>
              <Button as={Link} to="/archive">
                See the full project archive →
              </Button>
            </MoreRow>
          </Container>
        </Section>

        <Section id="contact" aria-labelledby="contact-title">
          <Container>
            <ContactPanel data-reveal>
              <h2 id="contact-title">Hiring for backend, platform or AI roles? Let&apos;s talk.</h2>
              <p>
                I&apos;m open to senior and lead engineering roles, on-site, hybrid or remote from
                Bengaluru. The quickest way to reach me is email.
              </p>
              <div className="row">
                <Button className="solid" href={`mailto:${email}`}>
                  {icons.mail}
                  {email}
                </Button>
                <Button href="/resume.pdf" target="_blank" rel="noopener noreferrer">
                  {icons.download}
                  Résumé
                </Button>
                {linkedin && (
                  <Button href={linkedin.url} target="_blank" rel="noopener noreferrer">
                    <Icon name="Linkedin" />
                    LinkedIn
                  </Button>
                )}
                <CopyEmail />
              </div>
            </ContactPanel>
          </Container>
        </Section>
      </main>

      <Footer>
        <Container>
          <div className="row">
            <span>© {new Date().getFullYear()} Srijan Singh · Designed &amp; built in Gatsby · v2</span>
            <Link to="/v1/">View the original site (v1)</Link>
          </div>
        </Container>
      </Footer>
    </>
  );
};

V2Page.propTypes = {
  data: PropTypes.object.isRequired,
};

export default V2Page;

export const query = graphql`
  query {
    avatar: file(sourceInstanceName: { eq: "images" }, relativePath: { eq: "me.jpeg" }) {
      childImageSharp {
        gatsbyImageData(width: 240, aspectRatio: 1, transformOptions: { cropFocus: ATTENTION }, placeholder: BLURRED, formats: [AUTO, WEBP])
      }
    }
    featured: allMarkdownRemark(
      filter: { fileAbsolutePath: { regex: "/featured/" } }
      sort: { frontmatter: { date: DESC } }
    ) {
      nodes {
        frontmatter {
          title
          cover {
            childImageSharp {
              gatsbyImageData(width: 1200, placeholder: BLURRED, formats: [AUTO, WEBP])
            }
          }
          tech
          github
          external
        }
        html
      }
    }
    projects: allMarkdownRemark(
      filter: {
        fileAbsolutePath: { regex: "/content/projects/" }
        frontmatter: { showInProjects: { eq: true } }
      }
      sort: { frontmatter: { date: DESC } }
    ) {
      nodes {
        frontmatter {
          title
          tech
          github
          external
          company
        }
        html
      }
    }
  }
`;
