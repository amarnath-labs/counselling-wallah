import fitz

pdf_path = r".\tmp-fees\coep-2026-27.pdf"
png_path = r".\tmp-fees\coep-2026-27.png"

doc = fitz.open(pdf_path)
page = doc[0]

pix = page.get_pixmap(
    matrix=fitz.Matrix(3, 3),
    alpha=False
)

pix.save(png_path)

print("Saved:", png_path)
print("Image size:", pix.width, "x", pix.height)

doc.close()
