import Foundation
import PDFKit
import AppKit

let args = CommandLine.arguments
let pdfPath = args[1]
let outDir = args[2]
guard let doc = PDFDocument(url: URL(fileURLWithPath: pdfPath)) else {
    print("cannot open pdf"); exit(1)
}
for i in 0..<doc.pageCount {
    guard let page = doc.page(at: i) else { continue }
    let bounds = page.bounds(for: .mediaBox)
    let scale: CGFloat = 2.0
    let size = NSSize(width: bounds.width * scale, height: bounds.height * scale)
    let img = NSImage(size: size)
    img.lockFocus()
    NSColor.white.setFill()
    NSRect(origin: .zero, size: size).fill()
    let ctx = NSGraphicsContext.current!.cgContext
    ctx.scaleBy(x: scale, y: scale)
    page.draw(with: .mediaBox, to: ctx)
    img.unlockFocus()
    guard let tiff = img.tiffRepresentation,
          let rep = NSBitmapImageRep(data: tiff),
          let png = rep.representation(using: .png, properties: [:]) else { continue }
    let out = URL(fileURLWithPath: outDir).appendingPathComponent(String(format: "page-%02d.png", i+1))
    try? png.write(to: out)
    print("wrote \(out.path)")
}
