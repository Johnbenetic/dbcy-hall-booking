frappe.query_reports["Monthly Hall Booking Report"] = {
	filters: [
		{
			fieldname: "from_date",
			label: __("From Date"),
			fieldtype: "Date",
		},
		{
			fieldname: "to_date",
			label: __("To Date"),
			fieldtype: "Date",
		},
		{
			fieldname: "hall",
			label: __("Hall"),
			fieldtype: "Link",
			options: "Hall",
		},
		{
			fieldname: "department",
			label: __("Department"),
			fieldtype: "Data",
		},
		{
			fieldname: "status",
			label: __("Status"),
			fieldtype: "Select",
			options: "\nRequested\nApproved\nRejected\nCancelled\nCompleted",
		},
	],
};
