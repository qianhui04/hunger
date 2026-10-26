// const jsPDF = require('jspdf'); // OR
import { jsPDF } from 'jspdf';


export function buildCSV(
    reportData: Record<string, unknown>
) {
    const rows: unknown[][] = [];

    Object.entries(reportData).forEach(([key, value]) => {
        // If the value is an array of objects, create a table.
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

            // Section title
            rows.push([formatColumnName(key)]);

            // Table headers
            const fields = Object.keys(items[0]);

            rows.push([
                'Rank',
                ...fields.map(formatColumnName)
            ]);

            // Table rows
            items.forEach((item, index) => {
                rows.push([
                    index + 1,
                    ...fields.map(field => item[field] ?? '')
                ]);
            });

            // Blank row between sections
            rows.push([]);
        } else {
            // Ordinary metrics remain Metric + Value.
            const displayValue =
                value !== null && typeof value === 'object'
                    ? JSON.stringify(value)
                    : Array.isArray(value)
                        ? value.map(String).join('; ')
                        : String(value ?? '');

            rows.push([
                formatColumnName(key),
                displayValue
            ]);
        }
    });

    // Escape CSV values safely.
    return rows
        .map(row =>
            row.map(cell =>
                `"${String(cell ?? '').replace(/"/g, '""')}"`
            ).join(',')
        )
        .join('\n');
}

export function downloadCSV(
    reportData: Record<string, unknown>,
    fileName: string
) {
    const csvContent = buildCSV(reportData);
    const blob = new Blob([csvContent], {
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
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
}


function createPDFDocument(
    reportData: Record<string, unknown>,
    startDate?: string,
    endDate?: string
): jsPDF {
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    doc.setFontSize(18);
    doc.text('Sustainability Impact Report', margin, 20);

    if (startDate && endDate) {
        doc.setFontSize(10);
        doc.text(
            `Reporting Period: ${startDate} to ${endDate}`,
            margin,
            30
        );
    }

    let y = 45;

    function checkPageSpace(requiredHeight: number) {
        if (y + requiredHeight > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }
    }

    function drawTable(
        title: string,
        items: Record<string, unknown>[]
    ) {
        if (items.length === 0) return;

        const fields = Object.keys(items[0]);
        const headers = ['Rank', ...fields.map(formatColumnName)];
        const columnCount = headers.length;

        // Give Rank a smaller column; divide the rest evenly.
        const widths = [
            15,
            ...Array(columnCount - 1).fill(
                (contentWidth - 15) / (columnCount - 1)
            )
        ];

        const padding = 2;
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

            checkPageSpace(rowHeight);

            let x = margin;

            cells.forEach((_, index) => {
                doc.rect(x, y, widths[index], rowHeight);

                if (isHeader) {
                    doc.setFont('helvetica', 'bold');
                } else {
                    doc.setFont('helvetica', 'normal');
                }

                doc.setFontSize(8);

                doc.text(
                    textLines[index],
                    x + padding,
                    y + padding + lineHeight - 1
                );

                x += widths[index];
            });

            y += rowHeight;
        }

        checkPageSpace(15);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(formatColumnName(title), margin, y);
        y += 5;

        drawRow(headers, true);

        items.forEach((item, index) => {
            drawRow([
                index + 1,
                ...fields.map(field => item[field] ?? '')
            ]);
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
                value !== null && typeof value === 'object'
                    ? JSON.stringify(value)
                    : Array.isArray(value)
                        ? value.map(String).join(', ')
                        : String(value ?? '');

            const label = formatColumnName(key);
            const lines = doc.splitTextToSize(
                `${label}: ${displayValue}`,
                contentWidth
            );

            checkPageSpace(lines.length * 5 + 5);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(lines, margin, y);

            y += lines.length * 5 + 5;
        }
    });

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
    endDate?: string
) {
    const doc = createPDFDocument(
        reportData,
        startDate,
        endDate
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