import json
from pathlib import Path

import frappe


CONFIRMATION_PRINT_FORMAT_NAME = "Hall Booking Confirmation"
RESERVATION_PRINT_FORMAT_NAME = "Don Bosco College Hall Reservation Slip"
CONFIRMATION_HTML_PATH = Path(__file__).parent / "hall_booking_confirmation.html"
RESERVATION_HTML_PATH = Path(__file__).parent / "don_bosco_hall_reservation_slip.html"


def _sync_print_format(print_format_name, html_path):
	html = html_path.read_text()
	format_data = json.dumps(
		{
			"sections": [
				{
					"columns": [
						{
							"fields": [
								{
									"fieldname": "_custom_html",
									"fieldtype": "HTML Editor",
									"html": html,
								}
							]
						}
					]
				}
			]
		}
	)
	values = {
		"print_format_for": "DocType",
		"doc_type": "Hall Booking Request",
		"custom_format": 1,
		"disabled": 0,
		"format_data": format_data,
		"html": html,
		"module": "Hall Booking",
		"page_number": "Hide",
		"print_format_type": "Jinja",
		"standard": "No",
	}

	if frappe.db.exists("Print Format", print_format_name):
		frappe.db.set_value("Print Format", print_format_name, values)
	else:
		print_format = frappe.get_doc(
			{
				"doctype": "Print Format",
				"name": print_format_name,
				**{key: value for key, value in values.items() if key != "format_data"},
			}
		)
		print_format.insert(ignore_permissions=True)
		frappe.db.set_value("Print Format", print_format_name, values)

	frappe.clear_cache(doctype="Hall Booking Request")


def sync_hall_booking_confirmation():
	_sync_print_format(CONFIRMATION_PRINT_FORMAT_NAME, CONFIRMATION_HTML_PATH)


def sync_hall_booking_reservation_slip():
	_sync_print_format(RESERVATION_PRINT_FORMAT_NAME, RESERVATION_HTML_PATH)


def sync_hall_booking_print_formats():
	sync_hall_booking_confirmation()
	sync_hall_booking_reservation_slip()
