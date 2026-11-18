# Blez & Yuki — Wedding Invitation

An online wedding invitation for **Sunday, April 18, 2027 · 4:30 PM** at **Prive by the Sea**.
A small, static site (plain HTML, CSS and JavaScript) with no build step and no dependencies.

## The experience

1. **The envelope.** Guests land on a full-screen sage envelope with gold leaf flakes and a pearl calla lily wax seal. The page can't be scrolled until the seal is tapped.
2. **The opening.** Tapping the seal lifts it, the envelope dissolves into a dark sage screen, and the invitation fades in. Soft, generated piano music begins at the same moment.
3. **The invitation.** One column on embossed floral paper, set in Cormorant Garamond to match the save-the-date:
   - Venue drawing, names with a single-line rings flourish, the invitation text, date and a map link
   - A live countdown
   - The details (dress code, setting, kind note)
   - The program, an illustrated timeline
   - A short closing with the RSVP note and an "add to calendar" button
4. **The little touches.** Text reveals as you scroll, calla petals and gold flakes drift down the page, the closing seal releases a burst of petals when tapped, and a line-drawn bride and groom tied by a red string walk toward each other in a frosted bar at the bottom as guests scroll, cheering when they reach the end.

## Project layout

```
dist/
  index.html     page content
  styles.css     all styles (later rules refine earlier ones)
  script.js      opening sequence, scroll effects, countdown, music, footer couple
  assets/        images and textures
```

## Run it locally

Serve the `dist` folder with any static server, for example:

```bash
cd dist && python3 -m http.server 4180
```

Then open http://localhost:4180.

## Editing

- **Text** (names, date, details, program) is in `dist/index.html`.
- **Wedding date and time** for the countdown and the calendar file are set near the top of the countdown code in `dist/script.js` (`eventStart`, `eventEnd`).
- **Music** is generated in the browser (no audio file). The chords, melody and tempo live in the "Background music" section of `dist/script.js`.
- After changing `styles.css` or `script.js`, bump the `?v=` number on its link in `index.html` so browsers load the new version.

## Accessibility

- Guests whose devices are set to reduce motion get the content without the falling petals, reveals or bursts.
- The seal and buttons can be reached with the keyboard.
- Images that carry meaning have descriptive alt text.

## Notes

- Some images (the plaster texture, the wax seal photos and the line illustrations) came from reference pictures. Check you have the right to use them before sharing the site publicly.
