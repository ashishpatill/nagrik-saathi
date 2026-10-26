/**
 * Reviewed scam-pattern library.
 *
 * Every pattern is content, not a verdict. A rule may only match text it can
 * explain in `examples`; `counterexamples` are checked by the test suite so a
 * broad regex cannot silently turn a legitimate notice into a fraud warning.
 *
 * Portal references are registry keys, never raw URLs. The page resolves them
 * through the same reviewed registry as every other official link.
 */

export type ScamCategory = "credentials" | "payment" | "link" | "pressure" | "identity";
export type ScamSeverity = "high" | "medium";

export interface ScamRule {
  id: string;
  label: string;
  test: (text: string) => boolean;
  examples: string[];
  counterexamples: string[];
}

export interface ScamPattern {
  id: string;
  title: string;
  category: ScamCategory;
  severity: ScamSeverity;
  match: "any" | "all";
  summary: string;
  signals: string[];
  whyItMatters: string;
  safeAction: string;
  verifyHint: string;
  officialPortalKeys: string[];
  sourceNote: string;
  lastReviewed: string;
  rules: ScamRule[];
}

export const SCAM_LIBRARY_VERSION = "1.0.0";
export const SCAM_LIBRARY_REVIEWED = "2026-10-26";

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

// A sentence that tells the reader not to do something is not a request.
// "Never share your OTP" must not match the same rule as "Share your OTP".
const NEGATED_REQUEST = /\b(?:do not|don't|never|avoid|no need to|not required to)\b/i;

function positiveSentences(text: string): string[] {
  return sentences(text).filter((sentence) => !NEGATED_REQUEST.test(sentence));
}

function anyPositiveSentence(text: string, pattern: RegExp): boolean {
  return positiveSentences(text).some((sentence) => pattern.test(sentence));
}

function anyText(text: string, pattern: RegExp): boolean {
  return pattern.test(text);
}

function rule(
  id: string,
  label: string,
  test: (text: string) => boolean,
  examples: string[],
  counterexamples: string[],
): ScamRule {
  return { id, label, test, examples, counterexamples };
}

const FEE_PATTERN =
  /\b(?:processing|release|clearance|courier|token|registration|verification|service)\s+(?:fee|charge|amount|payment)\b/i;
const NEGATED_FEE =
  /\b(?:no|without|never|zero)\b[^.!?\n]{0,40}\b(?:processing|release|clearance|courier|token|registration|verification|service)\s+(?:fee|charge|amount|payment)\b/i;

function asksForFee(text: string): boolean {
  return positiveSentences(text).some(
    (sentence) => FEE_PATTERN.test(sentence) && !NEGATED_FEE.test(sentence),
  );
}

export const SCAM_PATTERNS: ScamPattern[] = [
  {
    id: "otp-pin-request",
    title: "Someone asks you to share an OTP, PIN, or password",
    category: "credentials",
    severity: "high",
    match: "any",
    summary:
      "A government office, bank, or portal does not need your OTP, UPI PIN, card PIN, CVV, or password. A one-time code authorizes the action, so sharing it hands over control.",
    signals: [
      "The message asks you to share, send, read out, or forward a code.",
      "The caller says the code is needed to stop a payment, complete a refund, or verify your identity.",
      "The request arrives by phone, SMS, or WhatsApp rather than inside the official app or portal.",
    ],
    whyItMatters:
      "The code is the second key to your account or payment. Whoever has it can finish the transaction even if they do not know your password.",
    safeAction:
      "Do not share the code. End the call or chat. Open the official app or portal yourself and check the transaction there.",
    verifyHint:
      "Use the department's printed helpline or the reviewed portal. Report the call at the national Cyber Crime Portal or 1930.",
    officialPortalKeys: ["cybercrime"],
    sourceNote: "Public safety guidance from RBI, NPCI, and the national Cyber Crime Portal.",
    lastReviewed: "2026-10-26",
    rules: [
      rule(
        "asks-to-share-a-code",
        "Asks you to share a code",
        (text) =>
          anyPositiveSentence(
            text,
            /\b(?:share|send|provide|tell|forward|read out|what is|give me)\b[^.!?\n]{0,60}\b(?:otp|one[-\s]?time\s+password|upi\s+pin|card\s+pin|cvv|verification\s+code|password)\b/i,
          ) ||
          anyPositiveSentence(
            text,
            /\b(?:otp|one[-\s]?time\s+password|upi\s+pin|card\s+pin|cvv|verification\s+code|password)\b[^.!?\n]{0,60}\b(?:share|send|provide|tell|forward|read out)\b/i,
          ),
        ["Please share the OTP you received on your phone."],
        [
          "Never share your OTP with anyone.",
          "Enter the OTP on the official portal.",
          "The portal will never ask for your password.",
        ],
      ),
    ],
  },
  {
    id: "digital-arrest",
    title: "A video call from the police and a demand for secrecy",
    category: "pressure",
    severity: "high",
    match: "all",
    summary:
      "No police investigation is conducted by video call with a demand for secrecy and an immediate payment. This is the pattern called a digital arrest.",
    signals: [
      "A caller claims to be from the police, CBI, ED, customs, or narcotics.",
      "The call happens on WhatsApp, Skype, or another video app.",
      "You are told not to tell family and to pay a verification fee or fine.",
    ],
    whyItMatters:
      "The threat is fabricated. Secrecy isolates you from the people who could help you check it.",
    safeAction:
      "Hang up. Do not pay or share documents. Talk to a family member and report at the Cyber Crime Portal or 1930.",
    verifyHint:
      "Call the local police station through a published number, not a number supplied by the caller.",
    officialPortalKeys: ["cybercrime", "mahapolice"],
    sourceNote: "National Cyber Crime Portal and Mumbai Police public advisories on digital arrest.",
    lastReviewed: "2026-10-26",
    rules: [
      rule(
        "agency-on-a-video-call",
        "Claims an agency is on a video call",
        (text) =>
          anyText(
            text,
            /\b(?:cbi|enforcement\s+directorate|ed|customs|narcotics|police|crime\s+branch)\b[\s\S]{0,80}\b(?:video\s+call|whatsapp|skype|zoom)\b/i,
          ) ||
          anyText(
            text,
            /\b(?:video\s+call|whatsapp|skype|zoom)\b[\s\S]{0,80}\b(?:cbi|enforcement\s+directorate|ed|customs|narcotics|police|crime\s+branch)\b/i,
          ),
        ["This is CBI. Join the video call now."],
        ["The local police station is open today."],
      ),
      rule(
        "secrecy-or-arrest",
        "Demands secrecy or threatens arrest",
        (text) =>
          anyText(
            text,
            /\b(?:do not tell|don't tell|keep this confidential|secrecy|without informing|do not inform)\b/i,
          ) ||
          anyText(
            text,
            /\b(?:arrest|warrant|case registered|money laundering|digital arrest)\b/i,
          ),
        ["Do not tell your family. A warrant has been issued."],
        ["The police published a public advisory."],
      ),
    ],
  },
  {
    id: "personal-upi",
    title: "Payment is routed to a personal UPI ID or mobile number",
    category: "payment",
    severity: "high",
    match: "any",
    summary:
      "Official portals collect payment on their own domain and show the department as the payee. A personal UPI handle or a mobile number in a notice is a warning sign.",
    signals: [
      "A UPI ID such as name@okhdfcbank, name@paytm, or name@ybl.",
      "A phone number next to Google Pay, PhonePe, Paytm, or UPI.",
      "The message asks you to send money to a person rather than pay the department.",
    ],
    whyItMatters:
      "Money sent to a personal handle is difficult to trace and recover. The notice can look official while the payment goes elsewhere.",
    safeAction:
      "Do not send money to the handle. Open the reviewed portal for the department and pay there.",
    verifyHint:
      "Check the payee name before approving any UPI request. A collect request you did not start is a red flag.",
    officialPortalKeys: ["cybercrime"],
    sourceNote: "NPCI UPI safety guidance and public bank fraud warnings.",
    lastReviewed: "2026-10-26",
    rules: [
      rule(
        "upi-handle",
        "Contains a UPI handle",
        (text) =>
          /\b[a-z0-9._-]{2,}@(?:oksbi|okhdfcbank|okicici|okaxis|paytm|ybl|ibl|axl|upi|apl)\b/i.test(
            text,
          ),
        ["Send the amount to shop@okhdfcbank."],
        ["Pay on the official portal."],
      ),
      rule(
        "wallet-and-mobile",
        "Pairs a wallet with a mobile number",
        (text) =>
          /\b(?:google\s*pay|gpay|phonepe|paytm|upi)\b[^.!?\n]{0,40}\b(?:\+91[\s-]?)?[6-9]\d{9}\b/i.test(
            text,
          ) ||
          /\b(?:\+91[\s-]?)?[6-9]\d{9}\b[^.!?\n]{0,40}\b(?:google\s*pay|gpay|phonepe|paytm|upi)\b/i.test(
            text,
          ),
        ["Pay through Google Pay on 9876543210."],
        ["Pay through Google Pay on the official portal."],
      ),
    ],
  },
  {
    id: "electricity-disconnection",
    title: "Electricity will be disconnected tonight unless you call",
    category: "pressure",
    severity: "high",
    match: "all",
    summary:
      "Disconnection threats are a common SMS scam. A real disconnection notice comes from the distribution company and can be checked in its app or on its portal.",
    signals: [
      "The message says power will be cut tonight or within hours.",
      "It gives a mobile number to call, not the official helpline.",
      "It asks for a payment or personal details before reconnection.",
    ],
    whyItMatters:
      "The fear of losing power pushes people to call a number that collects payment or personal data.",
    safeAction:
      "Do not call the number in the message. Check the bill in the official app or portal, or call the printed helpline.",
    verifyHint:
      "For MSEDCL, the reviewed portal is wss.mahadiscom.in and the helpline is 1912.",
    officialPortalKeys: ["msedcl_power", "mahavitaran_complaints", "cybercrime"],
    sourceNote: "MSEDCL public disconnection and payment guidance.",
    lastReviewed: "2026-10-26",
    rules: [
      rule(
        "electricity-threat",
        "Threatens an electricity disconnection",
        (text) =>
          /\b(?:electricity|power|connection|meter)\b[^.!?\n]{0,50}\b(?:disconnect(?:ed|ion)?|cut off|shut down)\b/i.test(
            text,
          ) ||
          /\b(?:disconnect(?:ed|ion)?|cut off|shut down)\b[^.!?\n]{0,50}\b(?:electricity|power|connection|meter)\b/i.test(
            text,
          ),
        ["Your electricity connection will be disconnected tonight."],
        ["Your electricity bill is ready."],
      ),
      rule(
        "adds-a-personal-mobile-number",
        "Adds a personal mobile number",
        (text) =>
          /(?:\+91[\s-]?)?[6-9]\d{9}\b/.test(text) &&
          !/\b(?:helpline|toll[\s-]?free|1800[\s-]?\d{3}[\s-]?\d{4}|1912|1930)\b/i.test(text),
        ["Call 9876543210 for reconnection."],
        ["Call the helpline 1912 for reconnection."],
      ),
      rule(
        "same-day-deadline",
        "Sets a same-day deadline",
        (text) =>
          /\b(?:tonight|today|within\s+\d+\s*(?:hours?|hrs?)|immediately|right now)\b/i.test(
            text,
          ),
        ["Your connection will be disconnected tonight."],
        ["Pay by 30 November 2026."],
      ),
    ],
  },
  {
    id: "shortened-link",
    title: "The link is shortened or uses plain HTTP",
    category: "link",
    severity: "high",
    match: "any",
    summary:
      "A shortened link hides the destination. A plain HTTP page is not encrypted and can be altered in transit.",
    signals: [
      "bit.ly, tinyurl.com, t.co, rb.gy, or another shortener.",
      "A link that starts with http:// instead of https://.",
      "A domain that looks like the department but is not the reviewed one.",
    ],
    whyItMatters:
      "The page can copy an official login screen and capture your credentials or payment.",
    safeAction:
      "Do not tap the link. Type the reviewed portal address yourself or open it from the registry.",
    verifyHint:
      "The reviewed registry lists the allowed hostname for each department. A link that is not on it is not official, even if it looks similar.",
    officialPortalKeys: ["cybercrime"],
    sourceNote: "National Cyber Crime Portal guidance on phishing links.",
    lastReviewed: "2026-10-26",
    rules: [
      rule(
        "shortener",
        "Uses a link shortener",
        (text) =>
          /\b(?:bit\.ly|tinyurl\.com|t\.co|rb\.gy|shorturl\.at|is\.gd|buff\.ly|cutt\.ly)\b/i.test(
            text,
          ),
        ["Pay at bit.ly/3xyzabc."],
        ["Pay at https://wss.mahadiscom.in/wss/wss."],
      ),
      rule(
        "plain-http",
        "Uses plain HTTP",
        (text) => /\bhttp:\/\/[^\s]+/i.test(text),
        ["Open http://mahadiscom-bill.example to pay."],
        ["Open https://wss.mahadiscom.in/wss/wss to pay."],
      ),
    ],
  },
  {
    id: "fee-to-release",
    title: "You must pay a fee to receive a refund, prize, or benefit",
    category: "payment",
    severity: "high",
    match: "all",
    summary:
      "A genuine refund or benefit does not require a processing fee, courier charge, or token payment to release it.",
    signals: [
      "Pay a small processing fee to release a larger refund or prize.",
      "A courier or clearance charge is needed before the money arrives.",
      "The message asks for a token amount to confirm the claim.",
    ],
    whyItMatters: "The first payment is the scam. The promised money does not exist.",
    safeAction:
      "Do not pay. Verify the scheme or refund through the department's official portal or helpline.",
    verifyHint:
      "Check the scheme on the department portal. A real refund is credited to your account; it is not released by a fee.",
    officialPortalKeys: ["cybercrime", "consumer_helpline"],
    sourceNote: "Public bank and cyber-fraud warnings about advance-fee fraud.",
    lastReviewed: "2026-10-26",
    rules: [
      rule(
        "asks-for-a-fee",
        "Mentions a processing or release fee",
        asksForFee,
        ["Pay a processing fee of ₹500 to release the refund."],
        ["There is no processing fee for this refund."],
      ),
      rule(
        "promises-a-benefit",
        "Promises a refund, prize, or benefit",
        (text) =>
          anyPositiveSentence(
            text,
            /\b(?:refund|prize|lottery|subsidy|benefit|claim|compensation|winnings?)\b/i,
          ),
        ["Your refund of ₹5,000 is ready."],
        ["Your bill is ready."],
      ),
    ],
  },
  {
    id: "document-over-chat",
    title: "Someone asks for an Aadhaar or PAN photo over chat",
    category: "identity",
    severity: "high",
    match: "any",
    summary:
      "A portal may ask you to upload a document after you log in. A person asking over WhatsApp, Telegram, or SMS is not a secure channel.",
    signals: [
      "Send an Aadhaar, PAN, passport, voter, or driving licence photo on WhatsApp.",
      "Share a scan or copy to a personal mobile number.",
      "The request says the document is needed to verify a refund, case, or application.",
    ],
    whyItMatters:
      "Full Aadhaar and PAN copies enable identity fraud and can be misused for loans, accounts, or SIM cards.",
    safeAction:
      "Do not send the photo. Use the official portal's own upload flow after checking the domain, or visit the office.",
    verifyHint:
      "Aadhaar and PAN are sensitive. Share only the last four digits when a form asks, and only on a reviewed portal.",
    officialPortalKeys: ["uidai", "protean_pan", "cybercrime"],
    sourceNote: "UIDAI and Protean public guidance on sharing Aadhaar and PAN.",
    lastReviewed: "2026-10-26",
    rules: [
      rule(
        "document-on-a-chat-app",
        "Asks for a document on a chat app",
        (text) =>
          anyText(text, /\b(?:whatsapp|telegram|wa\.me)\b/i) &&
          anyText(text, /\b(?:aadhaar|pan|passport|voter|driving\s+licen[cs]e)\b/i) &&
          anyPositiveSentence(text, /\b(?:send|share|upload|photo|copy|image|scan)\b/i),
        ["Send your Aadhaar photo on WhatsApp."],
        ["Never share your Aadhaar photo on WhatsApp."],
      ),
      rule(
        "document-to-a-mobile-number",
        "Asks for a document to a mobile number",
        (text) =>
          anyPositiveSentence(
            text,
            /\b(?:send|share|upload)\b[^.!?\n]{0,50}\b(?:aadhaar|pan|passport|voter|driving\s+licen[cs]e)\b[^.!?\n]{0,50}\b(?:\+91[\s-]?)?[6-9]\d{9}\b/i,
          ),
        ["Send your PAN copy to 9876543210."],
        ["Upload your PAN on the official portal."],
      ),
    ],
  },
  {
    id: "urgency-threat",
    title: "A deadline of hours, with a threat and a payment demand",
    category: "pressure",
    severity: "medium",
    match: "all",
    summary:
      "Pressure is a tactic, not proof. Real notices usually give a reference number, a written order, and a way to verify the demand.",
    signals: [
      "Pay within 24 hours, tonight, or immediately.",
      "The same message threatens disconnection, penalty, arrest, or legal action.",
      "There is no reference number, office address, or published helpline.",
    ],
    whyItMatters:
      "Urgency stops you from checking the issuer. A short deadline is common in both real notices and scams, so verify before paying.",
    safeAction:
      "Slow down. Find the reference number and verify with the printed notice, the department helpline, or the reviewed portal.",
    verifyHint: "Use the reviewed portal or the printed helpline for the department named in the notice.",
    officialPortalKeys: ["cybercrime", "consumer_helpline"],
    sourceNote: "Public consumer and cyber-fraud guidance on pressure tactics.",
    lastReviewed: "2026-10-26",
    rules: [
      rule(
        "hours-long-or-immediate-deadline",
        "Sets an hours-long or immediate deadline",
        (text) =>
          /\b(?:within|in|before)\s+(?:\d+|twenty[-\s]?four|forty[-\s]?eight|twelve|six)\s*(?:hours?|hrs?)\b/i.test(
            text,
          ) ||
          /\b(?:tonight|today|immediately|right now|last chance|final notice)\b/i.test(text),
        ["Pay within 24 hours."],
        ["Pay by 30 November 2026."],
      ),
      rule(
        "threatens-a-consequence",
        "Threatens a serious consequence",
        (text) =>
          /\b(?:disconnect(?:ed|ion)?|penalty|fine|legal action|arrest|warrant|block|suspend|seize|court)\b/i.test(
            text,
          ),
        ["Your connection will be disconnected."],
        ["Your bill is ready."],
      ),
      rule(
        "demands-a-payment",
        "Demands a payment",
        (text) => /\b(?:pay|payment|transfer|deposit|clear dues)\b/i.test(text),
        ["Pay the amount today."],
        ["Your bill is ready."],
      ),
      rule(
        "lacks-verifiable-detail",
        "Gives no reference number or published helpline",
        (text) =>
          !/\b(?:reference|ref(?:erence)?\s*(?:no|number)|consumer\s*(?:no|number)|application\s*(?:no|number)|case\s*(?:no|number)|notice\s*(?:no|number)|helpline|toll[\s-]?free|1800[\s-]?\d{3}[\s-]?\d{4}|1912|1930|office\s+address)\b/i.test(
            text,
          ),
        ["Pay within 24 hours or your connection will be disconnected."],
        [
          "Notice 12345. Pay within 24 hours or a penalty applies. Helpline 1912.",
          "Consumer number BU-411038-7781. Pay within 24 hours or face a penalty.",
        ],
      ),
    ],
  },
  {
    id: "whatsapp-only-contact",
    title: "The only contact is WhatsApp or a personal mobile number",
    category: "identity",
    severity: "medium",
    match: "any",
    summary:
      "Official notices carry a department name, a written reference, and a published helpline. A WhatsApp-only contact is not a verification channel.",
    signals: [
      "The message asks you to reply on WhatsApp or wa.me.",
      "The sender uses a personal mobile number with no office name, address, or landline.",
      "The message asks you to keep the conversation private.",
    ],
    whyItMatters: "A personal number can be changed or spoofed and leaves no official record.",
    safeAction:
      "Ask for the written notice and verify the department through its published helpline or reviewed portal.",
    verifyHint: "Do not send documents or money over WhatsApp. Use the official portal or visit the office.",
    officialPortalKeys: ["cybercrime"],
    sourceNote: "National Cyber Crime Portal guidance on impersonation.",
    lastReviewed: "2026-10-26",
    rules: [
      rule(
        "asks-for-whatsapp-contact",
        "Asks for contact on WhatsApp",
        (text) =>
          anyPositiveSentence(
            text,
            /\b(?:whatsapp|wa\.me)\b[^.!?\n]{0,60}\b(?:contact|call|message|send|reply|chat|only)\b/i,
          ) ||
          anyPositiveSentence(
            text,
            /\b(?:contact|call|message|send|reply|chat|only)\b[^.!?\n]{0,60}\b(?:whatsapp|wa\.me)\b/i,
          ),
        ["Contact us on WhatsApp at 9876543210."],
        [
          "The department does not use WhatsApp for official notices.",
          "Never contact us on WhatsApp.",
        ],
      ),
      rule(
        "pushes-a-private-mobile-number",
        "Pushes a private mobile number",
        (text) =>
          anyPositiveSentence(
            text,
            /\b(?:contact|call|whatsapp|message)\b[^.!?\n]{0,20}\b(?:\+91[\s-]?)?[6-9]\d{9}\b/i,
          ) && !/\b(?:helpline|toll[-\s]?free|1800|1912|1930|112)\b/i.test(text),
        ["Call 9876543210 for reconnection."],
        [
          "Call the helpline 1912 for reconnection.",
          "Call 9876543210 or the toll-free helpline 1912.",
        ],
      ),
    ],
  },
  {
    id: "qr-code-payment",
    title: "A QR code is presented as the only way to pay",
    category: "payment",
    severity: "medium",
    match: "any",
    summary:
      "Many genuine bills include a QR code, so a code by itself is not a warning. The signal is a code that is pushed as the only route, or a payee name that is a person or shop rather than the department.",
    signals: [
      "The message says the QR code is the only way to pay.",
      "The payee name is a person, a shop, or a different department.",
      "The code is on a sticker, a handwritten slip, or a chat message.",
    ],
    whyItMatters: "The code can point to a personal account while the notice looks genuine.",
    safeAction:
      "Open the reviewed portal and pay there. If you scan, read the payee name and do not approve a collect request you did not start.",
    verifyHint: "Match the payee name to the department. When in doubt, pay through the department portal.",
    officialPortalKeys: ["cybercrime"],
    sourceNote: "NPCI and bank guidance on QR-code payment fraud.",
    lastReviewed: "2026-10-26",
    rules: [
      rule(
        "qr-as-the-only-payment-route",
        "Says a QR code is the only way to pay",
        (text) =>
          /\b(?:qr|scan)\b[^.!?\n]{0,60}\b(?:only|must|mandatory|compulsory)\b[^.!?\n]{0,60}\b(?:pay|payment|upi|amount|bill)\b/i.test(
            text,
          ) ||
          /\b(?:only|must|mandatory|compulsory)\b[^.!?\n]{0,40}\b(?:qr|scan)\b[^.!?\n]{0,40}\b(?:pay|payment|upi|amount|bill)\b/i.test(
            text,
          ),
        [
          "This QR code is the only way to pay the bill.",
          "You must scan the QR code to pay.",
        ],
        ["Scan this QR code to pay the bill.", "Scan the QR code to view the notice."],
      ),
    ],
  },
];
