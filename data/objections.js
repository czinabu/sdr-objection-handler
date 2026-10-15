// Objection library, transcribed from the "Rebuttals & Overcoming Objections" page.
//
// Each objection:
//   id        unique slug
//   title     what the homeowner says (shown on the button)
//   group     section it belongs to
//   keywords  words a rep might type to find it
//   rebuttals list of { text, mode?, note? }
//             mode: "inside" (Rehash / warm transfer) or "field" (set appointment);
//                   leave it off when the line works for both.
//             note: the coaching note from the page, e.g. "Transition to call agenda".
//   probe     optional question-first flow: { ask, answers: [{ label, text }] }
//   note      optional reminder shown under the rebuttals
//   forceMode optional: always use this transition, whatever the call type.
//   custom    true when the rebuttals were written for this tool rather than
//             copied from the company page (shown with a "New" tag).

window.OBJECTION_GROUPS = [
  "Tough objections",
  "Common objections",
  "Not ready / going to wait",
  "Can't talk right now",
  "Disqualify (DQ) reasons",
];

window.OBJECTIONS = [
  // ---------------------------------------------------------------- Tough
  // Written for this tool, in the same voice as the company page.
  {
    id: "not-interested",
    title: "Just not interested",
    group: "Tough objections",
    custom: true,
    keywords: ["not interested", "interested", "no thanks", "no thank you", "pass", "nope", "good"],
    probe: {
      ask: "Totally fair. Just so I can update your file, was it something about the numbers, the timing, or something else?",
      answers: [
        { label: "Numbers", text: "That's exactly why I'm calling. Let's get a second set of eyes on that proposal and make sure it makes the most financial sense for you." },
        { label: "Timing", text: "Not looking to put you on any timeline. Let's just review those details so you have everything you need when you're ready." },
        { label: "Nothing specific", text: "Fair enough. Then there's no harm in a quick look at the real numbers. If they don't make sense, you've lost nothing." },
      ],
    },
    rebuttals: [
      { text: "I hear you, and I'm not calling to sell you anything today. You had requested information on solar, so I just want to make sure you actually got real numbers before you close the door on it. If they don't make sense, you've lost nothing." },
      { text: "Totally understand. Most folks I talk to say the same thing until they see what they'd actually pay compared to their utility bill. Let's at least get you that comparison so you're deciding off real numbers." },
      { text: "No problem at all. Can I ask, is it that you're not interested in solar, or not interested in another sales call? Because this is just a second set of eyes on what you were already shown." },
    ],
  },
  {
    id: "send-info",
    title: "Just send me something / email it to me",
    group: "Tough objections",
    custom: true,
    keywords: ["send", "email", "mail", "brochure", "information", "info", "text me", "look it over"],
    rebuttals: [
      { text: "I'd be happy to! The tricky part is that your numbers are specific to your home and your bill, so a generic email won't tell you much. Let me get you with your expert for a few minutes and they'll send over everything that actually applies to you." },
      { text: "Absolutely. So we send you the right thing, let's have your consultant put your real numbers together with you, and that'll be what lands in your inbox." },
    ],
  },
  {
    id: "think-about-it",
    title: "I need to think about it",
    group: "Tough objections",
    custom: true,
    keywords: ["think", "think about it", "consider", "sleep on it", "decide", "mull", "not sure"],
    rebuttals: [
      { text: "That makes sense, it's a big decision. What's the main thing you'd want to think through? That way I can make sure your expert covers it." },
      { text: "Of course. This isn't a decision you need to make today. This step just gets you the full picture so when you do think it over, you're working with real numbers." },
    ],
  },
  {
    id: "didnt-sign-up",
    title: "I never signed up for this / how did you get my number?",
    group: "Tough objections",
    custom: true,
    keywords: ["signed up", "never", "number", "how did you get", "didn't request", "who is this", "spam"],
    rebuttals: [
      { text: "Great question. It looks like we have a record of you or someone at the home looking into solar with us. I'm just following up to make sure nobody left you hanging. Are you still at [address]?" },
      { text: "I completely understand being cautious. I see we've been in touch before about your home, so I wanted to make sure you got the information you asked about. If you'd like, I can update your file either way." },
    ],
  },
  {
    id: "pushy-sales",
    title: "I don't want a pushy salesperson",
    group: "Tough objections",
    custom: true,
    keywords: ["pushy", "salesman", "salesperson", "sales pitch", "pressure", "in my house", "sold"],
    rebuttals: [
      { text: "I totally get that, nobody likes feeling pressured. This is really just a review of your options and your numbers. If it doesn't make sense for you, the consultant will tell you that too." },
      { text: "Fair enough. You stay in the driver's seat the whole time. You're not committing to anything by looking at the numbers." },
    ],
  },
  {
    id: "bad-experience",
    title: "Had a bad experience with the last consultant",
    group: "Tough objections",
    custom: true,
    keywords: ["bad experience", "last consultant", "rude", "didn't like", "previous", "last guy", "last time"],
    rebuttals: [
      { text: "I'm really sorry to hear that, and thank you for telling me. That's exactly why I'm calling. Let's get you connected with a different expert so you get the experience you should have had the first time." },
      { text: "That's not the experience we want for anyone. I'll make a note on your file, and I'll make sure you're with someone new who can take a fresh look at your proposal." },
    ],
  },
  {
    id: "not-worth-it",
    title: "Solar isn't worth it / doesn't really save money",
    group: "Tough objections",
    custom: true,
    keywords: ["worth", "save", "savings", "doesn't work", "scam", "payback", "not worth", "myth"],
    rebuttals: [
      { text: "That's a fair thing to wonder, and honestly it depends on the home. That's why we look at your actual bill and roof instead of guessing. If the numbers don't save you money, we'll tell you." },
      { text: "I hear that a lot. Let's put it to the test with your real numbers. Worst case, you'll know for sure and won't have to wonder about it again." },
    ],
  },

  // ---------------------------------------------------------------- Common
  {
    id: "stop-calling",
    title: "Stop calling / Too many calls",
    group: "Common objections",
    keywords: ["stop", "calling", "calls", "bothering", "harass", "remove", "do not call", "dnc", "again"],
    rebuttals: [
      { text: "So sorry we have been calling you a bunch! I'm glad we reached you. What I can do is make sure you are taken care of from here on out with an expert.", note: "Transition to call agenda" },
      { text: "I apologize for that! Once I connect you to a consultant, the follow up will not be reaching out to you and I'll update your file.", note: "Transition to call agenda" },
      { text: "I understand, we didn't want you to think we forgot about you since we last spoke.", note: "Transition to call agenda" },
    ],
  },
  {
    id: "too-expensive",
    title: "Too expensive",
    group: "Common objections",
    keywords: ["expensive", "price", "cost", "money", "afford", "pricey", "payment", "costly", "budget"],
    rebuttals: [
      { text: "Hmm? That doesn't sound right. Solar is supposed to save you money, not make you spend more. But that's exactly why I'm calling: to connect you with a consultant who can give you a second set of eyes on that proposal." },
      { text: "Perfect! That's why I am calling. Let's get another set of eyes to make sure we have provided the best possible solution that makes the most financial sense." },
    ],
  },
  {
    id: "spouse",
    title: "Spouse doesn't want it",
    group: "Common objections",
    keywords: ["spouse", "wife", "husband", "partner", "talk to", "other half", "boyfriend", "girlfriend"],
    probe: {
      ask: "Have they received a proposal?",
      answers: [
        { label: "Yes", text: "What about it don't they like?", coach: "Find the actual reason so you can address it." },
        { label: "No", text: "Let's get you some real numbers so you can discuss with your spouse if you haven't seen any yet." },
      ],
    },
    rebuttals: [
      { text: "I totally understand the importance of including your spouse in this decision, we want to get this information out to you so you both can review it in your own time." },
    ],
  },
  {
    id: "already-visited",
    title: "Already had a visit / already spoke with someone",
    group: "Common objections",
    keywords: ["already", "visit", "spoke", "talked", "came out", "before", "met"],
    rebuttals: [
      { text: "I see that. We wanted to follow up and go over those details with you with a fine-tooth comb to make sure it is the best solution for you." },
      { text: "That's good. This is the follow-up visit to review that proposal briefly. Then, your consultant will take it back to the office to fine-tune it to best suit your needs.", mode: "field" },
      { text: "I totally understand! That's why this second visit is actually the most important. The first visit helped us assess your energy consumption and explore your options. Now, this follow-up is where we customize the proposal to fit your lifestyle and discuss the best next steps for you. Let's get you scheduled for that.", mode: "field" },
    ],
  },
  {
    id: "already-working",
    title: "Already working with someone",
    group: "Common objections",
    keywords: ["already", "working", "consultant", "rep", "someone", "have a guy", "my person"],
    rebuttals: [
      { text: "No worries! We work together as a team and want to get another pair of eyes on that proposal to make sure we've offered the best possible solution to you.", mode: "inside" },
      { text: "No worries! Sometimes it takes a few hands to ensure that proposal makes the most sense for you!", mode: "inside" },
      { text: "Perfect, let me try to get [original consultant name] back on the line. If they are unavailable, I'll grab you someone from their team.", mode: "inside" },
      { text: "No worries! I can get you scheduled for that next appointment with the consultant you have been working with.", mode: "field", note: "Reassign to previous consultant, then transition" },
    ],
  },
  {
    id: "bad-reviews",
    title: "Bad reviews",
    group: "Common objections",
    keywords: ["reviews", "bad", "heard", "online", "reputation", "yelp", "google", "complaints", "scam"],
    rebuttals: [
      { text: "That is a valid concern to have for any company. We have close to 1,000,000 customers and the grand majority of them have a good experience. If someone has a poor experience we will do everything to correct it." },
      { text: "Totally get that! I like to read reviews too. We just want to get that information you requested and let you have your own experience with Sunrun." },
      { text: "I appreciate you taking this decision seriously. Your experience here at Sunrun is extremely important to us, that being said, every bad experience a customer has we want to make right. Let's get you the information you requested." },
      { text: "This is all just informational, you're not committed to anything and for what it's worth you might be able to see more savings than what you are seeing with your utility company." },
    ],
  },
  {
    id: "aesthetics",
    title: "Doesn't look nice (aesthetics)",
    group: "Common objections",
    keywords: ["look", "ugly", "aesthetics", "appearance", "nice", "pretty", "design", "see"],
    rebuttals: [
      { text: "I totally understand, aesthetics are extremely important to us as well. Let's get you connected to a consultant who will be able to take a look at that design and customize it to what you are wanting." },
      { text: "That's a valid concern and why I am calling. Let me get you in touch with a consultant who can address that and help make it better fit your preferences." },
    ],
  },
  {
    id: "not-on-roof",
    title: "Don't want it on my roof",
    group: "Common objections",
    keywords: ["roof", "on roof", "holes", "leak", "damage", "ground"],
    rebuttals: [
      { text: "Ok that is no problem, you have options to best fit your preferences." },
    ],
  },
  {
    id: "too-old",
    title: "I am too old",
    group: "Common objections",
    keywords: ["old", "age", "retired", "elderly", "won't live", "too old"],
    rebuttals: [
      { text: "You are never too old to take control of your energy costs. Let's review that proposal and see how it works out for you." },
      { text: "This is something that could be part of a legacy, too, in helping the environment and meeting not just yours but your family's needs. Let me connect you to a consultant, and they can walk you through all of your options." },
    ],
  },
  {
    id: "competitor",
    title: "Signed with a competitor",
    group: "Common objections",
    keywords: ["competitor", "signed", "another company", "tesla", "other", "went with", "someone else"],
    rebuttals: [
      { text: "Oh that is great to hear! It is always best to directly compare a few proposals to find what is best for you. Let's do our diligence and go apples to apples with them and get you that proposal in hand here as well." },
    ],
  },
  {
    id: "rental",
    title: "Home is a rental property",
    group: "Common objections",
    keywords: ["rental", "rent", "tenant", "investment", "landlord", "don't live"],
    forceMode: "inside",
    note: "Warm transfer every rental property customer, since they likely don't live on the property.",
    rebuttals: [
      { text: "Perfect! We have different ways for us to help you and your future tenants see the benefits by going solar on your home. Your consultant will have information on the different ways to navigate you getting solar on your investment property. Let me get you connected to that solar expert to discuss this with you." },
    ],
  },
  {
    id: "no-show",
    title: "Consultant no-show",
    group: "Common objections",
    keywords: ["no show", "never showed", "didn't show", "stood up", "missed", "nobody came"],
    rebuttals: [
      { text: "Oh I'm so sorry to hear that! I'm so glad we're calling so that we can get you connected to a different solar expert to get you the experience you deserve." },
    ],
  },
  {
    id: "no-more-panels",
    title: "Don't want to add panels (add-on)",
    group: "Common objections",
    keywords: ["add", "more panels", "add-on", "addon", "enough", "already have solar", "extra"],
    note: "Add-on angle: complete the system, or offer a system analysis.",
    rebuttals: [
      { text: "Totally hear you. Let's get my consultant on the line to take a look at those bills again and find a solution that makes sense for you.", note: "Transition to WT" },
      { text: "That's why I am calling. We wanted to take another look at things to make sure we can provide a solution that keeps those bills as close to 0 for as long as possible." },
    ],
  },

  // ---------------------------------------------------- Not ready / waiting
  {
    id: "not-right-time",
    title: "Not the right time / wait until after the holidays",
    group: "Not ready / going to wait",
    keywords: ["time", "wait", "holidays", "later", "not ready", "next year", "think about", "timing"],
    rebuttals: [
      { text: "Perfect! Not looking to put you on any timelines. Let's review those proposal details so when you're ready you have everything you need." },
    ],
  },
  {
    id: "lost-job",
    title: "Lost my job",
    group: "Not ready / going to wait",
    keywords: ["job", "lost", "laid off", "unemployed", "work", "fired", "income"],
    rebuttals: [
      { text: "I am sorry to hear that. You have options designed to save you money instead of cost you money that a consultant can cover with you." },
    ],
  },
  {
    id: "passed-away",
    title: "Someone passed away / in the hospital",
    group: "Not ready / going to wait",
    keywords: ["passed", "died", "death", "funeral", "hospital", "sick", "surgery", "family"],
    rebuttals: [
      { text: "So sorry to hear that. Would it be helpful to get the conversation started with your proposal, and then the consultant can follow back up when it makes more sense for you?", mode: "inside" },
      { text: "So sorry to hear that. Would it be helpful to schedule your appointment a week or two out to go over that proposal?", mode: "field" },
    ],
  },
  {
    id: "just-got-proposal",
    title: "Just got the proposal",
    group: "Not ready / going to wait",
    keywords: ["just got", "proposal", "review", "haven't looked", "need time", "read"],
    rebuttals: [
      { text: "Perfect, that's why I am calling. You need time to review that information. Let's schedule your follow up out a week or so so we can review those details and do some fine tuning.", mode: "field" },
    ],
  },

  // ---------------------------------------------------------- Can't talk
  {
    id: "busy",
    title: "Can't talk right now / I'm busy / I'm working",
    group: "Can't talk right now",
    keywords: ["busy", "working", "can't talk", "driving", "bad time", "call back", "at work", "meeting"],
    rebuttals: [
      { text: "Understood! This call is quick. Let me get my consultant on the line to start the conversation and they can follow up afterwards when it is more convenient for you.", mode: "inside", note: "Transition to WT" },
      { text: "Totally understand. I'll be brief. What I can do is get your consultant on the line to start the conversation and then they can follow up when it makes more sense.", mode: "inside", note: "Transition to WT" },
      { text: "No worries, this call is very quick. We wanted to schedule that follow up visit to go over that proposal with you. I have [day] available at these times, which works better for a brief visit?", mode: "field" },
    ],
  },

  // ------------------------------------------------------------ DQ reasons
  {
    id: "credit",
    title: "Credit too low",
    group: "Disqualify (DQ) reasons",
    keywords: ["credit", "score", "low credit", "bad credit", "qualify", "denied", "financing"],
    rebuttals: [
      { text: "That's why I am calling, you have options and we wanted to get a second set of eyes on your situation to make sure we have found the best possible solution for you." },
    ],
  },
  {
    id: "hoa",
    title: "HOA won't allow it",
    group: "Disqualify (DQ) reasons",
    keywords: ["hoa", "association", "neighborhood", "not allowed", "rules", "permit"],
    rebuttals: [
      { text: "No problem, we work with HOAs quite a bit. Let's get a consultant to review your situation and they can actually help coordinate with the HOA as well." },
    ],
  },
  {
    id: "roof-issue",
    title: "Roof size / material / shade",
    group: "Disqualify (DQ) reasons",
    keywords: ["roof", "shade", "trees", "small", "material", "tile", "old roof", "size", "space"],
    rebuttals: [
      { text: "Perfect! That's why I am calling, we wanted to get a second set of eyes on your situation to make sure we have done all we can for you." },
    ],
  },
  {
    id: "selling",
    title: "Selling the house",
    group: "Disqualify (DQ) reasons",
    keywords: ["selling", "sell", "moving", "move", "market", "listing", "relocating"],
    rebuttals: [
      { text: "You can take advantage of solar while in the house and add value for the next owners. Let's go over that information and see how it works out for you." },
    ],
  },
  {
    id: "not-homeowner",
    title: "Not the homeowner",
    group: "Disqualify (DQ) reasons",
    keywords: ["homeowner", "owner", "not mine", "parents", "landlord", "renting", "not my house"],
    rebuttals: [
      { text: "No problem, we wanted to go over that proposal with you and you can discuss those details with them. A consultant can also coordinate with both of you." },
    ],
  },
  {
    id: "low-bills",
    title: "Low bills (add-on)",
    group: "Disqualify (DQ) reasons",
    keywords: ["low bill", "bills", "cheap", "small bill", "don't pay much", "add-on", "already low"],
    note: "Add-on angle: complete the system, or offer a system analysis.",
    rebuttals: [
      { text: "That's why I am calling. We wanted to take another look at things to make sure we can provide a better solution that keeps those bills as close to 0 for as long as possible." },
    ],
  },
];

// Close / transition scripts, from the call script's "Close/Transition" section.
window.TRANSITIONS = {
  inside: {
    label: "Warm transfer to inside consultant",
    close: "Give me about 30 seconds to bring your solar expert on the line. If you have a moment to grab your utility bill please do, and prepare to be impressed!",
    assumptive: [
      "Perfect! Give me 30 seconds to connect you to your expert.",
      "That's a great question for your expert! One moment and I'll get them on the line to answer that.",
    ],
  },
  field: {
    label: "Set a field appointment",
    close: "An expert can visit with you at your home on [next available day] at [time] or [time], which one works better for you?",
    confirm: "Perfect! We'll see you at [appointment time] to go over your proposal and next steps. Make sure to have a utility bill handy if you can and prepare to be impressed! We'll see you soon!",
    assumptive: [
      "Do you prefer mornings or afternoons?",
      "Here's what we're gonna do, I'll get you on the schedule a week out on [day] at [time]. That way it gives you some time! How does that sound?",
      "Are you typically available in the mornings or evenings?",
    ],
  },
};
