// Client-only. Feeds events.flyerUrl; the PDF itself stays in flyerDownloadUrl.
export async function pdfFirstPageToPng(file: File): Promise<Blob> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() })
    .promise;
  const page = await doc.getPage(1);

  const base = page.getViewport({ scale: 1 });
  const scale = 1600 / Math.max(base.width, base.height);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const canvasContext = canvas.getContext("2d")!;
  await page.render({ canvasContext, canvas, viewport }).promise;

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );
  if (!blob) throw new Error("Could not create a preview from this PDF.");
  return blob;
}
