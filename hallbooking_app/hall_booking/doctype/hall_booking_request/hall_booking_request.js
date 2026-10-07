// Copyright (c) 2026, JB and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Hall Booking Request", {
// 	refresh(frm) {

// 	},
// });
frappe.ui.form.on("Hall Booking Request", {
    refresh(frm) {
        set_requested_by(frm);
    },

    onload(frm) {
        set_requested_by(frm);
    },

    requested_by(frm) {
        set_faculty_name(frm);
    }
});

function set_requested_by(frm) {
    if (frm.is_new() && !frm.doc.requested_by) {
        frm.set_value("requested_by", frappe.session.user);
    }

    // Also fill Faculty Name after Requested By is set
    if (frm.doc.requested_by && !frm.doc.faculty_name) {
        set_faculty_name(frm);
    }
}

function set_faculty_name(frm) {
    if (!frm.doc.requested_by) {
        return;
    }

    frappe.db.get_value(
        "User",
        frm.doc.requested_by,
        "full_name"
    ).then(r => {
        if (r.message && r.message.full_name) {
            frm.set_value("faculty_name", r.message.full_name);
        }
    });
}