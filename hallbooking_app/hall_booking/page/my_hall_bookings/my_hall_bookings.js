frappe.pages["my-hall-bookings"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __("My Hall Bookings"),
		single_column: true,
	});

	page.main.html(frappe.render_template("my_hall_bookings"));
	new MyHallBookingsPage(page);
};

class MyHallBookingsPage {
	constructor(page) {
		this.page = page;
		this.bind_events();
		this.load_bookings();
	}

	bind_events() {
		this.page.main.find("#new-hall-booking, #empty-new-hall-booking").on("click", () => {
			frappe.set_route("Form", "Hall Booking Request", "new");
		});

		this.page.main
			.find("#filter-booking-date, #filter-booking-status, #filter-booking-hall")
			.on("change", () => this.load_bookings());

		this.page.main.find("#clear-booking-filters").on("click", () => {
			this.page.main
				.find("#filter-booking-date, #filter-booking-status, #filter-booking-hall")
				.val("");
			this.load_bookings();
		});

		this.page.main.on("click", ".booking-id-link", (event) => {
			event.preventDefault();
			frappe.set_route("Form", "Hall Booking Request", $(event.currentTarget).attr("data-name"));
		});

		this.page.main.on("click", ".print-reservation-slip", (event) => {
			event.preventDefault();
			const name = $(event.currentTarget).attr("data-name");
			if (!name) return;
			frappe.utils.print_document("Hall Booking Request", name, "Don Bosco College Hall Reservation Slip");
		});
	}

	load_bookings() {
		this.page.main.find("#my-bookings-message").removeClass("my-bookings-error").text(__("Loading your requests..."));
		this.page.main.find("#my-bookings-table-section, #my-bookings-empty").prop("hidden", true);
		this.page.main.find("#my-bookings-table-section").hide();
		this.page.main.find("#my-bookings-empty").hide();

		frappe.call({
			method: "hallbooking_app.hall_booking.page.my_hall_bookings.my_hall_bookings.get_my_hall_bookings",
			args: {
				booking_date: this.page.main.find("#filter-booking-date").val(),
				status: this.page.main.find("#filter-booking-status").val(),
				hall: this.page.main.find("#filter-booking-hall").val(),
			},
			callback: (response) => {
				this.render_bookings(response.message);
			},
			error: (response) => {
				const message = response.responseJSON?.message || __("Could not load your hall bookings.");
				this.page.main
					.find("#my-bookings-message")
					.addClass("my-bookings-error")
					.text(frappe.utils.strip_html(message));
			},
		});
	}

	render_bookings(result) {
		const bookings = result.bookings || [];
		this.render_summary(result.summary || {});
		this.render_halls(result.halls || []);
		this.page.main.find("#my-bookings-message").empty();
		this.page.main.find("#my-bookings-body").html(bookings.map((booking) => this.render_row(booking)).join(""));

		if (bookings.length) {
			this.page.main.find("#my-bookings-table-section").prop("hidden", false).show();
			this.page.main.find("#my-bookings-empty").prop("hidden", true).hide();
			return;
		}

		this.page.main.find("#my-bookings-table-section").prop("hidden", true).hide();
		this.page.main.find("#my-bookings-empty").prop("hidden", false).show();
	}

	render_summary(summary) {
		this.page.main.find("#summary-total").text(summary.total || 0);
		this.page.main.find("#summary-requested").text(summary.requested || 0);
		this.page.main.find("#summary-approved").text(summary.approved || 0);
		this.page.main.find("#summary-rejected").text(summary.rejected || 0);
		this.page.main.find("#summary-completed").text(summary.completed || 0);
	}

	render_halls(halls) {
		const options = ['<option value="">All halls</option>'];
		for (const hall of halls) {
			options.push(
				`<option value="${frappe.utils.escape_html(hall.name)}">${frappe.utils.escape_html(hall.hall_name)}</option>`
			);
		}

		const select = this.page.main.find("#filter-booking-hall");
		const selected = select.val();
		select.html(options.join(""));
		if (halls.some((hall) => hall.name === selected)) {
			select.val(selected);
		}
	}

	render_row(booking) {
		const status_class = (booking.status || "").toLowerCase();
		const can_print = ["Approved", "Completed"].includes(booking.status || "");
		const print_btn = can_print
			? `<button class="btn btn-default btn-xs print-reservation-slip" data-name="${frappe.utils.escape_html(booking.name)}">Print Slip</button>`
			: "";
		return `<tr>
			<td><a class="booking-id-link" href="#" data-name="${frappe.utils.escape_html(booking.name)}">${frappe.utils.escape_html(booking.name)}</a></td>
			<td>${frappe.utils.escape_html(frappe.datetime.str_to_user(booking.booking_date))}</td>
			<td>${frappe.utils.escape_html(booking.hall_name || "")}</td>
			<td>${frappe.utils.escape_html(booking.start_time || "")}</td>
			<td>${frappe.utils.escape_html(booking.end_time || "")}</td>
			<td class="booking-purpose">${frappe.utils.escape_html(booking.purpose || "—")}</td>
			<td>${frappe.utils.escape_html(String(booking.number_of_students ?? ""))}</td>
			<td><span class="booking-status booking-status-${frappe.utils.escape_html(status_class)}">${frappe.utils.escape_html(booking.status || "")}</span></td>
			<td>${print_btn}</td>
		</tr>`;
	}
}
