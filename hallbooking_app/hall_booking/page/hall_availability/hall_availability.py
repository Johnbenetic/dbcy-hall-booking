import frappe
from frappe.utils import get_time, getdate, today


ACTIVE_BOOKING_STATUSES = ["Requested", "Approved", "Completed"]


@frappe.whitelist()
def check_hall_availability(booking_date, start_time, end_time, minimum_capacity=None, hall=None):
	if not booking_date:
		frappe.throw("Booking Date is required.")

	try:
		booking_date = getdate(booking_date)
	except (TypeError, ValueError):
		frappe.throw("Booking Date is invalid.")

	if booking_date < getdate(today()):
		frappe.throw("Booking Date cannot be in the past.")

	if not start_time or not end_time:
		frappe.throw("Start Time and End Time are required.")

	try:
		start_time = get_time(start_time)
		end_time = get_time(end_time)
	except (TypeError, ValueError):
		frappe.throw("Start Time or End Time is invalid.")

	if start_time >= end_time:
		frappe.throw("End Time must be later than Start Time.")

	capacity = None
	if minimum_capacity not in (None, ""):
		try:
			capacity_value = float(minimum_capacity)
			if not capacity_value.is_integer():
				frappe.throw("Minimum Capacity must be a whole number.")
			capacity = int(capacity_value)
		except (TypeError, ValueError, OverflowError):
			frappe.throw("Minimum Capacity must be a whole number.")

		if capacity < 0:
			frappe.throw("Minimum Capacity cannot be negative.")

	if not frappe.has_permission("Hall", "read"):
		frappe.throw("You do not have permission to view halls.", frappe.PermissionError)

	if not frappe.has_permission("Hall Booking Request", "read"):
		frappe.throw(
			"You do not have permission to check booking availability.",
			frappe.PermissionError,
		)

	hall_filters = {"active": 1}
	if capacity is not None:
		hall_filters["capacity"] = [">=", capacity]
	if hall:
		hall_filters["name"] = hall

	halls = frappe.get_list(
		"Hall",
		filters=hall_filters,
		fields=["name", "hall_name", "hall_code", "capacity", "facilities"],
		order_by="hall_name asc",
		limit_page_length=0,
	)

	if not halls:
		return {"available": [], "unavailable": []}

	bookings = frappe.get_list(
		"Hall Booking Request",
		filters={
			"hall": ["in", [item.name for item in halls]],
			"booking_date": booking_date,
			"status": ["in", ACTIVE_BOOKING_STATUSES],
		},
		fields=["name", "hall", "start_time", "end_time", "faculty_name", "department", "status"],
		order_by="start_time asc",
		limit_page_length=0,
	)

	bookings_by_hall = {}
	for booking in bookings:
		existing_start = get_time(booking.start_time)
		existing_end = get_time(booking.end_time)
		if existing_start < end_time and existing_end > start_time:
			bookings_by_hall.setdefault(booking.hall, booking)

	available = []
	unavailable = []
	for item in halls:
		hall_info = {
			"hall": item.name,
			"hall_name": item.hall_name,
			"hall_code": item.hall_code,
			"capacity": item.capacity,
			"facilities": item.facilities,
		}
		if booking := bookings_by_hall.get(item.name):
			hall_info["existing_booking"] = {
				"name": booking.name,
				"start_time": booking.start_time,
				"end_time": booking.end_time,
				"faculty_name": booking.faculty_name,
				"department": booking.department,
				"status": booking.status,
			}
			unavailable.append(hall_info)
		else:
			available.append(hall_info)

	return {"available": available, "unavailable": unavailable}
