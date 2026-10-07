from datetime import date

import frappe


BOOKING_STATUSES = ["Requested", "Approved", "Rejected", "Cancelled", "Completed"]
SUMMARY_STATUSES = ["Requested", "Approved", "Rejected", "Completed"]


@frappe.whitelist()
def get_my_hall_bookings(booking_date=None, status=None, hall=None):
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("You must be logged in to view your hall bookings.", frappe.PermissionError)

	if not frappe.has_permission("Hall Booking Request", "read"):
		frappe.throw("You do not have permission to view your hall bookings.", frappe.PermissionError)

	owner_filter = {"requested_by": user}
	all_bookings = frappe.get_list(
		"Hall Booking Request",
		filters=owner_filter,
		fields=["status", "hall"],
		limit_page_length=0,
	)

	summary = {"total": len(all_bookings)}
	summary.update({item.lower(): 0 for item in SUMMARY_STATUSES})
	for booking in all_bookings:
		if booking.status in SUMMARY_STATUSES:
			summary[booking.status.lower()] += 1

	filters = dict(owner_filter)
	if booking_date:
		try:
			filters["booking_date"] = date.fromisoformat(booking_date)
		except (TypeError, ValueError):
			frappe.throw("Booking Date is invalid.")

	if status:
		if status not in BOOKING_STATUSES:
			frappe.throw("Booking Status is invalid.")
		filters["status"] = status

	if hall:
		filters["hall"] = hall

	bookings = frappe.get_list(
		"Hall Booking Request",
		filters=filters,
		fields=[
			"name",
			"booking_date",
			"hall",
			"start_time",
			"end_time",
			"purpose",
			"number_of_students",
			"status",
		],
		order_by="booking_date desc, start_time desc",
		limit_page_length=0,
	)

	hall_names = {booking.hall for booking in all_bookings if booking.get("hall")}
	hall_labels = {}
	if hall_names:
		halls = frappe.get_list(
			"Hall",
			filters={"name": ["in", list(hall_names)]},
			fields=["name", "hall_name"],
			limit_page_length=0,
		)
		hall_labels = {item.name: item.hall_name for item in halls}

	for booking in bookings:
		booking["hall_name"] = hall_labels.get(booking.hall, booking.hall)

	return {
		"bookings": bookings,
		"summary": summary,
		"halls": [
			{"name": name, "hall_name": hall_labels.get(name, name)} for name in sorted(hall_names)
		],
	}
