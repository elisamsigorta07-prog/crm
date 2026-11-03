# Telegram poliçe botu

Bot, CRM ile aynı Next.js Node sunucu rotalarında webhook üzerinden çalışır.
Bilgisayarın açık kalması gerekmez; canlı HTTPS uygulaması ve sunucu ayarları
gereklidir. Bu çalışma siteyi yayımlamaz ve kendiliğinden webhook kaydetmez.

## Kullanım

- Hazır **Poliçe sorgula** butonu sonrasında TC, ad soyad veya poliçe numarası yazılır.
  TC ve müşteri kartı eşleştirilir. Tam poliçe numarasıyla arama, aynı müşteri
  kimliğine bağlı diğer poliçeleri de getirir. İsim benzerliklerinde birden çok
  kişi gelebilir; TC ve poliçe bilgileri sonuçlarda gösterilir.
- Bilgiler doğrudan `policies` ve `customers` kayıtlarından gelir. PDF yüklenmiş
  olması gerekmez. Sadece eski tarayıcı yerel belleğinde duran bilgiler botta
  görünmez; Supabase'de kayıtlı olmalıdır.
- Her poliçenin bilgileri ayrı mesajlarda gönderilir. Uzun içerikler bölünür;
  sonuçlar beşer kayıtla sayfalanır ve **Sonraki 5 poliçe** butonu kullanılır.
- **Bitişi yaklaşan poliçeler** bugünden üç takvim ayı sonuna kadar tarar.
  Ay sonunda hedef ayın son günü kullanılır. Saat dilimi Europe/Istanbul'dur.
- **PDF gönder** sadece mevcut özel depodaki güncel PDF'yi Telegram dosyası olarak
  gönderir. PDF yoksa bunu açıklar; poliçe bilgileri yine gelir. Kaldırılan ek
  sürümleri gönderilmez. PDF veya yeni poliçe oluşturulmaz.
- Bot bu sürümde sorgulama yapar; poliçe veya müşteri verisini değiştirmez.
  Otomatik zamanlanmış bildirimler bu sürümde bulunmaz.

## Erişim

Botun adını bilen herkes Telegram'da mesaj yazabilir. Poliçe verisi alabilmek
için yönetici tarafından verilen, o kişinin sayısal Telegram kimliğine bağlı
192 bit rastgele kodla eşleştirme gerekir. CRM şifresi Telegram'a yazılmaz.

1. Kişi özel sohbette `/kimlik` yazar; CRM verisine erişmeden kendi kimliğini öğrenir.
2. Yönetici, kişinin bildirdiği kimliği doğrular. CRM → Ayarlar → Hatırlatmalar
   bölümünde kişi adı ve sayısal kimlikle kod oluşturur, yalnızca o kişiye iletir.
3. Kişi `/eslestir KOD` yazar. Kod 10 dakika geçerlidir, yalnızca belirtilen
   kimlikle bir kez eşleştirme sağlar. Açık kod sadece oluşturulduğu yanıt ve
   CRM ekranında gösterilir; sunucu deposunda yalnızca SHA-256 özeti tutulur.
4. Birden çok kişi bağımsız eşleştirilebilir. Yetkilendirilen her kişi acentenin
   tüm poliçe ve müşteri bilgilerine erişir; müşteri bazında daraltma yoktur.
5. Yönetici erişimi kapatabilir. Yeni kod oluşturmak da eski oturumu geçersiz
   kılar. Kullanıcının **Erişimi kapat** butonu kendi bağlantısını kapatır.
   Yeniden bağlantı için yeni kod gerekir. Her sorgu ve dosya gönderiminden
   hemen önce yetki tekrar kontrol edilir. Yola çıkmış bir yanıt geri alınamaz.

Grup/kanal sohbetleri, başka botlar ve iletilmiş sorgular işlenmez. Kullanıcı adı
yerine Telegram'ın gönderdiği sayısal kullanıcı kimliği esas alınır. Telegram
hesabına erişen kişi o hesabın yetkilerini kullanabilir; hesap koruması önemlidir.
Erişimi kapatmak önceden gönderilmiş Telegram mesajlarını veya PDF kopyalarını
silmez. `protect_content` kullanılır, ancak bu tam bir veri kopyalama engeli değildir.

Canlı kullanım öncesi proje kökündeki `GUVENLIK-KURULUM.md` uygulanmalıdır.
Güvenlik güncellemesi veritabanında atomik istek sınırı ekler. 3 Kasım isteğiyle
MFA zorunluluğu kaldırılmıştır. Güvenlik SQL'si uygulanana kadar eski anonim tablo erişimi devam eder ve
güvenlik RPC'sine bağlı bot sorguları güvenli biçimde başarısız olur. Yönetici
paneli e-posta ve şifreyle kullanılır. Daha önce açıkta bulunan eski
şifrenin riski yalnızca bot kimlik kontrolüyle giderilemez.

## Kurulum

1. Resmî `https://t.me/BotFather` hesabında `/newbot` ile bot hesabı oluşturun.
2. Tokenı `.env.local` dosyasına yalnızca sunucuda `TELEGRAM_BOT_TOKEN` olarak
   ekleyin. `NEXT_PUBLIC_` öneki kullanmayın; sohbet veya kaynak koduna koymayın.
3. `npm run crm:telegram:setup` özel `telegram-bot-state` Storage deposunu hazırlar,
   eksikse `TELEGRAM_WEBHOOK_SECRET` üretip `.env.local` dosyasına ekler. Yeni SQL
   tablosu veya genel Storage RLS izni eklenmez. JSON üyelikler, eşleştirmeler ve
   kısa ömürlü buton referansları bu özel depoda tutulur. PDF deposundan ayrıdır.
4. Sunucuyu yeniden başlatın. Yönetim ekranı anahtarları veya kod özetlerini döndürmez.
5. İleride uygulama yayımlandığında, hosting ayarlarına mevcut Supabase ortam
   değişkenleriyle birlikte aynı `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` ve
   `TELEGRAM_WEBHOOK_URL=https://ALAN-ADI/api/telegram/webhook` değerlerini ekleyin.
6. Aynı URL'yi yerel sunucu ayarına da yazıp
   `npm run crm:telegram:setup -- --register-webhook` çalıştırın. Bu açık komut
   Telegram'daki botun mesaj yönlendirmesini değiştirir; siteyi yayımlamaz.
   `getMe`/`getWebhookInfo` üzerinden panelde bağlantı doğrulanır.

Webhook istekleri Telegram'ın `X-Telegram-Bot-Api-Secret-Token` başlığı ile
doğrulanır. Token URL'si ve ham Telegram hataları istemciye/loga aktarılmaz.
Tekrar teslim edilen güncellemeler sorgu yanıtlarını tekrarlayabilir; iş kayıtları
değiştirilmez. Eşleştirme tek nesne oluşturma ve sürüm kimliğiyle korunur.

Üyelik geçmişi ve süresi dolan buton nesneleri otomatik temizlenmez; depo bakımında
yalnızca süresi dolmuş butonlar ve eski nesil oturum kayıtları kaldırılabilir.
Eski tarayıcıdaki `elisam_telegram_config` ayarı panel açıldığında kaldırılır.

## Doğrulama

`npm run test:telegram` yetkisiz hesapları, grup/iletilmiş mesajları, yanlış kişide
kod kullanımını, süre sonunu, iptali, TC/isim/numara sorgusunu, üç aylık tarih
aralığını, sayfalamayı, PDF yetki sınırlarını ve ayrıntıların korunmasını sınar.
Gerçek Telegram teslimi için BotFather tokenı ve canlı HTTPS webhook gerekir.
`node scripts/test-telegram-storage-live.mjs` gerçek Supabase üzerinde geçici
bot kayıtları ve sahte kimliğe ait sentetik PDF kullanır; Telegram taşımasını
taklit eder. Gerçek iş kayıtları veya müşteri PDF'leri değiştirilmez ve geçici
kayıtlar temizlenir. Bu test gerçek Telegram teslimi yapıldığını kanıtlamaz.
