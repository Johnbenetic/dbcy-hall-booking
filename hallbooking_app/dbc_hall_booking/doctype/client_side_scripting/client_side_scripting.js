// Copyright (c) 2026, DBC and contributors
// For license information, please see license.txt

frappe.ui.form.on("Client Side Scripting", {
	after_save(frm) {
		let first_name = frm.doc.first_name || "";
		let middle_name = frm.doc.middle_name || "";
		let last_name = frm.doc.last_name || "";

		let full_name = [first_name, middle_name, last_name].filter(Boolean).join(" ");

		if (full_name) {
			frappe.msgprint(`Full Name: ${full_name}`);
		}
        }
});