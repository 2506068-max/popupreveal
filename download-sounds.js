const fs = require('fs');
const path = require('path');
const https = require('https');

const downloads = [
  {
    url: 'https://cdn.freesound.org/previews/485/485076_5121236-lq.mp3',
    file: 'assets/audio/heartbeat.mp3'
  },
  {
    url: 'https://raw.githubusercontent.com/wesbos/JavaScript30/master/01%20-%20JavaScript%20Drum%20Kit/sounds/boom.wav',
    file: 'assets/audio/dundundun.mp3'
  },
  {
    url: 'https://raw.githubusercontent.com/wesbos/JavaScript30/master/01%20-%20JavaScript%20Drum%20Kit/sounds/openhat.wav',
    file: 'assets/audio/animeshock.mp3'
  },
  {
    url: 'https://raw.githubusercontent.com/wesbos/JavaScript30/master/01%20-%20JavaScript%20Drum%20Kit/sounds/tink.wav',
    file: 'assets/audio/btn-click.mp3'
  },
  {
    url: 'https://cdn.freesound.org/previews/337/337049_3232293-lq.mp3',
    file: 'assets/audio/yeayy.mp3'
  },
  {
    url: 'https://raw.githubusercontent.com/wesbos/JavaScript30/master/01%20-%20JavaScript%20Drum%20Kit/sounds/ride.wav',
    file: 'assets/audio/cymbal.mp3'
  },
  {
    url: 'https://raw.githubusercontent.com/wesbos/JavaScript30/master/01%20-%20JavaScript%20Drum%20Kit/sounds/boom.wav',
    file: 'assets/audio/vineboom.mp3'
  },
  {
    url: 'https://raw.githubusercontent.com/wesbos/JavaScript30/master/01%20-%20JavaScript%20Drum%20Kit/sounds/tink.wav',
    file: 'assets/audio/click.mp3'
  }
];

function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    ensureDirectoryExists(dest);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      console.log(`✅ Already exists, skipping: ${dest}`);
      return resolve();
    }

    const file = fs.createWriteStream(dest);
    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          file.close();
          fs.unlink(dest, () => {});
          return reject(new Error(`Failed to download ${url}: status ${response.statusCode}`));
        }
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      })
      .on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
}

(async function main() {
  try {
    console.log('Mulai mengunduh asset audio ke assets/audio/...');
    for (const item of downloads) {
      console.log(`Downloading ${item.url} -> ${item.file}`);
      await downloadFile(item.url, path.resolve(__dirname, item.file));
      console.log(`Saved ${item.file}`);
    }
    console.log('🎉 Semua file audio berhasil diunduh!');
  } catch (error) {
    console.error('Gagal mengunduh audio:', error.message || error);
    process.exit(1);
  }
})();
