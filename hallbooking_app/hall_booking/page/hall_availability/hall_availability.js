frappe.pages["hall-availability"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __("Hall Availability"),
		single_column: true,
	});

	page.main.html(frappe.render_template("hall_availability"));
	new HallAvailabilityPage(page);
};

class HallAvailabilityPage {
	constructor(page) {
		this.page = page;
		this.controls = {};
		this.setup_controls();
		this.bind_events();
	}

	setup_controls() {
		this.controls.booking_date = this.make_control("booking-date", {
			fieldname: "booking_date",
			fieldtype: "Date",
			label: __("Booking Date"),
			default: frappe.datetime.get_today(),
			reqd: 1,
		});
		this.controls.start_time = this.make_control("start-time", {
			fieldname: "start_time",
			fieldtype: "Time",
			label: __("Start Time"),
			reqd: 1,
		});
		this.controls.end_time = this.make_control("end-time", {
			fieldname: "end_time",
			fieldtype: "Time",
			label: __("End Time"),
			reqd: 1,
		});
		this.controls.minimum_capacity = this.make_control("minimum-capacity", {
			fieldname: "minimum_capacity",
			fieldtype: "Int",
			label: __("Minimum Capacity"),
			min: 0,
		});
		this.controls.hall = this.make_control("hall", {
			fieldname: "hall",
			fieldtype: "Link",
			label: __("Hall"),
			options: "Hall",
			get_query: () => ({ filters: { active: 1 } }),
		});
	}

	make_control(fieldname, df) {
		const control = frappe.ui.form.make_control({
			parent: this.page.main.find(`#availability-${fieldname}`),
			df,
			render_input: true,
		});
		control.refresh();
		return control;
	}

	bind_events() {
		this.page.main.find("#check-hall-availability").on("click", () => this.check_availability());
		this.page.main.find("#clear-hall-availability").on("click", () => this.clear_search());

		this.page.main.on("click", ".book-this-hall", (event) => {
			const hall = $(event.currentTarget).attr("data-hall");
			frappe.route_options = {
				booking_date: this.last_search.booking_date,
				hall,
				start_time: this.last_search.start_time,
				end_time: this.last_search.end_time,
			};
			frappe.set_route("Form", "Hall Booking Request", "new");
		});

		this.page.main.on("click", ".open-existing-booking", (event) => {
			const request = $(event.currentTarget).attr("data-request");
			frappe.set_route("Form", "Hall Booking Request", request);
		});
	}

	check_availability() {
		const values = {
			booking_date: this.controls.booking_date.get_value(),
			start_time: this.controls.start_time.get_value(),
			end_time: this.controls.end_time.get_value(),
			minimum_capacity: this.controls.minimum_capacity.get_value(),
			hall: this.controls.hall.get_value(),
		};

		if (!values.booking_date || !values.start_time || !values.end_time) {
			frappe.msgprint(__("Booking Date, Start Time, and End Time are required."));
			return;
		}

		if (values.start_time >= values.end_time) {
			frappe.msgprint(__("End Time must be later than Start Time."));
			return;
		}

		this.last_search = values;
		this.show_loading();
		frappe.call({
			method: "hallbooking_app.hall_booking.page.hall_availability.hall_availability.check_hall_availability",
			args: values,
			callback: (response) => {
				if (response.message) {
					this.render_results(response.message);
				}
			},
			error: (response) => {
				this.show_error(response.responseJSON?.message || __("Could not check hall availability."));
			},
		});
	}

	render_results(result) {
		const available = result.available || [];
		const unavailable = result.unavailable || [];
		const total = available.length + unavailable.length;
		this.page.main.find("#availability-message").empty().hide();
		this.page.main.find("#availability-results").show();
		this.page.main.find("#availability-result-count").text(__("{0} halls checked", [total]));
		this.page.main.find("#available-halls-count").text(available.length);
		this.page.main.find("#unavailable-halls-count").text(unavailable.length);
		this.page.main.find("#available-halls-body").html(
			available.map((hall) => this.render_hall_row(hall, true)).join("")
		);
		this.page.main.find("#unavailable-halls-body").html(
			unavailable.map((hall) => this.render_hall_row(hall, false)).join("")
		);
		this.page.main.find("#available-halls-section").toggle(available.length > 0);
		this.page.main.find("#unavailable-halls-section").toggle(unavailable.length > 0);
		this.page.main.find("#availability-no-halls").toggle(total === 0);
	}

	render_hall_row(hall, is_available) {
		const status_label = is_available ? __("AVAILABLE") : __("NOT AVAILABLE");
		const status_class = is_available ? "availability-status-available" : "availability-status-unavailable";
		const booking = hall.existing_booking;
		const booking_details = booking
			? `<div class="existing-booking-details">
					<strong>${frappe.utils.escape_html(booking.name)}</strong>
					<span>${frappe.utils.escape_html(booking.start_time)} - ${frappe.utils.escape_html(booking.end_time)}</span>
					<span>${frappe.utils.escape_html(booking.faculty_name || "")} / ${frappe.utils.escape_html(booking.department || "")}</span>
					<span>${frappe.utils.escape_html(booking.status)}</span>
				</div>`
			: `<span class="text-muted">--</span>`;
		const action = is_available
			? `<button class="btn btn-primary btn-xs book-this-hall" data-hall="${frappe.utils.escape_html(hall.hall)}">${__("Book This Hall")}</button>`
			: booking
				? `<button class="btn btn-default btn-xs open-existing-booking" data-request="${frappe.utils.escape_html(booking.name)}">${__("Open")}</button>`
				: "";

		return `<tr>
			<td><strong>${frappe.utils.escape_html(hall.hall_name || "")}</strong></td>
			<td>${frappe.utils.escape_html(hall.hall_code || "")}</td>
			<td>${frappe.utils.escape_html(String(hall.capacity ?? ""))}</td>
			<td class="facilities-cell">${frappe.utils.escape_html(hall.facilities || "—")}</td>
			<td><span class="availability-status ${status_class}">${status_label}</span></td>
			<td>${booking_details}</td>
			<td class="availability-action-cell">${action}</td>
		</tr>`;
	}

	show_loading() {
		this.page.main.find("#availability-results").hide();
		this.page.main
			.find("#availability-message")
			.html(`<div class="availability-inline-message">${__("Checking active halls...")}</div>`)
			.show();
	}

	show_error(message) {
		this.page.main.find("#availability-results").hide();
		this.page.main
			.find("#availability-message")
			.html(`<div class="availability-inline-message availability-error">${frappe.utils.escape_html(message)}</div>`)
			.show();
	}

	clear_search() {
		this.controls.booking_date.set_value("");
		this.controls.start_time.set_value("");
		this.controls.end_time.set_value("");
		this.controls.minimum_capacity.set_value("");
		this.controls.hall.set_value("");
		this.last_search = null;
		this.page.main.find("#availability-message, #availability-results").empty().hide();
		this.page.main.find("#availability-results").hide();
	}
}
