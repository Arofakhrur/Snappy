// gifenc ships no type declarations; this module describes the surface used
// by the gallery GIF builder (src/lib/utils/gallery.ts).
declare module 'gifenc' {
	/** Palette produced by quantize(): array of [r, g, b] tuples. */
	export type Palette = number[][];

	export interface GIFEncoderInit {
		auto?: boolean;
		initialCapacity?: number;
	}

	export interface WriteFrameOptions {
		palette?: Palette;
		first?: boolean;
		transparent?: boolean;
		transparentIndex?: number;
		delay?: number;
		repeat?: number;
		dispose?: number;
	}

	export interface GIFEncoderInstance {
		writeFrame(
			index: Uint8Array,
			width: number,
			height: number,
			options?: WriteFrameOptions
		): void;
		writeFrame(index: number[], width: number, height: number, options?: WriteFrameOptions): void;
		finish(): void;
		bytes(): Uint8Array;
		bytesView(): Uint8Array;
		reset(): void;
	}

	export function GIFEncoder(init?: GIFEncoderInit): GIFEncoderInstance;

	export function quantize(
		data: Uint8ClampedArray | number[] | ArrayLike<number>,
		maxColors: number,
		options?: { format?: 'rgb565' | 'rgb444' | 'rgba4444'; oneBitAlpha?: boolean; clearAlpha?: boolean }
	): Palette;

	export function applyPalette(
		data: Uint8ClampedArray | number[] | ArrayLike<number>,
		palette: Palette,
		format?: 'rgb565' | 'rgb444' | 'rgba4444'
	): Uint8Array;
}
