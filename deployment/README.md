# Ubuntu: release CodeKita

Arsitektur: Vite `dist/`, backend `.server-build/server.js`, API `/api`, PostgreSQL dan satu proses Node. Tidak ada Redis/BullMQ atau WebSocket server yang ditemukan. Nginx di sini khusus menerima HTTP dari cloudflared pada `127.0.0.1:8080`; jangan gunakan konfigurasi ini sebagai origin HTTP publik. Konfigurasi tunnel untuk `codekita.web.id` menuju `http://127.0.0.1:8080`, dan terminasi HTTPS di Cloudflare. Pertahankan route tunnel lain yang ada. Jangan expose port PostgreSQL, 3000 atau 8080 ke publik.

## Build dan transfer dari Windows

Gunakan Node >=22 dengan npm dan `package-lock.json` (meski package.json juga menyebut pnpm); gunakan versi Node/npm yang sama pada host build dan server. `npm ci` mengganti node_modules lokal; simpan perubahan lokal yang diperlukan terlebih dahulu. Script build project sendiri mengosongkan `dist` dan `.server-build` serta memperbarui halaman `public/status` yang dihasilkan.

```powershell
cd C:\Users\maizar\Desktop\codekita.id
npm ci
$env:VITE_API_URL='/api'
npm run build
if ($LASTEXITCODE -ne 0) { throw 'Build failed' }
.\deployment\package.ps1 -Output "$env:TEMP\codekita-release.tar.gz"
scp "$env:TEMP\codekita-release.tar.gz" USER@SERVER:/tmp/codekita-release.tar.gz
```

Pilih nama file baru tiap release; script menolak menimpa file. Archive memakai allowlist: hasil build, package/lockfile, schema, migrasi, dan script operasional; tidak menyertakan `.env`, database lokal, atau `node_modules`. Pastikan output build tidak memuat data rahasia. `VITE_API_URL` bersifat publik dan dipasang saat build; jangan sertakan secret berawalan `VITE_`.

## Persiapan server sekali saja

Pasang Node >=22 beserta npm pada `/usr/bin/node` dan `/usr/bin/npm`, PostgreSQL lokal, OpenSSL/libssl yang kompatibel, dan tool build native jika dependency memerlukannya. Uji kompatibilitas Prisma/native dependency pada Ubuntu target. Systemd service mengasumsikan path Node tersebut; ubah unit jika berbeda. Pastikan `listen_addresses` PostgreSQL tetap loopback dan autentikasi lokal disiapkan tanpa mengubah akses SSH/firewall. Tidak perlu memasang Docker atau Redis.

```bash
sudo useradd --system --home-dir /opt/codekita --shell /usr/sbin/nologin codekita
sudo install -d -o codekita -g codekita -m 0755 /opt/codekita/releases
sudo install -d -o root -g codekita -m 0750 /etc/codekita
```

Salin `deployment/production.env.example` melalui SSH ke `/etc/codekita/codekita.env`, lalu isi `DATABASE_URL`, `DIRECT_URL`, dan `SESSION_SECRET` secara privat. Gunakan secret acak stabil minimal 32 byte; rotasi akan membatalkan sesi. Contoh format URL: `postgresql://ROLE:ENCODED_PASSWORD@127.0.0.1:5432/codekita?schema=public&connection_limit=5`; DIRECT_URL dapat menunjuk database lokal yang sama. URL-encode password. Jangan kirim secret melalui chat atau perintah yang menyimpannya di shell history. File ini dibaca systemd, bukan file `.env` dalam release; gunakan format `KEY=value` yang kompatibel dengan systemd.

```bash
sudo chown root:codekita /etc/codekita/codekita.env
sudo chmod 0640 /etc/codekita/codekita.env
```

Buat database dan role khusus secara administratif. Migrasi 0004 mengaktifkan RLS tanpa policy: role runtime harus memiliki tabel (atau kebijakan yang sesuai); cara sederhana adalah role khusus tersebut memiliki database, schema public, dan tabel hasil migrasi. Beri hak yang diperlukan untuk membuat `pgcrypto`; **jangan** gunakan superuser sebagai runtime. Migrasi membutuhkan hak DDL, sedangkan runtime memerlukan akses aplikasi. Untuk database lama, backup dan periksa ownership, RLS, data dan riwayat migrasi terlebih dahulu; jangan baseline sembarangan. Jangan menjalankan `db push`, `migrate reset`, atau mengasumsikan rollback kode dapat membalik migrasi.

## Release di Ubuntu

Gunakan ID baru setiap kali; contoh berikut tidak menimpa release lama. Archive harus berasal dari sumber tepercaya. Jalankan migrasi hanya setelah review dan backup PostgreSQL teruji; hentikan bila gagal. `npm ci` memasang dev dependencies sementara karena Prisma CLI ada di devDependencies; install dan generate dilakukan di Linux, bukan menyalin binary Windows. Pastikan kapasitas disk cukup.

```bash
export RELEASE=/opt/codekita/releases/20261115-01  # ganti dengan ID unik
sudo install -d -o codekita -g codekita -m 0755 "$RELEASE"
sudo tar -xzf /tmp/codekita-release.tar.gz -C "$RELEASE" --no-same-owner
sudo chown -R codekita:codekita "$RELEASE"
cd "$RELEASE"
sudo -u codekita npm ci --include=dev
sudo -u codekita ./node_modules/.bin/prisma generate --schema prisma/schema.prisma
# systemd membaca file environment tanpa menampilkan nilainya atau menaruhnya di history.
sudo systemd-run --wait --pipe --collect -p User=codekita -p Group=codekita -p EnvironmentFile=/etc/codekita/codekita.env -p WorkingDirectory="$RELEASE" /usr/bin/npm run db:status
# Status dapat mengembalikan nonzero untuk migrasi pending pada database baru.
# Periksa hasil, riwayat, backup dan migration.sql terlebih dahulu:
sudo systemd-run --wait --pipe --collect -p User=codekita -p Group=codekita -p EnvironmentFile=/etc/codekita/codekita.env -p WorkingDirectory="$RELEASE" /usr/bin/npm run db:deploy
# Untuk database baru saja, provision role/permission dan konten pembelajaran:
sudo systemd-run --wait --pipe --collect -p User=codekita -p Group=codekita -p EnvironmentFile=/etc/codekita/codekita.env -p WorkingDirectory="$RELEASE" /usr/bin/node prisma/seed.mjs
sudo systemd-run --wait --pipe --collect -p User=codekita -p Group=codekita -p EnvironmentFile=/etc/codekita/codekita.env -p WorkingDirectory="$RELEASE" /usr/bin/node scripts/import-curriculum.mjs
sudo -u codekita npm prune --omit=dev --ignore-scripts
sudo ln -sfn "$RELEASE" /opt/codekita/current
```

Install `deployment/codekita.service` ke `/etc/systemd/system/codekita.service`, dan `deployment/nginx.conf` ke `/etc/nginx/sites-available/codekita`, lalu aktifkan site tanpa menghapus konfigurasi lain. Pastikan port 8080 belum dipakai. Script operational seed/import perlu generate client sebelum prune; untuk migrasi selanjutnya gunakan release baru dengan dev dependencies sementara, bukan `npx` yang bisa mengunduh versi lain.

```bash
sudo ln -s /etc/nginx/sites-available/codekita /etc/nginx/sites-enabled/codekita
sudo nginx -t && sudo systemctl reload nginx
sudo systemctl daemon-reload
sudo systemctl enable --now codekita
sudo systemctl restart codekita
sudo systemctl status codekita --no-pager
curl -fsS http://127.0.0.1:3000/api/health
curl -fsS -H 'Host: codekita.web.id' http://127.0.0.1:8080/api/health
```

Untuk admin, register akun normal, lalu secara privat jalankan script `prisma/grant-admin.mjs` menggunakan `systemd-run` dengan properti environment dan working directory di atas, diikuti email terdaftar dan `ADMIN` atau `SUPER_ADMIN`. Verifikasi login, register, CSRF, dashboard, pembelajaran, refresh route SPA dan health melalui HTTPS tunnel. Health existing melaporkan status database, bukan kredensial; batasi di edge bila status tersebut tidak ingin diumumkan. Untuk update, ulangi release dan restart. Nginx meneruskan `/api/` tanpa mengubah prefix. Tidak ada WebSocket server saat ini; tambahkan konfigurasi upgrade hanya jika fitur itu benar-benar diperkenalkan.

`TRUST_PROXY=1` mempercayai Nginx saja. Nginx sengaja menimpa X-Forwarded-For dengan alamat peer lokal untuk mencegah spoofing: semua pengunjung tunnel berbagi satu identitas/IP (100 request API/menit dan 10 login/menit), sehingga pengguna dapat saling terkena rate limit. Untuk limit per pengunjung, terapkan rate limiting terverifikasi di Cloudflare edge dan uji trafik end-to-end; jangan gunakan `CF-Connecting-IP` langsung sebagai IP tepercaya karena aplikasi lokal lain dapat menghubungi origin loopback. Real IP memerlukan batas origin yang hanya dapat diakses cloudflared, sumber header yang diautentikasi, dan uji spoofing; daftar IP Cloudflare saja tidak mengautentikasi proses cloudflared lokal. `X-Forwarded-Proto=https` benar hanya jika origin lokal khusus menerima tunnel HTTPS sebagaimana di atas. Cookie session dan CSRF `HttpOnly`, `Secure` pada production dan `SameSite=Lax`; token CSRF diperoleh frontend dari API.

## Rollback

Simpan release sebelumnya dan backup database yang teruji. Jika schema baru kompatibel dengan versi lama, arahkan `/opt/codekita/current` ke direktori release lama (`sudo ln -sfn /opt/codekita/releases/ID_LAMA /opt/codekita/current`) lalu `sudo systemctl restart codekita` dan periksa health/login. Jika migrasi tidak kompatibel, pemulihan database memerlukan rencana backup/restore tersendiri dan dapat kehilangan perubahan setelah backup; jangan rollback secara membabi buta. Tidak ada memory limit aktif: ukur RSS, beban login Argon2 dan PostgreSQL sebelum menetapkan batas.