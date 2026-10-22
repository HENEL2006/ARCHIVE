import {
  getSalesReportForPDFService,
  getSalesReportService,
} from "../../services/admin/salesService.js";

import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

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

export const downloadSalesReportExcel = async (req, res) => {
  try {
    const report = await getSalesReportForPDFService(req.query);

    const { orders, totalSales, totalOrders, totalItemsSold, period } = report;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ARCHIVE E-Commerce";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Sales Report", {
      views: [{ showGridLines: true }],
    });

    // Title & Metadata
    worksheet.mergeCells("A1:F1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "ARCHIVE // SALES REPORT";
    titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "000000" } };
    titleCell.alignment = { horizontal: "left", vertical: "middle" };
    worksheet.getRow(1).height = 30;

    worksheet.mergeCells("A2:F2");
    const periodCell = worksheet.getCell("A2");
    periodCell.value = `Period: ${period ? period.toUpperCase() : "ALL"} | Generated: ${new Date().toLocaleDateString("en-IN")}`;
    periodCell.font = { name: "Arial", size: 10, italic: true, color: { argb: "555555" } };
    worksheet.getRow(2).height = 20;

    worksheet.addRow([]);

    // Summary Cards Row
    worksheet.addRow(["Total Orders", totalOrders, "Total Items Sold", totalItemsSold, "Total Net Sales", `₹${totalSales.toLocaleString("en-IN")}`]);
    const summaryRow = worksheet.getRow(4);
    summaryRow.font = { bold: true };
    summaryRow.height = 22;

    worksheet.addRow([]);

    // Table Columns
    worksheet.columns = [
      { header: "Date", key: "date", width: 16 },
      { header: "Order ID", key: "orderId", width: 26 },
      { header: "Payment Method", key: "paymentMethod", width: 18 },
      { header: "Status", key: "status", width: 16 },
      { header: "Items Count", key: "itemsCount", width: 14 },
      { header: "Net Total (₹)", key: "total", width: 18 },
    ];

    // Style Header Row (Row 6)
    const headerRow = worksheet.getRow(6);
    headerRow.values = ["Date", "Order ID", "Payment Method", "Status", "Items", "Net Sales (₹)"];
    headerRow.height = 26;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "000000" },
      };
      cell.font = {
        name: "Arial",
        size: 11,
        bold: true,
        color: { argb: "FFFFFF" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    // Populate Order Rows
    orders.forEach((order) => {
      const itemsCount = (order.items || []).reduce(
        (sum, item) => sum + (item.quantity || 0),
        0,
      );

      const row = worksheet.addRow([
        new Date(order.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).toUpperCase(),
        order.orderId,
        order.paymentMethod,
        order.orderStatus,
        itemsCount,
        order.total || 0,
      ]);

      row.height = 20;
      row.getCell(1).alignment = { horizontal: "center" };
      row.getCell(2).alignment = { horizontal: "left" };
      row.getCell(3).alignment = { horizontal: "center" };
      row.getCell(4).alignment = { horizontal: "center" };
      row.getCell(5).alignment = { horizontal: "center" };
      row.getCell(6).alignment = { horizontal: "right" };
      row.getCell(6).numFmt = "₹#,##0.00";
    });

    // Summary Total Row
    const totalRow = worksheet.addRow([
      "TOTAL",
      "",
      "",
      "",
      totalItemsSold,
      totalSales,
    ]);
    totalRow.height = 24;
    totalRow.font = { bold: true };
    totalRow.getCell(1).alignment = { horizontal: "left" };
    totalRow.getCell(5).alignment = { horizontal: "center" };
    totalRow.getCell(6).alignment = { horizontal: "right" };
    totalRow.getCell(6).numFmt = "₹#,##0.00";
    totalRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "F4F4F5" },
      };
      cell.border = {
        top: { style: "thin", color: { argb: "CCCCCC" } },
        bottom: { style: "double", color: { argb: "000000" } },
      };
    });

    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `ARCHIVE-Sales-Report-${period}-${dateStr}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`,
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("DOWNLOAD SALES REPORT EXCEL ERROR:", error);

    if (!res.headersSent) {
      res.status(500).json({
        message: error.message || "Failed to generate sales report Excel",
      });
    }
  }
};

