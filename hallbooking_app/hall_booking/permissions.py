import frappe


FACULTY_OWNER_FIELDS = ("requested_by", "owner")
ADMINISTRATIVE_ROLES = {"System Manager", "Hall Booking Approver", "Hall Booking Administrator"}


def _user_roles(user=None):
    if user is None:
        user = frappe.session.user
    return set(frappe.get_roles(user))


def get_hall_booking_request_permission_query_conditions(user=None):
    if user is None:
        user = frappe.session.user

    if user == "Administrator":
        return ""

    roles = _user_roles(user)
    if roles & ADMINISTRATIVE_ROLES:
        return ""

    if "Faculty" in roles:
        escaped_user = frappe.db.escape(user)
        return f"`tabHall Booking Request`.`requested_by` = {escaped_user}"

    return "1 = 0"


def has_hall_booking_request_permission(doc, ptype=None, user=None):
    if user is None:
        user = frappe.session.user

    if user == "Administrator":
        return True

    roles = _user_roles(user)
    if roles & ADMINISTRATIVE_ROLES:
        return True

    if not doc:
        return False

    if doc.doctype != "Hall Booking Request":
        return False

    if "Faculty" not in roles:
        return False

    if ptype == "create":
        return True

    if ptype in {"read", "write", "delete", "submit", "cancel", "amend"}:
        return bool(doc.get("requested_by") == user or doc.get("owner") == user)

    return False


def has_hall_permission(doc, ptype=None, user=None):
    if user is None:
        user = frappe.session.user

    if user == "Administrator":
        return True

    roles = _user_roles(user)
    if roles & ADMINISTRATIVE_ROLES:
        return True

    if "Faculty" in roles and ptype in {"read", "select"}:
        return True

    return False
