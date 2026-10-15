# sdr-objection-handler

A one-screen helper for handling objections live on a call. Type a word from what the homeowner said, get the rebuttal to read, then the transition that fits the call type: a warm transfer to an inside consultant (Rehash) or a field appointment.

## Use it

Open `index.html` in a browser. There is nothing to install, and it works offline.

1. Pick the call type up top: **Inside** (Rehash, warm transfer) or **Field** (set an appointment).
2. Type what they said, like `spouse`, `expensive`, `HOA` or `busy`, then press **Enter**. You can also tap an objection from the list.
3. Read the **Say this** line. There are alternates under **Or try**.
4. Read the **Then transition** script at the bottom. Yellow highlights are blanks to fill in.

Keyboard: `/` jumps to search, `↑` `↓` move through matches, `Enter` opens one, `Esc` clears.

The last five objections you opened stay under **Recent**, and the call type you picked is remembered.

## Edit the scripts

Every objection, rebuttal and transition lives in [`data/objections.js`](data/objections.js). To change wording, add trigger words, or add a new objection, edit that file and reload the page. The comment at the top of the file explains each field.
