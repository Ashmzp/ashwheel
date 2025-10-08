import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { saveAs } from 'file-saver';

let ffmpeg;

const loadFFmpeg = async (onProgress) => {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

  ffmpeg.on('log', ({ message }) => {
    console.log(message);
  });

  ffmpeg.on('progress', ({ progress }) => {
    onProgress(progress);
  });

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  return ffmpeg;
};

const getResolution = (aspectRatio) => {
    const ratios = {
        '16:9': { width: 1920, height: 1080 },
        '9:16': { width: 1080, height: 1920 },
        '1:1': { width: 1080, height: 1080 },
    };
    return ratios[aspectRatio] || ratios['16:9'];
}

export const exportVideo = async (timeline, aspectRatio, onProgress) => {
  const ffmpeg = await loadFFmpeg(onProgress);
  const resolution = getResolution(aspectRatio);
  const totalDuration = Math.max(...timeline.map(t => t.start + t.duration), 0);

  const inputFiles = [];
  const videoInputs = [];
  const audioInputs = [];
  const filterComplexParts = [];

  // Write all files to FFmpeg's virtual filesystem
  for (const track of timeline) {
    const fileName = `${track.type}-${track.id}.${track.src.split('.').pop().split('?')[0]}`;
    await ffmpeg.writeFile(fileName, await fetchFile(track.src));
    inputFiles.push('-i', fileName);
    if (track.type === 'video') {
      videoInputs.push({ ...track, fileName, index: videoInputs.length });
    }
    if (track.type === 'audio') {
      audioInputs.push({ ...track, fileName, index: audioInputs.length });
    }
  }

  // Create a silent base video track if no video exists
  if (videoInputs.length === 0) {
    const baseVideoName = 'black.mp4';
    await ffmpeg.exec([
        '-f', 'lavfi', '-i', `color=c=black:s=${resolution.width}x${resolution.height}:d=${totalDuration}`,
        '-t', totalDuration.toString(), baseVideoName
    ]);
    inputFiles.unshift('-i', baseVideoName);
    videoInputs.push({ id: 'base', start: 0, duration: totalDuration, fileName: baseVideoName, index: 0 });
    filterComplexParts.push(`[${videoInputs.length - 1}:v]scale=${resolution.width}:${resolution.height},setsar=1[base];`);
  } else {
     filterComplexParts.push(`[0:v]scale=${resolution.width}:${resolution.height},setsar=1[base];`);
  }

  let lastStream = 'base';
  videoInputs.forEach((track, i) => {
    const streamIndex = i;
    const nextStream = `v${i}`;
    filterComplexParts.push(
      `[${streamIndex}:v]scale=${resolution.width}:${resolution.height},setsar=1,setpts=PTS-STARTPTS+${track.start}/TB[vid${i}];`
    );
    filterComplexParts.push(
      `[${lastStream}][vid${i}]overlay=enable='between(t,${track.start},${track.start + track.duration})'[${nextStream}];`
    );
    lastStream = nextStream;
  });

  // Audio mixing
  if (audioInputs.length > 0) {
    const audioOffsetFilters = audioInputs.map((track, i) => {
      const audioIndex = videoInputs.length + i;
      return `[${audioIndex}:a]adelay=${track.start * 1000}|${track.start * 1000}[a${i}];`;
    }).join('');
    const amixInputs = audioInputs.map((_, i) => `[a${i}]`).join('');
    filterComplexParts.push(`${audioOffsetFilters}${amixInputs}amix=inputs=${audioInputs.length}[outa];`);
  }

  const filterComplex = filterComplexParts.join('');
  
  const command = [
    ...inputFiles,
    '-filter_complex', filterComplex,
    '-map', `[${lastStream}]`,
  ];

  if (audioInputs.length > 0) {
    command.push('-map', '[outa]');
  }
  
  command.push(
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-pix_fmt', 'yuv420p',
    '-t', totalDuration.toString(),
    'output.mp4'
  );

  await ffmpeg.exec(command);

  const data = await ffmpeg.readFile('output.mp4');
  const blob = new Blob([data.buffer], { type: 'video/mp4' });
  saveAs(blob, 'exported-video.mp4');

  // Cleanup
  for (const track of timeline) {
      const fileName = `${track.type}-${track.id}.${track.src.split('.').pop().split('?')[0]}`;
      await ffmpeg.deleteFile(fileName);
  }
  if (videoInputs.length === 0) {
      await ffmpeg.deleteFile('black.mp4');
  }
  await ffmpeg.deleteFile('output.mp4');
};