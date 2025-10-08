import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, WidthType, BorderStyle, HeadingLevel, AlignmentType, ImageRun } from 'docx';

const formatCurrency = (amount, currency) => `${currency}${amount.toFixed(2)}`;

const createHeader = (invoiceNumber, logo) => {
    const logoImage = logo ? new ImageRun({
        data: Buffer.from(logo.split(',')[1], 'base64'),
        transformation: {
            width: 150,
            height: 50,
        },
    }) : new TextRun("");

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [50, 50],
        borders: {
            top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
            left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
        },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({ children: [logoImage] })],
                        verticalAlign: 'center',
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    }),
                    new TableCell({
                        children: [
                            new Paragraph({ text: "Invoice", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.RIGHT }),
                            new Paragraph({ text: `# ${invoiceNumber}`, alignment: AlignmentType.RIGHT }),
                        ],
                        verticalAlign: 'center',
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    }),
                ],
            }),
        ],
    });
};

const createInfoSection = (date, dueDate, billFrom, billTo, total, currency) => {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [50, 50],
        borders: { all: { style: BorderStyle.NONE } },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        children: [
                            new Paragraph({ text: "FROM:", style: "subheading" }),
                            ...billFrom.split('\n').map(line => new Paragraph(line)),
                        ],
                        borders: { all: { style: BorderStyle.NONE } },
                    }),
                    new TableCell({
                        children: [
                            new Paragraph({ text: "TO:", style: "subheading", alignment: AlignmentType.RIGHT }),
                            ...billTo.split('\n').map(line => new Paragraph({ text: line, alignment: AlignmentType.RIGHT })),
                        ],
                        borders: { all: { style: BorderStyle.NONE } },
                    }),
                ],
            }),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph("")], borders: { all: { style: BorderStyle.NONE } } }),
                    new TableCell({
                        children: [
                            new Paragraph({ text: "Date:", style: "subheading", alignment: AlignmentType.RIGHT }),
                            new Paragraph({ text: date, alignment: AlignmentType.RIGHT }),
                            new Paragraph({ text: "Due Date:", style: "subheading", alignment: AlignmentType.RIGHT }),
                            new Paragraph({ text: dueDate || 'N/A', alignment: AlignmentType.RIGHT }),
                            new Paragraph({ text: "Total Amount:", style: "subheading", alignment: AlignmentType.RIGHT }),
                            new Paragraph({ text: formatCurrency(total, currency), alignment: AlignmentType.RIGHT, style: "totalAmount" }),
                        ],
                        borders: { all: { style: BorderStyle.NONE } },
                    }),
                ],
            }),
        ],
    });
};

const createItemsTable = (items, currency) => {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [50, 15, 15, 20],
        rows: [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: "Item", style: "tableHeader" })], shading: { fill: "4F4F4F" } }),
                    new TableCell({ children: [new Paragraph({ text: "Qty", style: "tableHeader", alignment: AlignmentType.RIGHT })], shading: { fill: "4F4F4F" } }),
                    new TableCell({ children: [new Paragraph({ text: "Rate", style: "tableHeader", alignment: AlignmentType.RIGHT })], shading: { fill: "4F4F4F" } }),
                    new TableCell({ children: [new Paragraph({ text: "Amount", style: "tableHeader", alignment: AlignmentType.RIGHT })], shading: { fill: "4F4F4F" } }),
                ],
            }),
            ...items.flatMap(item => [
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ text: item.description, bold: true })] }),
                        new TableCell({ children: [new Paragraph({ text: String(item.quantity), alignment: AlignmentType.RIGHT })] }),
                        new TableCell({ children: [new Paragraph({ text: formatCurrency(item.rate, currency), alignment: AlignmentType.RIGHT })] }),
                        new TableCell({ children: [new Paragraph({ text: formatCurrency(item.quantity * item.rate, currency), alignment: AlignmentType.RIGHT })] }),
                    ],
                }),
            ]),
        ],
    });
};

const createTotalsTable = ({ subtotal, totalItemDiscount, overallDiscount, overallDiscountType, tax, shipping, total, currency }) => {
    const overallDiscountAmount = overallDiscountType === '%' ? (subtotal - totalItemDiscount) * overallDiscount / 100 : overallDiscount;
    const taxableAmount = subtotal - totalItemDiscount - overallDiscountAmount;
    const taxAmount = taxableAmount * tax / 100;
    
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [70, 30],
        borders: { all: { style: BorderStyle.NONE } },
        rows: [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: "Subtotal", alignment: AlignmentType.RIGHT })] }),
                    new TableCell({ children: [new Paragraph({ text: formatCurrency(subtotal, currency), alignment: AlignmentType.RIGHT })] }),
                ]
            }),
            ...(totalItemDiscount > 0 ? [new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: "Item Discounts", alignment: AlignmentType.RIGHT })] }),
                    new TableCell({ children: [new Paragraph({ text: `-${formatCurrency(totalItemDiscount, currency)}`, alignment: AlignmentType.RIGHT })] }),
                ]
            })] : []),
            ...(overallDiscount > 0 ? [new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: `Discount (${overallDiscount}${overallDiscountType})`, alignment: AlignmentType.RIGHT })] }),
                    new TableCell({ children: [new Paragraph({ text: `-${formatCurrency(overallDiscountAmount, currency)}`, alignment: AlignmentType.RIGHT })] }),
                ]
            })] : []),
            ...(tax > 0 ? [new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: `Tax (${tax}%)`, alignment: AlignmentType.RIGHT })] }),
                    new TableCell({ children: [new Paragraph({ text: `+${formatCurrency(taxAmount, currency)}`, alignment: AlignmentType.RIGHT })] }),
                ]
            })] : []),
            ...(shipping > 0 ? [new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: "Shipping", alignment: AlignmentType.RIGHT })] }),
                    new TableCell({ children: [new Paragraph({ text: `+${formatCurrency(shipping, currency)}`, alignment: AlignmentType.RIGHT })] }),
                ]
            })] : []),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: "Total Due", alignment: AlignmentType.RIGHT, style: "totalText" })] }),
                    new TableCell({ children: [new Paragraph({ text: formatCurrency(total, currency), alignment: AlignmentType.RIGHT, style: "totalText" })] }),
                ],
            }),
        ],
    });
};

const createFooter = (notes, terms, paymentDetails) => {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [50, 50],
        borders: { all: { style: BorderStyle.NONE } },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        children: [
                            new Paragraph({ text: "Notes", style: "subheading" }),
                            new Paragraph(notes),
                        ],
                        borders: { all: { style: BorderStyle.NONE } }
                    }),
                    new TableCell({
                        children: [
                            new Paragraph({ text: "Terms", style: "subheading" }),
                            new Paragraph(terms),
                        ],
                        borders: { all: { style: BorderStyle.NONE } }
                    }),
                ],
            }),
            new TableRow({
                children: [
                    new TableCell({
                        children: [
                            new Paragraph({ text: "Payment Details", style: "subheading" }),
                            new Paragraph(paymentDetails),
                        ],
                        columnSpan: 2,
                        borders: { top: { style: BorderStyle.SINGLE, size: 2, color: "E0E0E0" }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
                    })
                ]
            })
        ],
    });
};


export const generateDocx = (data) => {
    const doc = new Document({
        creator: "Ashwheel Tools",
        styles: {
            paragraphStyles: [
                { id: "subheading", name: "Subheading", basedOn: "Normal", next: "Normal", run: { bold: true, color: "808080" }, paragraph: { spacing: { after: 120 } } },
                { id: "tableHeader", name: "Table Header", basedOn: "Normal", run: { bold: true, color: "FFFFFF" }, paragraph: { spacing: { before: 100, after: 100 } } },
                { id: "totalAmount", name: "Total Amount", basedOn: "Normal", run: { bold: true, size: 28 }, },
                { id: "totalText", name: "Total Text", basedOn: "Normal", run: { bold: true, size: 24 }, paragraph: { border: { top: { color: "000000", space: 1, style: "single", size: 6 } }, spacing: { before: 100 } } },
            ],
        },
        sections: [{
            children: [
                createHeader(data.invoiceNumber, data.logo),
                new Paragraph({ spacing: { after: 400 } }),
                createInfoSection(data.date, data.dueDate, data.billFrom, data.billTo, data.total, data.currency),
                new Paragraph({ spacing: { after: 400 } }),
                createItemsTable(data.items, data.currency),
                new Paragraph({ spacing: { after: 200 } }),
                createTotalsTable(data),
                new Paragraph({ spacing: { after: 600 } }),
                createFooter(data.notes, data.terms, data.paymentDetails),
            ],
        }],
    });

    return doc;
};