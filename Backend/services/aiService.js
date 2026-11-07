const { GoogleGenAI } = require('@google/genai');
const AIModel = require('../models/aiModel');

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Analyse all reports under one Master Ticket
class AIService {

    static async analyzeMasterTicket(ticketId) {
        let expectedReportCount = null;

        try {
            // 1. Get Master Ticket
            const ticket = await AIModel.getMasterTicketById(ticketId);

            if (!ticket) {
                throw new Error('Master Ticket not found.');
            }

            expectedReportCount = ticket.report_count;

            // Mark AI analysis as processing
            const started = await AIModel.updateAIAnalysisStatus(
                ticketId,
                expectedReportCount,
                'processing'
            );

            if (!started) {
                throw new Error('New reports arrived. Please analyse the latest version.');
            }

            // 2. Get ALL reports under this Master Ticket
            const reports = await AIModel.getReportsByMasterTicketId(ticketId);

            if (reports.length === 0) {
                throw new Error('No reports found for this Master Ticket.');
            }

            // 3. Get Food Listing details
            const listing = await AIModel.getListingById(ticket.target_object_id);

            if (!listing) {
                throw new Error('Food Listing not found.');
            }

            // 4. Prepare information for Gemini
            const analysisInput = {
                listing: listing,
                reportCount: reports.length,
                reports: reports.map((report, index) => ({
                    reportNumber: index + 1,
                    reasons: report.reasons,
                    additionalNotes: report.notes,
                    reportedAt: report.created_at
                }))
            };

            // 5. Create AI Prompt
            const prompt = `
You are an AI assistant helping administrators review food-sharing abuse reports.

Analyse all reports together and assess the reported food listing.

IMPORTANT RULES:
- Consider every report, not just the latest report.
- Do not assume allegations are true.
- Multiple reports do not automatically prove misconduct.
- Distinguish repeated complaints from confirmed misconduct.
- Base your analysis only on the supplied information.
- Do not invent evidence.
- Your output must be valid JSON.

BEHAVIOURAL TAG:
Choose exactly ONE tag from this predefined list:
1. Food Quality Concern
2. Misleading Listing
3. Repeated Complaints
4. Potential Misconduct
5. No Clear Pattern

SEVERITY SCORE:
Give a score from 0 to 100 based on the available evidence and potential risk.
Do not increase the score simply because the report count is high.

SUGGESTED ACTION:
Provide a recommendation for the administrator.
This is only a recommendation. Do not claim that any action has already been taken.

Return JSON in exactly this structure:
{
    "severityScore": 0,
    "behavioralTag": "No Clear Pattern",
    "insightsSummary": "Summary of all reports",
    "suggestedAction": "Recommended administrator action",
    "flaggedSnippets": []
}

DATA TO ANALYSE:
${JSON.stringify(analysisInput, null, 2)}
`;

            // 6. Send information to Gemini
            const response = await ai.models.generateContent({
                model: MODEL,
                contents: prompt,
                config: {
                    responseMimeType: 'application/json'
                }
            });

            // 7. Parse Gemini response
            let result;

            try {
                result = JSON.parse(response.text);
            } catch (error) {
                throw new Error('Gemini returned an invalid JSON response.');
            }

            // 8. Validate AI result
            if (
                typeof result.severityScore !== 'number' ||
                result.severityScore < 0 ||
                result.severityScore > 100
            ) {
                throw new Error('Invalid AI severity score.');
            }

            const validTags = [
                'Food Quality Concern',
                'Misleading Listing',
                'Repeated Complaints',
                'Potential Misconduct',
                'No Clear Pattern'
            ];

            if (!validTags.includes(result.behavioralTag)) {
                throw new Error('Invalid AI behavioural tag.');
            }

            if (
                typeof result.insightsSummary !== 'string' ||
                typeof result.suggestedAction !== 'string' ||
                !Array.isArray(result.flaggedSnippets)
            ) {
                throw new Error('Invalid AI analysis structure.');
            }

            // 9. Save AI analysis results
            const saved = await AIModel.saveAIAnalysis(
                ticketId,
                expectedReportCount,
                result
            );

            if (!saved) {
                throw new Error(
                    'AI analysis is outdated because new reports arrived. Re-analysis is required.'
                );
            }

            return result;
        } catch (error) {

            // Do not mark a newer analysis as failed.
            if (expectedReportCount !== null) {
                await AIModel.updateAIAnalysisStatus(
                    ticketId,
                    expectedReportCount,
                    'failed',
                    error.message
                );
            }

            throw error;
        }

    }
}

module.exports = AIService;