frappe.query_reports["Department-wise Booking Report"] = {
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
			fieldname: "department",
			label: __("Department"),
			fieldtype: "Data",
		},
	],
};
