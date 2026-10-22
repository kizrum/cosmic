/**
 * Fetches and decodes map tiers off the main thread, into plain RGBA bytes, rows bottom-up
 * (the order WebGL expects). The buffer is transferred to the page, not copied.
 *
 * Decoding goes through WebCodecs' ImageDecoder where available. createImageBitmap would be
 * simpler, but Chrome builds large bitmaps in its GPU process, the same one that draws the
 * frames: decoding a 4K map that way stalls rendering even from a worker.
 */
type Decoded = { width: number; height: number; data: Uint8ClampedArray };

async function withImageDecoder(buf: ArrayBuffer, type: string): Promise<Decoded> {
  const decoder = new ImageDecoder({ data: buf, type });
  const { image } = await decoder.decode();
  const width = image.codedWidth, height = image.codedHeight;
  const data = new Uint8ClampedArray(width * height * 4);
  await image.copyTo(data, { format: 'RGBA' } as VideoFrameCopyToOptions);
  image.close();
  decoder.close();
  // Top-down → bottom-up.
  const row = width * 4, tmp = new Uint8ClampedArray(row);
  for (let y = 0; y < height >> 1; y++) {
    const a = y * row, b = (height - 1 - y) * row;
    tmp.set(data.subarray(a, a + row));
    data.copyWithin(a, b, b + row);
    data.set(tmp, b);
  }
  return { width, height, data };
}

async function withBitmap(blob: Blob): Promise<Decoded> {
  const bitmap = await createImageBitmap(blob, { imageOrientation: 'flipY', premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
  const { width, height } = bitmap;
  const ctx = new OffscreenCanvas(width, height).getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return { width, height, data: ctx.getImageData(0, 0, width, height).data };
}

self.onmessage = async (e: MessageEvent<{ id: number; url: string }>) => {
  const { id, url } = e.data;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = res.headers.get('content-type') ?? (url.endsWith('.png') ? 'image/png' : 'image/jpeg');
    let out: Decoded;
    if (typeof ImageDecoder !== 'undefined') {
      try {
        out = await withImageDecoder(await res.clone().arrayBuffer(), type);
      } catch {
        out = await withBitmap(await res.blob());
      }
    } else {
      out = await withBitmap(await res.blob());
    }
    (self as unknown as Worker).postMessage({ id, ...out }, [out.data.buffer]);
  } catch (err) {
    (self as unknown as Worker).postMessage({ id, error: String(err) });
  }
};
