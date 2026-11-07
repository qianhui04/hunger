// Validate Ticket ID
exports.validateTicketId = (req, res, next) => {
    const id = req.params.id;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (typeof (id) !== 'string') {
        return res.status(400).json({
            error: 'Invalid ticket ID.'
        });
    }

    if (!(uuidRegex.test(id))) {
        return res.status(400).json({
            error: 'Invalid ticket ID.'
        });
    }

    next();
};


// Validate Ticket Status
exports.validateTicketStatus = (req, res, next) => {
    const status = req.body.status;
    const allowedStatuses = ['unresolved', 'resolved'];

    if (!(allowedStatuses.includes(status))) {
        return res.status(400).json({
            error: 'Invalid ticket status.'
        });
    }

    next();
};