import type { DocumentAnalysis, Language } from "@/lib/types";

export function draftCitizenLetter(
  currentCase: DocumentAnalysis,
  language: Language,
  tone: "formal" | "simple",
): string {
  void tone;
  const opening = letterOpening(language);
  const body =
    currentCase.documentType === "payment_receipt"
      ? paidLetterBody(currentCase, language)
      : unpaidLetterBody(currentCase, language);
  const closing = letterClosing(language);
  return `${opening}\n\n${body}\n\n${closing}`;
}

function letterOpening(language: Language): string {
  switch (language) {
    case "hi":
      return "सेवा में,\nसंबंधित अधिकारी,";
    case "mr":
      return "प्रति,\nसंबंधित अधिकारी,";
    case "ta":
      return "பெறுநர்,\nதொடர்புடைய அதிகாரி,";
    case "kn":
      return "ಗೆ,\nಸಂಬಂಧಿತ ಅಧಿಕಾರಿ,";
    case "gu":
      return "પ્રતિ,\nસંબંધિત અધિકારી,";
    case "te":
      return "కు,\nసంబంధిత అధికారి,";
    case "bn":
      return "প্রতি,\nসম্পর্কিত কর্মকর্তা,";
    case "en":
      return "To,\nThe concerned officer,";
    default: {
      const _exhaustive: never = language;
      return _exhaustive;
    }
  }
}

function paidLetterBody(currentCase: DocumentAnalysis, language: Language): string {
  const ref = currentCase.referenceNumber;
  const date = currentCase.deadlineDate ?? "—";
  const amount = currentCase.amountDue ?? "—";
  switch (language) {
    case "en":
      return `This is a payment receipt for transaction/receipt ${ref} (date ${date}, amount ${amount}). Please note it on record; do not charge again.`;
    case "hi":
      return `मेरे लेनदेन/रसीद संख्या ${ref} की यह भुगतान रसीद है (तिथि ${date}, राशि ${amount})। कृपया दर्ज करें; दोबारा शुल्क न लें।`;
    case "mr":
      return `माझ्या व्यवहार/पावती क्रमांक ${ref} बाबत ही पेमेंट पावती आहे (तारीख ${date}, रक्कम ${amount}). कृपया नोंद घ्या; पुन्हा शुल्क आकारू नये.`;
    case "ta":
      return `என் பரிவர்த்தனை/ரசீது எண் ${ref} தொடர்பான கட்டண ரசீது இது (தேதி ${date}, தொகை ${amount}). பதிவு செய்யுங்கள்; மீண்டும் கட்டணம் வசூலிக்க வேண்டாம்.`;
    case "kn":
      return `ನನ್ನ ವಹಿವಾಟು/ರಸೀದಿ ಸಂಖ್ಯೆ ${ref} ಗೆ ಸಂಬಂಧಿಸಿದ ಪಾವತಿ ರಸೀದಿ ಇದು (ದಿನಾಂಕ ${date}, ಮೊತ್ತ ${amount}). ದಯವಿಟ್ಟು ದಾಖಲಿಸಿ; ಮತ್ತೆ ಶುಲ್ಕ ವಿಧಿಸಬೇಡಿ.`;
    case "gu":
      return `મારા વ્યવહાર/રસીદ નંબર ${ref} ની આ ચુકવણી રસીદ છે (તારીખ ${date}, રકમ ${amount}). કૃપા કરીને નોંધો; ફરી શુલ્ક ન લો.`;
    case "te":
      return `నా లావాదేవీ/రసీదు నంబర్ ${ref} కు సంబంధించిన చెల్లింపు రసీదు ఇది (తేదీ ${date}, మొత్తం ${amount}). దయచేసి నమోదు చేయండి; మళ్లీ రుసుము వసూలు చేయవద్దు.`;
    case "bn":
      return `আমার লেনদেন/রসিদ নম্বর ${ref}-এর এই পেমেন্ট রসিদ (তারিখ ${date}, পরিমাণ ${amount})। অনুগ্রহ করে নথিভুক্ত করুন; আবার চার্জ নেবেন না।`;
    default: {
      const _exhaustive: never = language;
      return _exhaustive;
    }
  }
}

function unpaidLetterBody(currentCase: DocumentAnalysis, language: Language): string {
  const ref = currentCase.referenceNumber;
  const date = currentCase.deadlineDate ?? "—";
  switch (language) {
    case "en":
      return `Please provide guidance regarding reference ${ref}. The deadline is ${date}.`;
    case "hi":
      return `संदर्भ संख्या ${ref} के संबंध में कृपया मार्गदर्शन करें। अंतिम तिथि ${date} है।`;
    case "mr":
      return `माझ्या संदर्भ क्रमांक ${ref} बाबत कृपया मार्गदर्शन करावे. अंतिम तारीख ${date} आहे.`;
    case "ta":
      return `குறிப்பு எண் ${ref} குறித்து வழிகாட்டல் அளிக்குமாறு கேட்டுக்கொள்கிறேன். கடைசி தேதி ${date}.`;
    case "kn":
      return `ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ ${ref} ಬಗ್ಗೆ ದಯವಿಟ್ಟು ಮಾರ್ಗದರ್ಶನ ನೀಡಿ. ಕೊನೆಯ ದಿನಾಂಕ ${date}.`;
    case "gu":
      return `સંદર્ભ નંબર ${ref} અંગે કૃપા કરીને માર્ગદર્શન આપો. અંતિમ તારીખ ${date} છે.`;
    case "te":
      return `సూచన సంఖ్య ${ref} గురించి దయచేసి మార్గదర్శకత్వం ఇవ్వండి. గడువు ${date}.`;
    case "bn":
      return `রেফারেন্স নম্বর ${ref} সম্পর্কে অনুগ্রহ করে নির্দেশনা দিন। শেষ তারিখ ${date}।`;
    default: {
      const _exhaustive: never = language;
      return _exhaustive;
    }
  }
}

function letterClosing(language: Language): string {
  switch (language) {
    case "hi":
      return "सादर,\n[आपका नाम]\n\nस्वचालित रूप से न भेजें। समीक्षा कर आधिकारिक माध्यम से स्वयं जमा करें।";
    case "mr":
      return "धन्यवाद,\n[तुमचे नाव]\n\nस्वयंचलितपणे पाठवू नका. तपासून अधिकृत मार्गाने स्वतः सादर करा.";
    case "ta":
      return "நன்றி,\n[உங்கள் பெயர்]\n\nதானாக அனுப்ப வேண்டாம். சரிபார்த்து அதிகாரப்பூர்வ வழியில் நீங்களே சமர்ப்பிக்கவும்.";
    case "kn":
      return "ವಂದನೆಗಳು,\n[ನಿಮ್ಮ ಹೆಸರು]\n\nಸ್ವಯಂಚಾಲಿತವಾಗಿ ಕಳುಹಿಸಬೇಡಿ. ಪರಿಶೀಲಿಸಿ ಅಧಿಕೃತ ಮಾರ್ಗದಲ್ಲಿ ನೀವೇ ಸಲ್ಲಿಸಿ.";
    case "gu":
      return "આભાર,\n[તમારું નામ]\n\nઆપમેળે મોકલશો નહીં. સમીક્ષા કરી અધિકૃત માર્ગે પોતે સબમિટ કરો.";
    case "te":
      return "ధన్యవాదాలు,\n[మీ పేరు]\n\nఆటోమేటిక్‌గా పంపవద్దు. సమీక్షించి అధికారిక మార్గంలో మీరే సమర్పించండి.";
    case "bn":
      return "শুভেচ্ছা,\n[আপনার নাম]\n\nস্বয়ংক্রিয়ভাবে পাঠাবেন না। পর্যালোচনা করে সরকারি মাধ্যমে নিজে জমা দিন।";
    case "en":
      return "Regards,\n[Your name]\n\nDo not send automatically. Review and submit through the official channel yourself.";
    default: {
      const _exhaustive: never = language;
      return _exhaustive;
    }
  }
}
