# sdr-objection-handler

A one-screen helper for handling objections live on a sales call. Type a word from what the prospect said, read the rebuttal, then read the close that fits the call: a live transfer to a specialist, or a booked appointment.

It ships with a generic demo set. You can edit it in the app or load your own.

## Use it

Open `index.html` in a browser. There's nothing to install, and it works offline.

1. Pick the call type at the top. The demo set's types are **Transfer** and **Appointment**. Every card ends with that type's closing script.
2. Start typing what they said, like `price`, `busy` or `think about it`. The best match opens as you type, so you don't need to press anything.
3. Or press **1–9** to jump straight to a quick pick. Pin your own with the **☆ Pin** button on any card.
4. Read **Say this**, then the close, which stays in view at the bottom of the card. Yellow highlights are blanks to fill in.
5. Press **Esc** to clear the search. Press **Esc** again, or **New call**, to reset for the next call.

Keyboard: `1`–`9` quick picks, `↑` `↓` move through matches, `Enter` keeps the card open and readies the next search, `Esc` clears, `/` jumps to search.
6. After the call, tap **Transferred** (or **Booked**) or **Lost** under the close. It's one tap, and it resets for the next call. If you said an alternate line, tap it first so the log credits that one. **Undo** appears for a few seconds.
7. Open **Stats** to see your most common objections and which rebuttals lead to wins. Rebuttal rates appear once a line has been used twice. You can save the log as a CSV or clear it.

On a phone, tap an objection to open it full screen, then use **← All objections** to go back.

## Make it yours

- **Edit a card:** open it and press **Edit** to change the wording, the search words, or which call type each rebuttal is for. You can also delete the card there.
- **Add a card:** press **+ Add objection** at the bottom of the list.
- **Rename call types and closes:** open **Manage**, then go to **Call types and closing scripts**.
- **Back up or move your set:** open **Manage**, then use **Copy as text** or **Save as file**. To load a set, use **Load a set**. **Reset to demo set** puts the demo back.

Your edits, pins, recent cards, call type and call log are saved in this browser only. Nothing is uploaded.

### Keeping a private set private

If your objections come from your employer's training material, don't commit them to this repo. Keep them in a saved file on your own computer and load it with **Manage → Load a set**. That way the public code only ever contains the demo set.

## Change the demo set

The demo set lives in [`data/demo.js`](data/demo.js). The comment at the top of that file explains each field. A saved file uses the same shape, as JSON.
