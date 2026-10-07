// Copyright (c) 2026, JB and contributors
// For license information, please see license.txt

frappe.pages["hall-booking-approver-dashboard"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __("Hall Booking Approver Dashboard"),
		single_column: true,
	});

	page.main.html(frappe.render_template("hall_booking_approver_dashboard"));

	const dashboard = new HallBookingApproverDashboard(page);
	dashboard.init();
	dashboard.load_data();

	$(wrapper).bind("show", function () {
		dashboard.load_data();
	});
};

class HallBookingApproverDashboard {
	constructor(page) {
		this.page = page;
		this.data = null;
	}

	init() {
		this.setup_event_listeners();
	}

	setup_event_listeners() {
		const refresh_btn = document.getElementById("refresh-btn");
		if (refresh_btn) {
			refresh_btn.addEventListener("click", () => this.load_data());
		}

		const view_all_btn = document.getElementById("view-all-btn");
		if (view_all_btn) {
			view_all_btn.addEventListener("click", () => {
				frappe.set_route("List", "Hall Booking Request");
			});
		}

		const calendar_btn = document.getElementById("calendar-btn");
		if (calendar_btn) {
			calendar_btn.addEventListener("click", () => {
				frappe.set_route("List", "Hall Booking Request", { view: "calendar" });
			});
		}
	}

	load_data() {
		this.show_loading_state();

		frappe.call({
			method: "hallbooking_app.hall_booking.page.hall_booking_approver_dashboard.hall_booking_approver_dashboard.get_dashboard_data",
			callback: (r) => {
				if (r.message) {
					this.data = r.message;
					this.render_dashboard();
				}
			},
			error: (r) => {
				frappe.msgprint({
					title: __("Error"),
					message: r.responseJSON?.message || __("Failed to load dashboard data"),
					indicator: "red",
				});
			},
		});
	}

	show_loading_state() {
		const ids = ["pending-count", "approved-count", "rejected-count", "todays-count", "upcoming-count"];
		ids.forEach((id) => {
			const elem = document.getElementById(id);
			if (elem) elem.textContent = "...";
		});
	}

	render_dashboard() {
		this.render_header();
		this.render_summary_cards();
		this.render_pending_requests();
		this.render_todays_bookings();
		this.render_upcoming_bookings();
		this.render_hall_summary();
	}

	render_header() {
		const user_full_name_elem = document.getElementById("user-full-name");
		if (user_full_name_elem && this.data.user_full_name) {
			user_full_name_elem.textContent = this.data.user_full_name;
		}
	}

	render_summary_cards() {
		const summary = this.data && this.data.summary ? this.data.summary : {};
		const map = {
			"pending-count": summary.pending_requests || 0,
			"approved-count": summary.approved || 0,
			"rejected-count": summary.rejected || 0,
			"todays-count": summary.todays_bookings || 0,
			"upcoming-count": summary.upcoming_bookings || 0,
		};
		Object.keys(map).forEach((id) => {
			const elem = document.getElementById(id);
			if (elem) elem.textContent = map[id];
		});
	}

	render_pending_requests() {
		const tbody = document.getElementById("pending-tbody");
		const no_pending = document.getElementById("no-pending");
		const table_div = document.getElementById("pending-requests-table");

		if (!tbody || !no_pending || !table_div) return;

		if (!this.data.pending_requests || this.data.pending_requests.length === 0) {
			table_div.style.display = "none";
			no_pending.style.display = "block";
			return;
		}

		table_div.style.display = "block";
		no_pending.style.display = "none";

		tbody.innerHTML = this.data.pending_requests
			.map((req) => this.render_request_row(req, true))
			.join("");

		tbody.querySelectorAll(".open-btn").forEach((btn) => {
			btn.addEventListener("click", (e) => {
				const req_name = e.currentTarget.dataset.reqName;
				if (req_name) frappe.set_route("Form", "Hall Booking Request", req_name);
			});
		});
	}

	render_todays_bookings() {
		const tbody = document.getElementById("todays-tbody");
		const no_todays = document.getElementById("no-todays");
		const table_div = document.getElementById("todays-bookings-table");

		if (!tbody || !no_todays || !table_div) return;

		if (!this.data.todays_bookings || this.data.todays_bookings.length === 0) {
			table_div.style.display = "none";
			no_todays.style.display = "block";
			return;
		}

		table_div.style.display = "block";
		no_todays.style.display = "none";

		tbody.innerHTML = this.data.todays_bookings
			.map((booking) => this.render_todays_row(booking))
			.join("");
	}

	render_upcoming_bookings() {
		const tbody = document.getElementById("upcoming-tbody");
		const no_upcoming = document.getElementById("no-upcoming");
		const table_div = document.getElementById("upcoming-bookings-table");

		if (!tbody || !no_upcoming || !table_div) return;

		if (!this.data.upcoming_bookings || this.data.upcoming_bookings.length === 0) {
			table_div.style.display = "none";
			no_upcoming.style.display = "block";
			return;
		}

		table_div.style.display = "block";
		no_upcoming.style.display = "none";

		tbody.innerHTML = this.data.upcoming_bookings
			.map((booking) => this.render_upcoming_row(booking))
			.join("");
	}

	render_hall_summary() {
		const tbody = document.getElementById("hall-tbody");
		if (!tbody) return;

		if (!this.data.hall_summary || this.data.hall_summary.length === 0) {
			tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No active halls available.</td></tr>';
			return;
		}

		tbody.innerHTML = this.data.hall_summary
			.map((hall) => `
				<tr>
					<td>${frappe.utils.escape_html(hall.hall_name || "")}</td>
					<td><span class="badge badge-light">${frappe.utils.escape_html(hall.hall_code || "")}</span></td>
					<td>${hall.capacity || 0}</td>
					<td>
						${hall.booking_count > 0
							? `<span class="badge badge-info">${hall.booking_count}</span>`
							: `<span class="text-muted">0</span>`
						}
					</td>
				</tr>
			`)
			.join("");
	}

	render_request_row(req, include_action = false) {
		const status_badge = this.get_status_badge(req.status);
		const action_col = include_action
			? `<td>
				<button class="btn btn-xs btn-primary open-btn" data-req-name="${frappe.utils.escape_html(req.name)}">
					<i class="fa fa-external-link"></i> Open
				</button>
			</td>`
			: "";

		return `
			<tr>
				<td><strong>${frappe.utils.escape_html(req.name)}</strong></td>
				<td>${frappe.datetime.str_to_user(req.booking_date, false, true)}</td>
				<td>${frappe.utils.escape_html(req.hall || "")}</td>
				<td>${this.format_time(req.start_time)}</td>
				<td>${this.format_time(req.end_time)}</td>
				<td>${frappe.utils.escape_html(req.faculty_name || "")}</td>
				<td>${frappe.utils.escape_html(req.department || "")}</td>
				<td>${frappe.utils.escape_html(req.programme || "")}</td>
				<td>${req.number_of_students || 0}</td>
				<td>${status_badge}</td>
				${action_col}
			</tr>
		`;
	}

	render_todays_row(booking) {
		const status_badge = this.get_status_badge(booking.status);

		return `
			<tr>
				<td>${frappe.utils.escape_html(booking.hall || "")}</td>
				<td>${frappe.datetime.str_to_user(booking.booking_date, false, true)}</td>
				<td>${this.format_time(booking.start_time)}</td>
				<td>${this.format_time(booking.end_time)}</td>
				<td>${frappe.utils.escape_html(booking.faculty_name || "")}</td>
				<td>${frappe.utils.escape_html(booking.department || "")}</td>
				<td>${frappe.utils.escape_html(booking.programme || "")}</td>
				<td>${booking.number_of_students || 0}</td>
				<td>${status_badge}</td>
			</tr>
		`;
	}

	render_upcoming_row(booking) {
		const status_badge = this.get_status_badge(booking.status);

		return `
			<tr>
				<td><strong>${frappe.utils.escape_html(booking.name)}</strong></td>
				<td>${frappe.datetime.str_to_user(booking.booking_date, false, true)}</td>
				<td>${frappe.utils.escape_html(booking.hall || "")}</td>
				<td>${this.format_time(booking.start_time)}</td>
				<td>${this.format_time(booking.end_time)}</td>
				<td>${frappe.utils.escape_html(booking.faculty_name || "")}</td>
				<td>${frappe.utils.escape_html(booking.department || "")}</td>
				<td>${frappe.utils.escape_html(booking.programme || "")}</td>
				<td>${booking.number_of_students || 0}</td>
				<td>${status_badge}</td>
			</tr>
		`;
	}

	get_status_badge(status) {
		const status_map = {
			"Requested": { badge_class: "badge-warning", icon: "fa-hourglass-half", label: "Pending" },
			"Approved": { badge_class: "badge-success", icon: "fa-check-circle", label: "Approved" },
			"Rejected": { badge_class: "badge-danger", icon: "fa-times-circle", label: "Rejected" },
			"Cancelled": { badge_class: "badge-danger", icon: "fa-ban", label: "Cancelled" },
			"Completed": { badge_class: "badge-info", icon: "fa-flag-checkered", label: "Completed" },
		};

		const status_info = status_map[status] || { badge_class: "badge-secondary", icon: "fa-question", label: status };

		return `<span class="badge ${status_info.badge_class}"><i class="fa ${status_info.icon}"></i> ${status_info.label}</span>`;
	}

	format_time(time_str) {
		if (!time_str) return "";
		// time_str is in format HH:MM:SS
		const parts = time_str.split(":");
		if (parts.length >= 2) {
			return `${parts[0]}:${parts[1]}`;
		}
		return time_str;
	}
}
