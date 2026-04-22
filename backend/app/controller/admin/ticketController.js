import Ticket from "../../models/ticket.js";
import { createAdminController } from "../../utils/controllerFactory.js";

const controller = createAdminController(Ticket, {
    searchFields: ['subject', 'description', 'ticketId'],
    populateFields: [
        { path: 'customer', select: 'name phone' }
    ],
    defaultSort: { createdAt: -1 }
});

export const getTickets = controller.getAll;
export const getTicketById = controller.getById;
export const updateTicket = controller.update;
export const deleteTicket = controller.delete;
