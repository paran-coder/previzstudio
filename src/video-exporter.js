const MEDIABUNNY_URL = 'https://cdn.jsdelivr.net/npm/mediabunny@1.55.7/+esm';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function exportMp4(engine, doc, onProgress) {
  if (!('VideoEncoder' in globalThis)) throw new Error('WebCodecs VideoEncoder를 지원하지 않습니다.');
  const { Output, Mp4OutputFormat, BufferTarget, CanvasSource, Quality } = await import(MEDIABUNNY_URL);
  const { width, height, fps, duration } = doc.sequence;
  const totalFrames = Math.round(duration * fps);
  engine.beginExport(width, height);
  try {
    const target = new BufferTarget();
    const output = new Output({ format: new Mp4OutputFormat(), target });
    const source = new CanvasSource(engine.canvas, {
      codec: 'avc',
      quality: new Quality('high'),
      latencyMode: 'quality',
      hardwareAcceleration: 'no-preference',
    });
    output.addVideoTrack(source, { frameRate: fps });
    await output.start();
    for (let i = 0; i < totalFrames; i++) {
      const timestamp = i / fps;
      engine.renderExportFrame(timestamp);
      await source.add(timestamp, 1 / fps, { keyFrame: i % (fps * 2) === 0 });
      onProgress?.((i + 1) / totalFrames, 'MP4');
    }
    source.close?.();
    await output.finalize();
    const buffer = target.buffer;
    if (!buffer?.byteLength) throw new Error('MP4 버퍼가 비어 있습니다.');
    return new Blob([buffer], { type: 'video/mp4' });
  } finally {
    engine.endExport();
  }
}

function bestRecorderMime() {
  if (!globalThis.MediaRecorder) return null;
  const choices = [
    'video/mp4;codecs=avc1.42E01E',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  return choices.find(type => MediaRecorder.isTypeSupported?.(type)) || '';
}

async function exportRealtimeRecorder(engine, doc, onProgress) {
  const { width, height, fps, duration } = doc.sequence;
  const mimeType = bestRecorderMime();
  if (mimeType === null || !engine.canvas.captureStream) throw new Error('브라우저 영상 녹화를 지원하지 않습니다.');
  const totalFrames = Math.round(duration * fps);
  engine.beginExport(width, height);
  const stream = engine.canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 12_000_000 } : { videoBitsPerSecond: 12_000_000 });
  const chunks = [];
  recorder.ondataavailable = e => { if (e.data?.size) chunks.push(e.data); };
  const stopped = new Promise((resolve, reject) => {
    recorder.onstop = resolve;
    recorder.onerror = e => reject(e.error || new Error('MediaRecorder 오류'));
  });
  recorder.start(1000);
  try {
    const frameMs = 1000 / fps;
    const start = performance.now();
    for (let i = 0; i < totalFrames; i++) {
      const timestamp = i / fps;
      engine.renderExportFrame(timestamp);
      onProgress?.((i + 1) / totalFrames, mimeType.includes('mp4') ? 'MP4 실시간' : 'WebM 실시간');
      const target = start + (i + 1) * frameMs;
      await sleep(Math.max(0, target - performance.now()));
    }
  } finally {
    recorder.stop();
    await stopped;
    stream.getTracks().forEach(track => track.stop());
    engine.endExport();
  }
  const type = recorder.mimeType || mimeType || 'video/webm';
  const blob = new Blob(chunks, { type });
  if (!blob.size) throw new Error('영상 데이터가 생성되지 않았습니다.');
  return blob;
}

export async function exportSequenceVideo(engine, doc, onProgress) {
  try {
    const blob = await exportMp4(engine, doc, onProgress);
    return { blob, format: 'mp4', mode: 'WebCodecs + Mediabunny' };
  } catch (mp4Error) {
    console.info('[Previz] MP4 고속 렌더 경로를 사용할 수 없어 실시간 녹화로 전환합니다.', mp4Error?.message || mp4Error);
    const blob = await exportRealtimeRecorder(engine, doc, onProgress);
    return { blob, format: blob.type.includes('mp4') ? 'mp4' : 'webm', mode: 'MediaRecorder', mp4Error: String(mp4Error?.message || mp4Error) };
  }
}
