const catchAsync = require("../utils/catchAsync");
const Property = require("../models/Property");
const { NlpManager, ConversationContext } = require("node-nlp");
const fs = require("fs");
const path = require("path");

// تكوين مدير NLP مع المزيد من الخيارات
const nlpManager = new NlpManager({
  languages: ["ar"],
  threshold: 0.45, // خفض الحد الأدنى للثقة
  autoSave: true, // حفظ تلقائي للنموذج
  autoLoad: true, // تحميل تلقائي للنموذج
  modelFileName: path.join(__dirname, "../model.nlp"), // مسار حفظ النموذج
});

// تهيئة سياق المحادثة
const conversationContexts = {};

// تدريب نموذج NLP على الكلمات المفتاحية العربية
const trainNLP = async () => {
  // التدريب على التحيات
  nlpManager.addDocument("ar", "مرحبا", "greetings");
  nlpManager.addDocument("ar", "اهلا", "greetings");
  nlpManager.addDocument("ar", "السلام عليكم", "greetings");
  nlpManager.addDocument("ar", "صباح الخير", "greetings");
  nlpManager.addDocument("ar", "مساء الخير", "greetings");

  // التدريب على الشراء والبيع
  nlpManager.addDocument("ar", "شراء", "buy");
  nlpManager.addDocument("ar", "اشتري", "buy");
  nlpManager.addDocument("ar", "بيع", "buy");
  nlpManager.addDocument("ar", "ابحث عن عقار للشراء", "buy");
  nlpManager.addDocument("ar", "اريد شراء", "buy");

  // التدريب على الإيجار
  nlpManager.addDocument("ar", "ايجار", "rent");
  nlpManager.addDocument("ar", "استئجار", "rent");
  nlpManager.addDocument("ar", "أبحث عن ايجار", "rent");
  nlpManager.addDocument("ar", "اريد استئجار", "rent");

  // التدريب على الأسعار
  nlpManager.addDocument("ar", "سعر", "price");
  nlpManager.addDocument("ar", "تكلفة", "price");
  nlpManager.addDocument("ar", "ثمن", "price");
  nlpManager.addDocument("ar", "كم يكلف", "price");

  // التدريب على الاتصال
  nlpManager.addDocument("ar", "اتصال", "contact");
  nlpManager.addDocument("ar", "تواصل", "contact");
  nlpManager.addDocument("ar", "هاتف", "contact");
  nlpManager.addDocument("ar", "رقم", "contact");

  // التدريب على الخدمات
  nlpManager.addDocument("ar", "خدمة", "services");
  nlpManager.addDocument("ar", "خدمات", "services");

  // التدريب على المواقع
  nlpManager.addDocument("ar", "مكان", "location");
  nlpManager.addDocument("ar", "موقع", "location");
  nlpManager.addDocument("ar", "منطقة", "location");
  nlpManager.addDocument("ar", "حي", "location");

  // التدريب على أنواع العقارات
  nlpManager.addDocument("ar", "شقة", "property_type");
  nlpManager.addDocument("ar", "فيلا", "property_type");
  nlpManager.addDocument("ar", "محل", "property_type");
  nlpManager.addDocument("ar", "أرض", "property_type");

  // تدريب النموذج
  await nlpManager.train();
  console.log("تم تدريب نموذج معالجة اللغة الطبيعية بنجاح");
};

// تشغيل التدريب عند بدء التطبيق
trainNLP().catch(console.error);

// Simple chatbot responses
const botResponses = {
  greetings: [
    "مرحبا! كيف يمكنني مساعدتك في البحث عن عقار؟",
    "أهلاً بك في عقار كام! هل تبحث عن عقار للشراء أو للإيجار؟",
    "مرحباً! أنا هنا للمساعدة في استفساراتك العقارية",
  ],
  buy: [
    "نحن نقدم مجموعة واسعة من العقارات للبيع. هل تبحث عن منطقة معينة؟",
    "يمكنك تصفح العقارات المتاحة للبيع من خلال صفحة العقارات. هل ترغب في تحديد ميزانية معينة؟",
  ],
  rent: [
    "لدينا العديد من الخيارات للإيجار. هل تفضل شقة أم فيلا؟",
    "يمكنك العثور على عقارات للإيجار في مختلف مناطق أسيوط. هل لديك منطقة معينة في ذهنك؟",
  ],
  price: [
    "الأسعار تختلف حسب الموقع والمساحة. يمكنك استخدام فلاتر البحث لتحديد نطاق السعر المناسب لك.",
    "يمكنك استخدام أداة الحاسبة في موقعنا لتقدير تكلفة العقار والرسوم المرتبطة به.",
  ],
  contact: [
    "يمكنك التواصل معنا عبر صفحة اتصل بنا أو عبر الهاتف على الرقم 01XXXXXXXXX.",
    "فريق خدمة العملاء متاح للرد على استفساراتك من السبت إلى الخميس من 9 صباحًا حتى 6 مساءً.",
  ],
  services: [
    "نقدم خدمات البيع والشراء والإيجار، بالإضافة إلى الاستشارات العقارية والتقييم.",
    "نساعدك في جميع مراحل المعاملات العقارية من البحث حتى توثيق العقود.",
  ],
  location: [
    "نحن نغطي معظم مناطق أسيوط، بما في ذلك وسط المدينة، الأربعين، شارع الجمهورية، والمناطق الجديدة.",
    "يمكنك تحديد المنطقة المفضلة لديك في خيارات البحث لتصفية النتائج.",
  ],
  error: [
    "عذراً، يبدو أن هناك مشكلة في الاتصال. سنقوم بإصلاح هذا في أقرب وقت، يمكنك المحاولة مرة أخرى بعد قليل.",
    "نواجه بعض المشكلات الفنية حالياً. يرجى المحاولة مرة أخرى لاحقاً، أو يمكنك التواصل معنا على 01XXXXXXXXX.",
    "نعتذر، هناك مشكلة في الاتصال بقاعدة البيانات. يرجى إبلاغ مسؤول النظام.",
    "نعتذر عن الانقطاع المؤقت في الخدمة. نحن نعمل على استعادة الاتصال بشكل كامل. شكراً لصبرك.",
    "أعتذر عن المشكلة التقنية. هل يمكنك تحديث الصفحة والمحاولة مرة أخرى؟",
  ],
  default: [
    "عذراً، لم أفهم استفسارك. هل يمكنك إعادة صياغته بطريقة أخرى؟",
    "للحصول على مساعدة أكثر تخصصاً، يمكنك التواصل مع فريق خدمة العملاء.",
  ],
};

// Helper function to get random response from category
const getRandomResponse = (category) => {
  const responses = botResponses[category] || botResponses.default;
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
};

// محاولة استخلاص السمات اللغوية من النص العربي
const analyzeArabicText = (message) => {
  // تبسيط النص وإزالة التشكيل إن وجد
  const simplifiedText = message
    .replace(/[\u064B-\u065F]/g, "") // إزالة التشكيل
    .replace(/\s+/g, " ") // إزالة المسافات الزائدة
    .trim(); // إزالة المسافات في البداية والنهاية

  // تحليل الكلمات الأساسية
  const keywordMappings = {
    greetings: ["مرحبا", "اهلا", "السلام", "صباح", "مساء", "هاي", "هلا"],
    buy: [
      "شراء",
      "اشتري",
      "بيع",
      "ابيع",
      "أشتري",
      "أبيع",
      "أريد شراء",
      "ابحث عن شراء",
    ],
    rent: ["ايجار", "استأجر", "أستأجر", "استئجار", "اجار", "أبحث عن ايجار"],
    price: [
      "سعر",
      "ثمن",
      "تكلفة",
      "كم يكلف",
      "اسعار",
      "أسعار",
      "المبلغ",
      "التكاليف",
    ],
    contact: ["اتصال", "تواصل", "هاتف", "رقم", "الاتصال", "التواصل", "تليفون"],
    services: ["خدمة", "خدمات", "تقدمون", "تقدم", "تعملون"],
    location: [
      "مكان",
      "موقع",
      "منطقة",
      "حي",
      "شارع",
      "مدينة",
      "قرية",
      "المكان",
      "الموقع",
    ],
    error: [
      "خطأ",
      "مشكلة",
      "عطل",
      "فشل",
      "لا يعمل",
      "اتصال",
      "انقطع",
      "انقطاع",
      "توقف",
      "محاولة",
      "فشلت",
    ],
  };

  // احسب درجة التطابق لكل قصد
  const intentScores = {};

  for (const [intent, keywords] of Object.entries(keywordMappings)) {
    let score = 0;
    for (const keyword of keywords) {
      if (simplifiedText.includes(keyword)) {
        score += 1;
      }
    }
    intentScores[intent] = score;
  }

  // حدد القصد الأكثر احتمالاً
  let maxIntent = "default";
  let maxScore = 0;

  for (const [intent, score] of Object.entries(intentScores)) {
    if (score > maxScore) {
      maxScore = score;
      maxIntent = intent;
    }
  }

  return { intent: maxIntent, score: maxScore };
};

// Identify intent from user message using NLP
const identifyIntent = async (message) => {
  try {
    // استخدام نموذج NLP لتحديد القصد من الرسالة
    const result = await nlpManager.process("ar", message);

    // إذا كان هناك قصد تم اكتشافه بدرجة ثقة معقولة
    if (result.intent && result.score > 0.5) {
      return result.intent;
    }

    // استخدام تحليل النص العربي
    const arabicAnalysis = analyzeArabicText(message);
    if (arabicAnalysis.score > 0) {
      return arabicAnalysis.intent;
    }

    // الاستمرار في استخدام الطريقة التقليدية كاحتياطي
    const lowerMessage = message.toLowerCase();

    // Simple intent matching based on keywords
    if (
      lowerMessage.includes("مرحبا") ||
      lowerMessage.includes("اهلا") ||
      lowerMessage.includes("السلام عليكم")
    ) {
      return "greetings";
    } else if (
      lowerMessage.includes("شراء") ||
      lowerMessage.includes("اشتري") ||
      lowerMessage.includes("بيع")
    ) {
      return "buy";
    } else if (
      lowerMessage.includes("ايجار") ||
      lowerMessage.includes("استئجار")
    ) {
      return "rent";
    } else if (
      lowerMessage.includes("سعر") ||
      lowerMessage.includes("تكلفة") ||
      lowerMessage.includes("ثمن")
    ) {
      return "price";
    } else if (
      lowerMessage.includes("اتصال") ||
      lowerMessage.includes("تواصل") ||
      lowerMessage.includes("هاتف") ||
      lowerMessage.includes("رقم")
    ) {
      return "contact";
    } else if (
      lowerMessage.includes("خدمة") ||
      lowerMessage.includes("خدمات")
    ) {
      return "services";
    } else if (
      lowerMessage.includes("مكان") ||
      lowerMessage.includes("موقع") ||
      lowerMessage.includes("منطقة") ||
      lowerMessage.includes("حي")
    ) {
      return "location";
    } else {
      return "default";
    }
  } catch (error) {
    console.error("خطأ في تحديد القصد:", error);
    return "default";
  }
};

// استخراج معلمات العقار من الرسالة
const extractPropertyParams = async (message) => {
  const lowerMessage = message.toLowerCase();
  const params = {};

  // 1. استخراج نوع العقار - طريقة محسنة
  const propertyTypes = {
    شقة: ["شقة", "شقه", "شقق", "apartment", "flat"],
    فيلا: ["فيلا", "فيلل", "فلل", "villa", "فله"],
    محل: ["محل", "دكان", "متجر", "shop", "store"],
    أرض: ["أرض", "ارض", "قطعة أرض", "قطعه ارض", "land", "قطعة", "قطعه"],
  };

  for (const [type, keywords] of Object.entries(propertyTypes)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        params.type = type;
        break;
      }
    }
    if (params.type) break;
  }

  // 2. استخراج الغرض (بيع/إيجار) - طريقة محسنة
  const purposeTypes = {
    بيع: [
      "بيع",
      "شراء",
      "اشتري",
      "أشتري",
      "أبيع",
      "ابيع",
      "buy",
      "sell",
      "purchase",
    ],
    إيجار: [
      "إيجار",
      "ايجار",
      "استئجار",
      "أستأجر",
      "استاجر",
      "rent",
      "lease",
      "rental",
    ],
  };

  for (const [purpose, keywords] of Object.entries(purposeTypes)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        params.purpose = purpose;
        break;
      }
    }
    if (params.purpose) break;
  }

  // 3. استخراج الموقع - طريقة محسنة
  // قائمة أكبر من المواقع المحتملة
  const commonLocations = [
    "وسط المدينة",
    "وسط البلد",
    "الأربعين",
    "الاربعين",
    "شارع الجمهورية",
    "الجمهورية",
    "المعادي",
    "المعادى",
    "الزهور",
    "فيصل",
    "شارع فيصل",
    "العجمي",
    "العجمى",
    "الهرم",
    "شارع الهرم",
    "المهندسين",
    "مدينة نصر",
    "مدينه نصر",
    "التجمع الخامس",
    "التجمع",
    "المقطم",
    "حي المقطم",
    "المريوطية",
    "المريوطيه",
    "شبرا",
    "شبرا مصر",
    "حلوان",
    "المنيا",
    "المنيه",
    "أسيوط",
    "اسيوط",
    "الفيوم",
    "المنصورة",
    "المنصوره",
  ];

  // أولاً - البحث عن تطابق كامل للمواقع
  for (const location of commonLocations) {
    if (lowerMessage.includes(location.toLowerCase())) {
      params.location = location;
      break;
    }
  }

  // ثانيا - استخدام تعبيرات منتظمة للعثور على المواقع
  if (!params.location) {
    const locationMarkers = [
      "في منطقة",
      "في منطقه",
      "بمنطقة",
      "بمنطقه",
      "في حي",
      "بحي",
      "بشارع",
      "في شارع",
      "في مدينة",
      "في مدينه",
      "بمدينة",
      "بمدينه",
    ];

    for (const marker of locationMarkers) {
      if (lowerMessage.includes(marker)) {
        const index = lowerMessage.indexOf(marker) + marker.length;
        let location = lowerMessage.substring(index).trim();

        // قص حتى المسافة أو نهاية السلسلة
        const spaceIndex = location.indexOf(" ");
        if (spaceIndex > 0) {
          location = location.substring(0, spaceIndex + 8); // أخذ بضع كلمات بعد المؤشر
        }

        if (location.length > 2 && location.length < 25) {
          params.location = location;
          break;
        }
      }
    }
  }

  // 4. استخراج معلومات إضافية إذا كانت متوفرة

  // نطاق السعر
  const pricePattern = /(\d+)\s*(الف|ألف|مليون|جنيه|جنية|ج\.?م\.?)/i;
  const priceMatch = message.match(pricePattern);
  if (priceMatch) {
    params.priceRange = priceMatch[0];
  }

  // المساحة
  const areaPattern = /(\d+)\s*(متر|م2|م٢|م ٢)/i;
  const areaMatch = message.match(areaPattern);
  if (areaMatch) {
    params.area = areaMatch[0];
  }

  // عدد الغرف
  const roomsPattern = /(\d+)\s*(غرف|غرفة|غرفه|غرف نوم|غرفة نوم|غرفه نوم)/i;
  const roomsMatch = message.match(roomsPattern);
  if (roomsMatch) {
    params.rooms = roomsMatch[0];
  }

  return params;
};

// توليد رد مخصص بناء على النية والمعلمات
const generateCustomResponse = (intent, searchParams, propertyResults) => {
  // الردود العامة
  const generalResponses = botResponses[intent] || botResponses.default;

  // إذا كانت هناك نتائج، صياغة رد مخصص
  if (propertyResults && propertyResults.length > 0) {
    const propertyCount = propertyResults.length;
    const propertyType = searchParams.type || "عقار";
    const purpose = searchParams.purpose || "متاح";
    const location = searchParams.location || "المنطقة التي تبحث عنها";

    // إنشاء رد مخصص بناءً على النتائج المتاحة
    const customResponses = [
      `وجدت ${propertyCount} من ${propertyType} ${
        purpose === "بيع" ? "للبيع" : "للإيجار"
      } في ${location}. يمكنك الاطلاع على التفاصيل أدناه.`,
      `يتوفر لدينا ${propertyCount} خيارات تناسب بحثك عن ${propertyType} في ${location}. ألق نظرة على النتائج التالية!`,
      `بناءً على بحثك، هذه بعض ${propertyType} المتاحة ${
        purpose === "بيع" ? "للبيع" : "للإيجار"
      } في ${location}.`,
    ];

    // اختر رد عشوائي من الردود المخصصة
    const randomIndex = Math.floor(Math.random() * customResponses.length);
    return customResponses[randomIndex];
  }

  // إذا لم تكن هناك نتائج ولكن هناك معلمات بحث
  if (
    Object.keys(searchParams).length > 0 &&
    (!propertyResults || propertyResults.length === 0)
  ) {
    const propertyType = searchParams.type || "عقار";
    const purpose = searchParams.purpose || "متاح";
    const location = searchParams.location || "المنطقة التي تبحث عنها";

    // إنشاء ردود بديلة عندما لا توجد نتائج
    const noResultsResponses = [
      `للأسف، لم نجد ${propertyType} ${
        purpose === "بيع" ? "للبيع" : "للإيجار"
      } في ${location}. يمكنك تجربة البحث في مناطق قريبة أو تعديل معايير البحث.`,
      `لم يتم العثور حاليًا على ${propertyType} في ${location}. هل ترغب في توسيع نطاق البحث أو تغيير المنطقة؟`,
      `نأسف، لا يوجد لدينا حاليًا ${propertyType} ${
        purpose === "بيع" ? "للبيع" : "للإيجار"
      } في ${location}. يمكننا إخطارك عند توفر عقارات جديدة تناسب بحثك.`,
    ];

    const randomIndex = Math.floor(Math.random() * noResultsResponses.length);
    return noResultsResponses[randomIndex];
  }

  // إذا لم تكن هناك معلمات بحث محددة، استخدم الرد العشوائي العام
  const randomIndex = Math.floor(Math.random() * generalResponses.length);
  return generalResponses[randomIndex];
};

// إدارة سياق المحادثة
const manageConversationContext = (userId, message, intent, searchParams) => {
  // إنشاء سياق جديد إذا لم يكن موجودًا
  if (!conversationContexts[userId]) {
    conversationContexts[userId] = {
      lastIntent: null,
      searchHistory: [],
      lastMessageTime: Date.now(),
    };
  }

  // تحديث سياق المحادثة
  const context = conversationContexts[userId];
  context.lastIntent = intent;
  context.lastMessageTime = Date.now();

  // إضافة معلمات البحث إلى تاريخ البحث إذا كانت موجودة
  if (Object.keys(searchParams).length > 0) {
    context.searchHistory.push({
      params: searchParams,
      timestamp: Date.now(),
    });

    // الاحتفاظ فقط بآخر 5 عمليات بحث
    if (context.searchHistory.length > 5) {
      context.searchHistory.shift();
    }
  }

  return context;
};

// Process user message and return chatbot response
exports.processMessage = catchAsync(async (req, res, next) => {
  const { message, userId = "anonymous" } = req.body;

  if (!message) {
    return res.status(400).json({
      status: "error",
      message: "الرجاء إرسال رسالة للرد عليها",
    });
  }

  // Identify intent from message
  const intent = await identifyIntent(message);

  // Extract property search parameters
  const searchParams = await extractPropertyParams(message);
  let propertyResults = [];

  // Search for properties if we have search parameters
  if (Object.keys(searchParams).length > 0) {
    const query = { ...searchParams, status: "approved" };

    try {
      // Get a limited number of matching properties
      propertyResults = await Property.find(query)
        .select("title price location type purpose area mainImage")
        .sort("-createdAt")
        .limit(3);
    } catch (error) {
      console.error("Error searching for properties:", error);
    }
  }

  // إدارة سياق المحادثة
  const context = manageConversationContext(
    userId,
    message,
    intent,
    searchParams
  );

  // توليد رد مخصص بناءً على النية والمعلمات ونتائج البحث
  const enhancedResponse = generateCustomResponse(
    intent,
    searchParams,
    propertyResults
  );
  // تحضير خيارات تفاعلية حسب قصد المستخدم
  let options = [];

  if (intent === "greetings") {
    options = [
      "أبحث عن عقار للشراء",
      "أبحث عن عقار للإيجار",
      "أريد معرفة الأسعار",
    ];
  } else if (intent === "buy") {
    options = [
      "أبحث عن شقة للشراء",
      "أبحث عن فيلا للشراء",
      "أريد معرفة أسعار العقارات في وسط المدينة",
    ];
  } else if (intent === "rent") {
    options = [
      "أبحث عن شقة للإيجار",
      "أبحث عن محل للإيجار",
      "ما هي متوسط أسعار الإيجارات؟",
    ];
  } else if (intent === "price") {
    options = [
      "كيف يمكنني حساب تكلفة العقار؟",
      "ما هي الرسوم الإضافية للشراء؟",
      "أريد مقارنة أسعار العقارات في مناطق مختلفة",
    ];
  } else if (intent === "error") {
    options = [
      "تحديث الصفحة",
      "العودة للصفحة الرئيسية",
      "اتصل بفريق الدعم الفني",
    ];
  }

  // Return response with properties if available
  res.status(200).json({
    status: "success",
    data: {
      message: enhancedResponse,
      options: options,
      properties: propertyResults.length > 0 ? propertyResults : undefined,
    },
  });
});
