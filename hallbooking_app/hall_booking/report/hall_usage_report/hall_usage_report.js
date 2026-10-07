frappe.query_reports["Hall Usage Report"] = {
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
	],
};
