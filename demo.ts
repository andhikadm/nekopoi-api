import { NekopoiClient } from './src/index.js';

async function runDemo() {
  console.log('====== Nekopoi API Wrapper Demo ======');
  const client = new NekopoiClient();

  try {
    // 1. Uji Get Latest (Halaman Depan)
    console.log('\n1. Mengambil episode terbaru...');
    const latest = await client.getLatest();
    console.log(`Berhasil mengambil ${latest.length} episode terbaru.`);
    if (latest.length > 0) {
      console.log('Contoh episode terbaru:');
      console.log(`- Judul: ${latest[0].title}`);
      console.log(`- URL  : ${latest[0].url}`);
      console.log(`- Tipe : ${latest[0].type}`);
      console.log(`- Tanggal: ${latest[0].uploadedDate}`);
      console.log(`- Thumb: ${latest[0].thumbnail}`);

      // 2. Uji Get Detail Postingan (ambil postingan pertama dari terbaru)
      console.log('\n2. Mengambil detail postingan terbaru...');
      const detail = await client.getPostDetails(latest[0].url);
      console.log(`Judul Detail  : ${detail.title}`);
      console.log(`Judul Jepang  : ${detail.japaneseTitle || '-'}`);
      console.log(`Produser      : ${detail.producer || '-'}`);
      console.log(`Durasi        : ${detail.duration || '-'}`);
      console.log(`Genre         : ${detail.genres.join(', ')}`);
      console.log(`Sinopsis      : ${detail.synopsis.slice(0, 150)}...`);
      console.log(`Total Episode : ${detail.downloads.length}`);

      if (detail.downloads.length > 0) {
        console.log('\nLink Download (Episode Pertama):');
        const firstEp = detail.downloads[0];
        console.log(`Episode: ${firstEp.episode}`);
        firstEp.downloads.forEach(res => {
          console.log(`  Resolusi: ${res.resolution}`);
          res.links.forEach(link => {
            console.log(`    - [${link.host}] ${link.url}`);
          });
        });
      }
    }

    // 3. Uji Search dengan pagination halaman 2
    console.log('\n3. Melakukan pencarian "shota" halaman 2...');
    const searchResults = await client.search('shota', 2);
    console.log(`Ditemukan ${searchResults.length} hasil.`);
    if (searchResults.length > 0) {
      console.log('Contoh hasil pencarian Halaman 2:');
      console.log(`- Judul: ${searchResults[0].title}`);
      console.log(`- URL: ${searchResults[0].url}`);
    }

    // 4. Uji Get By Category (ambil kategori 3D Hentai halaman 1)
    console.log('\n4. Mengambil daftar dari kategori "3d-hentai"...');
    const categoryResults = await client.getByCategory('3d-hentai');
    console.log(`Berhasil mengambil ${categoryResults.length} item dari kategori.`);
    if (categoryResults.length > 0) {
      console.log('Contoh item kategori:');
      console.log(`- Judul: ${categoryResults[0].title}`);
    }

    // 4b. Uji Pintasan Kategori Navbar
    console.log('\n4b. Mengambil rilis terbaru kategori "Hentai" dan "JAV Cosplay" menggunakan pintasan navbar...');
    const hentaiShortcut = await client.getHentai();
    const javCosplayShortcut = await client.getJAVCosplay();
    console.log(`Berhasil mengambil ${hentaiShortcut.length} item Hentai dan ${javCosplayShortcut.length} item JAV Cosplay.`);

    // 5. Uji Get Genres & Get By Genre
    console.log('\n5. Mengambil daftar genre...');
    const genres = await client.getGenres();
    console.log(`Berhasil mengambil ${genres.length} genre.`);
    if (genres.length > 0) {
      console.log(`Genre pertama: ${genres[0].name} (Slug: ${genres[0].slug})`);

      console.log(`Mengambil daftar postingan dengan genre "${genres[0].name}"...`);
      const genreResults = await client.getByGenre(genres[0].slug);
      console.log(`Berhasil mengambil ${genreResults.length} item dengan genre tersebut.`);
    }

    // 6. Uji Get Series Details (dari salah satu hentai list)
    console.log('\n6. Mengambil detail serial "front-innocent-mou-hitotsu-no-lady-innocent"...');
    const seriesDetail = await client.getSeriesDetails('front-innocent-mou-hitotsu-no-lady-innocent');
    console.log(`Judul Seri    : ${seriesDetail.title}`);
    console.log(`Judul Jepang  : ${seriesDetail.japaneseTitle || '-'}`);
    console.log(`Status        : ${seriesDetail.status}`);
    console.log(`Total Episode : ${seriesDetail.totalEpisodes}`);
    console.log(`Genre Seri    : ${seriesDetail.genres.join(', ')}`);
    console.log(`Daftar Episode:`);
    seriesDetail.episodes.forEach(ep => {
      console.log(`  - [${ep.episodeNumber}] ${ep.title} (${ep.uploadedDate})`);
    });

    // 7. Uji Hentai List (A-Z)
    console.log('\n7. Mengambil Hentai List A-Z...');
    const hentaiList = await client.getHentaiList();
    console.log(`Berhasil mengambil ${hentaiList.length} hentai terindeks.`);
    if (hentaiList.length > 0) {
      console.log('Contoh dari daftar A-Z:');
      console.log(`- Judul: ${hentaiList[0].title}`);
      console.log(`- URL: ${hentaiList[0].url}`);
      console.log(`- Status: ${hentaiList[0].status || '-'}`);
      console.log(`- Skor: ${hentaiList[0].score || '-'}`);
    }

  } catch (error) {
    console.error('Terjadi kesalahan saat demo:', error);
  }
}

runDemo();
