import { backgroundRemovalConfig, storageConfig } from "@/config/dolab.config";
import { refineMask } from "./refineCutout";

/** What the removal is doing right now, for an honest progress message. */
export type RemovalStatus =
  | { phase: "download"; megabytes: number } // first time only: the AI model is downloaded
  | { phase: "cutting"; step: number; steps: number } // the model works on the photo
  | { phase: "refining" }; // our clean-up (filling holes etc.)
export type RemovalProgress = (status: RemovalStatus) => void;

// Cuts the item out of its background, entirely in the browser (free, private —
// the photo never leaves the device for this step).
// The library is loaded only when someone clicks the button, so it doesn't
// slow down the rest of the app.
export async function removeImageBackground(image: Blob, onProgress?: RemovalProgress): Promise<Blob> {
  const { removeBackground } = await import("@imgly/background-removal");

  // 1. The AI model guesses which pixels belong to the garment.
  //    The library reports each model file it downloads ("fetch:<file>") and
  //    four work steps ("compute:…"); we add up the downloads ourselves.
  const downloaded = new Map<string, number>();
  const raw = await removeBackground(image, {
    model: backgroundRemovalConfig.model,
    output: { format: "image/png" }, // lossless, so the mask isn't blurred by compression
    progress: (key, current, total) => {
      if (key.startsWith("fetch:")) {
        downloaded.set(key, current);
        const bytes = [...downloaded.values()].reduce((a, b) => a + b, 0);
        onProgress?.({ phase: "download", megabytes: Math.round(bytes / 1_000_000) });
      } else if (key.startsWith("compute:")) {
        onProgress?.({ phase: "cutting", step: Math.min(total, current + 1), steps: total });
      }
    },
  });
  onProgress?.({ phase: "refining" });
  await new Promise((resolve) => setTimeout(resolve, 0)); // let the message show before the busy work

  // 2. Clean up its mask (fills holes in dark clothes), then put the cleaned
  //    mask on the ORIGINAL photo's pixels.
  const [original, cut] = await Promise.all([createImageBitmap(image), createImageBitmap(raw)]);
  const { width, height } = cut;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas not available");

  ctx.drawImage(cut, 0, 0);
  const cutPixels = ctx.getImageData(0, 0, width, height).data;
  const alpha = new Uint8ClampedArray(width * height);
  for (let i = 0; i < alpha.length; i++) alpha[i] = cutPixels[i * 4 + 3];

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(original, 0, 0, width, height);
  const result = ctx.getImageData(0, 0, width, height);
  const mask = refineMask(alpha, result.data, width, height);
  for (let i = 0; i < mask.length; i++) result.data[i * 4 + 3] = mask[i];
  ctx.putImageData(result, 0, 0);
  original.close();
  cut.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode cut-out"))),
      "image/webp", // keeps transparency; older Safari falls back to PNG
      storageConfig.photoQuality,
    );
  });
}
