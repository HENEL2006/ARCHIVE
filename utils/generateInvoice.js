import PDFDocument from "pdfkit";

export const generateInvoice = (order, res) => {
  const doc = new PDFDocument({
    size: "A4",
    margin: 40,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="invoice-${order.orderId}.pdf"`,
  );

  doc.pipe(res);

  const startX = 40;
  const pageWidth = 515; // 595 - 80

  // =========================
  // BRAND HEADER
  // =========================
  doc
    .fontSize(22)
    .font("Helvetica-Bold")
    .text("ARCHIVE", startX, 40);

  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor("#555555")
    .text("FOOTBALL JERSEY ARCHIVE", startX, 66);

  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .fillColor("#000000")
    .text("TAX INVOICE", startX + 300, 40, { align: "right" });

  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor("#555555")
    .text(`INVOICE #: ${order.orderId}`, startX + 300, 62, { align: "right" })
    .text(`DATE: ${new Date(order.createdAt).toLocaleDateString("en-IN")}`, startX + 300, 74, { align: "right" });

  // Divider Line
  doc
    .moveTo(startX, 90)
    .lineTo(startX + pageWidth, 90)
    .lineWidth(1)
    .strokeColor("#000000")
    .stroke();

  // =========================
  // CUSTOMER & ORDER INFO GRID
  // =========================
  const colWidth = pageWidth / 2 - 10;
  let y = 105;

  // Left Column: Customer & Delivery Address
  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .fillColor("#000000")
    .text("DELIVERY ADDRESS", startX, y);

  y += 15;
  const address = order.deliveryAddress;
  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor("#333333")
    .text(address?.fullName || order.userId?.username || "", startX, y)
    .text(address?.phone ? `Phone: ${address.phone}` : "", startX, y + 12)
    .text(`${address?.addressLine1 || ""}${address?.addressLine2 ? ", " + address.addressLine2 : ""}`, startX, y + 24, { width: colWidth })
    .text(`${address?.city || ""}, ${address?.state || ""} - ${address?.postalCode || ""}`, startX, y + 36)
    .text(address?.country || "", startX, y + 48);

  // Right Column: Order Details
  const rightX = startX + colWidth + 20;
  y = 105;

  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .fillColor("#000000")
    .text("ORDER SUMMARY", rightX, y);

  y += 15;
  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor("#333333")
    .text(`Payment Method: ${order.paymentMethod || "COD"}`, rightX, y)
    .text(`Payment Status: ${order.paymentStatus || "PENDING"}`, rightX, y + 12)
    .text(`Order Status: ${order.orderStatus || "PLACED"}`, rightX, y + 24)
    .text(`Transaction ID: ${order.transactionId || "N/A"}`, rightX, y + 36);

  // Section Divider Line
  y = 180;
  doc
    .moveTo(startX, y)
    .lineTo(startX + pageWidth, y)
    .lineWidth(0.5)
    .strokeColor("#000000")
    .stroke();

  // =========================
  // PRODUCTS TABLE
  // =========================
  y += 15;

  // Table Headers
  const colX = {
    num: startX,
    name: startX + 25,
    size: startX + 260,
    qty: startX + 310,
    price: startX + 360,
    total: startX + 430,
  };

  doc
    .fontSize(9)
    .font("Helvetica-Bold")
    .fillColor("#000000")
    .text("#", colX.num, y)
    .text("PRODUCT DESCRIPTION", colX.name, y)
    .text("SIZE", colX.size, y)
    .text("QTY", colX.qty, y)
    .text("PRICE", colX.price, y)
    .text("TOTAL", colX.total, y, { width: 85, align: "right" });

  y += 15;
  doc
    .moveTo(startX, y)
    .lineTo(startX + pageWidth, y)
    .lineWidth(1)
    .strokeColor("#000000")
    .stroke();

  // Table Items
  y += 10;

  order.items.forEach((item, index) => {
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#222222")
      .text(`${index + 1}`, colX.num, y)
      .text(item.name || "-", colX.name, y, { width: 225 })
      .text(item.size || "-", colX.size, y)
      .text(`${item.quantity}`, colX.qty, y)
      .text(`₹${Number(item.price || 0).toLocaleString("en-IN")}`, colX.price, y)
      .text(`₹${Number(item.itemTotal || 0).toLocaleString("en-IN")}`, colX.total, y, { width: 85, align: "right" });

    y += 20;

    doc
      .moveTo(startX, y)
      .lineTo(startX + pageWidth, y)
      .lineWidth(0.25)
      .strokeColor("#cccccc")
      .stroke();

    y += 8;
  });

  // =========================
  // TOTALS CALCULATION
  // =========================
  y += 10;
  const summaryX = startX + 300;
  const summaryWidth = pageWidth - 300;

  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor("#444444")
    .text("Subtotal:", summaryX, y)
    .text(`₹${Number(order.subtotal || 0).toLocaleString("en-IN")}`, summaryX, y, { width: summaryWidth, align: "right" });

  y += 14;
  doc
    .text("Shipping Fee:", summaryX, y)
    .text(`₹${Number(order.shipping || 0).toLocaleString("en-IN")}`, summaryX, y, { width: summaryWidth, align: "right" });

  if (order.discount > 0) {
    y += 14;
    doc
      .text("Coupon Discount:", summaryX, y)
      .text(`-₹${Number(order.discount || 0).toLocaleString("en-IN")}`, summaryX, y, { width: summaryWidth, align: "right" });
  }

  y += 18;
  doc
    .moveTo(summaryX, y)
    .lineTo(startX + pageWidth, y)
    .lineWidth(1)
    .strokeColor("#000000")
    .stroke();

  y += 8;
  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .fillColor("#000000")
    .text("TOTAL PAID:", summaryX, y)
    .text(`₹${Number(order.total || 0).toLocaleString("en-IN")}`, summaryX, y, { width: summaryWidth, align: "right" });

  // =========================
  // FOOTER
  // =========================
  const footerY = doc.page.height - 70;

  doc
    .moveTo(startX, footerY)
    .lineTo(startX + pageWidth, footerY)
    .lineWidth(0.5)
    .strokeColor("#000000")
    .stroke();

  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor("#666666")
    .text("Thank you for your purchase with ARCHIVE.", startX, footerY + 12, { align: "center" })
    .text("For support, inquiries, or return requests, please visit support@archivejerseys.com", startX, footerY + 24, { align: "center" });

  doc.end();
};

