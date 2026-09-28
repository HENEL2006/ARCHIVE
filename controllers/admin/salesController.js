import {
  getSalesReportForPDFService,
  getSalesReportService,
} from "../../services/admin/salesService.js";

import PDFDocument from "pdfkit";

export const loadSalesReport = async (req, res) => {
  try {
    const report = await getSalesReportService(req.query);

    res.render("admin/salesReport", {
      ...report,
      activePage: "salesReport",
    });
  } catch (error) {
    console.log(error);

    req.session.toast = {
      type: "error",
      message: error.message,
    };

    res.redirect("/admin/salesReport");
  }
};

export const downloadSalesReportPDF = async (req, res) => {
  try {
    const report = await getSalesReportForPDFService(req.query);

    const {
      orders,
      totalSales,
      totalDiscount,
      totalOrders,
      totalItemsSold,
      breakdown,
      period,
      startDate,
      endDate,
    } = report;

    // ==========================================
    // CREATE PDF
    // ==========================================

    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
      bufferPages: true,
    });

    // ==========================================
    // FILE NAME
    // ==========================================

    const date = new Date().toISOString().split("T")[0];

    const filename = `ARCHIVE-Sales-Report-${period}-${date}.pdf`;

    // ==========================================
    // RESPONSE HEADERS
    // ==========================================

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Pipe PDF directly to browser
    doc.pipe(res);

    // ==========================================
    // COLORS
    // ==========================================

    const BLACK = "#0a0a0a";
    const GREY = "#71717a";
    const LIGHT_GREY = "#e5e7eb";
    const LIGHT_BACKGROUND = "#f4f4f5";

    // ==========================================
    // HELPER FUNCTIONS
    // ==========================================

    const formatCurrency = (amount = 0) => {
      return `Rs. ${Number(amount).toLocaleString("en-IN")}`;
    };

    const formatDate = (dateValue) => {
      if (!dateValue) {
        return "-";
      }

      return new Date(dateValue).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    // ==========================================
    // HEADER
    // ==========================================

    doc
      .font("Helvetica-Bold")
      .fontSize(24)
      .fillColor(BLACK)
      .text("ARCHIVE", 40, 40);

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(GREY)
      .text("FOOTBALL JERSEY STORE", 40, 68);

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor(BLACK)
      .text("SALES REPORT", 40, 105);

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(GREY)
      .text(`Period: ${period.toUpperCase()}`, 40, 128);

    doc.text(`${formatDate(startDate)} — ${formatDate(endDate)}`, 40, 142);

    // Header line
    doc.moveTo(40, 165).lineTo(555, 165).strokeColor(LIGHT_GREY).stroke();

    // ==========================================
    // SUMMARY CARDS
    // ==========================================

    const cardY = 185;
    const cardWidth = 118;
    const cardHeight = 75;
    const gap = 11;

    const cards = [
      {
        title: "TOTAL SALES",
        value: formatCurrency(totalSales),
      },
      {
        title: "ORDERS",
        value: totalOrders.toLocaleString("en-IN"),
      },
      {
        title: "ITEMS SOLD",
        value: totalItemsSold.toLocaleString("en-IN"),
      },
      {
        title: "DISCOUNTS",
        value: formatCurrency(totalDiscount),
      },
    ];

    cards.forEach((card, index) => {
      const x = 40 + index * (cardWidth + gap);

      doc
        .roundedRect(x, cardY, cardWidth, cardHeight, 3)
        .fillColor("#ffffff")
        .strokeColor(LIGHT_GREY)
        .lineWidth(1)
        .fillAndStroke();

      doc
        .font("Helvetica-Bold")
        .fontSize(7)
        .fillColor(GREY)
        .text(card.title, x + 10, cardY + 10);

      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor(BLACK)
        .text(card.value, x + 10, cardY + 35, {
          width: cardWidth - 20,
        });
    });

    // ==========================================
    // SALES BREAKDOWN
    // ==========================================

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(BLACK)
      .text("SALES BREAKDOWN", 40, 290);

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(GREY)
      .text("Chronological audit ledger of completed orders.", 40, 306);

    // ==========================================
    // TABLE CONFIGURATION
    // ==========================================

    let tableY = 330;

    const columns = {
      date: 45,
      orders: 155,
      items: 220,
      gross: 285,
      discount: 385,
      net: 485,
    };

    // ==========================================
    // TABLE HEADER
    // ==========================================

    doc.rect(40, tableY, 515, 25).fillColor(LIGHT_BACKGROUND).fill();

    doc.font("Helvetica-Bold").fontSize(7).fillColor(GREY);

    doc.text("DATE", columns.date, tableY + 8);

    doc.text("ORDERS", columns.orders, tableY + 8);

    doc.text("ITEMS", columns.items, tableY + 8);

    doc.text("GROSS SALES", columns.gross, tableY + 8);

    doc.text("DISCOUNTS", columns.discount, tableY + 8);

    doc.text("NET SALES", columns.net, tableY + 8);

    tableY += 25;

    // ==========================================
    // TABLE ROWS
    // ==========================================

    breakdown.forEach((row) => {
      // Create new page when necessary
      if (tableY > 750) {
        doc.addPage();

        tableY = 50;

        doc
          .font("Helvetica-Bold")
          .fontSize(11)
          .fillColor(BLACK)
          .text("SALES BREAKDOWN — CONTINUED", 40, tableY);

        tableY += 25;

        // Header again
        doc.rect(40, tableY, 515, 25).fillColor(LIGHT_BACKGROUND).fill();

        doc.font("Helvetica-Bold").fontSize(7).fillColor(GREY);

        doc.text("DATE", columns.date, tableY + 8);

        doc.text("ORDERS", columns.orders, tableY + 8);

        doc.text("ITEMS", columns.items, tableY + 8);

        doc.text("GROSS SALES", columns.gross, tableY + 8);

        doc.text("DISCOUNTS", columns.discount, tableY + 8);

        doc.text("NET SALES", columns.net, tableY + 8);

        tableY += 25;
      }

      // Row separator
      doc
        .moveTo(40, tableY)
        .lineTo(555, tableY)
        .strokeColor(LIGHT_GREY)
        .lineWidth(0.5)
        .stroke();

      doc.font("Helvetica").fontSize(7.5).fillColor(BLACK);

      doc.text(formatDate(row.date), columns.date, tableY + 8);

      doc.text(String(row.orders), columns.orders, tableY + 8);

      doc.text(String(row.itemsSold), columns.items, tableY + 8);

      doc.text(formatCurrency(row.grossSales), columns.gross, tableY + 8);

      doc.text(formatCurrency(row.discounts), columns.discount, tableY + 8);

      doc
        .font("Helvetica-Bold")
        .text(formatCurrency(row.netSales), columns.net, tableY + 8);

      tableY += 30;
    });

    // ==========================================
    // TOTAL ROW
    // ==========================================

    if (tableY > 700) {
      doc.addPage();

      tableY = 50;
    }

    const grossSales = orders.reduce(
      (sum, order) => sum + (order.subtotal || 0),
      0,
    );

    doc.rect(40, tableY, 515, 32).fillColor(LIGHT_BACKGROUND).fill();

    doc.font("Helvetica-Bold").fontSize(8).fillColor(BLACK);

    doc.text("TOTAL", 45, tableY + 11);

    doc.text(String(totalOrders), columns.orders, tableY + 11);

    doc.text(String(totalItemsSold), columns.items, tableY + 11);

    doc.text(formatCurrency(grossSales), columns.gross, tableY + 11);

    doc.text(formatCurrency(totalDiscount), columns.discount, tableY + 11);

    doc.text(formatCurrency(totalSales), columns.net, tableY + 11);

    // ==========================================
    // FOOTER / PAGE NUMBERS
    // ==========================================

    const pageRange = doc.bufferedPageRange();

    for (
      let page = pageRange.start;
      page < pageRange.start + pageRange.count;
      page++
    ) {
      doc.switchToPage(page);

      doc
        .font("Helvetica")
        .fontSize(7)
        .fillColor(GREY)
        .text(`ARCHIVE // SALES REPORT // PAGE ${page + 1}`, 40, 805, {
          width: 515,
          align: "center",
        });
    }

    // ==========================================
    // FINISH PDF
    // ==========================================

    doc.end();
  } catch (error) {
    console.error("DOWNLOAD SALES REPORT PDF ERROR:", error);

    if (!res.headersSent) {
      res.status(500).json({
        message: error.message || "Failed to generate sales report PDF",
      });
    }
  }
};
