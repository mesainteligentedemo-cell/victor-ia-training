// Upload the 38 official VTC training videos to Cloudinary CDN.
// Source: official GitHub repo (raw URLs) -> Cloudinary fetches server-side.
// Credentials passed via env (do NOT hardcode secrets in committed code).
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const https = require('https');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const REPO = 'mesainteligentedemo-cell/vtc-capacitacion-deploy';
const BRANCH = 'master';

function getJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'vtc-uploader' } }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

(async () => {
  const list = await getJSON(`https://api.github.com/repos/${REPO}/contents/videos?ref=${BRANCH}`);
  const videos = list.filter((f) => f.name.endsWith('.mp4')).map((f) => f.name).sort();
  console.log(`Found ${videos.length} official videos in repo.\n`);

  const urls = {};
  let ok = 0, fail = 0;

  for (const file of videos) {
    const name = path.parse(file).name; // modulo-M0
    const rawUrl = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/videos/${file}`;
    try {
      const result = await cloudinary.uploader.upload(rawUrl, {
        resource_type: 'video',
        public_id: `vtc-videos/${name}`,
        overwrite: true,
        tags: ['vtc-training', 'capacitacion'],
        timeout: 600000,
      });
      urls[name] = result.secure_url;
      ok++;
      console.log(`OK  ${file} -> ${result.secure_url}`);
    } catch (e) {
      fail++;
      console.error(`FAIL ${file}: ${e.message || e.http_code || e}`);
    }
  }

  fs.writeFileSync(
    path.join(__dirname, 'cloudinary-urls.json'),
    JSON.stringify(urls, null, 2)
  );
  console.log(`\nDone. ${ok} uploaded, ${fail} failed. URLs saved to cloudinary-urls.json`);
})();