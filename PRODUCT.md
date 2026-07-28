# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Casual chess players who want full control of their games in a desktop app. They play on Chess.com or Lichess and want to import, review, and analyze their games locally — without the complexity of professional tools like ChessBase or SCID.

## Product Purpose

A lightweight, easy-to-use desktop chess coach that lets casual players import their games, get engine analysis, understand their mistakes through move classification, and improve — all locally on their machine.

## Positioning

Simple and small. Where professional chess tools are powerful but intimidating, this app is approachable and focused. Full local control of your games without the bloat.

## Operating Context

- Player finishes a game on Chess.com or Lichess → imports the PGN into the app
- Reviews the game with engine analysis and move classification (brilliant, mistake, blunder, etc.)
- Explores alternative lines and learns from mistakes
- May play against an engine to practice specific positions
- All processing happens locally — no cloud account required for core functionality

## Capabilities and Constraints

- **Implemented**: Game import (PGN), game list/dashboard, board with tabs, engine management (download/activate), Chess.com/Lichess account sync, database management, file management, settings
- **In progress**: Engine pipeline (analysis), game analysis with move classification (chess.com-style badges), live eval bar during play
- **Deferred**: Training/puzzles, online real-time play
- **Technical**: Electrobun desktop app, embedded PGlite (local Postgres), Elysia API, React SPA with Vite, chessground board

## Brand Commitments

- Name is a placeholder — not yet finalized
- No logo, specific colors, or typography commitments yet
- Voice should be approachable and clear, not intimidating

## Evidence on Hand

- Working desktop app with 9 pages implemented
- Examples folder with mature reference implementations (pawn-appetite, chess-kit)
- Move classifier available in examples/chess-kit to port

## Product Principles

1. **Simple first** — every feature must be obvious to a casual player
2. **Local by default** — your games stay on your machine
3. **Small and fast** — lightweight desktop app, not a bloated suite
4. **Learn from mistakes** — the core value is understanding why moves were wrong

## Accessibility & Inclusion

No specific requirements established yet.
