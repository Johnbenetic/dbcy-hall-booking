# Copyright (c) 2026, JB and contributors
# For license information, please see license.txt

import frappe
from frappe.utils import today, getdate


@frappe.whitelist()
def get_dashboard_data():
	"""
	Fetch dashboard data for Hall Booking Approver.
	Only users with Hall Booking Approver role can access this method.
	"""
	
	# Server-side role check
	user_roles = frappe.get_roles(frappe.session.user)
	if "Hall Booking Approver" not in user_roles:
		frappe.throw(
			"You do not have permission to view this dashboard. "
			"This dashboard is only available to users with the Hall Booking Approver role.",
			frappe.PermissionError
		)
	
	# Get current user
	current_user = frappe.session.user
	user_full_name = frappe.db.get_value("User", current_user, "full_name") or current_user
	
	# Get summary data
	pending_count = frappe.db.count(
		"Hall Booking Request",
		filters={"status": "Requested"}
	)
	
	approved_count = frappe.db.count(
		"Hall Booking Request",
		filters={"status": "Approved"}
	)
	
	rejected_count = frappe.db.count(
		"Hall Booking Request",
		filters={"status": "Rejected"}
	)
	
	todays_date = today()
	todays_bookings_count = frappe.db.count(
		"Hall Booking Request",
		filters=[
			["booking_date", "=", todays_date],
			["status", "in", ["Requested", "Approved", "Completed"]]
		]
	)
	
	upcoming_bookings_count = frappe.db.count(
		"Hall Booking Request",
		filters=[
			["booking_date", ">", todays_date],
			["status", "in", ["Requested", "Approved"]]
		]
	)
	
	# Get pending requests (max 20)
	pending_requests = frappe.get_all(
		"Hall Booking Request",
		filters={"status": "Requested"},
		fields=[
			"name",
			"booking_date",
			"hall",
			"start_time",
			"end_time",
			"faculty_name",
			"department",
			"programme",
			"number_of_students",
			"status"
		],
		order_by="booking_date desc, start_time desc",
		limit_page_length=20
	)
	
	# Get today's bookings (max 20)
	todays_bookings = frappe.get_all(
		"Hall Booking Request",
		filters=[
			["booking_date", "=", todays_date],
			["status", "in", ["Requested", "Approved", "Completed"]]
		],
		fields=[
			"name",
			"booking_date",
			"hall",
			"start_time",
			"end_time",
			"faculty_name",
			"department",
			"programme",
			"number_of_students",
			"status"
		],
		order_by="start_time asc",
		limit_page_length=20
	)
	
	# Get upcoming bookings (max 10)
	upcoming_bookings = frappe.get_all(
		"Hall Booking Request",
		filters=[
			["booking_date", ">", todays_date],
			["status", "in", ["Requested", "Approved"]]
		],
		fields=[
			"name",
			"booking_date",
			"hall",
			"start_time",
			"end_time",
			"faculty_name",
			"department",
			"programme",
			"number_of_students",
			"status"
		],
		order_by="booking_date asc, start_time asc",
		limit_page_length=10
	)
	
	# Get hall summary (count of bookings per hall for today)
	hall_summary = frappe.get_all(
		"Hall",
		filters={"active": 1},
		fields=["name", "hall_name", "hall_code", "capacity"]
	)
	
	# Add today's booking count for each hall
	for hall in hall_summary:
		hall_booking_count = frappe.db.count(
			"Hall Booking Request",
			filters=[
				["hall", "=", hall.name],
				["booking_date", "=", todays_date],
				["status", "in", ["Requested", "Approved", "Completed"]]
			]
		)
		hall["booking_count"] = hall_booking_count
	
	return {
		"summary": {
			"pending_requests": pending_count,
			"approved": approved_count,
			"rejected": rejected_count,
			"todays_bookings": todays_bookings_count,
			"upcoming_bookings": upcoming_bookings_count
		},
		"pending_requests": pending_requests,
		"todays_bookings": todays_bookings,
		"upcoming_bookings": upcoming_bookings,
		"hall_summary": hall_summary,
		"user_full_name": user_full_name,
		"todays_date": todays_date
	}
