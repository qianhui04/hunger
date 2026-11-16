const { GoogleGenAI } = require('@google/genai');
const AIModel = require('../models/aiModel');
const AbuseAIConfigModel = require('../models/abuseAIConfigModel');

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

SEVERITY FACTOR SCORES:

Evaluate the following four factors independently.
Each factor must receive a score from 0 to 100.

1. reportFrequencyScore:
Assess the number of reports received for this listing.
A higher number of reports may indicate a recurring concern,
but multiple reports alone do not prove misconduct.

2. reportConsistencyScore:
Assess whether different reports describe consistent or similar concerns.
Consistent reports may indicate a recurring issue.

3. foodSafetyScore:
Assess the potential food safety risk based on reported food conditions,
such as unfresh food or unusual smell.
Do not assume a food safety violation without sufficient evidence.

4. evidenceStrengthScore:
Assess the specificity and detail of the available evidence,
including report reasons, additional notes, and listing information.

IMPORTANT:
- Evaluate each factor independently.
- Do not calculate the final severity score.
- Do not invent evidence.
- Return all four factor scores as numbers between 0 and 100.

AI CONFIDENCE SCORE:

Evaluate how reliable your overall assessment is based on the
specificity, consistency and completeness of the available information.

Return a confidence score from 0 to 100.

Guidelines:
- High confidence: Reports contain specific details and consistent evidence.
- Medium confidence: Some useful details exist, but evidence is incomplete.
- Low confidence: Reports are vague, lack supporting details or contain uncertainty.
- Do not treat the number of reports alone as proof of reliability.
- This score measures confidence in your AI assessment,
  not the severity of the alleged abuse.

SUGGESTED ACTION:
Provide a recommendation for the administrator.
This is only a recommendation. Do not claim that any action has already been taken.

Return JSON in exactly this structure:
{
    "reportFrequencyScore": 0,
    "reportConsistencyScore": 0,
    "foodSafetyScore": 0,
    "evidenceStrengthScore": 0,
    "confidenceScore": 0,
    "confidenceExplanation": "Explanation of assessment confidence",
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

            // 8. Validate AI factor scores
            const factorScores = [
                result.reportFrequencyScore,
                result.reportConsistencyScore,
                result.foodSafetyScore,
                result.evidenceStrengthScore
            ];

            if (
                factorScores.some(score =>
                    typeof score !== 'number' ||
                    !Number.isFinite(score) ||
                    score < 0 ||
                    score > 100
                )
            ) {
                throw new Error('Invalid AI factor scores.');
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

            // Validate AI confidence score
            if (
                typeof result.confidenceScore !== 'number' ||
                !Number.isFinite(result.confidenceScore) ||
                result.confidenceScore < 0 ||
                result.confidenceScore > 100
            ) {
                throw new Error('Invalid AI confidence score.');
            }

            if (
                typeof result.confidenceExplanation !== 'string' ||
                !result.confidenceExplanation.trim()
            ) {
                throw new Error('Invalid AI confidence explanation.');
            }

            // 9. Calculate weighted severity score using global AI configuration
            const aiConfig = await AbuseAIConfigModel.getConfig();

            // Determine AI confidence level using global threshold
            result.confidenceLevel =
                result.confidenceScore >= Number(aiConfig.confidence_threshold)
                    ? 'High'
                    : 'Low';

            const weightedSeverityScore = (
                result.reportFrequencyScore * Number(aiConfig.report_frequency_weight) +
                result.reportConsistencyScore * Number(aiConfig.report_consistency_weight) +
                result.foodSafetyScore * Number(aiConfig.food_safety_weight) +
                result.evidenceStrengthScore * Number(aiConfig.evidence_strength_weight)
            ) / 100;

            // Round to 2 decimal places
            result.severityScore = Math.round(weightedSeverityScore * 100) / 100;

            // 10. Save AI analysis results
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