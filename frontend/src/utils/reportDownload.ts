// const jsPDF = require('jspdf'); // OR
import { jsPDF } from 'jspdf';


export function buildCSV(
    reportData: Record<string, unknown>,
    reportType?: string,
    startDate?: string,
    endDate?: string
): string {
    const rows: unknown[][] = [];

    // Report information
    rows.push(['Report', 'Details']);
    rows.push(['Organisation', 'ZERO HUNGER UM']);
    rows.push(['Report Type', getReportTitle(reportType ?? 'summary')]);
    rows.push([
        'Reporting Period',
        startDate && endDate
            ? `${startDate} to ${endDate}`
            : 'All available dates'
    ]);

    const today = new Date();

    const generatedDate = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0')
    ].join('-');

    rows.push(['Generated On', `="${generatedDate}"`]);

    rows.push([]);

    Object.entries(reportData).forEach(([key, value]) => {
        // Arrays of objects become tables.
        if (
            Array.isArray(value) &&
            value.length > 0 &&
            value.every(
                item =>
                    item !== null &&
                    typeof item === 'object' &&
                    !Array.isArray(item)
            )
        ) {
            const items = value as Record<string, unknown>[];
            const fields = [
                ...new Set(items.flatMap(item => Object.keys(item)))
            ];

            rows.push([formatColumnName(key)]);
            rows.push(fields.map(formatColumnName));

            items.forEach(item => {
                rows.push(
                    fields.map(field => formatCSVValue(item[field]))
                );
            });

            rows.push([]);
        } else if (
            value !== null &&
            typeof value === 'object' &&
            !Array.isArray(value)
        ) {
            // Nested objects become readable key-value rows.
            rows.push([formatColumnName(key), 'Value']);

            Object.entries(value as Record<string, unknown>).forEach(
                ([nestedKey, nestedValue]) => {
                    rows.push([
                        formatColumnName(nestedKey),
                        formatCSVValue(nestedValue)
                    ]);
                }
            );

            rows.push([]);
        } else {
            // Ordinary metrics remain label + value.
            rows.push([
                formatColumnName(key),
                Array.isArray(value)
                    ? value.map(item => formatCSVValue(item)).join('; ')
                    : formatCSVValue(value)
            ]);
        }
    });

    // Escape commas, quotes and line breaks according to CSV rules.
    return rows
        .map(row =>
            row
                .map(cell => {
                    const text = String(cell ?? '');
                    return `"${text.replace(/"/g, '""')}"`;
                })
                .join(',')
        )
        .join('\r\n');
}

function formatCSVValue(value: unknown): string {
    if (value === null || value === undefined) {
        return '';
    }

    if (Array.isArray(value)) {
        return value.map(item => formatCSVValue(item)).join('; ');
    }

    if (typeof value === 'object') {
        return JSON.stringify(value);
    }

    return String(value);
}

export function downloadCSV(
    reportData: Record<string, unknown>,
    fileName: string,
    reportType?: string,
    startDate?: string,
    endDate?: string
) {
    const csvContent = buildCSV(
        reportData,
        reportType,
        startDate,
        endDate
    );

    // BOM helps Excel display UTF-8 characters correctly.
    const blob = new Blob(['\uFEFF', csvContent], {
        type: 'text/csv;charset=utf-8;'
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = fileName;
    link.click();

    window.URL.revokeObjectURL(url);
}

function formatColumnName(key: string): string {
    return key
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .trim()
        .replace(/\s+/g, " ")
        .replace(/\b\w/g, char => char.toUpperCase());
}

function getReportTitle(reportType: string): string {
    const titles: Record<string, string> = {
        summary: "Overall Summary Report",
        "food-listings": "Food Listings Report",
        "user-activity": "User Activity Report",
        "location-activity": "Location Activity Report",
        "waste-reduction": "Food Waste Reduction Report",
    };

    return titles[reportType] ?? "Zero Hunger UM Report";
}

function createPDFDocument(
    reportData: Record<string, unknown>,
    startDate?: string,
    endDate?: string,
    reportType?: string
): jsPDF {
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    const generatedDate = new Date().toLocaleDateString("en-MY", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

    const reportTitle = getReportTitle(reportType ?? "summary");
    const darkGreen: [number, number, number] = [31, 78, 58];
    const lightGreen: [number, number, number] = [232, 241, 234];
    const grey: [number, number, number] = [100, 110, 105];

    // Green header background
    doc.setFillColor(...darkGreen);
    doc.rect(0, 0, pageWidth, 48, "F");

    // Project name
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("ZERO HUNGER UM", margin, 13);

    // Report title
    doc.setFontSize(19);
    doc.text(reportTitle, margin, 25);

    // Subtitle
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(225, 235, 228);
    doc.text("UNIVERSITI MALAYA  |  FOOD SHARING ADMINISTRATION", margin, 33);

    // Reporting metadata area
    doc.setFillColor(...lightGreen);
    doc.rect(margin, 54, contentWidth, 24, "F");

    doc.setTextColor(...darkGreen);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("REPORTING PERIOD", margin + 4, 62);
    doc.text("GENERATED ON", pageWidth / 2 + 4, 62);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(40, 50, 45);

    doc.text(
        startDate && endDate
            ? `${startDate} to ${endDate}`
            : "All available dates",
        margin + 4,
        70
    );

    doc.text(generatedDate, pageWidth / 2 + 4, 70);

    // Reset text color for the report body
    doc.setTextColor(0, 0, 0);

    let y = 90;

    function checkPageSpace(requiredHeight: number) {
        const footerSpace = 22;
        const bottomLimit = pageHeight - footerSpace;

        if (y + requiredHeight > bottomLimit) {
            doc.addPage();
            y = 20;
        }
    }

    function drawTable(
        title: string,
        items: Record<string, unknown>[]
    ) {
        if (items.length === 0) return;

        const fields = Object.keys(items[0]);
        const headers = fields.map(formatColumnName);
        const columnCount = headers.length;

        const padding = 2;
        const minColumnWidth = 15;

        // Estimate each column's natural width from its header and values.
        const columnWeights = headers.map((header, index) => {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);

            const headerWidth = doc.getTextWidth(header);

            doc.setFont("helvetica", "normal");

            const maxContentWidth = Math.max(
                0,
                ...items.map(item => {
                    const value = String(item[fields[index]] ?? "");

                    return doc.getTextWidth(value);
                })
            );

            // Limit how much a very long value can influence the width.
            return Math.max(
                minColumnWidth,
                Math.min(Math.max(headerWidth, maxContentWidth) + padding * 2, 60)
            );
        });

        const totalWeight = columnWeights.reduce(
            (sum, width) => sum + width,
            0
        );

        // Distribute the available width proportionally across all columns.
        const widths = columnWeights.map(
            weight => (weight / totalWeight) * contentWidth
        );

        const lineHeight = 5;

        function drawRow(
            cells: unknown[],
            isHeader = false,
            rank = 0
        ) {
            const textLines = cells.map((cell, index) => {
                const text = String(cell ?? '');
                return doc.splitTextToSize(
                    text,
                    widths[index] - padding * 2
                ) as string[];
            });

            const maxLines = Math.max(
                ...textLines.map(lines => lines.length),
                1
            );

            const rowHeight = maxLines * lineHeight + padding * 2;

            const previousPage = doc.getNumberOfPages();

            checkPageSpace(rowHeight);

            const pageChanged = doc.getNumberOfPages() > previousPage;

            if (pageChanged && !isHeader) {
                drawRow(headers, true);
            }

            // Background color
            if (isHeader) {
                doc.setFillColor(31, 78, 58);
                doc.rect(margin, y, contentWidth, rowHeight, "F");
            } else if (rank % 2 === 0) {
                doc.setFillColor(242, 246, 243);
                doc.rect(margin, y, contentWidth, rowHeight, "F");
            }

            let x = margin;

            cells.forEach((_, index) => {
                // Light horizontal divider instead of heavy cell borders
                doc.setDrawColor(220, 228, 222);
                doc.setLineWidth(0.2);
                doc.line(x, y + rowHeight, x + widths[index], y + rowHeight);

                doc.setFont(
                    "helvetica",
                    isHeader ? "bold" : "normal"
                );
                doc.setFontSize(8);
                doc.setTextColor(
                    ...(isHeader
                        ? [255, 255, 255] as [number, number, number]
                        : [45, 55, 48] as [number, number, number])
                );

                doc.text(
                    textLines[index],
                    x + padding,
                    y + padding + lineHeight - 1
                );

                x += widths[index];
            });

            // Reset drawing and text settings for subsequent content
            doc.setTextColor(0, 0, 0);
            doc.setDrawColor(0, 0, 0);

            y += rowHeight;
        }
        checkPageSpace(15);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(formatColumnName(title), margin, y);
        y += 5;

        drawRow(headers, true);

        items.forEach((item, index) => {
            drawRow(
                fields.map(field => item[field] ?? ''),
                false,
                index + 1
            );
        });

        y += 8;
    }

    Object.entries(reportData).forEach(([key, value]) => {
        if (
            Array.isArray(value) &&
            value.length > 0 &&
            value.every(
                item =>
                    item !== null &&
                    typeof item === 'object' &&
                    !Array.isArray(item)
            )
        ) {
            // Arrays of objects become tables automatically.
            drawTable(
                key,
                value as Record<string, unknown>[]
            );
        } else {
            // Ordinary metrics remain label + value.
            const displayValue =
                value !== null &&
                    typeof value === 'object' &&
                    !Array.isArray(value)
                    ? Object.entries(value as Record<string, unknown>)
                        .map(([key, val]) => `${formatColumnName(key)}: ${val}`)
                        .join(' | ')
                    : Array.isArray(value)
                        ? value.map(String).join(', ')
                        : String(value ?? '');

            const label = formatColumnName(key);
            const labelText = `${label}: `;

            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");

            const labelWidth = doc.getTextWidth(labelText);
            const valueWidth = contentWidth - labelWidth;

            const valueLines = doc.splitTextToSize(
                displayValue,
                valueWidth > 20 ? valueWidth : contentWidth
            );

            const lineHeight = 5;
            const textHeight = valueLines.length * lineHeight;

            checkPageSpace(textHeight + 7);

            // Draw the label in bold
            doc.setFont("helvetica", "bold");
            doc.setTextColor(31, 78, 58);
            doc.text(labelText, margin, y);

            // Draw the value beside the label
            doc.setFont("helvetica", "normal");
            doc.setTextColor(70, 80, 74);

            if (valueWidth > 20) {
                doc.text(valueLines, margin + labelWidth, y);
            } else {
                // If the label is too long, put the value on the next line.
                doc.text(valueLines, margin, y + lineHeight);
            }

            const actualTextHeight =
                valueWidth > 20
                    ? textHeight
                    : lineHeight + textHeight;

            const separatorY = y + actualTextHeight + 2;

            doc.setDrawColor(225, 232, 226);
            doc.setLineWidth(0.2);
            doc.line(margin, separatorY, pageWidth - margin, separatorY);

            doc.setTextColor(0, 0, 0);
            y = separatorY + 5;
        }
    });

    const totalPages = doc.getNumberOfPages();

    for (let page = 1; page <= totalPages; page++) {
        doc.setPage(page);

        // Footer divider
        doc.setDrawColor(220, 228, 222);
        doc.setLineWidth(0.3);
        doc.line(
            margin,
            pageHeight - 14,
            pageWidth - margin,
            pageHeight - 14
        );

        // Project name
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 110, 105);

        doc.text(
            "ZERO HUNGER UM | ADMIN REPORT",
            margin,
            pageHeight - 8
        );

        // Page number
        doc.text(
            `Page ${page} of ${totalPages}`,
            pageWidth - margin,
            pageHeight - 8,
            { align: "right" }
        );
    }

    doc.setTextColor(0, 0, 0);

    return doc;
}

export function getPDFFileSize(
    reportData: Record<string, unknown>,
    startDate?: string,
    endDate?: string
): number {
    const doc = createPDFDocument(
        reportData,
        startDate,
        endDate
    );

    return doc.output('blob').size;
}

export function downloadPDF(
    reportData: Record<string, unknown>,
    fileName: string,
    startDate?: string,
    endDate?: string,
    reportType?: string
) {
    const doc = createPDFDocument(
        reportData,
        startDate,
        endDate,
        reportType
    );

    doc.save(fileName);
}

export function getCSVFileSize(
    reportData: Record<string, unknown>
): number {
    const csvContent = buildCSV(reportData);

    const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;'
    });

    return blob.size;
}