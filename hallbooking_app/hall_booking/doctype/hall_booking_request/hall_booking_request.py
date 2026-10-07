# Copyright (c) 2026, JB and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import getdate, get_time, get_datetime, today


class HallBookingRequest(Document):

    def validate(self):
        self.set_requested_by()
        self.validate_booking_date()
        self.validate_booking_time()
        self.validate_hall()
        self.validate_status()
        self.set_calendar_datetime()
        self.validate_booking_conflict()
        
    def set_requested_by(self):
        """Automatically set the current logged-in user as the requester."""

        if not self.requested_by:
            self.requested_by = frappe.session.user

    def validate_booking_date(self):
        """Ensure the booking date is not in the past."""

        if self.booking_date and getdate(self.booking_date) < getdate(today()):
            frappe.throw("Booking Date cannot be in the past.")

    def validate_booking_time(self):
        """Ensure start time is earlier than end time."""

        if not self.start_time or not self.end_time:
            frappe.throw("Start Time and End Time are required.")

        start_time = get_time(self.start_time)
        end_time = get_time(self.end_time)

        if start_time >= end_time:
            frappe.throw("End Time must be later than Start Time.")

    def validate_hall(self):
        """Ensure the selected hall exists and is active."""

        if not self.hall:
            frappe.throw("Please select a Hall.")

        hall_active = frappe.db.get_value(
            "Hall",
            self.hall,
            "active"
        )

        if not hall_active:
            frappe.throw(
                f"Hall <b>{self.hall}</b> is not active and cannot be booked."
            )

    def validate_status(self):
        """Set and validate the booking status."""

        if self.is_new() and not self.status:
            self.status = "Requested"

        valid_statuses = [
            "Requested",
            "Approved",
            "Rejected",
            "Cancelled",
            "Completed"
        ]

        if self.status and self.status not in valid_statuses:
            frappe.throw(
                f"Invalid booking status: {self.status}"
            )

    def set_calendar_datetime(self):
        """Combine booking date and time for the calendar."""

        if self.booking_date and self.start_time:
            self.custom_calendar_start = get_datetime(
                f"{self.booking_date} {self.start_time}"
            )

        if self.booking_date and self.end_time:
            self.custom_calendar_end = get_datetime(
                f"{self.booking_date} {self.end_time}"
            )

    def validate_booking_conflict(self):
        """Prevent overlapping active bookings for the same hall and date."""

        if self.status not in ["Requested", "Approved", "Completed"]:
            return

        existing_bookings = frappe.get_all(
            "Hall Booking Request",
            filters={
                "hall": self.hall,
                "booking_date": self.booking_date,
                "status": ["in", ["Requested", "Approved", "Completed"]],
                "name": ["!=", self.name],
            },
            fields=[
                "name",
                "start_time",
                "end_time",
                "status",
            ],
        )

        new_start = get_time(self.start_time)
        new_end = get_time(self.end_time)

        for booking in existing_bookings:
            existing_start = get_time(booking.start_time)
            existing_end = get_time(booking.end_time)

            if existing_start < new_end and existing_end > new_start:
                frappe.throw(
                    f"""
                    <b>Hall Booking Conflict</b><br><br>
                    This hall already has an active booking/request
                    during the selected time.<br><br>

                    <b>Existing Request:</b> {booking.name}<br>
                    <b>Time:</b> {booking.start_time} - {booking.end_time}<br>
                    <b>Status:</b> {booking.status}
                    """
                )