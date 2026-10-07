frappe.views.calendar["Hall Booking Request"] = {
    field_map: {
        start: "custom_calendar_start",
        end: "custom_calendar_end",
        id: "name",
        title: "hall",
        status: "status"
    },

    order_by: "custom_calendar_start",

    style_map: {
        Requested: "warning",
        Approved: "success",
        Rejected: "danger",
        Cancelled: "danger",
        Completed: "info"
    }
};