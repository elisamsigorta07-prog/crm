export type Language = 'TR' | 'EN' | 'RU';

export interface Translations {
  // Navigation
  nav_home: string;
  nav_about: string;
  nav_solutions: string;
  nav_blog: string;
  nav_contact: string;
  crm_login: string;
  get_quote: string;

  // Hero Section
  hero_title: string;
  hero_subtitle: string;
  hero_cta1: string;
  hero_cta2: string;

  // Why Us
  why_badge: string;
  why_title: string;
  why_subtitle: string;
  why_card1_title: string;
  why_card1_desc: string;
  why_card2_title: string;
  why_card2_desc: string;
  why_card3_title: string;
  why_card3_desc: string;
  why_card4_title: string;
  why_card4_desc: string;
  why_bottom_banner: string;
  why_bottom_btn: string;

  // Solutions
  solutions_badge: string;
  solutions_title: string;
  solutions_subtitle: string;
  solutions_banner_title: string;
  solutions_banner_subtitle: string;
  solutions_banner_btn: string;
  btn_detail: string;

  // Claim Process
  claim_badge: string;
  claim_title: string;
  claim_subtitle: string;
  claim_step1_title: string;
  claim_step1_desc: string;
  claim_step1_tag: string;
  claim_step2_title: string;
  claim_step2_desc: string;
  claim_step2_tag: string;
  claim_step3_title: string;
  claim_step3_desc: string;
  claim_step3_tag: string;
  claim_step4_title: string;
  claim_step4_desc: string;
  claim_step4_tag: string;

  // 3 Step Process
  step_badge: string;
  step_title: string;
  step_subtitle: string;
  step_feat1: string;
  step_feat2: string;
  step_feat3: string;
  step_card1_title: string;
  step_card1_desc: string;
  step_card2_title: string;
  step_card2_desc: string;
  step_card3_title: string;
  step_card3_desc: string;

  // Elisam in Numbers
  stats_badge: string;
  stats_title: string;
  stats_subtitle: string;
  stat_card1: string;
  stat_card2: string;
  stat_card3: string;
  stat_card4: string;

  // FAQ & Blog
  faq_badge: string;
  blog_title: string;
  blog_all: string;
  read_more: string;

  // Footer
  footer_desc: string;
  footer_rights: string;
}

export const translations: Record<Language, Translations> = {
  TR: {
    // Navigation
    nav_home: 'Ana Sayfa',
    nav_about: 'Hakkımızda',
    nav_solutions: 'Sigorta Çözümleri',
    nav_blog: 'Blog',
    nav_contact: 'İletişim',
    crm_login: 'CRM Giriş',
    get_quote: 'Teklif Al',

    // Hero
    hero_title: 'Geleceğinizi Güvence Altına Alın',
    hero_subtitle: "Elisam Sigorta olarak, siz ve sevdikleriniz için Alanya'daki en doğru sigorta çözümlerini sunuyoruz.",
    hero_cta1: 'Hemen Teklif Al',
    hero_cta2: 'Bizi Arayın',

    // Why Us
    why_badge: 'NEDEN ELİSAM SİGORTA?',
    why_title: 'Güvenli Geleceğiniz İçin Yanınızdayız',
    why_subtitle: "Alanya'da 10 yılı aşkın tecrübemiz ve şeffaf hizmet anlayışımızla tüm sigorta ihtiyaçlarınıza özel çözümler üretiyoruz.",
    why_card1_title: 'Uzman & Deneyimli Kadro',
    why_card1_desc: 'Alanında uzman danışmanlarımızla en doğru poliçeyi oluşturuyoruz.',
    why_card2_title: '25+ Güçlü Sigorta Şirketi',
    why_card2_desc: "Türkiye'nin en seçkin sigorta firmalarının tekliflerini karşılaştırıyoruz.",
    why_card3_title: '7/24 Kesintisiz Hasar Destek',
    why_card3_desc: 'Kaza ve ihbar anlarında anında yanınızda duruyoruz.',
    why_card4_title: 'En Uygun Fiyat Garantisi',
    why_card4_desc: 'Bütçenize en uygun ve en kapsamlı teminatları garanti ediyoruz.',
    why_bottom_banner: 'Hemen sigorta teklifi alın, geleceğinizi güvenle koruyun.',
    why_bottom_btn: 'Hızlı Teklif Al',

    // Solutions
    solutions_badge: 'SİGORTA ÇÖZÜMLERİMİZ',
    solutions_title: 'İhtiyacınıza Özel Sigorta Ürünleri',
    solutions_subtitle: 'Hayatınızın her alanında güvence sağlayan geniş ürün yelpazemiz.',
    solutions_banner_title: 'İhtiyacınıza En Uygun Sigortayı Birlikte Seçelim',
    solutions_banner_subtitle: 'Uzman ekibimiz 25+ sigorta şirketini karşılaştırarak size özel teklif hazırlasın.',
    solutions_banner_btn: 'Ücretsiz Danışmanlık Al',
    btn_detail: 'Detaylı Bilgi',

    // Claim Process
    claim_badge: 'HASAR SÜRECİNDE YANINIZDAYIZ',
    claim_title: 'Hasar Sürecinde Yanınızdayız',
    claim_subtitle: 'Hasar anında hızlı ve etkili çözüm süreci.',
    claim_step1_title: 'Bize Ulaşın',
    claim_step1_desc: '7/24 bize ulaşın, ihbarınızı oluşturun.',
    claim_step1_tag: '7/24 Destek',
    claim_step2_title: 'Dosyanız Oluşturulsun',
    claim_step2_desc: 'Uzman ekibimiz dosyanızı hızlıca oluştursun.',
    claim_step2_tag: 'Hızlı Dosya Açılışı',
    claim_step3_title: 'Eksper Süreci',
    claim_step3_desc: 'Eksper ataması yapılarak süreç başlatılsın.',
    claim_step3_tag: 'Uzman Eksper Kadrosu',
    claim_step4_title: 'Ödemeniz Tamamlansın',
    claim_step4_desc: 'Onay sonrası ödemeniz hızla tamamlansın.',
    claim_step4_tag: 'Hızlı Ödeme',

    // 3 Step Process
    step_badge: '3 ADIMDA SİGORTAN HAZIR',
    step_title: 'Kolay, Hızlı ve Güvenli Süreç',
    step_subtitle: 'Sigortanızı dakikalar içinde oluşturun, güvencenizi hemen başlayın.',
    step_feat1: 'Güvenli ve Kişisel Veri Koruması',
    step_feat2: 'Hızlı Teklif ve Anında Sonuç',
    step_feat3: 'En Uygun Fiyat Garantisi',
    step_card1_title: 'Bilgilerini Gir',
    step_card1_desc: 'Kısa formu doldurarak bilgini bizimle paylaş.',
    step_card2_title: 'Teklifini Gönderelim Karşılaştıralım',
    step_card2_desc: 'Sana özel en uygun teklifleri karşılaştır ve seçimini yap.',
    step_card3_title: 'Poliçeni Oluşturalım',
    step_card3_desc: 'En uygun teklifi seç, poliçeni hemen oluşturalım.',

    // Elisam in Numbers
    stats_badge: 'RAKAMLARLA ELİSAM',
    stats_title: 'Güveniniz, Deneyimimizle Güçleniyor',
    stats_subtitle: 'Yılların tecrübesi ve binlerce mutlu müşteri ile daima yanınızdayız.',
    stat_card1: 'Mutlu Müşteri',
    stat_card2: 'Sigorta Şirketi',
    stat_card3: 'Müşteri Memnuniyeti',
    stat_card4: 'Yıllık Deneyim',

    // FAQ & Blog
    faq_badge: 'Sıkça Sorulan Sorular',
    blog_title: 'Blog & Haberler',
    blog_all: 'Tümünü Gör',
    read_more: 'Devamını Oku',

    // Footer
    footer_desc: "Alanya'nın en güvenilir sigorta ve araç kiralama acentesi. Kasko, Trafik, DASK, Sağlık sigortaları ve Rent A Car çözümlerimizle hizmetinizdeyiz.",
    footer_rights: 'Tüm Hakları Saklıdır.'
  },

  EN: {
    // Navigation
    nav_home: 'Home',
    nav_about: 'About Us',
    nav_solutions: 'Insurance Solutions',
    nav_blog: 'Blog',
    nav_contact: 'Contact',
    crm_login: 'CRM Login',
    get_quote: 'Get Quote',

    // Hero
    hero_title: 'Secure Your Future Today',
    hero_subtitle: 'At Elisam Insurance, we offer the most reliable insurance and rental solutions in Alanya for you and your family.',
    hero_cta1: 'Get Instant Quote',
    hero_cta2: 'Call Us Now',

    // Why Us
    why_badge: 'WHY ELISAM INSURANCE?',
    why_title: 'Standing By You for a Safe Future',
    why_subtitle: 'With over 10 years of experience in Alanya and transparent service, we tailor custom insurance coverage for all your needs.',
    why_card1_title: 'Expert & Experienced Team',
    why_card1_desc: 'We craft the ideal policy with our certified specialists.',
    why_card2_title: '25+ Leading Insurance Partners',
    why_card2_desc: "We compare quotes from Turkey's top insurance companies.",
    why_card3_title: '24/7 Claim Support',
    why_card3_desc: 'We stand by your side immediately during accidents and claims.',
    why_card4_title: 'Best Price Guarantee',
    why_card4_desc: 'We guarantee comprehensive coverage tailored to your budget.',
    why_bottom_banner: 'Get an insurance quote now and protect your future with confidence.',
    why_bottom_btn: 'Quick Quote',

    // Solutions
    solutions_badge: 'OUR INSURANCE SOLUTIONS',
    solutions_title: 'Tailored Products for Your Needs',
    solutions_subtitle: 'Our wide product range providing safety in every area of your life.',
    solutions_banner_title: 'Let Us Help You Choose the Best Insurance',
    solutions_banner_subtitle: 'Our expert team compares 25+ insurance providers to prepare a custom offer.',
    solutions_banner_btn: 'Free Consultation',
    btn_detail: 'Learn More',

    // Claim Process
    claim_badge: 'ALWAYS BY YOUR SIDE IN CLAIMS',
    claim_title: 'We Support You in Claim Processes',
    claim_subtitle: 'Fast and effective solution process when damage occurs.',
    claim_step1_title: 'Contact Us',
    claim_step1_desc: 'Reach us 24/7 and report your claim.',
    claim_step1_tag: '24/7 Support',
    claim_step2_title: 'File Creation',
    claim_step2_desc: 'Our team opens your claim file instantly.',
    claim_step2_tag: 'Fast File Opening',
    claim_step3_title: 'Expert Assessment',
    claim_step3_desc: 'An expert is assigned to assess the damage.',
    claim_step3_tag: 'Certified Experts',
    claim_step4_title: 'Payout Completed',
    claim_step4_desc: 'Upon approval, your compensation is paid fast.',
    claim_step4_tag: 'Fast Payment',

    // 3 Step Process
    step_badge: 'READY IN 3 EASY STEPS',
    step_title: 'Easy, Fast and Secure Process',
    step_subtitle: 'Create your insurance in minutes, start your coverage today.',
    step_feat1: 'Secure & Personal Data Protection',
    step_feat2: 'Fast Quote & Instant Results',
    step_feat3: 'Best Price Guarantee',
    step_card1_title: 'Enter Information',
    step_card1_desc: 'Fill out the short form to share details with us.',
    step_card2_title: 'Compare Quotes',
    step_card2_desc: 'Compare personalized quotes and pick the best option.',
    step_card3_title: 'Issue Your Policy',
    step_card3_desc: 'Choose your offer, we issue your policy right away.',

    // Elisam in Numbers
    stats_badge: 'ELISAM IN NUMBERS',
    stats_title: 'Your Trust Strengthened by Experience',
    stats_subtitle: 'Always by your side with years of experience and thousands of happy clients.',
    stat_card1: 'Happy Clients',
    stat_card2: 'Insurance Companies',
    stat_card3: 'Customer Satisfaction',
    stat_card4: 'Years Experience',

    // FAQ & Blog
    faq_badge: 'Frequently Asked Questions',
    blog_title: 'Blog & News',
    blog_all: 'View All',
    read_more: 'Read More',

    // Footer
    footer_desc: "Alanya's most trusted insurance & rent a car agency. Serving you with Motor, Health, Property insurance and Car Rental solutions.",
    footer_rights: 'All Rights Reserved.'
  },

  RU: {
    // Navigation
    nav_home: 'Главная',
    nav_about: 'О нас',
    nav_solutions: 'Страховые решения',
    nav_blog: 'Блог',
    nav_contact: 'Контакты',
    crm_login: 'Вход в CRM',
    get_quote: 'Рассчитать',

    // Hero
    hero_title: 'Защитите свое будущее сегодня',
    hero_subtitle: 'В Elisam Insurance мы предлагаем самые надежные страховые решения и аренду авто в Аланье для вас и вашей семьи.',
    hero_cta1: 'Получить расчет',
    hero_cta2: 'Позвонить нам',

    // Why Us
    why_badge: 'ПОЧЕМУ ELISAM INSURANCE?',
    why_title: 'Мы рядом ради вашего безопасного будущего',
    why_subtitle: 'С более чем 10-летним опытом в Аланье и прозрачным сервисом мы подбираем страхование под все ваши потребности.',
    why_card1_title: 'Опытная команда экспертов',
    why_card1_desc: 'Мы оформляем идеальный полис с нашими квалифицированными специалистами.',
    why_card2_title: '25+ надежных страховщиков',
    why_card2_desc: 'Мы сравниваем предложения ведущих страховых компаний Турции.',
    why_card3_title: 'Поддержка 24/7 при ДТП',
    why_card3_desc: 'Мы оперативно поддерживаем вас при происшествиях и страховых случаях.',
    why_card4_title: 'Гарантия лучшей цены',
    why_card4_desc: 'Мы гарантируем максимальную защиту по выгодным ценам.',
    why_bottom_banner: 'Рассчитайте стоимость страховки прямо сейчас и защитите свое будущее.',
    why_bottom_btn: 'Быстрый расчет',

    // Solutions
    solutions_badge: 'НАШИ СТРАХОВЫЕ РЕШЕНИЯ',
    solutions_title: 'Продукты под ваши потребности',
    solutions_subtitle: 'Широкий спектр продуктов для вашей безопасности во всех сферах жизни.',
    solutions_banner_title: 'Давайте подберем лучшую страховку вместе',
    solutions_banner_subtitle: 'Наша команда экспертов сравнит 25+ страховщиков и подготовит персональное предложение.',
    solutions_banner_btn: 'Бесплатная консультация',
    btn_detail: 'Подробнее',

    // Claim Process
    claim_badge: 'ПОДДЕРЖКА ПРИ СТРАХОВЫХ СЛУЧАЯХ',
    claim_title: 'Мы рядом в процессе урегулирования',
    claim_subtitle: 'Быстрый и эффективный процесс решений в момент страхового случая.',
    claim_step1_title: 'Свяжитесь с нами',
    claim_step1_desc: 'Свяжитесь с нами 24/7 и зарегистрируйте случай.',
    claim_step1_tag: 'Поддержка 24/7',
    claim_step2_title: 'Открытие дела',
    claim_step2_desc: 'Наша команда быстро открывает дело.',
    claim_step2_tag: 'Быстрое открытие дела',
    claim_step3_title: 'Оценка эксперта',
    claim_step3_desc: 'Назначается эксперт для оценки ущерба.',
    claim_step3_tag: 'Опытные эксперты',
    claim_step4_title: 'Выплата компенсации',
    claim_step4_desc: 'После одобрения выплата производится быстро.',
    claim_step4_tag: 'Быстрая выплата',

    // 3 Step Process
    step_badge: 'ГОТОВО ЗА 3 ПРОСТЫХ ШАГА',
    step_title: 'Простой, быстрый и безопасный процесс',
    step_subtitle: 'Оформите страховку за считанные минуты и получите защиту прямо сейчас.',
    step_feat1: 'Защита персональных данных',
    step_feat2: 'Быстрый расчет и мгновенный результат',
    step_feat3: 'Гарантия лучшей цены',
    step_card1_title: 'Введите данные',
    step_card1_desc: 'Заполните короткую форму и поделитесь информацией.',
    step_card2_title: 'Сравните варианты',
    step_card2_desc: 'Сравните персональные предложения и выберите лучшее.',
    step_card3_title: 'Оформите полис',
    step_card3_desc: 'Выберите предложение, и мы выпишем полис мгновенно.',

    // Elisam in Numbers
    stats_badge: 'ELISAM В ЦИФРАХ',
    stats_title: 'Ваше доверие подкреплено нашим опытом',
    stats_subtitle: 'Всегда рядом благодаря многолетнему опыту и тысячам довольных клиентов.',
    stat_card1: 'Довольных клиентов',
    stat_card2: 'Страховых компаний',
    stat_card3: 'Удовлетворенность клиентов',
    stat_card4: 'Лет опыта',

    // FAQ & Blog
    faq_badge: 'Частые вопросы',
    blog_title: 'Блог и Новости',
    blog_all: 'Смотреть все',
    read_more: 'Читать далее',

    // Footer
    footer_desc: 'Самое надежное агентство страхования и аренды авто в Аланье. Автострахование, медицина, недвижимость и Rent A Car.',
    footer_rights: 'Все права защищены.'
  }
};
