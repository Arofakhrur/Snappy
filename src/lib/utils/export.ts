/**
 * Export Utility — PNG download and print trigger
 */

import { renderExportCanvas } from './canvas';
import type { CustomTemplate, RenderOptions } from '#lib/types';

type TemplateArg = string | CustomTemplate;

/** Download the photo strip as a PNG file. */
export async function downloadStripPNG(
	photoDataUrls: string[],
	templateKey: TemplateArg,
	options: RenderOptions
): Promise<void> {
	const canvas = await renderExportCanvas(photoDataUrls, templateKey, options);

	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (!blob) {
					reject(new Error('Failed to generate PNG blob'));
					return;
				}
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				const timestamp = new Date()
					.toISOString()
					.replace(/[:\-T]/g, '')
					.slice(0, 15);
				a.href = url;
				a.download = `distudio-strip-${timestamp}.png`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
				resolve();
			},
			'image/png'
		);
	});
}

/**
 * Prepare the hidden #print-layout element with the export image,
 * then trigger window.print().
 */
export async function printStrip(
	photoDataUrls: string[],
	templateKey: TemplateArg,
	options: RenderOptions
): Promise<void> {
	const canvas = await renderExportCanvas(photoDataUrls, templateKey, options);

	const printLayout = document.getElementById('print-layout');
	if (!printLayout) {
		throw new Error('#print-layout element not found in DOM');
	}

	// Convert to data URL for the img tag
	const dataUrl = canvas.toDataURL('image/png');
	const img = printLayout.querySelector('img');
	if (img) {
		img.src = dataUrl;
	}

	// Small delay to let the browser paint the image before printing
	await new Promise((r) => setTimeout(r, 100));
	window.print();
}
