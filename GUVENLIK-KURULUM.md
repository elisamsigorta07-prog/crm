# Güvenlik kurulumu — 3 Kasım 2026

**Kod düzeltildi; canlı Supabase izinleri henüz uygulanmadı.** Son salt okunur
kontrol, eski kullanıcı, müşteri, poliçe ve cari tablolarında anonim erişimin
devam ettiğini gösterdi. Aşağıdaki SQL çalıştırılmadan bu açık kapanmış sayılmaz.
Site yayımlanmadı. Gerçek kullanıcı şifreleri ve doğrulama faktörleri değiştirilmedi.

3 Kasım hesap geçişi: Kullanıcının doğruladığı mevcut
`eray@elisamsigorta07.com` personel hesabı, eski şifresi yalnızca işlem belleğinde
kullanılarak Supabase Auth'a taşındı ve gerçek giriş doğrulandı. Şifre dosyaya,
koda veya çıktıya yazılmadı. Eski girişin sağladığı Sigorta ve Rent erişimleri
korundu; yönetici yetkisi verilmedi. Böylece mevcut iki hesabın Auth karşılığı
hazırdır. Yeni personel hesapları yönetici panelinden Auth üzerinden oluşturulur.

Aktif kullanıcılar nedeniyle canlı geçiş sırası önemlidir: hesaplar hazırlanır,
yeni uygulama sürümü kontrollü biçimde yayımlanır, aktif kullanıcılar sayfayı
yenileyip yeni girişle oturum açar; sonra güvenlik SQL'si uygulanır ve bulut
denetimi çalıştırılır. Yeni sürüm yayımlanmadan SQL'yi çalıştırmak eski canlı
sürümün veri erişimini kesebilir. Yayın ve canlı SQL bu hesap geçişinde yapılmadı.

## Kullanımı zorlaştırmadan kurulum

1. Supabase projenin panelinde **SQL Editor → New query** aç. Şu dosyanın tamamını
   kopyalayıp **Run** ile çalıştır:

   `supabase/migrations/20261102000100_crm_security.sql`

   SQL müşteri, poliçe veya finans kayıtlarını silmez. Eski kullanıcı tablosundaki
   düz metin şifreleri kullanımdan kaldırır; Supabase Auth'taki mevcut şifreni
   değiştirmez. Anonim veri erişimini hemen kapatır. Bu nedenle eski yayındaki
   CRM sürümü bu işlemden sonra verilere erişemeyebilir; yeni sürüm yerelde
   kullanılabilir, yayın için ayrıca karar verilmelidir. SQL tek işlemdir; hata
   olursa tamamı geri alınır. İşlem öncesinde Supabase yedeğinin mevcut olduğunu
   kontrol et. Bu çalışma otomatik yedek/PITR veya hosting güvenlik duvarı kurmadı.

2. `npm run dev` ile yerel uygulamayı aç; mevcut hesabınla e-posta ve şifre
   kullanarak giriş yap. Telefon kodu veya doğrulama uygulaması kurulumu zorunlu
   değildir. Panel yetkileri ve anonim erişim engeli korunur. Şifre değiştirilmedi.

Önceki güvenlik SQL'sini zaten çalıştırdıysan ana dosyayı tekrar uygulamak yerine
`supabase/migrations/20261103000100_optional_crm_mfa.sql` dosyası yalnızca zorunlu
MFA koşulunu kaldırır; mevcut politika, kayıt ve şifreleri değiştirmez. Henüz
hiç SQL çalıştırmadıysan güncellenmiş ana dosya yeterlidir. Bu değişiklikler
canlıya otomatik uygulanmadı ve site yayımlanmadı.

SQL sonucu veya doğrulama kodunu paylaşırken müşteri verilerini, QR kodunu,
şifreyi veya `.env.local` dosyasını bu sohbete yapıştırma.

## Doğrulama

`npm run security:audit:cloud` canlı Supabase'i salt okunur kontrol eder. SQL
uygulanmadan önce başarısız olması beklenir. Sonuçlarda anonim erişim kapalı,
iki depo özel ve güvenlik işlevi mevcut olmalıdır. Telefon doğrulaması zorunlu değildir. `npm run test:security` SQL'yi ayrı PostgreSQL
motorunda, tamamen sentetik verilerle doğrular.

Kodda yapılanlar:

- Koda yazılmış yönetici şifresi ve eski tabloyla şifre karşılaştırma kaldırıldı.
- Her iki panel aynı gerçek Auth oturumunu kullanır. Sigorta ve Rent yetkileri
  ayrılır. Hassas API'ler imzalı oturumu ve güncel personel yetkisini kontrol eder.
- Kullanıcılar sunucu tarafında yönetilir. Şifreler listeye/yanıta yazılmaz;
  yeni personelin panel yetkisi yönetici tarafından seçilir. Kapalı hesaplar
  eski JWT'leri olsa da yeni veritabanı sorgularında engellenir.
- SQL anonim erişimi kapatır, eski açık politikaları kaldırır ve erişimi canlı
  Auth üyeliği ve panel yetkisiyle sınırlar. Eski ek tablolar ve görüntüler de varsayılan
  olarak kapatılır. Özel dosya depolarına genel bir izinle erişim verilemez.
- CRM'de her isteğe özel CSP nonce, çerçeveleme engeli, `nosniff`, önbellekleme
  engeli, referrer kısıtı ve üretimde HTTPS taşıma başlığı eklendi. Üretim tarayıcı
  source map'leri kapalıdır. Tarayıcıya gönderilen arayüz kodu doğası gereği
  görülebilir; sunucu anahtarları tarayıcı paketine konmaz.
- API istek gövdeleri okunurken boyut sınırı uygulanır; farklı kaynaktan CRM
  API çağrıları reddedilir. Sunucu ve bot sorguları veritabanında atomik istek
  sınırı kullanır. Bu, hosting seviyesinde DDoS korumasının yerine geçmez.
- İş kayıtlarındaki değişiklikler verilerin kendisini kopyalamadan özel denetim
  tablosuna kaydedilir. Telegram botu yalnızca kişisel kimlik eşleştirmesiyle
  kullanılabilir; eski tarayıcı tokenıyla serbest gönderim yolları kaldırıldı.

## Sınırlar ve devam eden işler

- Eski şifren geçmişte kodda/açık tabloda bulunduğu için sızmış kabul edilmelidir.
  Kullanıcının isteği gereği Auth şifresi otomatik değiştirilmedi ve telefon kodu
  zorunluluğu kaldırıldı. Bilinen eski şifrenin riski devam eder; yeni ve güçlü bir
  parola kullanmak önerilir. Yetkisiz veri erişimini kapatmak bu riski tek başına
  ortadan kaldırmaz. Eski /crm/guvenlik bağlantıları doğrudan panele yönlendirilir.
- Kullanıcının doğruladığı yukarıdaki mevcut personel dışında eski diğer
  personel kayıtları otomatik olarak güvenilir sayılmaz. Yönetici,
  yeni Kullanıcılar ekranından meşru kişilere Auth hesabı açmalıdır. Parolalar
  eski tablodan otomatik olarak yeni hesaplara kopyalanmaz; yukarıdaki doğrulanmış
  hesap için kullanıcı isteğine dayalı tek seferlik geçiş yapılmıştır.
  Kurulum komutları mail göndermez.
- Daha önce tarayıcıda kaydedilmiş iş verileri, eski IndexedDB PDF'leri ve dışa
  aktarılmış dosyalar otomatik silinmedi. Bunların korunması cihaz/oturum
  güvenliğini de gerektirir; bulut RLS kuralları bilgisayardaki kopyaları silemez.
- Telegram'a önceden gönderilmiş veri kopyaları erişim iptaliyle geri alınamaz.
- Üretim bağımlılıklarında son npm taramasında bilinen açık bulunmadı. Geliştirme
  araçlarının `minimatch` zincirinde 16 orta seviyeli uyarı kaldı. npm'in önerdiği
  ESLint 4'e zorunlu düşürme güvenli bir çözüm olmadığı için uygulanmadı. Bu
  araçlar üretim sunucusunda kullanıcı isteklerini işlemez; güvenilmeyen glob
  kalıplarıyla çalıştırılmamalı ve uyumlu üst paket düzeltmeleri izlenmelidir.
- Supabase proje hesabının kendi MFA ayarları, Auth CAPTCHA/limit ayarları,
  hosting erişimi, yedekler/PITR ve düzenli anahtar yenileme panel erişimiyle
  ayrıca doğrulanmalıdır. Hiçbir sistem için sıfır saldırı riski garantisi yoktur.
