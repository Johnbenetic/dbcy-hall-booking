frappe.query_reports["Daily Hall Booking Report"] = {
	filters: [
		{
			fieldname: "booking_date",
			label: __("Booking Date"),
			fieldtype: "Date",
			reqd: 1,
		},
		{
			fieldname: "hall",
			label: __("Hall"),
			fieldtype: "Link",
			options: "Hall",
		},
		{
			fieldname: "status",
			label: __("Status"),
			fieldtype: "Select",
			options: "\nRequested\nApproved\nRejected\nCancelled\nCompleted",
		},
	],
};
