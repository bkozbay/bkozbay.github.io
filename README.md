# Bilge Kağan Özbay — Kişisel Web Sitesi

Fırçalanmış çelik (brushed steel) temalı, animasyonlu kişisel akademik site.
Tamamen statik (HTML + CSS + JS) — GitHub Pages'a doğrudan pushlanabilir,
derleme adımı yok.

## Tasarım

- **Palet:** Açık metalik çelik zemin (fırçalanmış çizgi dokusuyla), grafit
  metin, çelik mavisi vurgular; kartlarda buzlu cam + metal parlama efekti.
- **Arkaplan (tek ekonometrik öğe):** "İstatistik atlası" — ekranda kendini
  yavaşça çizen, sonra solup her seferinde yeni rastgele veriyle yeniden doğan
  hayalet grafikler: EKK saçılımı + güven bandı, logit S-eğrisi, histogram +
  normal eğri, artık grafiği, fark-fark (diff-in-diff) modeli, katsayı grafiği
  (%95 GA'lı) ve çekirdek yoğunlukları. Tümü yatay kesit / mikroekonometri;
  harici kütüphane yok, saf Canvas 2D.
- Sekmeli tek ekran düzen: Ana Sayfa, Eğitim, Deneyim, Yayınlar, Projeler,
  İletişim — içerik, arkaplanın üzerinde duran hafif saydam koyu bir plaka
  içinde sunulur.
- Kartlarda 3B tilt (perspektif), sekmelerde kayan gümüş gösterge.

## İçeriği düzenleme

Tüm içerik `index.html` içinde — eğitim/deneyim/yayın/proje bilgileri
mikroekonometri temalı **örnek (placeholder)** olarak dolduruldu; gerçek
bilgilerle değiştirin:

- Üniversite adları `— Üniversitesi` olarak bırakıldı.
- Yayın ve proje başlıkları temsilidir; DOI/GitHub linkleri `#`.
- E-posta: `bilgekagan.ozbay@universite.edu.tr` → gerçek adresle değiştirin.
- **Fotoğraf:** `foto.jpg` olarak eklendi; değiştirmek için aynı adla üzerine
  yazın. Dosya yoksa otomatik olarak "BKÖ" baş harfleri gösterilir.

## Yayınlama

Site `bkozbay.github.io` reposuna pushlanır ve
`https://bkozbay.github.io` adresinde yayına girer:

```bash
git push -u origin main
```

Not: Three.js CDN'den yüklenir (cdnjs). CDN erişilemezse site çalışmaya devam
eder, yalnızca 3B arkaplan görünmez.
