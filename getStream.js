const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');

try {
    setFileTree();
} catch (error) {
    setFileTree();
}

function setFileTree() {
    fs.rmSync("./streamsTmp", { recursive: true, force: true })
    fs.mkdirSync("./streamsTmp/", { recursive: true });
    const streamId = process.argv[2] || 'illojuan';
    const ttvUrl = `https://api.ttv.lol/playlist/${streamId}.m3u8%3Facmb%3De30%253D%26allow_source%3Dtrue%26fast_bread%3Dtrue%26p%3D66925%26play_session_id%3Dc6ef2a92a27be56aa760d3bf258c2320%26player_backend%3Dmediaplayer%26playlist_include_framerate%3Dtrue%26reassignments_supported%3Dtrue%26supported_codecs%3Davc1%26transcode_mode%3Dcbr_v2%26cdm%3Dwv%26player_version%3D1.18.0`

    console.log("Downloading main playlist from ttv.lol...")
    execSync(`curl -H "X-Donate-To: https://ttv.lol/donate" -o ./streamsTmp/mainOriginal.m3u8 ${ttvUrl}`, { stdio: 'ignore' });

    console.log("Creating file tree...")
    let totalSize = 0;
    let count = 0;
    fs.readFile('./streamsTmp/mainOriginal.m3u8', 'utf-8', (err, data) => {
        if (err) throw err;

        const playlistsUrls = data.match(/https?:\/\/[^\s]+/g).slice(1, 2);
        playlistsUrls.forEach(async(plUrl, index) => {
            fs.mkdirSync(`./streamsTmp/playlist${index}`, { recursive: true });
            await https.get(plUrl, (response) => {
                let data = '';
                const plFile = fs.createWriteStream(`./streamsTmp/playlist${index}/playlistOriginal${index}.m3u8`);
                response.pipe(plFile);

                response.on('data', (chunk) => {
                  data += chunk;
                });
              
                response.on('end', () => {
                    let segmentsUrls = data.match(/https?:\/\/[^\s]+/g);
                    segmentsUrls.forEach(async(segmentUrl, segmentIndex) => {
                        await https.get(segmentUrl, (response) => {
                            const file = fs.createWriteStream(`./streamsTmp/playlist${index}/segment${segmentIndex}.ts`);
                            response.pipe(file);
                            totalSize += parseInt(response.headers['content-length'] || 0);
                            count++
                            if (count === segmentsUrls.length * playlistsUrls.length) {
                                setTimeout(() => {
                                    console.log(`Done. Totalling an approximate of ${(totalSize / 1000000).toFixed(1)}MB`);
                                    createLocalCopy();
                                }, 3000)
                            }
                        });
                    })
                });
            });
        })
    });
}

function createLocalCopy() {
    console.log("Creating local files...");
    fs.readFile('./streamsTmp/mainOriginal.m3u8', 'utf-8', async (err, data) => {
        if (err) throw err;

        const playlistsUrls = data.match(/https?:\/\/[^\s]+/g).slice(1, 2);
        // const localPlaylists = [];
        for (let index = 0; index < playlistsUrls.length; index++) {
            // localPlaylists.push(`http://192.168.1.10:8000/streams/playlist${index}/playlist${index}.m3u8`);
            
            fs.readFile(`./streamsTmp/playlist${index}/playlistOriginal${index}.m3u8`, 'utf-8', async (err, data) => {
                if (err) throw err;

                const segmentsUrls = data.match(/https?:\/\/[^\s]+/g);
                const localSegments = [];
                for (let segmentIndex = 0; segmentIndex < segmentsUrls.length; segmentIndex++) {
                    localSegments.push(`http://192.168.1.10:8000/streams/playlist${index}/segment${segmentIndex}.ts`)
                    if(localSegments.length === segmentsUrls.length) {
                        replaceUrls(segmentsUrls, localSegments, `./streamsTmp/playlist${index}/playlistOriginal${index}.m3u8`, data)
                        fs.rmSync("./streams", { recursive: true, force: true })
                        fs.renameSync('./streamsTmp/', './streams')
                        console.log("Done")
                        try {
                            setFileTree();
                        } catch (error) {
                            setFileTree();
                        }
                    }
                }
            });
        }

        // replaceUrls(playlistsUrls, localPlaylists, './streams/mainOriginal.m3u8', data)
    });
}

function replaceUrls(original, replace, file, string) {
    if(original.length !== replace.length) return console.log(`Original and local lengths are not the same (${original.length} - ${replace.length}). Aborting.`)
    for (let index = 0; index < original.length; index++) {
        string = string.replace(original[index], replace[index]);
    }
    fs.writeFileSync(file.replace('Original', ''), string, { encoding: 'utf-8' })
}