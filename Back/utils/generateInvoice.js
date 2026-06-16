const PDFDocument = require("pdfkit");

/**
 * Generates an A4 PDF invoice directly into the response stream
 * @param {Object} order - The order document from DB
 * @param {Object} res - Express response stream
 */
const generateInvoice = (order, res) => {
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  // Stream output directly to response
  doc.pipe(res);

  // --- HEADER SECTION ---
  doc.fillColor("#111111")
     .fontSize(20)
     .text("SHOP PREMIUM", 50, 45, { bold: true });
  
  doc.fontSize(10)
     .text("123 Luxury Avenue, Cairo, Egypt", 50, 70)
     .text("support@shoppremium.com | +20 123 456 7890", 50, 85);

  doc.fontSize(14)
     .text("INVOICE", 400, 45, { align: "right" });
  
  doc.fontSize(10)
     .text(`Invoice No: INV-${order._id.toString().substring(0, 8).toUpperCase()}`, 400, 65, { align: "right" })
     .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 400, 80, { align: "right" })
     .text(`Status: ${order.orderStatus.toUpperCase()}`, 400, 95, { align: "right" });

  doc.moveDown(2);
  doc.strokeColor("#cccccc")
     .lineWidth(1)
     .moveTo(50, 115)
     .lineTo(550, 115)
     .stroke();

  // --- BILL TO / SHIP TO ---
  const billingTop = 135;
  doc.fontSize(12)
     .text("Bill To:", 50, billingTop, { underline: true });
  doc.fontSize(10)
     .text(order.user ? order.user.username : "Valued Customer", 50, billingTop + 20)
     .text(order.user ? order.user.email : "", 50, billingTop + 35);

  doc.fontSize(12)
     .text("Ship To:", 300, billingTop, { underline: true });
  doc.fontSize(10)
     .text(order.shippingAddress.fullName, 300, billingTop + 20)
     .text(`${order.shippingAddress.street}, ${order.shippingAddress.city}`, 300, billingTop + 35)
     .text(`Phone: ${order.shippingAddress.phone}`, 300, billingTop + 50);

  doc.moveDown(4);

  // --- ITEMS TABLE ---
  let tableTop = 230;
  doc.strokeColor("#eeeeee")
     .lineWidth(1)
     .moveTo(50, tableTop - 5)
     .lineTo(550, tableTop - 5)
     .stroke();

  // Header row
  doc.fontSize(10)
     .text("Item Description", 50, tableTop, { bold: true })
     .text("Price", 280, tableTop, { bold: true, align: "right", width: 70 })
     .text("Qty", 370, tableTop, { bold: true, align: "right", width: 50 })
     .text("Total", 450, tableTop, { bold: true, align: "right", width: 100 });

  doc.strokeColor("#222222")
     .lineWidth(1.5)
     .moveTo(50, tableTop + 15)
     .lineTo(550, tableTop + 15)
     .stroke();

  tableTop += 25;

  // Print items
  order.orderItems.forEach(item => {
    const title = item.title.length > 35 ? item.title.substring(0, 32) + "..." : item.title;
    doc.text(title, 50, tableTop)
       .text(`${item.price.toFixed(2)} EGP`, 280, tableTop, { align: "right", width: 70 })
       .text(item.quantity.toString(), 370, tableTop, { align: "right", width: 50 })
       .text(`${(item.price * item.quantity).toFixed(2)} EGP`, 450, tableTop, { align: "right", width: 100 });

    tableTop += 20;
  });

  doc.strokeColor("#eeeeee")
     .lineWidth(1)
     .moveTo(50, tableTop + 5)
     .lineTo(550, tableTop + 5)
     .stroke();

  tableTop += 15;

  // --- TOTALS BLOCK ---
  const totalsLeft = 350;
  doc.fontSize(10)
     .text("Subtotal:", totalsLeft, tableTop)
     .text(`${order.itemsPrice.toFixed(2)} EGP`, 450, tableTop, { align: "right", width: 100 });

  doc.text("Shipping Fee:", totalsLeft, tableTop + 15)
     .text(`${order.shippingPrice.toFixed(2)} EGP`, 450, tableTop + 15, { align: "right", width: 100 });

  doc.text("Tax (14% VAT):", totalsLeft, tableTop + 30)
     .text(`${order.taxPrice.toFixed(2)} EGP`, 450, tableTop + 30, { align: "right", width: 100 });

  doc.fontSize(12)
     .text("Grand Total:", totalsLeft, tableTop + 50, { bold: true })
     .text(`${order.totalPrice.toFixed(2)} EGP`, 450, tableTop + 50, { bold: true, align: "right", width: 100 });

  // --- FOOTER SECTION ---
  doc.fontSize(9)
     .fillColor("#666666")
     .text("Thank you for shopping with us! If you have any inquiries, please reach out to our customer experience desk.", 50, 730, { align: "center" });

  doc.end();
};

module.exports = generateInvoice;
