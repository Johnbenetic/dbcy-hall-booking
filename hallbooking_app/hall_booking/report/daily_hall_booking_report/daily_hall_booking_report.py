import frappe

from hallbooking_app.hall_booking.report.booking_report_utils import (
	booking_columns,
	get_booking_rows,
)


def execute(filters=None):
	return booking_columns(), get_booking_rows(frappe._dict(filters or {}))
