import { useEffect, useRef, useState } from "react";

export type SpeechMotion = {
  text: string;
  index: number;
  at: number;
  paused: boolean;
};

// A small 2D texture deformation, not phoneme recognition or a 3D face rig.
export default function SpeakingPortrait({
  speaking, motion,
}: { speaking: boolean; motion?: SpeechMotion }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const cue = useRef(motion);
  cue.current = motion;
  const [ready, setReady] = useState(false);
  const pixels = useRef<ImageData | null>(null);
  const sourceImage = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    let active = true;
    const image = new Image();
    image.onload = () => {
      if (!active) return;
      const context = canvas.current?.getContext("2d", { willReadFrequently: true });
      if (!context) return;
      try {
        context.drawImage(image, 0, 0, 291, 313);
        pixels.current = context.getImageData(0, 0, 291, 313);
        sourceImage.current = image;
        setReady(true);
      } catch {
        // Preserve the original image if canvas is unavailable.
      }
    };
    image.src = "/avatar/nexa-studio-dashboard.png";
    return () => { active = false; image.onload = null; };
  }, []);

  useEffect(() => {
    const context = canvas.current?.getContext("2d");
    const source = pixels.current;
    const image = sourceImage.current;
    if (!context || !source || !image || !ready) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = preference.matches;
    const change = () => { reduced = preference.matches; };
    preference.addEventListener("change", change);
    let frame = 0;
    let last = 0;
    let amount = 0;
    // Coordinates are calibrated to the existing 291 × 313 studio portrait.
    const left = 176, top = 124, width = 50, height = 45;
    const patch = context.createImageData(width, height);
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      if (now - last < 33) return;
      const dt = Math.min(100, now - (last || now));
      last = now;
      let target = 0;
      const current = cue.current;
      if (speaking && !reduced && current && !current.paused) {
        const elapsed = Math.max(0, now - current.at);
        // Word boundaries reset this estimate when the selected voice supplies them.
        const position = current.index + Math.floor(elapsed / 75);
        const letter = current.text[position]?.toLowerCase() ?? "";
        const vowel = /[aeiouyاآووییے]/u.test(letter);
        const closed = /[mbpمبپ]/u.test(letter);
        const silence = !letter || /[\s.,!?;:،۔؟]/u.test(letter);
        target = silence || closed ? 0 : vowel ? 3.1 : 1.25;
        target *= .75 + .25 * Math.sin(elapsed / 70) ** 2;
      }
      amount += (target - amount) * (1 - Math.exp(-dt / 42));
      if (!speaking || reduced) amount = 0;
      if (amount < .03) {
        context.drawImage(image, left, top, width, height, left, top, width, height);
        return;
      }
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const px = left + x, py = top + y;
          const center = 142 + (px - 200) * .26;
          const distance = py - center;
          const horizontal = Math.exp(-(((px - 200) / 16) ** 4));
          // Invert a smooth jaw deformation; sample the original lips and skin.
          let low = distance - 5, high = distance + 5;
          for (let step = 0; step < 9; step++) {
            const mid = (low + high) / 2;
            const mapped = mid + amount * horizontal *
              Math.tanh(mid / 1.3) * Math.exp(-((mid / 10) ** 2));
            if (mapped < distance) low = mid; else high = mid;
          }
          const sampleY = Math.max(0, Math.min(312, center + (low + high) / 2));
          const y0 = Math.floor(sampleY), blend = sampleY - y0;
          const a = (y0 * 291 + px) * 4;
          const b = (Math.min(312, y0 + 1) * 291 + px) * 4;
          const destination = (y * width + x) * 4;
          for (let channel = 0; channel < 4; channel++) {
            patch.data[destination + channel] =
              source.data[a + channel] * (1 - blend) + source.data[b + channel] * blend;
          }
        }
      }
      context.putImageData(patch, left, top);
    };
    if (speaking && !reduced) frame = requestAnimationFrame(draw);
    else context.drawImage(image, 0, 0, 291, 313);
    return () => {
      cancelAnimationFrame(frame);
      preference.removeEventListener("change", change);
      context.drawImage(image, 0, 0, 291, 313);
    };
  }, [speaking, ready]);

  return <span className={`nexa-character nexa-face ${ready && speaking ? "mouth-active" : ""}`}>
    <img src="/avatar/nexa-studio-dashboard.png" width="291" height="313"
      alt="NEXA wearing a lavender hijab, purple headphones and silver NEXA armor"/>
    <canvas ref={canvas} width="291" height="313" aria-hidden="true"/>
  </span>;
}
