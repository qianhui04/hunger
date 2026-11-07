const AbuseSafetyModel = require('../models/abuseSafetyModel');

exports.getAllTickets = async (req, res) => {
    try {
        const masterTickets = await AbuseSafetyModel.getAllTickets();
        return res.status(200).json(masterTickets);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Failed to retrieve ticket records." });
    }
}

exports.getTicketDetails = async (req, res) => {
    const id = req.params.id;
    try {
        const ticketDetails = await AbuseSafetyModel.getTicketById(id);
        return res.status(200).json(ticketDetails);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: `Failed to retrieve ${id} ticket records.` });
    }
}

exports.getTicketStatistics = async (req, res) => {
    try {
        const statistics = await AbuseSafetyModel.getTicketStatistics();
        return res.status(200).json(statistics);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "Failed to retrieve ticket statistics."
        });
    }
};

exports.getReportsByMasterTicketId = async (req, res) => {
    try {
        const masterTicketId = req.params.id;
        const reports = await AbuseSafetyModel.getReportsByMasterTicketId(masterTicketId);
        return res.status(200).json(reports);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "Failed to retrieve reports."
        });
    }
}

exports.updateTicketStatus = async (req, res) => {
    const id = req.params.id;
    const { status } = req.body;

    try {
        const updatedTicket = await AbuseSafetyModel.updateTicketStatus(id, status);
        return res.status(200).json(updatedTicket);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: `Failed to update ticket ${id} status.`
        });
    }
};