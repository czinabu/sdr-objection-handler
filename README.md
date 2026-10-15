# sdr-objection-handler

A one-screen helper for handling objections live on a call. Type a word from what the homeowner said, get the rebuttal to read, then the transition that fits the call type: a warm transfer to an inside consultant (Rehash) or a field appointment.

## Use it

Open `index.html` in a browser. There is nothing to install, and it works offline.

1. Pick the call type up top: **Inside** (Rehash, warm transfer) or **Field** (set an appointment). Every card's closing script follows it.
2. Start typing what they said, like `spouse`, `price`, `HOA` or `busy`. The best match opens as you type, so you don't need to press anything.
3. Or press **1–9** to jump straight to a quick pick. Pin your own with the **☆ Pin** button on any card.
4. Read **Say this**, then the transition, which stays in view at the bottom of the card. Yellow highlights are blanks to fill in.
5. Press **Esc** to clear the search, and **Esc** again (or **New call**) to reset for the next call.

Keyboard: `1`–`9` quick picks, `↑` `↓` move through matches, `Enter` keeps the card open and readies the next search, `Esc` clears, `/` jumps to search.

On a phone, tap an objection to open it full screen and use **← All objections** to go back.

Your call type, pins and the last five objections you opened are remembered in this browser.

## Edit the scripts

Every objection, rebuttal and transition lives in [`data/objections.js`](data/objections.js). To change wording, add trigger words, or add a new objection, edit that file and reload the page. The comment at the top of the file explains each field.
