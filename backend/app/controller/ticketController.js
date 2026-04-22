import Ticket from "../models/ticket.js";
import handleResponse from "../utils/helper.js";
import { createAdminController } from "../utils/controllerFactory.js";

const { getAll: listTickets, getById, update: updateT, delete: deleteT } = createAdminController(Ticket, {
    searchFields: ["subject", "description"],
    populate: [{ path: "userId", select: "name email avatar" }]
});

// Rename for exported consistency if needed
export const getAllTickets = listTickets;

// Create a new ticket (Customer/Seller/Rider)
export const createTicket = async (req, res) => {
    try {
        const { subject, description, priority, userType } = req.body;
        const userId = req.user.id;

        const newTicket = new Ticket({
            userId,
            userType: userType || "Customer",
            subject,
            description,
            priority,
            messages: [
                {
                    sender: req.user.name || "User",
                    senderId: userId,
                    senderType: "User",
                    text: description,
                    isAdmin: false,
                },
            ],
        });

        await newTicket.save();
        return handleResponse(res, 201, "Ticket created successfully", newTicket);
    } catch (error) {
        return handleResponse(res, 500, error.message);
    }
};

// Get all tickets for current user
export const getMyTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({ userId: req.user.id }).sort({ createdAt: -1 });
        return handleResponse(res, 200, "Tickets fetched successfully", tickets);
    } catch (error) {
        return handleResponse(res, 500, error.message);
    }
};

// Admin/User: Reply to a ticket
export const replyToTicket = async (req, res) => {
    try {
        const { text, isAdmin } = req.body;
        const { id } = req.params;

        const ticket = await Ticket.findById(id);
        if (!ticket) return handleResponse(res, 404, "Ticket not found");

        const newMessage = {
            sender: isAdmin ? "Admin Support" : (req.user.name || "User"),
            senderId: req.user.id,
            senderType: isAdmin ? "Admin" : "User",
            text,
            isAdmin: !!isAdmin,
        };

        ticket.messages.push(newMessage);
        if (isAdmin) {
            ticket.status = "processing";
        }

        await ticket.save();
        return handleResponse(res, 200, "Reply sent successfully", ticket);
    } catch (error) {
        return handleResponse(res, 500, error.message);
    }
};

// Admin: Update status
export const updateTicketStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;

        const ticket = await Ticket.findByIdAndUpdate(id, { status }, { new: true });
        if (!ticket) return handleResponse(res, 404, "Ticket not found");

        return handleResponse(res, 200, `Ticket status updated to ${status}`, ticket);
    } catch (error) {
        return handleResponse(res, 500, error.message);
    }
};
