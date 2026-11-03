# Poliçe PDF özelliği

Poliçeler → Yeni Poliçe → **PDF’den Al** ile belge okunur. Bulunan alanlar,
okunan kaynak metinle birlikte kontrol ekranında gösterilir. Kullanıcı alanları
seçer/düzeltir ve forma aktarır. Aynı PDF formun sonundaki ek alanına da seçilir.
Manuel ve hızlı metin girişi kullanılmaya devam eder. Düzenleme ekranında ek
değiştirilebilir veya kaydetme sırasında kaldırılabilir. Detay ekranından PDF
açılır ve indirilir.

## Okuma

- PDF.js metin parçalarının fiziksel konumlarını kullanır; PDF'nin iç çizim sırası
  yerine satır/sütun sırası yeniden oluşturulur. Kelime aralıkları ile tablo
  sütunları ayrılır. Yeterli metin içermeyen, karakterleri bozuk veya arama yapılabilen
  başlıkla taranmış gövde içeren sayfalar Türkçe/İngilizce Tesseract OCR ile okunur.
  Gerektiğinde kullanıcı tüm sayfaları görselden okumayı seçebilir. Belge bir
  yapay zekâ servisine gönderilmez.
- PDF/OCR çalışma dosyaları `scripts/prepare-pdf-assets.mjs` ile yerel sunucuya
  kopyalanır. Türkçe/İngilizce dil modelleri de npm paketlerinden aynı sunucuya
  hazırlanır; tarayıcı OCR için harici CDN'ye bağlanmaz.
- 20 MB dosya sınırı, bilgi çıkarma için 30 sayfa sınırı vardır.
- Alan çıkarma Türkçe alan başlıklarına dayanır; farklı şirketlerin etiketli
  düzenlerini destekler. Genel amaçlı yapay zekâ çıkarımı değildir. Etiketsiz,
  karmaşık tablolarda, çok sütunlu veya bulanık belgelerde manuel düzeltme
  gerekebilir. Birden fazla farklı değeri olan alanlar otomatik seçilmez.
- Sigortalı, sigorta ettiren ve şirket/acente bölümleri ayrı değerlendirilir.
  Ayrı ad ve soyad alanları birleştirilebilir. Birleşik başlangıç-bitiş tarihleri,
  ürün başlığından poliçe türü ve toplam ödenecek prim başlıkları desteklenir.
  Her doldurulan alanın kaynak satırı inceleme ekranında gösterilir.
- Yatay başlık/değer tablolarında tüm sütunlar (acente, müşteri, yenileme,
  düzenleme tarihi gibi içe aktarılmayanlar dahil) eşleştirilir. Başlık/değer
  sayıları uyuşmazsa sayı tahmin edilmez; kullanıcıya kontrol uyarısı verilir.
  Poliçe numarası alanına EK, Zeyil gibi başlık metinleri kabul edilmez.
- `Poliçe/Yenileme No` birleşik alanında ana poliçe numarası alınır; normal
  `Poliçe No` alanındaki eğik çizgili numaralar korunur. Önceki poliçe ve SBM
  referansları ana numara olarak kullanılmaz.
- Şirket/acente ve sigortalı/sigorta ettiren yan yana bloklarında soldaki bölümün
  rolü korunur. Genel sözleşme metinleri veya imza başlıkları kişi adı olamaz.
- Sayfalar önce metin katmanından incelenir. Daha sonraki sayfada temel poliçe
  bilgileri tam bulunduysa, tamamen metinsiz ön kapak için OCR zorunlu tutulmaz.
  Eksik veya bozuk metinlerde OCR uygulanır; kullanıcı OCR'yi ayrıca zorlayabilir.
- Metin katmanı uzun olsa bile temel alanlar eksikse ilgili en fazla üç metinli
  sayfada ek OCR denenir. OCR kelime kutularıyla sütun/satır konumları yeniden
  oluşturulur; yetersiz sonuçta seyrek metin düzeniyle ikinci okuma yapılır.
  OCR başarısız olursa okunabilen metin kaybedilmez ve ilgili sayfa için uyarı verilir.
- Okuma durdurulabilir. Önceki sonuçlar iptal veya başarısız yeniden okumada
  korunur. Kullanıcı PDF'yi yeniden seçmeden görselden tekrar deneyebilir.
- Her alan için kaynak sayfası gösterilir. Aynı dosyada farklı poliçeler bulunursa
  karışık form aktarımı engellenir; kullanıcı incelenecek sayfayı seçebilir.
  Metin/OCR farklı değerler verdiğinde iki okuma seçenek olarak gösterilir.
- Düşük OCR okuma kalitesine sahip alanlar otomatik seçilmez. Kullanıcının seçtiği
  veya düzelttiği değerler forma aktarılmadan önce tekrar doğrulanır; geçersiz
  tarih, kimlik/telefon biçimi ve net primin brütten büyük olması kontrol edilir.
- Çok satırlı şirket isimlerinde açık kurumsal ekler (ör. "SANAYİ VE TİCARET",
  "LİMİTED ŞİRKETİ") birleştirilir; adres veya rastgele sonraki sözcükler eklenmez.
- Maskelenmiş kişisel bilgiler için uyarı verilir. Maskeli müşteri iletişim
  bilgisi yerine belgenin sonundaki acente e-postası/telefonu kullanılmaz.
- İptal/fesih zeyli algılandığında normal aktif poliçe formuna aktarma kapatılır.
  Zeyil tarihleri ana poliçe vadesinin yerine alınmaz. Negatif/iade primleri normal
  poliçe primine çevrilmez. İptal işlemi veya finans hareketi otomatik yapılmaz.
- Türkçe ve İngilizce tutarlar mevcut para normalizasyonundan geçirilerek forma
  Türkçe sayı biçiminde aktarılır; örneğin `21,091.35` → `21.091,35`.
- Başlıklardaki farklı Unicode boşlukları, görünmeyen ayırıcılar ve tam genişlikli
  iki nokta normalize edilir. Ad/soyad alanları aynı satırda, alt alta veya ayrı
  tablo hücrelerinde olabilir. Birden çok farklı ad/soyad parçası varsa rastgele
  birleştirme yapılmaz. Maskelenmiş adlar da tam isim gibi doldurulmaz.
- İki taraflı bloklarda sigortalı ve şirket sağ sütunda da bulunabilir. Tekrarlanan
  etiketler sütun rolleriyle birlikte okunur; eksik etiketlerde sol sütun varsayılmaz.
- Binlik ayracı boşluk olan tutarlar da desteklenir. Negatif primler ve açıkça
  döviz cinsinde belirtilmiş primler TL formuna sessizce aktarılmaz.
- Telefon için sigortalıya ait etiket veya cep/GSM alanı aranır. Acente telefonu
  ve düzenleme tarihi müşteri telefonu / başlangıç tarihi olarak alınmaz.
- Yeni şirket örnekleriyle `policyPdfFields.ts` içindeki etiket eşleşmeleri
  ve örnek belge testleri genişletilebilir.

## Saklama ve bulut kurulumu

Yeni PDF'ler artık **yalnızca Supabase özel `policy-documents` deposuna** yazılır.
Bağlantı veya yetki hatasında yerel başarı taklidi yapılmaz. Başka cihazda aynı
yetkili hesapla oturum açıldığında aynı bulut eki görünür.

Sigorta CRM girişi gerçek Supabase Auth kullanır. Giriş sırasında eski `app_users`
tablosundaki şifreler okunmaz; eski istemci yönetici kısayolu PDF yetkisi vermez. Dosya
API'si her istekte `auth.getUser(accessToken)` ile kullanıcıyı doğrular ve yalnızca
**sunucu tarafından atanmış** `app_metadata.crm_workspace=elisam` ve
`crm_staff=true` değerlerini kabul eder. Kullanıcının değiştirebildiği
`user_metadata` veya yalnızca Auth'a kayıt olmuş olmak erişim sağlamaz.

API, yetkili personel için tek bir acente çalışma alanını paylaşır. Bucket için
anonim veya genel authenticated RLS izni eklenmedi. Servis anahtarı `server-only`
modülde kullanılır, tarayıcıya gönderilmez. 2 Kasım güvenlik güncellemesinde her
iki panel de aynı gerçek Auth istemcisine geçirildi. 3 Kasım güncellemesiyle
MFA zorunluluğu kaldırıldı; yetkili hesaplar şifreyle giriş yapabilir.
İş tablolarının yeni RLS kuralları `20261102000100_crm_security.sql` dosyasındadır.
Bu SQL canlıda uygulanmadan anonim veri erişimi kapatılmış sayılmaz.
Güncel kurulum ve doğrulama için proje kökündeki `GUVENLIK-KURULUM.md` dosyasını okuyun.

Kurulum:

1. Sunucuda `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` ve
   **yalnızca sunucuda** `SUPABASE_SERVICE_ROLE_KEY` tanımlanmalıdır.
2. `npm run crm:setup -- --owner-email admin@elisamsigorta07.com` özel bucket'ı ve
   mevcut CRM yöneticisine ait ayrı Auth hesabını hazırlar. E-posta göndermez,
   eski şifreyi kopyalamaz. Hesapta bilinmeyen rastgele başlangıç şifresi vardır;
   kullanıcı tek kullanımlık bağlantıyla kendi yeni şifresini belirler.
3. Kurulum dosyası varsayılan olarak işletim sisteminin geçici özel klasörüne
   yazılır; kaynak koduna veya OneDrive proje dizinine yazılmaz. Konum için
   `--output-dir <özel-yerel-klasör>` verilebilir. Süreli bağlantı geçersizleşirse
   aynı komut yeni bağlantı oluşturur; mevcut Auth şifresini değiştirmez.
4. Diğer mevcut personel için, yönetici terminalinden
   `npm run crm:setup -- --staff-email <mevcut-personel-epostası>` çalıştırılabilir.
   Eski tabloya kullanıcı eklemek tek başına PDF erişimi vermez. Üretilen personel
   bağlantısını paylaşmak veya e-posta göndermek otomatik yapılmaz.

Supabase özel bucket'ı ve yönetici Auth hesabı oluşturuldu. 2 Kasım 2026 tarihinde
kullanıcının isteğiyle yalnızca `admin@elisamsigorta07.com` hesabının mevcut panel
şifresi Auth hesabıyla tek seferlik eşitlendi ve gerçek giriş doğrulandı. Bu hesap
için kurulum bağlantısı veya yeni şifre belirleme adımı gerekmez. Şifre kaynak
koduna, dosyaya veya işlem çıktısına yazılmadı; diğer hesaplar değiştirilmedi.
Site kodu yayına alınmadı. Üretimde Node.js sunucu rotaları ve yukarıdaki ortam
değişkenleri gereklidir; yalnızca statik dosyaları yayınlamak yeterli değildir.

Yükleme akışı: poliçe kaydı → tek yola özel imzalı yükleme → PDF baytlarının
doğrudan Supabase'e gönderilmesi → sunucuda boyut/PDF başlığı doğrulaması → kalıcı
ek sürümü. Sunucuya PDF gövdesi POST edilmez; 20 MB dosyalar büyük API istek
gövdesine bağlı kalmaz. Uygulama yükleme izni 15 dakika, indirme bağlantısı
60 saniyedir. Başka bir işlem dosyayı değiştirirse eski revizyonla işlem reddedilir.

Dosya adları ve poliçe kimlikleri ham Storage klasörüne dönüştürülmez; kimlik
hash'lenir, Türkçe dosya adı sürümlü ad içinde korunur. Yeni sürüm önceki PDF'yi
silmez. Ek kaldırmak bir kaldırma işareti oluşturur; eski baytlar yönetici kurtarması
için tutulur. Henüz son kullanıcıya sürüm geçmişi/geri alma arayüzü eklenmedi.
Başarısız doğrulamaların geçici dosyaları temizlenir; yarım bırakılmış yüklemeler
için depolama yönetimi sırasında bakım gerekebilir.

Eski IndexedDB ekleri silinmedi. Detayda **Eski PDF’yi Supabase’e aktar** ile
taşınabilir; başarılı aktarımdan sonra bulut kopyası öncelikli okunur. Yeni PDF
verisi `localStorage`/IndexedDB'ye yazılmaz. Poliçe numarası düzenlense de kayıt
kimliği sabit kaldığından ek bağlantısı korunur. Poliçe kaydı başarılı, PDF yüklemesi
başarısızsa açık hata gösterilir ve aynı poliçede tekrar denenebilir.

## Kontrol

`npm run test:policy-pdf`, `npm run test:policy-ocr`, `npx tsc --noEmit`, `npm run build`.
`npm run test:policy-storage` erişim kuralları ve imzalı yükleme izinlerini sınar.
`node scripts/test-policy-storage-live.mjs`, açık yerel geliştirme sunucusuna karşı
yalnızca üretilmiş test PDF'leri ve geçici Auth hesaplarıyla gerçek yükleme,
indirme, sürüm koruma ve yetkisiz erişim reddini doğrular. Müşteri PDF'si yüklemez,
iş kaydı oluşturmaz/değiştirmez ve yalnızca kendi test verilerini temizler.
Testler yerleşik TypeScript desteği olan Node.js sürümü gerektirir; bu ortamda
Node.js 25 ile çalıştırıldı.

Otomatik kombinasyon testi 2.205 benzersiz metin/eşleştirme vakasını kontrol eder;
ayrıca 200 farklı çizim sırası, yazı boyutu ve küçük konum sapması içeren metin
girdisi üretir. Bunlara 900 ad/unvan varyasyonu, poliçe başlıklarının 720 sütun
sıralaması, kişisel bilgi tabloları, Unicode boşluklar, ayrı ad/soyad, birleşik
tarihler, parasal biçimler ve yanlış eşleşmeden kaçınma senaryoları dahildir.
Başarılı sonuç görmediğimiz bütün PDF'ler için doğruluk garantisi değildir;
özellikle OCR'nin gerçek tarama kalitesi bu sentetik metin testleriyle ölçülmez.
`test:policy-ocr` buna ek olarak sentetik görselleri gerçekten Tesseract ile
okur: normal satır, yan yana bloklar, küçük yazı, hafif eğim, düşük kontrast ve
ters sütun sırası örneklerini sınar. Harici servise belge göndermez. Bu deneyler
farklı gerçek taramalardaki doğruluk oranını temsil etmez.
`node scripts/inspect-policy-pdf.mjs <yerel.pdf>` metinli bir PDF'yi yüklemeden
inceler; kişisel değerleri yazdırmadan bulunan alan adlarını ve uyarıları listeler.

Bir kullanıcının sağladığı beş belgede (konut, üç trafik poliçesi ve bir iptal
zeyli) temel alanlar görsel sayfalarla karşılaştırıldı. Dört yeni dosyanın da ana
poliçe numarası doğrulandı. Orijinal belgeler ve kişisel değerleri testlere veya
kaynak koduna eklenmedi; testlerde sentetik örnekler kullanılır. Farklı şirketler
genelinde doğruluk oranı henüz ölçülmedi. Üretim öncesinde kişisel bilgileri maskelenmiş
metinli, taranmış ve çok sütunlu örneklerle kabul testi gerekir. Hazır AI servisleri
araştırıldı ancak henüz bir sağlayıcı/API entegrasyonu yapılmadı.
