import frappe


BOOKING_FIELDS = [
	"name",
	"booking_date",
	"hall",
	"start_time",
	"end_time",
	"faculty_name",
	"department",
	"programme",
	"number_of_students",
	"status",
]


def get_booking_rows(filters, *, include_department=False):
	conditions = {}

	if filters.get("booking_date"):
		conditions["booking_date"] = filters.booking_date

	from_date = filters.get("from_date")
	to_date = filters.get("to_date")
	if from_date and to_date:
		if frappe.utils.getdate(from_date) > frappe.utils.getdate(to_date):
			frappe.throw("From Date cannot be later than To Date.")
		conditions["booking_date"] = ["between", [from_date, to_date]]
	elif from_date:
		conditions["booking_date"] = [">=", from_date]
	elif to_date:
		conditions["booking_date"] = ["<=", to_date]

	for fieldname in ("hall", "status"):
		if filters.get(fieldname):
			conditions[fieldname] = filters[fieldname]

	if include_department and filters.get("department"):
		conditions["department"] = filters.department

	return frappe.get_list(
		"Hall Booking Request",
		filters=conditions,
		fields=BOOKING_FIELDS,
		order_by="booking_date asc, start_time asc, name asc",
		limit_page_length=0,
	)


def booking_columns():
	return [
		{
			"fieldname": "name",
			"label": "Request",
			"fieldtype": "Link",
			"options": "Hall Booking Request",
			"width": 150,
		},
		{"fieldname": "booking_date", "label": "Booking Date", "fieldtype": "Date", "width": 110},
		{"fieldname": "hall", "label": "Hall", "fieldtype": "Link", "options": "Hall", "width": 140},
		{"fieldname": "start_time", "label": "Start Time", "fieldtype": "Time", "width": 100},
		{"fieldname": "end_time", "label": "End Time", "fieldtype": "Time", "width": 100},
		{"fieldname": "faculty_name", "label": "Faculty Name", "fieldtype": "Data", "width": 160},
		{"fieldname": "department", "label": "Department", "fieldtype": "Data", "width": 140},
		{"fieldname": "programme", "label": "Programme", "fieldtype": "Data", "width": 140},
		{
			"fieldname": "number_of_students",
			"label": "Number of Students",
			"fieldtype": "Int",
			"width": 120,
		},
		{"fieldname": "status", "label": "Status", "fieldtype": "Data", "width": 110},
	]
