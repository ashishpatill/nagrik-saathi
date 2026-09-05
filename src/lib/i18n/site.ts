import type { Language } from "@/lib/languages";

export type SiteCopy = {
  eyebrow: string;
  tagline: string;
  stepAttachTitle: string;
  stepAttachBody: string;
  stepAnalyzeTitle: string;
  stepAnalyzeBody: string;
  stepPortalTitle: string;
  stepPortalBody: string;
  siteLanguage: string;
  explainLanguage: string;
  siteLanguageHint: string;
  explainLanguageHint: string;
  yourNotice: string;
  noticeHint: string;
  analyze: string;
  attach: string;
  readingFile: string;
  readingOcr: string;
  clearNotice: string;
  dropHint: string;
  whatYouGet: string;
  getBrief: string;
  getFields: string;
  getPortal: string;
  notGov: string;
  howToUse: string;
  howAttach: string;
  howAnalyze: string;
  howPortal: string;
  howExtras: string;
  nextSteps: string;
  nextStepsHint: string;
  preparingTools: string;
  result: string;
  openPortal: string;
  boundary: string;
  paidOn: string;
  deadline: string;
  amount: string;
  amountPaid: string;
  urgency: string;
  source: string;
  reviewedCues: string;
  checkCarefully: string;
  plainBrief: string;
  whatNext: string;
  keepNearby: string;
  photoCaption: string;
  pastePlaceholder: string;
  photoPlaceholder: string;
};

const en: SiteCopy = {
  eyebrow: "Government notice helper",
  tagline:
    "Confused by an electricity bill, tax notice, challan, or payment receipt? Bring the document here. We explain it in plain language and point you to a reviewed official website—you act there yourself.",
  stepAttachTitle: "Attach or paste",
  stepAttachBody: "PDF, text, or a photo (auto-read on device).",
  stepAnalyzeTitle: "Analyze",
  stepAnalyzeBody: "See amount, date, and what it means.",
  stepPortalTitle: "Open official site",
  stepPortalBody: "We never pay, log in, or submit for you.",
  siteLanguage: "Site language",
  explainLanguage: "Explain notice in",
  siteLanguageHint: "Buttons and labels",
  explainLanguageHint: "Plain-language brief only",
  yourNotice: "Your notice",
  noticeHint: "Attach a file or paste text. Stays on this device.",
  analyze: "Analyze",
  attach: "Attach PDF, text, or photo",
  readingFile: "Reading file…",
  readingOcr: "Reading photo with on-device OCR…",
  clearNotice: "Clear notice",
  dropHint: "Or drop a file here · PDF · TXT · JPG · PNG · WebP",
  whatYouGet: "What you get after Analyze",
  getBrief: "A plain-language brief in your explain language",
  getFields: "Deadline or paid-on date, amount, and reference if found",
  getPortal: "A reviewed official portal link—you open and act yourself",
  notGov:
    "This is not a government website and does not replace one. No OTP, Aadhaar, PAN, or banking details are collected here.",
  howToUse: "How to use",
  howAttach: "Attach a PDF, .txt, or photo (OCR runs on this device)—or paste the notice text.",
  howAnalyze: "Click Analyze to get a plain-language brief.",
  howPortal: "Use the official portal link we show—log in and act only on that site.",
  howExtras: "Extra steps (explain, scam check, action plan, portal, reminder, brief, letter) appear here after Analyze.",
  nextSteps: "Next steps",
  nextStepsHint: "Optional helpers for this notice. Results show below.",
  preparingTools: "Preparing tools…",
  result: "Result",
  openPortal: "Open official portal",
  boundary:
    "Human control is intentional. This app can explain, plan, draft, and prepare a reminder—never log into an official portal or send a letter.",
  paidOn: "Paid on",
  deadline: "Deadline",
  amount: "Amount",
  amountPaid: "Amount paid",
  urgency: "Urgency",
  source: "Source",
  reviewedCues: "Reviewed cues",
  checkCarefully: "Check carefully",
  plainBrief: "Plain-language brief",
  whatNext: "What to do next",
  keepNearby: "Keep nearby",
  photoCaption: "Photo preview — text was read on this device. Edit the box if OCR missed anything, then Analyze.",
  pastePlaceholder:
    "Paste your electricity bill, property tax notice, challan, payment receipt, or other government notice here…",
  photoPlaceholder: "Type or paste the text visible in the photo (amount, consumer number, date)…",
};

/** Site chrome translations. Explain-language strings live with notice summaries. */
export const SITE_COPY: Record<Language, SiteCopy> = {
  en,
  hi: {
    ...en,
    eyebrow: "सरकारी सूचना सहायक",
    tagline:
      "बिजली बिल, कर सूचना, चालान या भुगतान रसीद समझ नहीं आ रही? दस्तावेज़ यहाँ लाएँ। हम सादी भाषा में समझाएँगे और जाँचा हुआ आधिकारिक पोर्टल दिखाएँगे—आप स्वयं वहाँ कार्रवाई करें।",
    stepAttachTitle: "संलग्न करें या चिपकाएँ",
    stepAttachBody: "PDF, पाठ, या फोटो (इस डिवाइस पर पढ़ा जाएगा)।",
    stepAnalyzeTitle: "विश्लेषण",
    stepAnalyzeBody: "राशि, तारीख और अर्थ देखें।",
    stepPortalTitle: "आधिकारिक साइट खोलें",
    stepPortalBody: "हम भुगतान, लॉगिन या जमा नहीं करते।",
    siteLanguage: "साइट भाषा",
    explainLanguage: "सूचना समझाएँ",
    siteLanguageHint: "बटन और लेबल",
    explainLanguageHint: "केवल सादी भाषा का सार",
    yourNotice: "आपकी सूचना",
    noticeHint: "फ़ाइल जोड़ें या पाठ चिपकाएँ। इस डिवाइस पर रहता है।",
    analyze: "विश्लेषण करें",
    attach: "PDF, पाठ या फोटो जोड़ें",
    clearNotice: "साफ़ करें",
    howToUse: "कैसे उपयोग करें",
    nextSteps: "अगले कदम",
    result: "परिणाम",
    openPortal: "आधिकारिक पोर्टल खोलें",
    plainBrief: "सादी भाषा में सार",
    whatNext: "आगे क्या करें",
    keepNearby: "पास रखें",
  },
  mr: {
    ...en,
    eyebrow: "सरकारी सूचना सहाय्यक",
    tagline:
      "वीज बिल, कर सूचना, चलन किंवा पेमेंट पावती समजत नाही? दस्तऐवज इथे आणा. आम्ही सोप्या भाषेत समजावून सांगू आणि तपासलेले अधिकृत पोर्टल दाखवू—तुम्ही स्वतः तिथे कारवाई करा.",
    stepAttachTitle: "जोडा किंवा पेस्ट करा",
    stepAttachBody: "PDF, मजकूर किंवा फोटो (या उपकरणावर वाचले जाईल).",
    stepAnalyzeTitle: "विश्लेषण",
    stepAnalyzeBody: "रक्कम, तारीख आणि अर्थ पहा.",
    stepPortalTitle: "अधिकृत साइट उघडा",
    stepPortalBody: "आम्ही पेमेंट, लॉगिन किंवा सबमिट करत नाही.",
    siteLanguage: "साइट भाषा",
    explainLanguage: "सूचना समजावा",
    siteLanguageHint: "बटणे आणि लेबल्स",
    explainLanguageHint: "फक्त सोप्या भाषेतील सार",
    yourNotice: "तुमची सूचना",
    noticeHint: "फाईल जोडा किंवा मजकूर पेस्ट करा. या उपकरणावर राहते.",
    analyze: "विश्लेषण करा",
    attach: "PDF, मजकूर किंवा फोटो जोडा",
    clearNotice: "साफ करा",
    howToUse: "कसे वापरावे",
    nextSteps: "पुढील पावले",
    result: "निकाल",
    openPortal: "अधिकृत पोर्टल उघडा",
    plainBrief: "सोप्या भाषेतील सार",
    whatNext: "पुढे काय करावे",
    keepNearby: "जवळ ठेवा",
  },
  ta: {
    ...en,
    eyebrow: "அரசு அறிவிப்பு உதவி",
    tagline:
      "மின்சார பில்கள், வரி அறிவிப்புகள், சலான்கள் புரியவில்லையா? ஆவணத்தை இங்கே கொண்டு வாருங்கள். எளிய மொழியில் விளக்கி, சரிபார்க்கப்பட்ட அதிகாரப்பூர்வ தளத்தை காட்டுவோம்—நீங்களே அங்கு செயல்படுங்கள்.",
    siteLanguage: "தள மொழி",
    explainLanguage: "அறிவிப்பை விளக்கு",
    yourNotice: "உங்கள் அறிவிப்பு",
    analyze: "பகுப்பாய்வு",
    attach: "PDF, உரை அல்லது புகைப்படம் இணைக்க",
    howToUse: "எப்படி பயன்படுத்துவது",
    nextSteps: "அடுத்த படிகள்",
    plainBrief: "எளிய மொழி சுருக்கம்",
  },
  kn: {
    ...en,
    eyebrow: "ಸರ್ಕಾರಿ ಸೂಚನೆ ಸಹಾಯ",
    tagline:
      "ವಿದ್ಯುತ್ ಬಿಲ್, ತೆರಿಗೆ ಸೂಚನೆ ಅಥವಾ ಚಲಾನ್ ಅರ್ಥವಾಗುತ್ತಿಲ್ಲವೇ? ದಾಖಲೆಯನ್ನು ಇಲ್ಲಿಗೆ ತನ್ನಿ. ಸರಳ ಭಾಷೆಯಲ್ಲಿ ವಿವರಿಸಿ, ಪರಿಶೀಲಿಸಿದ ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ತೋರಿಸುತ್ತೇವೆ—ನೀವೇ ಅಲ್ಲಿ ಕಾರ್ಯಮಾಡಿ.",
    siteLanguage: "ತಾಣ ಭಾಷೆ",
    explainLanguage: "ಸೂಚನೆಯನ್ನು ವಿವರಿಸಿ",
    yourNotice: "ನಿಮ್ಮ ಸೂಚನೆ",
    analyze: "ವಿಶ್ಲೇಷಿಸಿ",
    attach: "PDF, ಪಠ್ಯ ಅಥವಾ ಫೋಟೋ ಲಗತ್ತಿಸಿ",
    howToUse: "ಹೇಗೆ ಬಳಸುವುದು",
    nextSteps: "ಮುಂದಿನ ಹಂತಗಳು",
    plainBrief: "ಸರಳ ಭಾಷೆಯ ಸಾರಾಂಶ",
  },
  gu: {
    ...en,
    eyebrow: "સરકારી સૂચના સહાયક",
    tagline:
      "વીજ બિલ, કર સૂચના કે ચલણ સમજાતું નથી? દસ્તાવેજ અહીં લાવો. અમે સાદી ભાષામાં સમજાવીશું અને ચકાસેલ અધિકૃત પોર્ટલ બતાવીશું—તમે પોતે ત્યાં કાર્યવાહી કરો.",
    siteLanguage: "સાઇટ ભાષા",
    explainLanguage: "સૂચના સમજાવો",
    yourNotice: "તમારી સૂચના",
    analyze: "વિશ્લેષણ",
    attach: "PDF, લખાણ અથવા ફોટો જોડો",
    howToUse: "કેવી રીતે વાપરવું",
    nextSteps: "આગળના પગલાં",
    plainBrief: "સાદી ભાષાનો સાર",
  },
  te: {
    ...en,
    eyebrow: "ప్రభుత్వ నోటీసు సహాయం",
    tagline:
      "విద్యుత్ బిల్లు, పన్ను నోటీసు లేదా చలాన్ అర్థం కావడం లేదా? పత్రాన్ని ఇక్కడికి తీసుకురండి. సాధారణ భాషలో వివరిస్తాం, సమీక్షించిన అధికారిక పోర్టల్ చూపిస్తాం—మీరే అక్కడ చర్య తీసుకోండి.",
    siteLanguage: "సైట్ భాష",
    explainLanguage: "నోటీసును వివరించు",
    yourNotice: "మీ నోటీసు",
    analyze: "విశ్లేషించు",
    attach: "PDF, టెక్స్ట్ లేదా ఫోటో జోడించు",
    howToUse: "ఎలా ఉపయోగించాలి",
    nextSteps: "తదుపరి అడుగులు",
    plainBrief: "సాధారణ భాష సారాంశం",
  },
  bn: {
    ...en,
    eyebrow: "সরকারি নোটিশ সহায়ক",
    tagline:
      "বিদ্যুৎ বিল, কর নোটিশ বা চালান বুঝতে পারছেন না? নথি এখানে আনুন। আমরা সহজ ভাষায় ব্যাখ্যা করব এবং যাচাই করা সরকারি পোর্টাল দেখাব—আপনি নিজে সেখানে কাজ করবেন।",
    siteLanguage: "সাইটের ভাষা",
    explainLanguage: "নোটিশ ব্যাখ্যা করুন",
    yourNotice: "আপনার নোটিশ",
    analyze: "বিশ্লেষণ",
    attach: "PDF, লেখা বা ছবি যোগ করুন",
    howToUse: "কীভাবে ব্যবহার করবেন",
    nextSteps: "পরবর্তী ধাপ",
    plainBrief: "সহজ ভাষার সার",
  },
};

export function siteCopy(language: Language): SiteCopy {
  return SITE_COPY[language] ?? SITE_COPY.en;
}
