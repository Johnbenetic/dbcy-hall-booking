import frappe

from hallbooking_app.hall_booking.report.booking_report_utils import get_booking_rows


def execute(filters=None):
	bookings = get_booking_rows(frappe._dict(filters or {}), include_department=True)
	summary = {}

	for booking in bookings:
		department = booking.department or "(Not Set)"
		row = summary.setdefault(
			department,
			{
				"department": department,
				"number_of_requests": 0,
				"approved": 0,
				"rejected": 0,
				"cancelled": 0,
				"completed": 0,
				"total_students": 0,
			},
		)
		row["number_of_requests"] += 1
		row["total_students"] += booking.number_of_students or 0
		if booking.status in {"Approved", "Rejected", "Cancelled", "Completed"}:
			row[booking.status.lower()] += 1

	columns = [
		{"fieldname": "department", "label": "Department", "fieldtype": "Data", "width": 180},
		{
			"fieldname": "number_of_requests",
			"label": "Number of Requests",
			"fieldtype": "Int",
			"width": 140,
		},
		{"fieldname": "approved", "label": "Approved", "fieldtype": "Int", "width": 100},
		{"fieldname": "rejected", "label": "Rejected", "fieldtype": "Int", "width": 100},
		{"fieldname": "cancelled", "label": "Cancelled", "fieldtype": "Int", "width": 100},
		{"fieldname": "completed", "label": "Completed", "fieldtype": "Int", "width": 100},
		{"fieldname": "total_students", "label": "Total Students", "fieldtype": "Int", "width": 120},
	]
	return columns, [summary[name] for name in sorted(summary)]
