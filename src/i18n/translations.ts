import { SupportedLanguage } from '../types/compliance';

export interface Translations {
  portalTitle: string;
  portalSubtitle: string;
  lodgeGrievanceBtn: string;
  filterByStatus: string;
  searchPlaceholder: string;
  allStatuses: string;
  needsReviewCount: string;
  investigationCount: string;
  resolvedCount: string;
  selectLanguage: string;
  languageName: string;

  // Directory Page
  searchDirectoryPlaceholder: string;
  displayingRecords: string;
  allCategories: string;
  allDietary: string;
  mrpInclTaxes: string;
  netQtyUsp: string;
  ingredientsDecl: string;
  statutoryDetails: string;
  fileGrievance: string;

  // Metrics Bar
  metricsTotalRegistered: string;
  metricsTotalSub: string;
  metricsUnderReview: string;
  metricsReviewSub: string;
  metricsActiveNotice: string;
  metricsNoticeSub: string;
  metricsResolved: string;
  metricsResolvedSub: string;

  // Modal / Form Translations
  newGrievanceTitle: string;
  newGrievanceSubtitle: string;
  consumerDetailsHeader: string;
  consumerNameLabel: string;
  emailLabel: string;
  phoneLabel: string;
  productDetailsHeader: string;
  productNameLabel: string;
  brandLabel: string;
  platformLabel: string;
  productUrlLabel: string;
  orderNumberLabel: string;
  descriptionHeader: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  transliterationHelp: string;
  transliterateBtn: string;
  transliteratingBtn: string;
  keyboardTip: string;
  evidenceHeader: string;
  evidenceUploadInstructions: string;
  dropImagesHere: string;
  selectFiles: string;
  submitComplaintBtn: string;
  submittingBtn: string;
  cancelBtn: string;

  // Verdict / Status Explanations
  statusNew: string;
  statusNeedsReview: string;
  statusTriaged: string;
  statusInvestigation: string;
  statusNoticeDispatched: string;
  statusAssignedForInspection: string;
  statusMoreInfoRequested: string;
  statusInsufficientEvidence: string;
  statusRejected: string;
  statusResolved: string;
  consumerVerdictPotentialIssue: string;
  consumerVerdictSubmitted: string;
  consumerVerdictUnderReview: string;
  consumerVerdictNoticeSent: string;
  consumerVerdictResolved: string;

  // Officer Dossier Modal Translations
  dossierTitle: string;
  originalLanguageLabel: string;
  originalTextLabel: string;
  tabCorrelation: string;
  tabEvidence: string;
  tabRag: string;
  tabAudit: string;
  officerNotice: string;

  // Login Page Translations
  loginSubtitle: string;
  publicHome: string;
  publicCatalog: string;
  consumerTab: string;
  consumerTabSub: string;
  inspectorTab: string;
  inspectorTabSub: string;
  adminTab: string;
  adminTabSub: string;
  authGatewayTitle: string;
  consumerPortalName: string;
  consumerPortalTagline: string;
  inspectorPortalName: string;
  inspectorPortalTagline: string;
  adminPortalName: string;
  adminPortalTagline: string;
  emailLabelSimple: string;
  passwordLabelSimple: string;
  enterConsumerBtn: string;
  enterInspectorBtn: string;
  enterAdminBtn: string;
}

export const TRANSLATIONS: Record<SupportedLanguage, Translations> = {
  en: {
    portalTitle: 'Consumer Complaint & Grievance Portal',
    portalSubtitle: 'File statutory packaging compliance grievances, track triage status, view multi-evidence OCR audit, and inspect legal metrology provisions.',
    lodgeGrievanceBtn: 'Lodge New Grievance',
    filterByStatus: 'Filter by Status',
    searchPlaceholder: 'Search complaints by Ticket ID, Consumer Name, Product, or Rule...',
    allStatuses: 'All Statuses',
    needsReviewCount: 'Needs Review',
    investigationCount: 'Active Investigations',
    resolvedCount: 'Resolved Grievances',
    selectLanguage: 'Select Language',
    languageName: 'English',

    searchDirectoryPlaceholder: 'Search Product Name, Brand, or Ingredient (e.g. Whey, Mustard)...',
    displayingRecords: 'Displaying Verified Records',
    allCategories: 'All Categories',
    allDietary: 'All Dietary Types',
    mrpInclTaxes: 'MRP (INCL. TAXES)',
    netQtyUsp: 'NET QTY / USP',
    ingredientsDecl: 'Ingredients Declared:',
    statutoryDetails: 'Statutory Details',
    fileGrievance: 'File Grievance',

    metricsTotalRegistered: 'Total Grievances Registered',
    metricsTotalSub: 'Active in National Registry',
    metricsUnderReview: 'Under Technical Review',
    metricsReviewSub: 'Pending Human Officer Triage',
    metricsActiveNotice: 'Active Notice Issued',
    metricsNoticeSub: 'Notices Issued to Brands',
    metricsResolved: 'Resolved Grievances',
    metricsResolvedSub: 'Resolved / Redressed Cases',

    newGrievanceTitle: 'Submit Statutory Consumer Complaint',
    newGrievanceSubtitle: 'Multi-Evidence Processing, Deterministic Classification & Regulatory RAG Ingestion',
    consumerDetailsHeader: '1. Complainant Contact Information',
    consumerNameLabel: 'Consumer Full Name',
    emailLabel: 'Consumer Email Address',
    phoneLabel: 'Mobile Phone Number',
    productDetailsHeader: '2. Product & Seller Details',
    productNameLabel: 'Product Title',
    brandLabel: 'Brand / Manufacturer Name',
    platformLabel: 'E-Commerce Platform / Store',
    productUrlLabel: 'Product Listing URL (Optional)',
    orderNumberLabel: 'Order / Invoice Number',
    descriptionHeader: '3. Grievance Description & Claim Details',
    descriptionLabel: 'Detailed Description of Packaging / Pricing Discrepancy',
    descriptionPlaceholder: 'Describe the packaging defect in detail (e.g. dual MRP sticker overprinted, missing Unit Sale Price (USP), or missing/smudged manufacturing date).',
    transliterationHelp: 'Type phonetically in English (e.g. "ee packet alli MRP illa") and click Transliterate to convert into native script.',
    transliterateBtn: 'Convert Phonetic (Transliterate)',
    transliteratingBtn: 'Converting...',
    keyboardTip: 'Direct typing in English, Hindi (हिन्दी), Kannada (ಕನ್ನಡ), and Tamil (தமிழ்) is fully supported.',
    evidenceHeader: 'Evidence Images (Packaging, Store Bill, Invoice)',
    evidenceUploadInstructions: 'Upload clear photos of product packaging, statutory declarations, price tag stickers, and store bill invoices.',
    dropImagesHere: 'Drag & drop evidence files here, or',
    selectFiles: 'Browse / Choose Files',
    submitComplaintBtn: 'Submit Complaint for Legal Triage',
    submittingBtn: 'Processing OCR & Building Dossier...',
    cancelBtn: 'Cancel',
    statusNew: 'New',
    statusNeedsReview: 'Needs Review',
    statusTriaged: 'Triaged',
    statusInvestigation: 'Under Investigation',
    statusNoticeDispatched: 'Notice Dispatched',
    statusAssignedForInspection: 'Assigned for Inspection',
    statusMoreInfoRequested: 'More Info Requested',
    statusInsufficientEvidence: 'Insufficient Evidence',
    statusRejected: 'Rejected',
    statusResolved: 'Resolved',
    consumerVerdictPotentialIssue: 'Potential compliance issue identified. Your complaint has been submitted for official review.',
    consumerVerdictSubmitted: 'Your grievance has been logged and assigned for official legal metrology triage.',
    consumerVerdictUnderReview: 'Your case is currently under official officer investigation.',
    consumerVerdictNoticeSent: 'A statutory compliance inquiry notice has been issued to the manufacturer/seller.',
    consumerVerdictResolved: 'Grievance resolved by enforcement authorities.',
    dossierTitle: 'Evidence-Backed Complaint Dossier & Triage Case',
    originalLanguageLabel: 'Submitted Language',
    originalTextLabel: 'Original Consumer Complaint Text',
    tabCorrelation: '4-Way Case Correlation',
    tabEvidence: 'Multi-Evidence OCR Audit',
    tabRag: 'Statutory RAG Mapping',
    tabAudit: 'System Audit Log',
    officerNotice: 'Official Officer Dossier View: Displays exact original consumer text, language code, and statutory cross-checks.',

    // Login Page Translations
    loginSubtitle: 'Central Consumer Protection Authority & Legal Metrology National Verification Grid',
    publicHome: '← Public Home',
    publicCatalog: 'Public Catalog (No Login)',
    consumerTab: 'Consumer',
    consumerTabSub: 'Grievance Only',
    inspectorTab: 'Inspector',
    inspectorTabSub: 'Bengaluru City',
    adminTab: 'Supervisor',
    adminTabSub: 'Supervisory Desk',
    authGatewayTitle: 'Active Authentication Gateway',
    consumerPortalName: 'Consumer Grievance Portal',
    consumerPortalTagline: 'Lodge complaints against deceptive packaging, dual MRP & deceptive units under CPA 2019',
    inspectorPortalName: 'Zonal Inspector Command',
    inspectorPortalTagline: 'Optical verification of field evidence, barcode audit & surprise inspection execution',
    adminPortalName: 'Central Supervisor Portal',
    adminPortalTagline: 'Statutory Show Cause Notice issuance under Section 36 & national compliance ledger',
    emailLabelSimple: 'Email',
    passwordLabelSimple: 'Password',
    enterConsumerBtn: 'Enter Consumer Grievance Portal',
    enterInspectorBtn: 'Enter Inspector Enforcement Gateway',
    enterAdminBtn: 'Enter Central Supervisor Portal',
  },

  hi: {
    portalTitle: 'उपभोक्ता शिकायत पोर्टल (SatyaDrishti)',
    portalSubtitle: 'पैकेजिंग नियमों के उल्लंघन, एमआरपी गड़बड़ी और कम वजन की शिकायतें दर्ज करें एवं ट्रैक करें।',
    lodgeGrievanceBtn: 'नई शिकायत दर्ज करें',
    filterByStatus: 'स्थिति के अनुसार फ़िल्टर करें',
    searchPlaceholder: 'टिकट आईडी, उपभोक्ता नाम, उत्पाद या नियम द्वारा खोजें...',
    allStatuses: 'सभी स्थितियाँ',
    needsReviewCount: 'समीक्षा आवश्यक',
    investigationCount: 'सक्रिय जांच',
    resolvedCount: 'समाधान की गई शिकायतें',
    selectLanguage: 'भाषा चुनें',
    languageName: 'हिन्दी',

    searchDirectoryPlaceholder: 'उत्पाद का नाम, ब्रांड, या सामग्री (जैसे व्हे, सरसों) खोजें...',
    displayingRecords: 'सत्यापित रिकॉर्ड प्रदर्शित',
    allCategories: 'सभी श्रेणियां',
    allDietary: 'सभी आहार प्रकार',
    mrpInclTaxes: 'MRP (कर सहित)',
    netQtyUsp: 'शुद्ध मात्रा / प्रति इकाई मूल्य',
    ingredientsDecl: 'सामग्री विवरण:',
    statutoryDetails: 'वैधानिक विवरण',
    fileGrievance: 'शिकायत दर्ज करें',

    metricsTotalRegistered: 'कुल दर्ज शिकायतें',
    metricsTotalSub: 'राष्ट्रीय रजिस्टर में सक्रिय',
    metricsUnderReview: 'तकनीकी समीक्षा के अधीन',
    metricsReviewSub: 'अधिकारी समीक्षा का इंतजार',
    metricsActiveNotice: 'सक्रिय नोटिस जारी',
    metricsNoticeSub: 'ब्रांड्स को जारी नोटिस',
    metricsResolved: 'समाधान की गई शिकायतें',
    metricsResolvedSub: 'निपटारा की गई शिकायतें',

    newGrievanceTitle: 'वैधानिक उपभोक्ता शिकायत जमा करें',
    newGrievanceSubtitle: 'बहु-साक्ष्य प्रसंस्करण, नियतात्मक वर्गीकरण और वैधानिक नियम मैपिंग',
    consumerDetailsHeader: '1. शिकायतकर्ता का संपर्क विवरण',
    consumerNameLabel: 'उपभोक्ता का पूरा नाम',
    emailLabel: 'उपभोक्ता ईमेल पता',
    phoneLabel: 'मोबाइल फोन नंबर',
    productDetailsHeader: '2. उत्पाद और विक्रेता विवरण',
    productNameLabel: 'उत्पाद का नाम',
    brandLabel: 'ब्रांड / निर्माता का नाम',
    platformLabel: 'ई-कॉमर्स प्लेटफॉर्म / दुकान',
    productUrlLabel: 'उत्पाद लिंक (वैकल्पिक)',
    orderNumberLabel: 'ऑर्डर / बिल नंबर',
    descriptionHeader: '3. शिकायत का विस्तृत विवरण',
    descriptionLabel: 'पैकेजिंग या मूल्य विसंगति का विवरण',
    descriptionPlaceholder: 'विस्तार से लिखें कि क्या समस्या है (जैसे: पैकेट पर दोहरा MRP स्टीकर चिपकाया गया है, प्रति इकाई मूल्य (USP) नहीं लिखा है, या निर्माण तिथि गायब है)।',
    transliterationHelp: 'अंग्रेजी अक्षरों में टाइप करें (जैसे "is packet par MRP nahi hai") और देवनागरी में बदलने के लिए लिप्यंतरण बटन दबाएं।',
    transliterateBtn: 'देवनागरी में बदलें (Transliterate)',
    transliteratingBtn: 'बदला जा रहा है...',
    keyboardTip: 'आप सीधे हिन्दी, अंग्रेजी, कन्नड़ या तमिल कीबोर्ड से टाइप कर सकते हैं।',
    evidenceHeader: 'साक्ष्य तस्वीरें (पैकेजिंग, दुकान बिल, रसीद)',
    evidenceUploadInstructions: 'उत्पाद पैकेजिंग, एमआरपी लेबल स्टिकर, और दुकान के बिल की स्पष्ट तस्वीरें अपलोड करें।',
    dropImagesHere: 'तस्वीरें यहाँ खींचकर लाएँ, या',
    selectFiles: 'फ़ाइलें चुनें',
    submitComplaintBtn: 'कानूनी समीक्षा हेतु शिकायत जमा करें',
    submittingBtn: 'साक्ष्य प्रोसेसिंग और ओसीआर चालू है...',
    cancelBtn: 'रद्द करें',
    statusNew: 'नया',
    statusNeedsReview: 'समीक्षा आवश्यक',
    statusTriaged: 'वर्गीकृत',
    statusInvestigation: 'जांच के अधीन',
    statusNoticeDispatched: 'नोटिस जारी',
    statusAssignedForInspection: 'निरीक्षण हेतु सौंपा गया',
    statusMoreInfoRequested: 'अतिरिक्त जानकारी मांगी गई',
    statusInsufficientEvidence: 'अपर्याप्त साक्ष्य',
    statusRejected: 'अस्वीकृत',
    statusResolved: 'समाधान हो गया',
    consumerVerdictPotentialIssue: 'संभावित पैकेजिंग विसंगति की पहचान की गई है। आपकी शिकायत आधिकारिक समीक्षा के लिए जमा कर ली गई है।',
    consumerVerdictSubmitted: 'आपकी शिकायत दर्ज कर ली गई है और कानूनी माप विज्ञान अधिकारियों को भेज दी गई है।',
    consumerVerdictUnderReview: 'आपका मामला वर्तमान में अधिकारी जांच के अधीन है।',
    consumerVerdictNoticeSent: 'निर्माता/विक्रेता को कानूनी अनुपालन नोटिस जारी किया गया है।',
    consumerVerdictResolved: 'प्रवर्तन अधिकारियों द्वारा शिकायत का निवारण कर दिया गया है।',
    dossierTitle: 'शिकायत का प्रमाण-आधारित मामला और विवरण',
    originalLanguageLabel: 'शिकायत की भाषा',
    originalTextLabel: 'उपभोक्ता का मूल शिकायत विवरण',
    tabCorrelation: 'मामला सहसंबंध',
    tabEvidence: 'ओसीआर साक्ष्य ऑडिट',
    tabRag: 'वैधानिक नियम मैपिंग',
    tabAudit: 'सिस्टम ऑडिट लॉग',
    officerNotice: 'अधिकारी केस अवलोकन: उपभोक्ता द्वारा लिखा गया मूल विवरण और भाषा कोड प्रदर्शित करता है।',

    // Login Page Translations
    loginSubtitle: 'केंद्रीय उपभोक्ता संरक्षण प्राधिकरण एवं विधिक मापविज्ञान राष्ट्रीय सत्यापन ग्रिड',
    publicHome: '← मुख्य पृष्ठ',
    publicCatalog: 'सार्वजनिक कैटलॉग (बिना लॉगिन)',
    consumerTab: 'उपभोक्ता',
    consumerTabSub: 'केवल शिकायत',
    inspectorTab: 'निरीक्षक',
    inspectorTabSub: 'बेंगलुरु सिटी',
    adminTab: 'CCPA एडमिन',
    adminTabSub: 'निदेशालय',
    authGatewayTitle: 'सक्रिय प्रमाणीकरण गेटवे',
    consumerPortalName: 'उपभोक्ता शिकायत निवारण पोर्टल',
    consumerPortalTagline: 'भ्रामक पैकेजिंग, दोहरे एमआरपी और भ्रामक इकाइयों के खिलाफ शिकायत दर्ज करें',
    inspectorPortalName: 'क्षेत्रीय निरीक्षक कमान',
    inspectorPortalTagline: 'क्षेत्रीय साक्ष्य का सत्यापन, बारकोड ऑडिट एवं औचक निरीक्षण',
    adminPortalName: 'केंद्रीय निदेशालय एवं प्रवर्तन डेस्क',
    adminPortalTagline: 'धारा 36 के तहत कारण बताओ नोटिस जारी करना और राष्ट्रीय अनुपालन रिकॉर्ड',
    emailLabelSimple: 'ईमेल',
    passwordLabelSimple: 'पासवर्ड',
    enterConsumerBtn: 'उपभोक्ता शिकायत पोर्टल में प्रवेश करें',
    enterInspectorBtn: 'निरीक्षक प्रवर्तन गेटवे में प्रवेश करें',
    enterAdminBtn: 'केंद्रीय CCPA निदेशालय में प्रवेश करें',
  },

  kn: {
    portalTitle: 'ಗ್ರಾಹಕ ದೂರು ಮತ್ತು ಕುಂದುಕೊರತೆ ಪೋರ್ಟಲ್',
    portalSubtitle: 'ಶಾಸನಬದ್ಧ ಪ್ಯಾಕೇಜಿಂಗ್ ನಿಯಮ ಉಲ್ಲಂಘನೆ, MRP ವ್ಯತ್ಯಾಸ ಮತ್ತು ತೂಕದ ಕೊರತೆಯ ದೂರುಗಳನ್ನು ನೋಂದಾಯಿಸಿ ಮತ್ತು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.',
    lodgeGrievanceBtn: 'ಹೊಸ ದೂರು ಸಲ್ಲಿಸಿ',
    filterByStatus: 'ಸ್ಥಿತಿಯ ಆಧಾರದ ಮೇಲೆ ಫಿಲ್ಟರ್ ಮಾಡಿ',
    searchPlaceholder: 'ಟಿಕೆಟ್ ಐಡಿ, ಗ್ರಾಹಕರ ಹೆಸರು, ಉತ್ಪನ್ನ ಅಥವಾ ನಿಯಮದಿಂದ ಹುಡುಕಿ...',
    allStatuses: 'ಎಲ್ಲಾ ಸ್ಥಿತಿಗಳು',
    needsReviewCount: 'ಪರಿಶೀಲನೆ ಅಗತ್ಯವಿದೆ',
    investigationCount: 'ಸಕ್ರಿಯ ತನಿಖೆ',
    resolvedCount: 'ಪರಿಹರಿಸಲಾದ ದೂರುಗಳು',
    selectLanguage: 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    languageName: 'ಕನ್ನಡ',

    searchDirectoryPlaceholder: 'ಉತ್ಪನ್ನದ ಹೆಸರು, ಬ್ರಾಂಡ್, ಅಥವಾ ಘಟಕಾಂಶ ಹುಡುಕಿ...',
    displayingRecords: 'ಪರಿಶೀಲಿಸಿದ ದಾಖಲೆಗಳು ಪ್ರದರ್ಶನದಲ್ಲಿದೆ',
    allCategories: 'ಎಲ್ಲಾ ವರ್ಗಗಳು',
    allDietary: 'ಎಲ್ಲಾ ಆಹಾರ ಪ್ರಕಾರಗಳು',
    mrpInclTaxes: 'MRP (ತೆರಿಗೆ ಸೇರಿ)',
    netQtyUsp: 'ನಿವ್ವಳ ಪ್ರಮಾಣ / ಬೆಲೆ',
    ingredientsDecl: 'ಘಟಕಾಂಶಗಳ ವಿವರಣೆ:',
    statutoryDetails: 'ಶಾಸನಬದ್ಧ ವಿವರಗಳು',
    fileGrievance: 'ದೂರು ಸಲ್ಲಿಸಿ',

    metricsTotalRegistered: 'ಒಟ್ಟು ನೋಂದಾಯಿತ ದೂರುಗಳು',
    metricsTotalSub: 'ರಾಷ್ಟ್ರೀಯ ನೋಂದಣಿಯಲ್ಲಿ ಸಕ್ರಿಯವಾಗಿದೆ',
    metricsUnderReview: 'ತಾಂತ್ರಿಕ ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ',
    metricsReviewSub: 'ಅಧಿಕಾರಿ ಪರಿಶೀಲನೆಗೆ ಬಾಕಿ ಇದೆ',
    metricsActiveNotice: 'ಸಕ್ರಿಯ ನೋಟಿಸ್ ಜಾರಿ',
    metricsNoticeSub: 'ಬ್ರಾಂಡ್‌ಗಳಿಗೆ ನೋಟಿಸ್ ನೀಡಲಾಗಿದೆ',
    metricsResolved: 'ಪರಿಹರಿಸಲಾದ ದೂರುಗಳು',
    metricsResolvedSub: 'ಪರಿಹರಿಸಲಾದ ಪ್ರಕರಣಗಳು',

    newGrievanceTitle: 'ಗ್ರಾಹಕ ಶಾಸನಬದ್ಧ ದೂರನ್ನು ಸಲ್ಲಿಸಿ',
    newGrievanceSubtitle: 'ಬಹು-ಸಾಕ್ಷ್ಯ ಪ್ರಕ್ರಿಯೆ, ನಿಯಮ ಆಧಾರಿತ ವರ್ಗೀಕರಣ ಮತ್ತು ಶಾಸನಬದ್ಧ ನಿಯಮ ಮ್ಯಾಪಿಂಗ್',
    consumerDetailsHeader: '1. ದೂರುದಾರರ ಸಂಪರ್ಕ ವಿವರಗಳು',
    consumerNameLabel: 'ಗ್ರಾಹಕರ ಪೂರ್ಣ ಹೆಸರು',
    emailLabel: 'ಗ್ರಾಹಕರ ಇಮೇಲ್ ವಿಳಾಸ',
    phoneLabel: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ',
    productDetailsHeader: '2. ಉತ್ಪನ್ನ ಮತ್ತು ಮಾರಾಟಗಾರರ ವಿವರಗಳು',
    productNameLabel: 'ಉತ್ಪನ್ನದ ಹೆಸರು',
    brandLabel: 'ಬ್ರಾಂಡ್ / ತಯಾರಕರ ಹೆಸರು',
    platformLabel: 'ಇ-ಕಾಮರ್ಸ್ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ / ಅಂಗಡಿ',
    productUrlLabel: 'ಉತ್ಪನ್ನದ ಲಿಂಕ್ (ಐಚ್ಛಿಕ)',
    orderNumberLabel: 'ಆರ್ಡರ್ / ಬಿಲ್ ಸಂಖ್ಯೆ',
    descriptionHeader: '3. ದೂರಿನ ವಿವರಣೆ ಮತ್ತು ಹಕ್ಕುಗಳ ವಿವರಗಳು',
    descriptionLabel: 'ವಿವರವಾದ ದೂರಿನ ವಿವರಣೆ',
    descriptionPlaceholder: 'ಏನು ಸಮಸ್ಯೆಯಾಗಿದೆ ಎಂದು ವಿವರವಾಗಿ ಬರೆಯಿರಿ (ಉದಾ: ಪ್ಯಾಕೆಟ್‌ನಲ್ಲಿ MRP ₹1999 ಇದೆ ಆದರೆ ಅಂಗಡಿಯವರು ₹2499 ಬಿಲ್ ಮಾಡಿದ್ದಾರೆ, ಅಥವಾ ತೂಕ ಕಡಿಮೆಯಿದೆ).',
    transliterationHelp: 'ಇಂಗ್ಲಿಷ್ ಅಕ್ಷರಗಳಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ (ಉದಾ "ee packet alli MRP illa") ಮತ್ತು ಕನ್ನಡಕ್ಕೆ ಪರಿವರ್ತಿಸಲು "ಲಿಪ್ಯಂತರ" ಬಟನ್ ಒತ್ತಿ.',
    transliterateBtn: 'ಕನ್ನಡಕ್ಕೆ ಪರಿವರ್ತಿಸಿ (Transliterate)',
    transliteratingBtn: 'ಪರಿವರ್ತಿಸಲಾಗುತ್ತಿದೆ...',
    keyboardTip: 'ಕನ್ನಡ, ಇಂಗ್ಲಿಷ್, ಹಿಂದಿ ಅಥವಾ ತಮಿಳು ಕೀಬೋರ್ಡ್ ಬಳಸಿ ನೇರವಾಗಿ ಟೈಪ್ ಮಾಡಬಹುದು.',
    evidenceHeader: 'ಸಾಕ್ಷ್ಯದ ಚಿತ್ರಗಳು (ಪ್ಯಾಕೇಜಿಂಗ್, ಅಂಗಡಿ ಬಿಲ್, ರಸೀದಿ)',
    evidenceUploadInstructions: 'ಉತ್ಪನ್ನದ ಪ್ಯಾಕೇಜಿಂಗ್, MRP ಲೇಬಲ್ ಸ್ಟಿಕ್ಕರ್ ಮತ್ತು ಅಂಗಡಿಯ ಬಿಲ್‌ನ ಸ್ಪಷ್ಟ ಫೋಟೋಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.',
    dropImagesHere: 'ಚಿತ್ರಗಳನ್ನು ಇಲ್ಲಿ ಎಳೆಯಿರಿ, ಅಥವಾ',
    selectFiles: 'ಫೈಲ್‌ಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    submitComplaintBtn: 'ದೂರನ್ನು ಸಲ್ಲಿಸಿ',
    submittingBtn: 'ಸಾಕ್ಷ್ಯ ಪ್ರಕ್ರಿಯೆ ಮತ್ತು ಒಸಿಆರ್ ಚಾಲನೆಯಲ್ಲಿದೆ...',
    cancelBtn: 'ರದ್ದುಗೊಳಿಸಿ',
    statusNew: 'ಹೊಸದು',
    statusNeedsReview: 'ಪರಿಶೀಲನೆ ಅಗತ್ಯವಿದೆ',
    statusTriaged: 'ವರ್ಗೀಕರಿಸಲಾಗಿದೆ',
    statusInvestigation: 'ತನಿಖೆಯಲ್ಲಿದೆ',
    statusNoticeDispatched: 'ನೋಟಿಸ್ ಕಳುಹಿಸಲಾಗಿದೆ',
    statusAssignedForInspection: 'ಪರಿಶೀಲನೆಗೆ ನಿಯೋಜಿಸಲಾಗಿದೆ',
    statusMoreInfoRequested: 'ಹೆಚ್ಚಿನ ಮಾಹಿತಿ ಕೋರಲಾಗಿದೆ',
    statusInsufficientEvidence: 'ಅಪೂರ್ಣ ಸಾಕ್ಷ್ಯ',
    statusRejected: 'ನಿರಾಕರಿಸಲಾಗಿದೆ',
    statusResolved: 'ಪರಿಹರಿಸಲಾಗಿದೆ',
    consumerVerdictPotentialIssue: 'ಸಂಭಾವ್ಯ ಪ್ಯಾಕೇಜಿಂಗ್ ವ್ಯತ್ಯಾಸವನ್ನು ಗುರುತಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ದೂರನ್ನು ಅಧಿಕೃತ ಪರಿಶೀಲನೆಗೆ ಸಲ್ಲಿಸಲಾಗಿದೆ.',
    consumerVerdictSubmitted: 'ನಿಮ್ಮ ದೂರನ್ನು ದಾಖಲಿಸಿಕೊಳ್ಳಲಾಗಿದೆ ಮತ್ತು ಕಾನೂನು ಮಾಪನಶಾಸ್ತ್ರ ಅಧಿಕಾರಿಗಳ ಪರಿಶೀಲನೆಗೆ ಕಳುಹಿಸಲಾಗಿದೆ.',
    consumerVerdictUnderReview: 'ನಿಮ್ಮ ಪ್ರಕರಣ ಪ್ರಸ್ತುತ ಅಧಿಕೃತ ತನಿಖೆಯಲ್ಲಿದೆ.',
    consumerVerdictNoticeSent: 'ತಯಾರಕರು/ಮಾರಾಟಗಾರರಿಗೆ ಶಾಸನಬದ್ಧ ನೋಟಿಸ್ ಜಾರಿಗೊಳಿಸಲಾಗಿದೆ.',
    consumerVerdictResolved: 'ಅಧಿಕಾರಿಗಳಿಂದ ದೂರಿಗೆ ಸೂಕ್ತ ಪರಿಹಾರ ಒದಗಿಸಲಾಗಿದೆ.',
    dossierTitle: 'ಸಾಕ್ಷ್ಯ ಆಧಾರಿತ ದೂರು ಡಾಸಿಯರ್ ಮತ್ತು ಪರಿಶೀಲನೆ',
    originalLanguageLabel: 'ಸಲ್ಲಿಸಿದ ಭಾಷೆ',
    originalTextLabel: 'ಗ್ರಾಹಕರ ಮೂಲ ದೂರಿನ ವಿವರಣೆ',
    tabCorrelation: 'ಪ್ರಕರಣದ ಸಂಯೋಜನೆ',
    tabEvidence: 'ಒಸಿಆರ್ ಸಾಕ್ಷ್ಯ ಪರಿಶೀಲನೆ',
    tabRag: 'ಶಾಸನಬದ್ಧ ನಿಯಮ ಮ್ಯಾಪಿಂಗ್',
    tabAudit: 'ಸಿಸ್ಟಮ್ ಆಡಿಟ್ ಲಾಗ್',
    officerNotice: 'ಅಧಿಕೃತ ಅಧಿಕಾರಿ ಡಾಸಿಯರ್ ನೋಟ: ಗ್ರಾಹಕರು ಬರೆದ ಮೂಲ ವಿವರಣೆ ಮತ್ತು ಭಾಷಾ ಕೋಡ್ ಅನ್ನು ತೋರಿಸುತ್ತದೆ.',

    // Login Page Translations
    loginSubtitle: 'ಕೇಂದ್ರ ಗ್ರಾಹಕ ಸಂರಕ್ಷಣಾ ಪ್ರಾಧಿಕಾರ ಮತ್ತು ಕಾನೂನು ಮಾಪನಶಾಸ್ತ್ರ ರಾಷ್ಟ್ರೀಯ ಪರಿಶೀಲನಾ ಜಾಲ',
    publicHome: '← ಮುಖಪುಟ',
    publicCatalog: 'ಸಾರ್ವಜನಿಕ ಕ್ಯಾಟಲಾಗ್ (ಲಾಗಿನ್ ಇಲ್ಲದೆ)',
    consumerTab: 'ಗ್ರಾಹಕ',
    consumerTabSub: 'ದೂರು ಮಾತ್ರ',
    inspectorTab: 'ಇನ್ಸ್‌ಪೆಕ್ಟರ್',
    inspectorTabSub: 'ಬೆಂಗಳೂರು ನಗರ',
    adminTab: 'CCPA ನಿರ್ವಾಹಕ',
    adminTabSub: 'ನಿರ್ದೇಶನಾಲಯ',
    authGatewayTitle: 'ಸಕ್ರಿಯ ದೃಢೀಕರಣ ಗೇಟ್‌ವೇ',
    consumerPortalName: 'ಗ್ರಾಹಕರ ಕುಂದುಕೊರತೆ ಪೋರ್ಟಲ್',
    consumerPortalTagline: 'ತಪ್ಪುದಾರಿಯೆಳೆಯುವ ಪ್ಯಾಕೇಜಿಂಗ್ ಮತ್ತು MRP ವ್ಯತ್ಯಾಸದ ವಿರುದ್ಧ ದೂರು ಸಲ್ಲಿಸಿ',
    inspectorPortalName: 'ವಲಯ ಇನ್ಸ್‌ಪೆಕ್ಟರ್ ಕಮಾಂಡ್',
    inspectorPortalTagline: 'ಸಾಕ್ಷ್ಯಗಳ ದೃಢೀಕರಣ, ಬಾರ್‌ಕೋಡ್ ಆಡಿಟ್ ಮತ್ತು ಅನಿರೀಕ್ಷಿತ ತಪಾಸಣೆ',
    adminPortalName: 'ಕೇಂದ್ರ ನಿರ್ದೇಶನಾಲಯ ಮತ್ತು ಜಾರಿ ವಿಭಾಗ',
    adminPortalTagline: 'ಸೆಕ್ಷನ್ 36 ರ ಅಡಿಯಲ್ಲಿ ಕಾರಣ ಕೇಳುವ ನೋಟಿಸ್ ಜಾರಿ ಮತ್ತು ರಾಷ್ಟ್ರೀಯ ದಾಖಲೆಗಳು',
    emailLabelSimple: 'ಇಮೇಲ್',
    passwordLabelSimple: 'ಪಾಸ್‌ವರ್ಡ್',
    enterConsumerBtn: 'ಗ್ರಾಹಕ ದೂರು ಪೋರ್ಟಲ್‌ಗೆ ಪ್ರವೇಶಿಸಿ',
    enterInspectorBtn: 'ಇನ್ಸ್‌ಪೆಕ್ಟರ್ ಗೇಟ್‌ವೇಗೆ ಪ್ರವೇಶಿಸಿ',
    enterAdminBtn: 'ಕೇಂದ್ರ CCPA ನಿರ್ದೇಶನಾಲಯಕ್ಕೆ ಪ್ರವೇಶಿಸಿ',
  },

  ta: {
    portalTitle: 'நுகர்வோர் புகார் மற்றும் குறைதீர்ப்பு தளம்',
    portalSubtitle: 'பேக்கேஜிங் வித மீறல்கள், MRP விலை வேறுபாடு மற்றும் எடை குறைவு புகார்களை பதிவு செய்து கண்காணிக்கவும்.',
    lodgeGrievanceBtn: 'புதிய புகார் அளிக்கவும்',
    filterByStatus: 'நிலைமை அடிப்படையில் வடிகட்டவும்',
    searchPlaceholder: 'டிக்கெட் ஐடி, நுகர்வோர் பெயர், பொருள் அல்லது விதி மூலம் தேடவும்...',
    allStatuses: 'அனைத்து நிலைகளும்',
    needsReviewCount: 'ஆய்வு தேவைப்படுகிறது',
    investigationCount: 'செயலில் உள்ள விசாரணை',
    resolvedCount: 'தீர்வு காணப்பட்ட புகார்கள்',
    selectLanguage: 'மொழியைத் தேர்ந்தெடுக்கவும்',
    languageName: 'தமிழ்',

    searchDirectoryPlaceholder: 'தயாரிப்பு பெயர், பிராண்ட், அல்லது மூலப்பொருளைத் தேடவும்...',
    displayingRecords: 'சரிபார்க்கப்பட்ட பதிவுகள் காட்டப்படுகின்றன',
    allCategories: 'அனைத்து பிரிவுகளும்',
    allDietary: 'அனைத்து உணவு வகைகளும்',
    mrpInclTaxes: 'MRP (வரிகள் உட்பட)',
    netQtyUsp: 'நிகர அளவு / அலகு விலை',
    ingredientsDecl: 'மூலப்பொருட்கள் விவரம்:',
    statutoryDetails: 'சட்ட விவரங்கள்',
    fileGrievance: 'புகார் அளிக்கவும்',

    metricsTotalRegistered: 'மொத்தப் பதிவு செய்யப்பட்ட புகார்கள்',
    metricsTotalSub: 'தேசிய பதிவேட்டில் செயலில் உள்ளது',
    metricsUnderReview: 'தொழில்நுட்ப ஆய்வில் உள்ளது',
    metricsReviewSub: 'அதிகாரி ஆய்வுக்கு நிலுவையில் உள்ளது',
    metricsActiveNotice: 'செயலில் உள்ள அறிவிப்பு அனுப்பப்பட்டது',
    metricsNoticeSub: 'நிறுவனங்களுக்கு அனுப்பப்பட்ட அறிவிப்புகள்',
    metricsResolved: 'தீர்வு காணப்பட்ட புகார்கள்',
    metricsResolvedSub: 'தீர்வு காணப்பட்ட வழக்குகள்',

    newGrievanceTitle: 'நுகர்வோர் சட்டப் புகாரைச் சமர்ப்பிக்கவும்',
    newGrievanceSubtitle: 'பல ஆதார செயலாக்கம், விதிகளின் அடிப்படையிலான வகைப்பாடு மற்றும் சட்ட விதி மேப்பிங்',
    consumerDetailsHeader: '1. புகார்தாரர் தொடர்பு விவரங்கள்',
    consumerNameLabel: 'நுகர்வோர் முழு பெயர்',
    emailLabel: 'நுகர்வோர் மின்னஞ்சல் முகவரி',
    phoneLabel: 'கைப்பேசி எண்',
    productDetailsHeader: '2. தயாரிப்பு மற்றும் விற்பனையாளர் விவரங்கள்',
    productNameLabel: 'தயாரிப்பு பெயர்',
    brandLabel: 'பிராண்ட் / தயாரிப்பாளர் பெயர்',
    platformLabel: 'இ-காமர்ஸ் தளம் / கடை',
    productUrlLabel: 'தயாரிப்பு இணைப்பு (விருப்பத்தேர்வு)',
    orderNumberLabel: 'ஆர்டர் / பில் எண்',
    descriptionHeader: '3. புகார் விவரம் மற்றும் கோரிக்கை',
    descriptionLabel: 'புகாரின் விரிவான விளக்கம்',
    descriptionPlaceholder: 'என்ன பிரச்சனை என்பதை விரிவாக எழுதவும் (எ.கா: பாக்கெட்டில் MRP ₹1999 ஆனால் கடையில் ₹2499 பில் போடப்பட்டது, அல்லது MRP அச்சிடப்படவில்லை).',
    transliterationHelp: 'ஆங்கிலத்தில் தட்டச்சு செய்யவும் (எ.கா "indha packet-il MRP இல்லை") மற்றும் தமிழில் மாற்ற "தமிழில் மாற்று" பொத்தானை அழுத்தவும்.',
    transliterateBtn: 'தமிழில் மாற்று (Transliterate)',
    transliteratingBtn: 'மாற்றப்படுகிறது...',
    keyboardTip: 'தமிழ், ஆங்கிலம், இந்தி அல்லது கன்னட விசைப்பலகை மூலம் நேரடியாக தட்டச்சு செய்யலாம்.',
    evidenceHeader: 'ஆதாரப் படங்கள் (பேக்கேஜிங், கடை பில், ரசீது)',
    evidenceUploadInstructions: 'தயாரிப்பு பேக்கேஜிங், MRP லேபிள் மற்றும் கடை பில்லின் தெளிவான புகைப்படங்களை பதிவேற்றவும்.',
    dropImagesHere: 'படங்களை இங்கே இழுத்து போடவும், அல்லது',
    selectFiles: 'கோப்புகளைத் தேர்ந்தெடுக்கவும்',
    submitComplaintBtn: 'புகாரைச் சமர்ப்பிக்கவும்',
    submittingBtn: 'ஆதாரங்கள் செயலாக்கப்பட்டு OCR ஆய்வு நடக்கிறது...',
    cancelBtn: 'ரத்து செய்',
    statusNew: 'புதியது',
    statusNeedsReview: 'ஆய்வு தேவைப்படுகிறது',
    statusTriaged: 'வகைப்படுத்தப்பட்டது',
    statusInvestigation: 'விசாரணையில் உள்ளது',
    statusNoticeDispatched: 'அறிவிப்பு அனுப்பப்பட்டது',
    statusAssignedForInspection: 'ஆய்வுக்கு ஒதுக்கப்பட்டது',
    statusMoreInfoRequested: 'கூடுதல் தகவல் கேட்கப்பட்டது',
    statusInsufficientEvidence: 'போதிய ஆதாரமில்லை',
    statusRejected: 'நிராகரிக்கப்பட்டது',
    statusResolved: 'தீர்வு காணப்பட்டது',
    consumerVerdictPotentialIssue: 'சாத்தியமான விதிமீறல் கண்டறியப்பட்டுள்ளது. உங்கள் புகார் அதிகாரப்பூர்வ ஆய்வுக்கு சமர்ப்பிக்கப்பட்டுள்ளது.',
    consumerVerdictSubmitted: 'உங்கள் புகார் பதிவு செய்யப்பட்டு சட்ட அளவியல் அதிகாரிகளின் ஆய்வுக்கு அனுப்பப்பட்டுள்ளது.',
    consumerVerdictUnderReview: 'உங்கள் வழக்கு தற்போது அதிகாரி விசாரணையில் உள்ளது.',
    consumerVerdictNoticeSent: 'தயாரிப்பாளர்/விற்பனையாளருக்கு சட்டப் பூர்வ விசாரணை அறிவிப்பு அனுப்பப்பட்டுள்ளது.',
    consumerVerdictResolved: 'அதிகாரிகளால் புகாருக்கு தீர்வு காணப்பட்டுள்ளது.',
    dossierTitle: 'ஆதார அடிப்படையிலான புகார் கோப்பு மற்றும் ஆய்வு',
    originalLanguageLabel: 'சமர்ப்பிக்கப்பட்ட மொழி',
    originalTextLabel: 'நுகர்வோரின் அசல் புகார் விவரம்',
    tabCorrelation: 'வழக்கு இணைப்பு',
    tabEvidence: 'OCR ஆதார தணிக்கை',
    tabRag: 'சட்ட விதி மேப்பிங்',
    tabAudit: 'சிஸ்டம் தணிக்கைப் பதிவு',
    officerNotice: 'அதிகாரப்பூர்வ கோப்பு பார்வை: நுகர்வோர் எழுதிய அசல் உரை மற்றும் மொழி குறியீட்டைக் காட்டுகிறது.',

    // Login Page Translations
    loginSubtitle: 'மத்திய நுகர்வோர் பாதுகாப்பு ஆணையம் & சட்ட அளவியல் தேசிய சரிபார்ப்பு தளம்',
    publicHome: '← முகப்பு',
    publicCatalog: 'பொது பட்டியல் (உள்நுழைவு தேவையில்லை)',
    consumerTab: 'நுகர்வோர்',
    consumerTabSub: 'புகார் மட்டும்',
    inspectorTab: 'ஆய்வாளர்',
    inspectorTabSub: 'பெங்களூரு நகரம்',
    adminTab: 'CCPA நிர்வாகி',
    adminTabSub: 'இயக்குநரகம்',
    authGatewayTitle: 'செயலில் உள்ள அங்கீகார நுழைவாயில்',
    consumerPortalName: 'நுகர்வோர் குறைதீர்ப்பு தளம்',
    consumerPortalTagline: 'தவறான பேக்கேஜிங் மற்றும் இரட்டை MRP-க்கு எதிராக புகார் பதிவு செய்யவும்',
    inspectorPortalName: 'மண்டல ஆய்வாளர் கட்டளை',
    inspectorPortalTagline: 'ஆதார சரிபார்ப்பு, பார்கோடு தணிக்கை மற்றும் திடீர் ஆய்வு',
    adminPortalName: 'மத்திய இயக்குநரகம் & அமலாக்கப் பிரிவு',
    adminPortalTagline: 'பிரிவு 36-ன் கீழ் நோட்டீஸ் வழங்குதல் மற்றும் தேசிய இணக்கப் பதிவு',
    emailLabelSimple: 'மின்னஞ்சல்',
    passwordLabelSimple: 'கடவுச்சொல்',
    enterConsumerBtn: 'நுகர்வோர் குறைதீர்ப்பு தளத்தில் நுழையவும்',
    enterInspectorBtn: 'ஆய்வாளர் நுழைவாயிலில் நுழையவும்',
    enterAdminBtn: 'மத்திய CCPA இயக்குநரகத்தில் நுழையவும்',
  },
};
