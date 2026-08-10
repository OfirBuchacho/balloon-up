# Balloon Up! 🎈

A 3D browser game: you're tiny, the living room is giant, and the balloon must never touch the floor.

## Game modes

- **Free Play** — solo practice. Keep the balloon up as long as you can.
- **Local 1v1** — split-screen duel on one keyboard.
- **Online 1v1** — play a friend on another computer via a 4-letter room code.

## Rules

- Slap the balloon to keep it airborne. Hold the button to charge a stronger hit.
- **Alternating hits:** after you touch the balloon, your rival must hit it next.
- Balloon lands and your rival failed to save it → you score.
- Nobody touches a serve → 10 seconds come off the match clock.
- First to 5 points, or whoever leads when time runs out. A tie goes to overtime.

## Controls

| Action | Player 1 | Player 2 (local 1v1) |
|---|---|---|
| Move | W A S D | Arrow keys |
| Jump | Space | Enter |
| Dash | Left Shift | Right Ctrl |
| Look | Mouse | auto-aims at balloon |
| Slap | Hold Left Click, release | Hold Right Shift, release |
| Pause | Esc | Esc |

## Running locally

```bash
npm install
node server.js
```

Then open http://localhost:3000

## Tech

Three.js (r128) for 3D, Node.js + Express + Socket.io for the online rooms.
Balloon physics are host-authoritative; the guest predicts locally and is
corrected 20 times a second.
