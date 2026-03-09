# Kurumsal OSINT & Subdomain Finder

Bu proje, hedef bir şirketin alan adı üzerinden pasif subdomain taraması yapan ve bulunan subdomain'lerde çalışan web servislerini analiz eden bir Açık Kaynak İstihbarat (OSINT) platformudur.

🚀 **Canlı Uygulama:** [https://siber-boun.github.io/subdomainfinder/](https://siber-boun.github.io/subdomainfinder/)

## Özellikler

1. **Subdomain Keşfi:** `crt.sh` sertifika şeffaflık loglarını kullanarak hedef domain için kaydedilmiş tüm subdomainleri bulur.
2. **Web Servisi & Port Analizi:** Bulunan her subdomain için yaygın olarak kullanılan 24 farklı HTTP/HTTPS/Panel portunu (`80`, `443`, `8443`, `8080`, `3000`, vb.) tarar.
3. **HTTP Durum Kodu Tespiti:** Açık portlara HEAD isteği atarak anlık durum kodunu (`200 OK`, `403 Forbidden`, `301 Redirect`) tespit eder.
4. **Cloudflare Tespiti:** WAF/Cloudflare arkasında olan web servislerini otomatik olarak tespit eder ve arayüzde özel bir rozet ile belirtir.
5. **Akıllı Yönlendirme:** Bulunan açık portlara tıklandığında, sunucunun kullandığı protokole (HTTP veya HTTPS) göre doğru URL'yi oluşturarak yeni sekmede açar.
6. **Kullanıcı Bazlı Veri Saklama:** Tarayıcı hafızasında (`localStorage`) birden fazla kullanıcı profili oluşturulabilir. Yapılan tüm taramalar kullanıcıya özel olarak saklanır.

## Mimari

*   **Frontend:** React, TypeScript, Vite
*   **Backend / API:** Node.js, Express.js
*   **Hosting:** 
    *   Ön yüz **GitHub Pages** üzerinde barındırılmaktadır.
    *   Arka yüz (Tarama motoru ve Proxy) **Render.com** üzerinde barındırılmaktadır.

*Not: Render sunucuları 15 dakika boyunca kullanılmadığında uyku moduna geçer. Bu nedenle ilk tarama işlemi sırasında sunucunun uyanması ~40 saniye sürebilir.*
