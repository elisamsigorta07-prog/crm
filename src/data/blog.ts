export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  imageUrl: string;
  category: string;
  readTime: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: 'kasko-ve-trafik-sigortasi-farklari',
    title: 'Kasko ve Trafik Sigortası Arasındaki Farklar Nelerdir?',
    excerpt: 'Trafik sigortası zorunlu mudur? Kasko neleri kapsar? Aracınızı güvence altına alırken bilmeniz gereken tüm detaylar bu yazımızda.',
    content: `
      <h2>Kasko ve Trafik Sigortası Nedir?</h2>
      <p>Araç sahiplerinin en çok merak ettiği konulardan biri olan <strong>Kasko ve Trafik Sigortası</strong> arasındaki farklar, olası kaza durumlarında hayati önem taşır. Trafik sigortası, devlet tarafından zorunlu tutulan ve kaza anında karşı tarafın hasarını karşılayan bir sistemdir. Kasko ise tamamen sizin aracınızı güvence altına alan isteğe bağlı bir sigorta türüdür.</p>
      
      <h2>Zorunlu Trafik Sigortası Neleri Kapsar?</h2>
      <p>Trafik sigortası, bir kazaya karıştığınızda kusurlu taraf sizseniz, karşı tarafın maddi hasarlarını ve bedeni zararlarını poliçe limitleri dahilinde karşılar. Sizin aracınızdaki hasarlar trafik sigortası kapsamına girmez. Bu nedenle sadece zorunlu olduğu için değil, trafikteki hukuki sorumluluklarınızı yerine getirmek için de poliçenizin sürekli güncel olması gerekir.</p>

      <h2>Kasko Sigortası Neden Gereklidir?</h2>
      <p>Kasko sigortası, aracınızın çalınması, yanması, kaza sonucu hasar görmesi veya doğal afetlere maruz kalması durumlarında kendi maddi zararınızı karşılar. Günümüzde araç fiyatlarının ve yedek parça maliyetlerinin artması, kasko yaptırmayı bir lüks olmaktan çıkarıp zorunlu bir güvence haline getirmiştir.</p>
      
      <h3>Başlıca Kasko Teminatları:</h3>
      <ul>
        <li>Çarpma ve Çarpışma</li>
        <li>Araç Çalınması veya Çalınmaya Teşebbüs</li>
        <li>Yangın ve Patlama</li>
        <li>Doğal Afetler (Sel, Dolu, Deprem)</li>
        <li>İhtiyari Mali Mesuliyet (İMM)</li>
      </ul>

      <h2>Elisam Sigorta ile Güvendesiniz</h2>
      <p>Alanya'nın en güvenilir sigorta acentesi <strong>Elisam Sigorta</strong> olarak, size en uygun Kasko ve Trafik poliçelerini tek ekranda karşılaştırarak sunuyoruz. Hemen bizimle iletişime geçin ve aracınızı güvenle kullanmanın tadını çıkarın.</p>
    `,
    author: 'Mustafa Şahin',
    date: '2023-11-15',
    imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80',
    category: 'Araç Sigortaları',
    readTime: '4 dk okuma'
  },
  {
    id: 'tamamlayici-saglik-sigortasi-tss-avantajlari',
    title: 'Tamamlayıcı Sağlık Sigortası (TSS) Yaptırmanın 5 Önemli Avantajı',
    excerpt: 'Özel hastanelerde fark ücreti ödemeden muayene olmanızı sağlayan Tamamlayıcı Sağlık Sigortasının bilinmeyen avantajları.',
    content: `
      <h2>Tamamlayıcı Sağlık Sigortası (TSS) Nedir?</h2>
      <p>SGK güvencesine sahip kişilerin, SGK ile anlaşmalı özel hastanelerde gördükleri tedaviler sonrasında ortaya çıkan fark ücretlerini karşılayan bir sağlık sigortası türüdür. Sağlığınıza yatırım yapmak istiyorsanız TSS en mantıklı seçeneklerden biridir.</p>

      <h2>TSS\'nin En Büyük Avantajları</h2>
      <ol>
        <li><strong>Fark Ücreti Ödemezsiniz:</strong> Muayene, tahlil ve yatarak tedavilerde özel hastane veznesinde sürpriz faturalarla karşılaşmazsınız.</li>
        <li><strong>Geniş Hastane Ağı:</strong> Türkiye genelinde yüzlerce elit özel hastanede geçerlidir. Seçkin doktor kadrolarına kolayca erişebilirsiniz.</li>
        <li><strong>Gelişmiş Teşhis:</strong> MR, Tomografi gibi pahalı teşhis yöntemleri ve laboratuvar hizmetleri poliçe kapsamındadır.</li>
        <li><strong>Uygun Primler:</strong> Özel Sağlık Sigortalarına (ÖSS) göre çok daha ekonomik primlerle yüksek standartlarda hizmet alırsınız.</li>
        <li><strong>Yatarak Tedavilerde Sınırsız Limit:</strong> Ameliyatlar ve hastanede yatış gerektiren durumlarda genellikle limitsiz olarak güvence altındasınız.</li>
      </ol>

      <h2>Kimler TSS Yaptırabilir?</h2>
      <p>SGK güvencesi aktif olan, genellikle 0-60 yaş arası (şirketten şirkete değişiklik gösterebilir) herkes Tamamlayıcı Sağlık Sigortasından yararlanabilir. Siz de ailenizin ve kendi sağlığınızı güvence altına almak için geç kalmayın.</p>
    `,
    author: 'Mustafa Şahin',
    date: '2023-10-28',
    imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80',
    category: 'Sağlık Sigortaları',
    readTime: '3 dk okuma'
  },
  {
    id: 'konut-sigortasi-ve-dask-farklari',
    title: 'Konut Sigortası ile DASK Aynı Şey Midir?',
    excerpt: 'Ev sahipleri ve kiracılar için rehber niteliğinde: DASK neleri korur, Konut sigortası neden ek olarak alınmalıdır?',
    content: `
      <h2>DASK (Zorunlu Deprem Sigortası) Nedir?</h2>
      <p>DASK, deprem ve deprem kaynaklı (yangın, infilak, tsunami veya yer kayması) maddi hasarları karşılayan zorunlu bir sigortadır. Binanın sadece temeli, duvarları ve çatısı gibi yapısal unsurlarını belirli bir limite kadar güvence altına alır.</p>

      <h2>DASK Yeterli Mi?</h2>
      <p>Birçok ev sahibi sadece DASK yaptırarak evinin tam güvencede olduğunu düşünür, ancak bu çok büyük bir yanılgıdır. DASK evinizin içindeki <strong>eşyalarınızı korumaz</strong>. Ayrıca su baskını, hırsızlık, komşuya verilen zararlar veya standart ev yangınları DASK kapsamında değildir.</p>

      <h2>Konut Sigortasının Kapsamı</h2>
      <p>Konut Sigortası; evinizi ve içindeki tüm eşyalarınızı hırsızlıktan su baskınına, yangından cam kırılmasına kadar çok geniş bir yelpazede korur. Ayrıca:</p>
      <ul>
        <li><strong>Eşya Güvencesi:</strong> Beyaz eşyalar, mobilyalar, elektronik aletler koruma altındadır.</li>
        <li><strong>Tesisat ve İzolasyon:</strong> Su borusu patlaması sonucu evinize veya alt komşunuza sızan suların verdiği zararları karşılar.</li>
        <li><strong>Asistans Hizmetleri:</strong> Çilingir, acil tesisatçı veya kombi bakımı gibi ekstra hayat kurtaran hizmetleri ücretsiz sunar.</li>
      </ul>

      <h2>İkisi Bir Arada Güçlü Koruma</h2>
      <p>DASK yasal bir zorunlulukken, Konut Sigortası sizin huzurunuz için gereklidir. Elisam Sigorta üzerinden en kapsamlı poliçeyi dakikalar içinde oluşturabilir, yuvanızı tüm risklere karşı tam koruma altına alabilirsiniz.</p>
    `,
    author: 'Mustafa Şahin',
    date: '2023-09-12',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80',
    category: 'Konut Sigortaları',
    readTime: '5 dk okuma'
  }
];
