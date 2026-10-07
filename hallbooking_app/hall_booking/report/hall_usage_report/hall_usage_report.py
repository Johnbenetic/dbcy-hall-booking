import frappe
from frappe.utils import get_time

from hallbooking_app.hall_booking.report.booking_report_utils import get_booking_rows


def execute(filters=None):
	filters = frappe._dict(filters or {})
	bookings = get_booking_rows(filters)
	active_statuses = {"Requested", "Approved", "Completed"}
	usage_by_hall = {}

	for booking in bookings:
		if booking.status not in active_statuses:
			continue

		usage = usage_by_hall.setdefault(
			booking.hall,
			{"number_of_bookings": 0, "total_students": 0, "total_booking_hours": 0.0},
		)
		usage["number_of_bookings"] += 1
		usage["total_students"] += booking.number_of_students or 0
		start = get_time(booking.start_time)
		end = get_time(booking.end_time)
		usage["total_booking_hours"] += (
			(end.hour * 3600 + end.minute * 60 + end.second)
			- (start.hour * 3600 + start.minute * 60 + start.second)
		) / 3600

	halls = frappe.get_list(
		"Hall",
		filters={"name": ["in", list(usage_by_hall)]},
		fields=["name", "hall_name", "hall_code", "capacity"],
		limit_page_length=0,
	) if usage_by_hall else []
	halls_by_name = {hall.name: hall for hall in halls}

	data = []
	for hall_name, usage in sorted(usage_by_hall.items()):
		hall = halls_by_name.get(hall_name, frappe._dict(name=hall_name))
		data.append(
			{
				"hall_name": hall.hall_name or hall.name,
				"hall_code": hall.hall_code,
				"capacity": hall.capacity,
				"number_of_bookings": usage["number_of_bookings"],
				"total_students": usage["total_students"],
				"total_booking_hours": round(usage["total_booking_hours"], 2),
			}
		)

	columns = [
		{"fieldname": "hall_name", "label": "Hall Name", "fieldtype": "Data", "width": 180},
		{"fieldname": "hall_code", "label": "Hall Code", "fieldtype": "Data", "width": 120},
		{"fieldname": "capacity", "label": "Capacity", "fieldtype": "Int", "width": 100},
		{
			"fieldname": "number_of_bookings",
			"label": "Number of Bookings",
			"fieldtype": "Int",
			"width": 140,
		},
		{"fieldname": "total_students", "label": "Total Students", "fieldtype": "Int", "width": 120},
		{
			"fieldname": "total_booking_hours",
			"label": "Total Booking Hours",
			"fieldtype": "Float",
			"precision": 2,
			"width": 150,
		},
	]
	return columns, data
