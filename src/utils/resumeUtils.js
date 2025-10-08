import { Packer, Document, Paragraph, TextRun, AlignmentType, PageSize, PageOrientation } from 'docx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const createSection = (title, children) => [
    new Paragraph({
        text: title.toUpperCase(),
        style: "SectionHeader",
        spacing: { before: title === "Summary" ? 200 : 300, after: 150 },
    }),
    ...children,
];

const createExperienceItem = (exp) => [
    new Paragraph({
        children: [
            new TextRun({ text: exp.jobTitle, bold: true, size: 22 }),
            new TextRun({ text: ` | ${exp.company}`, size: 22 }),
        ],
        spacing: { after: 40 },
    }),
    new Paragraph({
        children: [new TextRun({ text: `${exp.startDate} - ${exp.endDate || 'Present'}`, italics: true, color: "555555", size: 18 })],
        spacing: { after: 80 },
    }),
    ...exp.description.split('\n').filter(line => line.trim() !== '').map(line => new Paragraph({
        text: line.trim(),
        bullet: { level: 0 },
        style: "BodyText",
        spacing: { after: 40 },
        indent: { left: 360 },
    })),
];

const createEducationItem = (edu) => [
    new Paragraph({
        children: [
            new TextRun({ text: edu.degree, bold: true, size: 22 }),
            new TextRun({ text: ` | ${edu.institution}`, size: 22 }),
        ],
        spacing: { after: 40 },
    }),
    new Paragraph({
        children: [new TextRun({ text: `${edu.startDate} - ${edu.endDate}`, italics: true, color: "555555", size: 18 })],
        spacing: { after: 80 },
    }),
    new Paragraph({ text: edu.description, style: "BodyText", spacing: { after: 80 } }),
];

export const generateDocx = async (resumeData, templateId) => {
    const { personalDetails, summary, experience, education, skills } = resumeData;

    const doc = new Document({
        creator: "Ashwheel Resume Builder",
        title: `${personalDetails.name} Resume`,
        styles: {
            paragraphStyles: [
                { id: "Header", name: "Header", basedOn: "Normal", next: "Normal", run: { size: 48, bold: true, font: "Calibri Light" }, paragraph: { alignment: AlignmentType.CENTER, spacing: { after: 100 } } },
                { id: "Contact", name: "Contact", basedOn: "Normal", next: "Normal", run: { size: 20, font: "Calibri" }, paragraph: { alignment: AlignmentType.CENTER, spacing: { after: 300 } } },
                { id: "SectionHeader", name: "Section Header", basedOn: "Normal", next: "Normal", run: { size: 24, bold: true, color: "333333", font: "Calibri", allCaps: true }, paragraph: { spacing: { before: 200, after: 100 }, border: { bottom: { color: "auto", space: 1, value: "single", size: 4 } } } },
                { id: "BodyText", name: "Body Text", basedOn: "Normal", run: { size: 20, font: "Calibri" }, paragraph: { spacing: { line: 276, after: 100 }, alignment: AlignmentType.JUSTIFIED } },
            ],
        },
        sections: [{
            properties: {
                pageSize: {
                    width: PageSize.A4.width,
                    height: PageSize.A4.height,
                    orientation: PageOrientation.PORTRAIT,
                },
                page: {
                    margin: { top: 720, right: 720, bottom: 720, left: 720 },
                },
            },
            children: [
                new Paragraph({ text: personalDetails.name, style: "Header" }),
                new Paragraph({
                    children: [
                        new TextRun(personalDetails.email),
                        new TextRun(" | "),
                        new TextRun(personalDetails.phone),
                        new TextRun(" | "),
                        new TextRun(personalDetails.linkedin),
                    ],
                   style: "Contact",
                }),
                
                ...createSection("Summary", [new Paragraph({ text: summary, style: "BodyText", alignment: AlignmentType.LEFT })]),
                ...createSection("Experience", experience.flatMap(createExperienceItem)),
                ...createSection("Education", education.flatMap(createEducationItem)),
                ...createSection("Skills", [new Paragraph({ text: skills.split(',').join(' • '), style: "BodyText", alignment: AlignmentType.LEFT })]),
            ],
        }],
    });

    try {
        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${personalDetails.name.replace(/\s/g, '_')}_Resume.docx`);
    } catch(err) {
        console.error("Error generating DOCX file: ", err);
        throw err;
    }
};

export const generatePdf = async (element, fileName) => {
    if (!element) throw new Error("Preview element not found");
    
    element.style.width = '210mm';
    element.style.height = 'auto'; 

    const canvas = await html2canvas(element, {
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
    });
    
    element.style.width = ''; 
    element.style.height = '';

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    const ratio = canvasWidth / canvasHeight;
    let imgWidth = pdfWidth;
    let imgHeight = imgWidth / ratio;

    if (imgHeight > pdfHeight) {
        imgHeight = pdfHeight;
        imgWidth = imgHeight * ratio;
    }

    const x = (pdfWidth - imgWidth) / 2;
    const y = 0;

    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
    pdf.save(`${fileName.replace(/\s/g, '_')}_Resume.pdf`);
};