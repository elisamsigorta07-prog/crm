/**
 * Excel / CSV İçe-Dışa Aktarım ve Alan Formatlayıcı Yardımcıları
 * Elisam Sigorta & Finans CRM
 */

/**
 * Excel'in uzun sayıları (TCKN, Poliçe No, Telefon vb.) bilimsel gösterime (2,00037E+12)
 * çevirmesini ve baştaki sıfırları ("0551...") yutmasını engelleyen metin formülü çıktısı üretir.
 * 
 * Örnek Çıktı: ="20003712345" veya ="05514387771"
 * Excel bu formülü gördüğünde hücreyi saf metin olarak yorumlar ve biçimlendirmeyi korur.
 */
export const formatExcelText = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null) return '""';
  const str = String(val).trim();
  if (!str) return '""';
  if (str === '-') return '"-"';
  // Çift tırnakları CSV ve formül uyumlu hale getir
  const escaped = str.replace(/"/g, '""');
  return `="${escaped}"`;
};

/**
 * Türk Lirası para formatını Excel'in (özellikle Türkçe Excel'in) doğru tanıması için
 * virgüllü ondalık ve noktalı binlik ayracı ile döndürür.
 * 
 * Örnek: 12450.5 -> "12.450,50"
 */
export const formatExcelCurrency = (val: number | string | undefined | null): string => {
  const num = typeof val === 'number' ? val : Number(val);
  if (isNaN(num)) return '0,00';
  return num.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/**
 * Plaka ve Belge Seri No değerlerini birbirinden ayrıştırır.
 * Eğer plaka içine belge seri no (örn: CU 637314) veya "Belge Seri: ...", " / ", " - " karışmışsa,
 * bunları temizleyip bağımsız olarak döndürür.
 * 
 * Örnekler:
 * - ("07 ABC 123", "CU 637314") -> { plate: "07 ABC 123", docSerial: "CU 637314" }
 * - ("07 ABC 123 Belge Seri: CU 637314", "") -> { plate: "07 ABC 123", docSerial: "CU 637314" }
 * - ("38VH244 / CU 637314", "") -> { plate: "38VH244", docSerial: "CU 637314" }
 * - ("38VH244 CU 637314", "") -> { plate: "38VH244", docSerial: "CU 637314" }
 */
export function resolvePlateAndDocSerial(
  rawPlate?: string, 
  rawDocSerial?: string,
  rawNotes?: string
): { plate: string; docSerial: string } {
  let plate = (rawPlate || '').trim();
  let docSerial = (rawDocSerial || '').trim();
  const notes = (rawNotes || '').trim();

  if (plate === '-') plate = '';
  if (docSerial === '-') docSerial = '';

  // 1. Plaka içinde açık etiket varsa (örn: "Belge Seri No: CU 637314", "Ruhsat Seri: ...")
  const explicitBelgeRegex = /(?:Belge\s*Seri(?:\s*No)?|Ruhsat\s*Seri(?:\s*No)?|Seri\s*No|Belge\s*No|Ruhsat\s*No|Asbis(?:\s*No)?|Tescil(?:\s*No)?)[:\s]+([A-Za-z0-9\s/-]{3,25})/i;
  const explicitInPlate = plate.match(explicitBelgeRegex);
  if (explicitInPlate) {
    if (!docSerial) {
      docSerial = explicitInPlate[1].trim();
    }
    plate = plate.replace(explicitInPlate[0], '').trim();
  }

  // 2. Belge Seri hala boşsa ve notlar (notes) alanı verilmişse, notlardan çıkart
  if (!docSerial && notes) {
    const explicitInNotes = notes.match(explicitBelgeRegex);
    if (explicitInNotes) {
      const cleanVal = explicitInNotes[1].split(/[\r\n|;]/)[0].trim();
      if (cleanVal) docSerial = cleanVal;
    }
  }

  // 3. Plaka boşsa ve notlar (notes) alanı verilmişse, notlardan plaka çıkart
  if (!plate && notes) {
    const plateInNotes = notes.match(/(?:Plaka|Araç\s*Plakası)[:\s]+([A-Za-z0-9\s]{4,15})/i);
    if (plateInNotes) {
      const cleanPlate = plateInNotes[1].split(/[\r\n|;]/)[0].trim();
      if (cleanPlate) plate = cleanPlate;
    }
  }

  // 4. Plaka içinde "/" veya " - " ayracı varsa (örn: "07 ABC 123 / CU 637314" veya "38VH244 - CU637314")
  if (!docSerial && (plate.includes('/') || plate.includes(' - ') || plate.includes(' / '))) {
    const delimiter = plate.includes(' / ') ? ' / ' : (plate.includes('/') ? '/' : ' - ');
    const parts = plate.split(delimiter).map(p => p.trim()).filter(Boolean);
    if (parts.length === 2) {
      // Türkiye plakası genelde 2 basamaklı il kodu ile başlar (örn: 07 ABC 123, 34 A 1234)
      const part1IsTrPlate = /^\d{2}\s*[A-Za-z]{1,3}\s*\d{2,4}$/i.test(parts[0]);
      const part2IsTrPlate = /^\d{2}\s*[A-Za-z]{1,3}\s*\d{2,4}$/i.test(parts[1]);
      
      // Belge Seri genelde 1-2 harf + 4-8 rakamdır (örn: CU 637314, AS 123456)
      const part2IsSerial = /^[A-Za-z]{1,3}\s*[-/]?\s*\d{4,8}$/i.test(parts[1]);
      const part1IsSerial = /^[A-Za-z]{1,3}\s*[-/]?\s*\d{4,8}$/i.test(parts[0]);

      if (part1IsTrPlate || part2IsSerial) {
        plate = parts[0];
        docSerial = parts[1];
      } else if (part2IsTrPlate || part1IsSerial) {
        plate = parts[1];
        docSerial = parts[0];
      }
    }
  }

  // 5. Plaka içinde boşlukla ayrılmış plaka + belge seri varsa (örn: "38VH244 CU 637314" veya "07ABC123 CU637314")
  if (!docSerial && /\b\d{2}\s*[A-Za-z]{1,3}\s*\d{2,4}\b/i.test(plate)) {
    const combinedMatch = plate.match(/^(\d{2}\s*[A-Za-z]{1,3}\s*\d{2,4})\s+([A-Za-z]{1,3}\s*\d{4,8})$/i);
    if (combinedMatch) {
      plate = combinedMatch[1].trim();
      docSerial = combinedMatch[2].trim();
    }
  }

  // 6. Plaka alanına yanlışlıkla Belge Seri girilmişse (örn: "CU 637314" veya "HK 052602")
  const isTrDocSerialOnly = /^[A-Za-z]{2}\s*\d{6}$/i.test(plate);
  if (isTrDocSerialOnly && !docSerial) {
    docSerial = plate;
    plate = '';
  }

  // 7. Belge Seri alanına yanlışlıkla Plaka girilmişse (örn: "07 BSL 071")
  const isTrPlateOnly = /^\d{2}\s*[A-Za-z]{1,3}\s*\d{2,4}$/i.test(docSerial);
  if (isTrPlateOnly && !plate) {
    plate = docSerial;
    docSerial = '';
  }

  // 8. Belge Seri zaten doluysa fakat plaka metninde de geçiyorsa plakadan temizle
  if (docSerial && plate.toLowerCase().includes(docSerial.toLowerCase())) {
    plate = plate.replace(new RegExp(docSerial.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), '').trim();
  }

  // Sondaki veya baştaki artık karakterleri (/ - : ,) temizle
  plate = plate.replace(/^[\/:\-,\s]+|[\/:\-,\s]+$/g, '').trim();
  docSerial = docSerial.replace(/^[\/:\-,\s]+|[\/:\-,\s]+$/g, '').trim();

  // Normalize et (büyük harf ve boşluk kontrolü)
  plate = plate ? plate.toUpperCase().replace(/\s+/g, ' ') : '-';
  docSerial = docSerial ? docSerial.toUpperCase().replace(/\s+/g, ' ') : '-';

  return {
    plate,
    docSerial
  };
}

/**
 * Notlar alanından temiz referans bilgisini çıkartır.
 * Sistem tarafından otomatik eklenen genel şablon metinleri ("Yeni poliçe kaydı." vb.)
 * referans olarak görünmesin diye temizlenir.
 */
export function extractReferenceFromNotes(notes?: string | null): string {
  if (!notes) return '-';
  const trimmed = notes.trim();
  if (!trimmed || trimmed === '-') return '-';

  const systemPlaceholders = [
    'yeni poliçe kaydı.',
    'yeni poliçe kaydı',
    'poliçe kesimi ile otomatik oluşturuldu.',
    'poliçe kesimi ile otomatik oluşturuldu',
    'poliçe kesimi ile otomatik kaydedildi.',
    'poliçe kesimi ile otomatik kaydedildi',
    'kayıtlı özel not bulunmuyor.',
    'kayıtlı özel not bulunmuyor',
    'cari hareket ile otomatik tanımlandı.',
    'cari hareket ile otomatik tanımlandı',
    'poliçe kesiminde tahsil edildi.',
    'poliçe kesiminde tahsil edildi'
  ];

  if (systemPlaceholders.includes(trimmed.toLowerCase())) {
    return '-';
  }

  // Notlar içinde birden fazla satır varsa tek satırda temiz göster (Excel hücre düzeni için)
  return trimmed.replace(/[\r\n]+/g, ' ');
}
