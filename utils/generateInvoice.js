import PDFDocument from "pdfkit";

export const generateInvoice = (order, res) => {
  const doc = new PDFDocument({
    margin: 50,
  });

  res.setHeader("Content-Type", "application/pdf");

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="invoice-${order.orderId}.pdf"`,
  );

  doc.pipe(res);

  // =========================
  // HEADER
  // =========================

  doc.fontSize(24).font("Helvetica-Bold").text("ARCHIVE");

  doc.fontSize(10).font("Helvetica").text("Football Jersey Archive");

  doc.moveDown(2);

  doc.fontSize(18).font("Helvetica-Bold").text("INVOICE");

  doc.moveDown();

  // =========================
  // ORDER INFORMATION
  // =========================

  doc
    .fontSize(10)
    .font("Helvetica")
    .text(`Order ID: ${order.orderId}`)
    .text(
      `Order Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}`,
    )
    .text(`Payment Method: ${order.paymentMethod || "-"}`)
    .text(`Payment Status: ${order.paymentStatus || "-"}`)
    .text(`Order Status: ${order.orderStatus || "-"}`);

  doc.moveDown(2);

  // =========================
  // CUSTOMER INFORMATION
  // =========================

  doc.fontSize(12).font("Helvetica-Bold").text("Customer");

  doc.moveDown(0.5);

  doc
    .fontSize(10)
    .font("Helvetica")
    .text(order.deliveryAddress?.fullName || order.userId?.username || "")
    .text(order.userId?.email || "")
    .text(order.deliveryAddress?.phone || "");

  doc.moveDown();

  // =========================
  // DELIVERY ADDRESS
  // =========================

  doc.fontSize(12).font("Helvetica-Bold").text("Delivery Address");

  doc.moveDown(0.5);

  const address = order.deliveryAddress;

  if (address) {
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(address.addressLine1 || "")
      .text(address.addressLine2 || "")
      .text(
        `${address.city || ""}, ${address.state || ""} - ${
          address.postalCode || ""
        }`,
      )
      .text(address.country || "");
  }

  doc.moveDown(2);

  // =========================
  // PRODUCTS
  // =========================

  doc.fontSize(12).font("Helvetica-Bold").text("Products");

  doc.moveDown();

  order.items.forEach((item, index) => {
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(`${index + 1}. ${item.name}`);

    doc
      .font("Helvetica")
      .text(`Size: ${item.size || "-"}`)
      .text(`Quantity: ${item.quantity}`)
      .text(`Price: ₹${Number(item.price || 0).toLocaleString("en-IN")}`)
      .text(
        `Subtotal: ₹${Number(item.itemTotal || 0).toLocaleString("en-IN")}`,
      );

    if (item.itemStatus === "CANCELLED") {
      doc.font("Helvetica").text("Status: CANCELLED");
    } else if (item.itemStatus === "RETURN_REQUESTED") {
      doc.font("Helvetica").text("Status: RETURN REQUESTED");
    } else {
      doc.font("Helvetica").text(`Status: ${item.itemStatus || "-"}`);
    }

    doc.moveDown();
  });

  // =========================
  // ORDER SUMMARY
  // =========================

  doc.moveDown();

  doc.fontSize(12).font("Helvetica-Bold").text("Order Summary");

  doc.moveDown(0.5);

  doc
    .fontSize(10)
    .font("Helvetica")
    .text(`Subtotal: ₹${Number(order.subtotal || 0).toLocaleString("en-IN")}`, {
      align: "right",
    })
    .text(`Shipping: ₹${Number(order.shipping || 0).toLocaleString("en-IN")}`, {
      align: "right",
    })
    .text(`Tax: ₹${Number(order.tax || 0).toLocaleString("en-IN")}`, {
      align: "right",
    })
    .text(
      `Discount: -₹${Number(order.discount || 0).toLocaleString("en-IN")}`,
      { align: "right" },
    );

  doc.moveDown();

  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .text(`TOTAL: ₹${Number(order.total || 0).toLocaleString("en-IN")}`, {
      align: "right",
    });

  // =========================
  // FOOTER
  // =========================

  doc.moveDown(3);

  doc
    .fontSize(9)
    .font("Helvetica")
    .text("Thank you for shopping with ARCHIVE.", { align: "center" });

  doc.end();
};
