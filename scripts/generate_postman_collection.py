import json
from datetime import datetime
import os

ROLE_ADMIN = "ADMIN"
ROLE_DOCTOR = "DOCTOR"
ROLE_RECEPTIONIST = "RECEPTIONIST"
ROLE_PATIENT = "PATIENT"

ALL = [ROLE_ADMIN, ROLE_DOCTOR, ROLE_RECEPTIONIST, ROLE_PATIENT]
ADMIN_ONLY = [ROLE_ADMIN]
DOCTOR_ONLY = [ROLE_DOCTOR]
RECEPTIONIST_ONLY = [ROLE_RECEPTIONIST]
PATIENT_ONLY = [ROLE_PATIENT]
ADMIN_RECEPTIONIST = [ROLE_ADMIN, ROLE_RECEPTIONIST]
ADMIN_DOCTOR = [ROLE_ADMIN, ROLE_DOCTOR]
ADMIN_DOCTOR_RECEPTIONIST = [ROLE_ADMIN, ROLE_DOCTOR, ROLE_RECEPTIONIST]
ADMIN_DOCTOR_PATIENT = [ROLE_ADMIN, ROLE_DOCTOR, ROLE_PATIENT]
PATIENT_DOCTOR = [ROLE_PATIENT, ROLE_DOCTOR]

MODULE_ORDER = [
    "AUTH",
    "PROFILE",
    "USER",
    "PATIENT",
    "DOCTOR",
    "APPOINTMENT",
    "VISIT / MEDICAL RECORD",
    "BILLING / INVOICE",
    "INVENTORY / MEDICINE",
    "ATTENDANCE / SHIFT",
    "NOTIFICATION",
    "SEARCH",
    "SPECIALTY",
    "PAYROLL",
    "PERMISSION",
    "ADMIN",
    "SYSTEM",
]

DEFAULT_TESTS = [
    "pm.test(\"Status code is 2xx\", function () {",
    "  pm.expect(pm.response.code).to.be.within(200, 299);",
    "});",
    "const contentType = pm.response.headers.get(\"Content-Type\") || \"\";",
    "if (contentType.includes(\"application/json\")) {",
    "  pm.test(\"Response is JSON\", function () {",
    "    pm.expect(pm.response.json()).to.be.an(\"object\");",
    "  });",
    "}",
]


def json_body(data):
    return {
        "mode": "raw",
        "raw": json.dumps(data, indent=2, ensure_ascii=True),
        "options": {"raw": {"language": "json"}},
    }


def form_body(fields):
    return {"mode": "formdata", "formdata": fields}


def build_headers(auth_required, body):
    headers = []
    if auth_required:
        headers.append({"key": "Authorization", "value": "Bearer {{accessToken}}"})
    if body and body.get("mode") == "raw":
        headers.append({"key": "Content-Type", "value": "application/json"})
    return headers


def make_description(method, raw_url, headers, body, success, error, notes):
    lines = []
    if notes:
        lines.append("Notes:")
        for note in notes:
            lines.append(f"- {note}")
        lines.append("")

    lines.append(f"Method: {method}")
    lines.append(f"URL: {raw_url}")

    if headers:
        lines.append("Headers:")
        for header in headers:
            lines.append(f"- {header['key']}: {header['value']}")
    else:
        lines.append("Headers: (none)")

    if body:
        lines.append("Body:")
        if body.get("mode") == "raw":
            lines.append(body.get("raw", ""))
        elif body.get("mode") == "formdata":
            lines.append("form-data:")
            for field in body.get("formdata", []):
                if field.get("type") == "file":
                    lines.append(f"- {field.get('key')}: <file>")
                else:
                    lines.append(f"- {field.get('key')}: {field.get('value', '')}")
    else:
        lines.append("Body: (none)")

    if success:
        lines.append("Success Response Example:")
        lines.append(json.dumps(success, indent=2, ensure_ascii=True))

    if error:
        lines.append("Error Response Example:")
        lines.append(json.dumps(error, indent=2, ensure_ascii=True))

    return "\n".join(lines)


def build_event(extra_tests=None, skip=False):
    if skip:
        return []
    lines = list(DEFAULT_TESTS)
    if extra_tests:
        lines.extend(extra_tests)
    return [
        {
            "listen": "test",
            "script": {"type": "text/javascript", "exec": lines},
        }
    ]


endpoints = []


def add_endpoint(
    name,
    module,
    method,
    path,
    roles,
    auth=True,
    body=None,
    success=None,
    error=None,
    tests=None,
    skip_tests=False,
    notes=None,
):
    endpoints.append(
        {
            "name": name,
            "module": module,
            "method": method,
            "path": path,
            "roles": roles,
            "auth": auth,
            "body": body,
            "success": success,
            "error": error,
            "tests": tests,
            "skip_tests": skip_tests,
            "notes": notes or [],
        }
    )


add_endpoint(
    name="Register",
    module="AUTH",
    method="POST",
    path="/api/auth/register",
    roles=ALL,
    auth=False,
    body=json_body(
        {
            "email": "patient1@example.com",
            "password": "Password123",
            "fullName": "Patient One",
            "roleId": 3,
        }
    ),
    success={
        "success": True,
        "message": "REGISTER_SUCCESS",
        "user": {
            "id": 1,
            "email": "patient1@example.com",
            "fullName": "Patient One",
            "roleId": 3,
        },
    },
    error={"success": False, "message": "EMAIL_ALREADY_EXISTS"},
    tests=[
        "const json = pm.response.json();",
        "if (json.user && json.user.id) { pm.environment.set(\"userId\", json.user.id); }",
    ],
)

add_endpoint(
    name="Login",
    module="AUTH",
    method="POST",
    path="/api/auth/login",
    roles=ALL,
    auth=False,
    body=json_body({"email": "patient1@example.com", "password": "Password123"}),
    success={
        "success": True,
        "message": "LOGIN_SUCCESS",
        "tokens": {"accessToken": "<token>", "refreshToken": "<token>"},
        "user": {
            "userId": 1,
            "email": "patient1@example.com",
            "fullName": "Patient One",
            "roleId": 3,
        },
    },
    error={"success": False, "message": "INVALID_CREDENTIALS"},
    tests=[
        "const json = pm.response.json();",
        "pm.test(\"Login returns tokens\", function () {",
        "  pm.expect(json.tokens).to.have.property(\"accessToken\");",
        "  pm.expect(json.tokens).to.have.property(\"refreshToken\");",
        "});",
        "pm.environment.set(\"accessToken\", json.tokens.accessToken);",
        "pm.environment.set(\"refreshToken\", json.tokens.refreshToken);",
        "if (json.user && json.user.userId) { pm.environment.set(\"userId\", json.user.userId); }",
    ],
)

add_endpoint(
    name="Refresh token",
    module="AUTH",
    method="POST",
    path="/api/auth/refresh-token",
    roles=ALL,
    auth=True,
    body=json_body({"refreshToken": "{{refreshToken}}"}),
    success={"success": True, "message": "REFRESH_SUCCESS", "accessToken": "<token>"},
    error={"success": False, "message": "INVALID_REFRESH_TOKEN"},
    tests=[
        "const json = pm.response.json();",
        "if (json.accessToken) { pm.environment.set(\"accessToken\", json.accessToken); }",
    ],
)

add_endpoint(
    name="Logout",
    module="AUTH",
    method="POST",
    path="/api/auth/logout",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "message": "LOGOUT_SUCCESS"},
    error={"success": False, "message": "NO_TOKEN_PROVIDED"},
)

add_endpoint(
    name="Forgot password",
    module="AUTH",
    method="POST",
    path="/api/auth/forgot-password",
    roles=ALL,
    auth=False,
    body=json_body({"email": "patient1@example.com"}),
    success={"message": "If email exists, reset link was sent"},
    error={"message": "INTERNAL_SERVER_ERROR"},
)

add_endpoint(
    name="Reset password",
    module="AUTH",
    method="POST",
    path="/api/auth/reset-password",
    roles=ALL,
    auth=False,
    body=json_body({"token": "reset-token-here", "newPassword": "NewPassword123"}),
    success={"message": "Password reset successfully"},
    error={"message": "INVALID_OR_EXPIRED_TOKEN"},
)

add_endpoint(
    name="OAuth - Google Login",
    module="AUTH",
    method="GET",
    path="/api/auth/oauth/google",
    roles=ALL,
    auth=False,
    body=None,
    success={"message": "Redirect to Google OAuth"},
    error={"success": False, "message": "OAuth authentication failed"},
    skip_tests=True,
    notes=["Browser redirect (302) to Google OAuth consent screen"],
)

add_endpoint(
    name="OAuth - Google Callback",
    module="AUTH",
    method="GET",
    path="/api/auth/oauth/google/callback",
    roles=ALL,
    auth=False,
    body=None,
    success={
        "success": True,
        "message": "OAuth login successful",
        "data": {
            "token": "<token>",
            "user": {
                "id": 1,
                "email": "user@example.com",
                "fullName": "User One",
                "roleId": 3,
                "oauth2Provider": "google",
            },
        },
    },
    error={"success": False, "message": "OAuth authentication failed"},
    skip_tests=True,
)

add_endpoint(
    name="OAuth - Failure",
    module="AUTH",
    method="GET",
    path="/api/auth/oauth/failure",
    roles=ALL,
    auth=False,
    body=None,
    success={"success": False, "message": "OAuth authentication failed"},
    error=None,
    tests=[
        "pm.test(\"Status code is 401\", function () {",
        "  pm.expect(pm.response.code).to.eql(401);",
        "});",
    ],
)


add_endpoint(
    name="Get my profile",
    module="PROFILE",
    method="GET",
    path="/api/profile",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "data": {"id": 1, "email": "user@example.com"}},
    error={"success": False, "message": "User not found"},
)

add_endpoint(
    name="Update profile",
    module="PROFILE",
    method="PUT",
    path="/api/profile",
    roles=ALL,
    auth=True,
    body=json_body({"fullName": "Updated User", "avatar": "/uploads/users/avatar.png"}),
    success={"success": True, "message": "Profile updated successfully", "data": {"id": 1}},
    error={"success": False, "message": "User not found"},
)

add_endpoint(
    name="Change password",
    module="PROFILE",
    method="PUT",
    path="/api/profile/password",
    roles=ALL,
    auth=True,
    body=json_body({"currentPassword": "OldPassword123", "newPassword": "NewPassword123"}),
    success={"success": True, "message": "Password changed successfully"},
    error={"success": False, "message": "Current password is incorrect"},
)

add_endpoint(
    name="Upload avatar",
    module="PROFILE",
    method="POST",
    path="/api/profile/avatar",
    roles=ALL,
    auth=True,
    body=form_body([{ "key": "avatar", "type": "file", "src": "" }]),
    success={"success": True, "message": "Avatar uploaded successfully", "data": {"avatar": "/uploads/users/avatar.png"}},
    error={"success": False, "message": "No file uploaded"},
)


add_endpoint(
    name="Get my notification settings",
    module="USER",
    method="GET",
    path="/api/users/me/notification-settings",
    roles=ALL,
    auth=True,
    body=None,
    success={
        "success": True,
        "message": "Notification settings retrieved successfully",
        "data": {"emailEnabled": True, "smsEnabled": False, "pushEnabled": True, "inAppEnabled": True},
    },
    error={"success": False, "message": "Failed to retrieve notification settings"},
)

add_endpoint(
    name="Update my notification settings",
    module="USER",
    method="PUT",
    path="/api/users/me/notification-settings",
    roles=ALL,
    auth=True,
    body=json_body({"emailEnabled": True, "smsEnabled": False, "pushEnabled": True, "inAppEnabled": True}),
    success={
        "success": True,
        "message": "Notification settings updated successfully",
        "data": {"emailEnabled": True, "smsEnabled": False, "pushEnabled": True, "inAppEnabled": True},
    },
    error={"success": False, "message": "No valid settings provided"},
)

add_endpoint(
    name="Get all users",
    module="USER",
    method="GET",
    path="/api/users",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "count": 2, "data": [{"id": 1, "email": "admin@example.com"}]},
    error={"success": False, "message": "Failed to get users"},
)

add_endpoint(
    name="Get user by ID",
    module="USER",
    method="GET",
    path="/api/users/{{userId}}",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "data": {"id": 1, "email": "user@example.com"}},
    error={"success": False, "message": "User not found"},
)

add_endpoint(
    name="Create user",
    module="USER",
    method="POST",
    path="/api/users",
    roles=ADMIN_ONLY,
    auth=True,
    body=json_body({"email": "staff1@example.com", "password": "Password123", "fullName": "Staff One", "roleId": 2}),
    success={"success": True, "message": "User created successfully", "data": {"id": 2, "email": "staff1@example.com"}},
    error={"success": False, "message": "Email already exists"},
)

add_endpoint(
    name="Update user",
    module="USER",
    method="PUT",
    path="/api/users/{{userId}}",
    roles=ADMIN_ONLY,
    auth=True,
    body=json_body({"email": "staff1@example.com", "fullName": "Staff One", "roleId": 2, "isActive": True}),
    success={"success": True, "message": "User updated successfully", "data": {"id": 1}},
    error={"success": False, "message": "User not found"},
)

add_endpoint(
    name="Activate user",
    module="USER",
    method="PUT",
    path="/api/users/{{userId}}/activate",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "User activated successfully", "data": {"id": 1}},
    error={"success": False, "message": "User is already active"},
)

add_endpoint(
    name="Deactivate user",
    module="USER",
    method="PUT",
    path="/api/users/{{userId}}/deactivate",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "User deactivated successfully", "data": {"id": 1}},
    error={"success": False, "message": "User is already inactive"},
)

add_endpoint(
    name="Change user role",
    module="USER",
    method="PUT",
    path="/api/users/{{userId}}/role",
    roles=ADMIN_ONLY,
    auth=True,
    body=json_body({"roleId": 4}),
    success={"success": True, "message": "User role changed successfully", "data": {"id": 1, "roleId": 4}},
    error={"success": False, "message": "roleId is required"},
)

add_endpoint(
    name="Delete user",
    module="USER",
    method="DELETE",
    path="/api/users/{{userId}}",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "User deleted successfully"},
    error={"success": False, "message": "User not found"},
)


add_endpoint(
    name="Setup patient profile",
    module="PATIENT",
    method="POST",
    path="/api/patients/setup",
    roles=PATIENT_ONLY,
    auth=True,
    body=json_body(
        {
            "fullName": "Patient One",
            "gender": "MALE",
            "dateOfBirth": "1990-01-01",
            "cccd": "012345678901",
            "profiles": [
                {"type": "phone", "value": "0901234567"}
            ],
        }
    ),
    success={"success": True, "message": "Patient profile setup successfully", "data": {"id": 1}},
    error={"success": False, "message": "PATIENT_ALREADY_SETUP"},
    tests=[
        "const json = pm.response.json();",
        "if (json.data && json.data.id) { pm.environment.set(\"patientId\", json.data.id); }",
    ],
)

add_endpoint(
    name="Get patients",
    module="PATIENT",
    method="GET",
    path="/api/patients?page=1&limit=10",
    roles=ADMIN_DOCTOR_RECEPTIONIST,
    auth=True,
    body=None,
    success={"success": True, "page": 1, "limit": 10, "patients": []},
    error={"success": False, "message": "Failed to get patients"},
)

add_endpoint(
    name="Get patient by ID",
    module="PATIENT",
    method="GET",
    path="/api/patients/{{patientId}}",
    roles=ADMIN_DOCTOR_RECEPTIONIST,
    auth=True,
    body=None,
    success={"success": True, "patient": {"id": 1, "fullName": "Patient One"}},
    error={"success": False, "message": "Patient not found"},
)

add_endpoint(
    name="Update patient",
    module="PATIENT",
    method="PUT",
    path="/api/patients/{{patientId}}",
    roles=ADMIN_DOCTOR_RECEPTIONIST + PATIENT_ONLY,
    auth=True,
    body=json_body({"fullName": "Patient One", "gender": "MALE", "dateOfBirth": "1990-01-01"}),
    success={"success": True, "message": "Patient updated successfully", "patient": {"id": 1}},
    error={"success": False, "message": "Patient not found"},
)

add_endpoint(
    name="Delete patient",
    module="PATIENT",
    method="DELETE",
    path="/api/patients/{{patientId}}",
    roles=ADMIN_DOCTOR_RECEPTIONIST,
    auth=True,
    body=None,
    success={"success": True, "message": "Patient deleted successfully"},
    error={"success": False, "message": "Patient not found"},
)

add_endpoint(
    name="Upload patient avatar",
    module="PATIENT",
    method="POST",
    path="/api/patients/{{patientId}}/avatar",
    roles=PATIENT_ONLY,
    auth=True,
    body=form_body([{ "key": "avatar", "type": "file", "src": "" }]),
    success={"success": True, "message": "Patient avatar uploaded successfully", "data": {"avatar": "/uploads/patients/avatar.png"}},
    error={"success": False, "message": "No file uploaded"},
)

add_endpoint(
    name="Get patient medical history",
    module="PATIENT",
    method="GET",
    path="/api/patients/{{patientId}}/medical-history",
    roles=ADMIN_DOCTOR_PATIENT,
    auth=True,
    body=None,
    success={"success": True, "data": {"visits": [], "prescriptions": [], "totalVisits": 0, "totalPrescriptions": 0}},
    error={"success": False, "message": "FORBIDDEN"},
)

add_endpoint(
    name="Get patient prescriptions",
    module="PATIENT",
    method="GET",
    path="/api/patients/{{patientId}}/prescriptions",
    roles=ADMIN_DOCTOR_PATIENT,
    auth=True,
    body=None,
    success={"success": True, "data": [], "total": 0},
    error={"success": False, "message": "FORBIDDEN"},
)


add_endpoint(
    name="Get all doctors",
    module="DOCTOR",
    method="GET",
    path="/api/doctors",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "data": []},
    error={"success": False, "message": "Get doctors failed"},
)

add_endpoint(
    name="Get doctor by ID",
    module="DOCTOR",
    method="GET",
    path="/api/doctors/{{doctorId}}",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "data": {"id": 1, "userId": 1}},
    error={"success": False, "message": "Doctor not found"},
)

add_endpoint(
    name="Create doctor",
    module="DOCTOR",
    method="POST",
    path="/api/doctors",
    roles=ADMIN_ONLY,
    auth=True,
    body=json_body({"userId": "{{userId}}", "specialtyId": 1, "position": "Attending", "degree": "MD", "description": "General medicine"}),
    success={"success": True, "data": {"id": 1, "userId": 1}},
    error={"success": False, "message": "User not found"},
    tests=[
        "const json = pm.response.json();",
        "if (json.data && json.data.id) { pm.environment.set(\"doctorId\", json.data.id); }",
    ],
)

add_endpoint(
    name="Update doctor",
    module="DOCTOR",
    method="PUT",
    path="/api/doctors/{{doctorId}}",
    roles=ADMIN_ONLY,
    auth=True,
    body=json_body({"specialtyId": 1, "position": "Senior", "degree": "MD", "description": "Updated"}),
    success={"success": True, "data": {"id": 1}},
    error={"success": False, "message": "Doctor not found"},
)

add_endpoint(
    name="Delete doctor",
    module="DOCTOR",
    method="DELETE",
    path="/api/doctors/{{doctorId}}",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "Doctor deleted"},
    error={"success": False, "message": "Doctor not found"},
)

add_endpoint(
    name="Get shifts by doctor",
    module="DOCTOR",
    method="GET",
    path="/api/doctors/{{doctorId}}/shifts",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "data": []},
    error={"success": False, "message": "Get shifts by doctor failed"},
)


add_endpoint(
    name="Create appointment (online)",
    module="APPOINTMENT",
    method="POST",
    path="/api/appointments",
    roles=PATIENT_ONLY,
    auth=True,
    body=json_body({"doctorId": "{{doctorId}}", "shiftId": 1, "date": "2026-02-01", "symptomInitial": "Mild fever"}),
    success={"success": True, "message": "APPOINTMENT_CREATED", "data": {"id": 1}},
    error={"success": False, "message": "MISSING_INPUT"},
)

add_endpoint(
    name="Create appointment (offline)",
    module="APPOINTMENT",
    method="POST",
    path="/api/appointments/offline",
    roles=RECEPTIONIST_ONLY,
    auth=True,
    body=json_body({"patientId": "{{patientId}}", "doctorId": "{{doctorId}}", "shiftId": 1, "date": "2026-02-01", "symptomInitial": "Mild fever"}),
    success={"success": True, "message": "APPOINTMENT_CREATED", "data": {"id": 1}},
    error={"success": False, "message": "MISSING_INPUT"},
)

add_endpoint(
    name="Cancel appointment",
    module="APPOINTMENT",
    method="PUT",
    path="/api/appointments/{{appointmentId}}/cancel",
    roles=PATIENT_ONLY + RECEPTIONIST_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "APPOINTMENT_CANCELLED", "data": {"id": 1}},
    error={"success": False, "message": "APPOINTMENT_NOT_FOUND"},
)

add_endpoint(
    name="Get appointments",
    module="APPOINTMENT",
    method="GET",
    path="/api/appointments?date=2026-02-01&doctorId={{doctorId}}&shiftId=1&status=WAITING",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "data": []},
    error={"success": False, "message": "DATE_INVALID"},
)

add_endpoint(
    name="Get my appointments",
    module="APPOINTMENT",
    method="GET",
    path="/api/appointments/my",
    roles=PATIENT_DOCTOR,
    auth=True,
    body=None,
    success={"success": True, "data": []},
    error={"success": False, "message": "PATIENT_NOT_SETUP"},
)

add_endpoint(
    name="Get upcoming appointments",
    module="APPOINTMENT",
    method="GET",
    path="/api/appointments/upcoming",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "data": []},
    error={"success": False, "message": "FAILED_TO_GET_UPCOMING"},
)

add_endpoint(
    name="Get appointment by ID",
    module="APPOINTMENT",
    method="GET",
    path="/api/appointments/{{appointmentId}}",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "data": {"id": 1}},
    error={"success": False, "message": "APPOINTMENT_NOT_FOUND"},
)

add_endpoint(
    name="Update appointment (reschedule)",
    module="APPOINTMENT",
    method="PUT",
    path="/api/appointments/{{appointmentId}}",
    roles=ADMIN_ONLY + RECEPTIONIST_ONLY + PATIENT_ONLY,
    auth=True,
    body=json_body({"doctorId": "{{doctorId}}", "shiftId": 1, "date": "2026-02-02", "symptomInitial": "Updated symptom"}),
    success={"success": True, "message": "APPOINTMENT_UPDATED", "data": {"id": 1}},
    error={"success": False, "message": "CAN_ONLY_UPDATE_WAITING_APPOINTMENTS"},
)

add_endpoint(
    name="Mark appointment no-show",
    module="APPOINTMENT",
    method="PUT",
    path="/api/appointments/{{appointmentId}}/no-show",
    roles=ADMIN_ONLY + RECEPTIONIST_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "APPOINTMENT_MARKED_NO_SHOW", "data": {"id": 1}},
    error={"success": False, "message": "APPOINTMENT_NOT_FOUND"},
)


add_endpoint(
    name="Start visit (check-in)",
    module="VISIT / MEDICAL RECORD",
    method="POST",
    path="/api/visits/checkin/{{appointmentId}}",
    roles=RECEPTIONIST_ONLY,
    auth=True,
    body=json_body({"vitalSigns": {"bloodPressure": "120/80", "heartRate": 80, "temperature": 37.0, "weight": 70}}),
    success={"success": True, "message": "Check-in successful", "data": {"id": 1}},
    error={"success": False, "message": "APPOINTMENT_ALREADY_CHECKED_IN"},
)

add_endpoint(
    name="Complete visit",
    module="VISIT / MEDICAL RECORD",
    method="PUT",
    path="/api/visits/{{visitId}}/complete",
    roles=DOCTOR_ONLY,
    auth=True,
    body=json_body({"diagnosis": "Upper respiratory infection", "diseaseCategoryId": 1, "treatment": "Rest and fluids", "notes": "Follow up in 1 week"}),
    success={"success": True, "message": "Visit completed and invoice created", "data": {"visit": {"id": 1}}},
    error={"success": False, "message": "VISIT_NOT_FOUND"},
)

add_endpoint(
    name="Visit history",
    module="VISIT / MEDICAL RECORD",
    method="GET",
    path="/api/visits",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "data": []},
    error={"success": False, "message": "Failed to get visits"},
)

add_endpoint(
    name="Get visits by patient",
    module="VISIT / MEDICAL RECORD",
    method="GET",
    path="/api/visits/patient/{{patientId}}",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "data": []},
    error={"success": False, "message": "FORBIDDEN"},
)

add_endpoint(
    name="Get visit by ID",
    module="VISIT / MEDICAL RECORD",
    method="GET",
    path="/api/visits/{{visitId}}",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "data": {"id": 1}},
    error={"success": False, "message": "VISIT_NOT_FOUND"},
)

add_endpoint(
    name="Create prescription",
    module="VISIT / MEDICAL RECORD",
    method="POST",
    path="/api/prescriptions",
    roles=DOCTOR_ONLY,
    auth=True,
    body=json_body({
        "visitId": "{{visitId}}",
        "patientId": "{{patientId}}",
        "medicines": [
            {"medicineId": 1, "quantity": 10, "dosageMorning": 1, "dosageNoon": 0, "dosageAfternoon": 1, "dosageEvening": 0}
        ],
        "note": "Take after meals"
    }),
    success={"success": True, "message": "Prescription created successfully", "data": {"id": 1}},
    error={"success": False, "message": "VISIT_NOT_FOUND"},
)

add_endpoint(
    name="Update prescription",
    module="VISIT / MEDICAL RECORD",
    method="PUT",
    path="/api/prescriptions/{{prescriptionId}}",
    roles=DOCTOR_ONLY,
    auth=True,
    body=json_body({
        "medicines": [
            {"medicineId": 1, "quantity": 8, "dosageMorning": 1, "dosageNoon": 0, "dosageAfternoon": 1, "dosageEvening": 0}
        ],
        "note": "Updated dosage"
    }),
    success={"success": True, "message": "Prescription updated successfully", "data": {"id": 1}},
    error={"success": False, "message": "PRESCRIPTION_NOT_FOUND"},
)

add_endpoint(
    name="Cancel prescription",
    module="VISIT / MEDICAL RECORD",
    method="POST",
    path="/api/prescriptions/{{prescriptionId}}/cancel",
    roles=DOCTOR_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "Prescription cancelled successfully", "data": {"id": 1}},
    error={"success": False, "message": "PRESCRIPTION_NOT_FOUND"},
)

add_endpoint(
    name="Dispense prescription",
    module="VISIT / MEDICAL RECORD",
    method="PUT",
    path="/api/prescriptions/{{prescriptionId}}/dispense",
    roles=ADMIN_ONLY + RECEPTIONIST_ONLY,
    auth=True,
    body=json_body({"dispensedBy": "{{userId}}"}),
    success={"success": True, "message": "Prescription dispensed successfully", "data": {"id": 1}},
    error={"success": False, "message": "PRESCRIPTION_NOT_FOUND"},
)

add_endpoint(
    name="Get prescription by visit",
    module="VISIT / MEDICAL RECORD",
    method="GET",
    path="/api/prescriptions/visit/{{visitId}}",
    roles=DOCTOR_ONLY,
    auth=True,
    body=None,
    success={"success": True, "data": {"id": 1}},
    error={"success": False, "message": "No prescription found for this visit"},
)

add_endpoint(
    name="Get prescription by ID",
    module="VISIT / MEDICAL RECORD",
    method="GET",
    path="/api/prescriptions/{{prescriptionId}}",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "data": {"id": 1}},
    error={"success": False, "message": "Prescription not found"},
)

add_endpoint(
    name="Get prescriptions by patient",
    module="VISIT / MEDICAL RECORD",
    method="GET",
    path="/api/prescriptions/patient/{{patientId}}",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "data": []},
    error={"success": False, "message": "Failed to get prescriptions"},
)

add_endpoint(
    name="Export prescription PDF",
    module="VISIT / MEDICAL RECORD",
    method="GET",
    path="/api/prescriptions/{{prescriptionId}}/pdf",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "message": "PDF generated"},
    error={"success": False, "message": "Prescription not found"},
    notes=["Returns application/pdf on success"],
)


add_endpoint(
    name="Create invoice",
    module="BILLING / INVOICE",
    method="POST",
    path="/api/invoices",
    roles=ADMIN_RECEPTIONIST,
    auth=True,
    body=json_body({
        "patientId": "{{patientId}}",
        "doctorId": "{{doctorId}}",
        "visitId": "{{visitId}}",
        "examinationFee": 200000,
        "items": [
            {"description": "Consultation", "quantity": 1, "unitPrice": 200000}
        ]
    }),
    success={"success": True, "message": "Invoice created successfully", "data": {"id": 1}},
    error={"success": False, "message": "visitId and examinationFee are required"},
    notes=["Validator also requires patientId, doctorId, items"],
)

add_endpoint(
    name="Get invoices",
    module="BILLING / INVOICE",
    method="GET",
    path="/api/invoices?page=1&limit=10&patientId={{patientId}}",
    roles=ADMIN_RECEPTIONIST,
    auth=True,
    body=None,
    success={"success": True, "message": "Invoices retrieved successfully", "data": [], "pagination": {"page": 1, "limit": 10}},
    error={"success": False, "message": "Failed to retrieve invoices"},
)

add_endpoint(
    name="Get invoice by ID",
    module="BILLING / INVOICE",
    method="GET",
    path="/api/invoices/{{invoiceId}}",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "message": "Invoice retrieved successfully", "data": {"id": 1}},
    error={"success": False, "message": "Invoice not found"},
    notes=["Authorization check inside controller"],
)

add_endpoint(
    name="Update invoice",
    module="BILLING / INVOICE",
    method="PUT",
    path="/api/invoices/{{invoiceId}}",
    roles=ADMIN_RECEPTIONIST,
    auth=True,
    body=json_body({
        "discount": 50000,
        "note": "Membership discount",
        "items": [
            {"description": "Consultation", "quantity": 1, "unitPrice": 200000}
        ]
    }),
    success={"success": True, "message": "Invoice updated successfully", "data": {"id": 1}},
    error={"success": False, "message": "Failed to update invoice"},
)

add_endpoint(
    name="Pay invoice (add payment)",
    module="BILLING / INVOICE",
    method="POST",
    path="/api/invoices/{{invoiceId}}/payments",
    roles=ADMIN_RECEPTIONIST,
    auth=True,
    body=json_body({"amount": 150000, "paymentMethod": "CASH", "reference": "RCPT-001", "note": "Partial payment"}),
    success={"success": True, "message": "Payment added successfully", "data": {"id": 1}},
    error={"success": False, "message": "amount and paymentMethod are required"},
)

add_endpoint(
    name="Get invoice payments",
    module="BILLING / INVOICE",
    method="GET",
    path="/api/invoices/{{invoiceId}}/payments",
    roles=ADMIN_RECEPTIONIST,
    auth=True,
    body=None,
    success={"success": True, "message": "Payments retrieved successfully", "data": []},
    error={"success": False, "message": "Invoice not found"},
)

add_endpoint(
    name="Export invoice PDF",
    module="BILLING / INVOICE",
    method="GET",
    path="/api/invoices/{{invoiceId}}/pdf",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "message": "PDF generated"},
    error={"success": False, "message": "Failed to export PDF"},
    notes=["Returns application/pdf on success", "Authorization check inside controller"],
)

add_endpoint(
    name="Get invoices by patient",
    module="BILLING / INVOICE",
    method="GET",
    path="/api/invoices/patient/{{patientId}}",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "message": "Invoices retrieved successfully", "data": []},
    error={"success": False, "message": "Failed to retrieve invoices"},
    notes=["Authorization check inside controller"],
)

add_endpoint(
    name="Get unpaid invoices",
    module="BILLING / INVOICE",
    method="GET",
    path="/api/invoices/unpaid?limit=50",
    roles=ADMIN_RECEPTIONIST,
    auth=True,
    body=None,
    success={"success": True, "message": "Unpaid invoices retrieved successfully", "data": [], "pagination": {"limit": 50}},
    error={"success": False, "message": "Failed to retrieve unpaid invoices"},
)

add_endpoint(
    name="Get invoice statistics",
    module="BILLING / INVOICE",
    method="GET",
    path="/api/invoices/statistics?fromDate=2026-01-01&toDate=2026-01-31",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "Statistics retrieved successfully", "data": {}},
    error={"success": False, "message": "Failed to retrieve statistics"},
)


add_endpoint(
    name="Create medicine",
    module="INVENTORY / MEDICINE",
    method="POST",
    path="/api/medicines",
    roles=ADMIN_ONLY,
    auth=True,
    body=json_body({
        "name": "Paracetamol",
        "group": "Analgesic",
        "unit": "VIEN",
        "importPrice": 1000,
        "salePrice": 1500,
        "quantity": 100,
        "expiryDate": "2026-12-31"
    }),
    success={"success": True, "message": "Medicine created successfully", "data": {"id": 1}},
    error={"success": False, "message": "Medicine name is required"},
)

add_endpoint(
    name="Update medicine",
    module="INVENTORY / MEDICINE",
    method="PUT",
    path="/api/medicines/{{medicineId}}",
    roles=ADMIN_ONLY,
    auth=True,
    body=json_body({"salePrice": 1600, "quantity": 120}),
    success={"success": True, "message": "Medicine updated successfully", "data": {"id": 1}},
    error={"success": False, "message": "Medicine not found"},
)

add_endpoint(
    name="Import medicine",
    module="INVENTORY / MEDICINE",
    method="POST",
    path="/api/medicines/{{medicineId}}/import",
    roles=ADMIN_ONLY,
    auth=True,
    body=json_body({"quantity": 50, "importPrice": 1000}),
    success={"success": True, "message": "Medicine imported successfully", "data": {"id": 1}},
    error={"success": False, "message": "Medicine not found"},
)

add_endpoint(
    name="Get low stock medicines",
    module="INVENTORY / MEDICINE",
    method="GET",
    path="/api/medicines/low-stock?page=1&limit=10",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "data": []},
    error={"success": False, "message": "Failed to get low stock medicines"},
)

add_endpoint(
    name="Get expiring medicines",
    module="INVENTORY / MEDICINE",
    method="GET",
    path="/api/medicines/expiring?days=30",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "Found 0 medicine(s) expiring within 30 day(s)", "data": []},
    error={"success": False, "message": "Failed to get expiring medicines"},
)

add_endpoint(
    name="Auto mark expired medicines",
    module="INVENTORY / MEDICINE",
    method="POST",
    path="/api/medicines/auto-mark-expired",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "Marked 0 medicine(s) as expired", "data": {"markedCount": 0}},
    error={"success": False, "message": "Failed to auto-mark expired medicines"},
)

add_endpoint(
    name="Get medicine import history",
    module="INVENTORY / MEDICINE",
    method="GET",
    path="/api/medicines/{{medicineId}}/imports",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "data": []},
    error={"success": False, "message": "Failed to get import history"},
)

add_endpoint(
    name="Get medicine export history",
    module="INVENTORY / MEDICINE",
    method="GET",
    path="/api/medicines/{{medicineId}}/exports",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "data": []},
    error={"success": False, "message": "Failed to get export history"},
)

add_endpoint(
    name="Mark medicine as expired",
    module="INVENTORY / MEDICINE",
    method="POST",
    path="/api/medicines/{{medicineId}}/mark-expired",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "Medicine marked as expired", "data": {"id": 1}},
    error={"success": False, "message": "Medicine not found"},
)

add_endpoint(
    name="Delete medicine",
    module="INVENTORY / MEDICINE",
    method="DELETE",
    path="/api/medicines/{{medicineId}}",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "Medicine removed successfully", "data": {"id": 1}},
    error={"success": False, "message": "Cannot remove medicine with remaining stock"},
)

add_endpoint(
    name="Get all medicines",
    module="INVENTORY / MEDICINE",
    method="GET",
    path="/api/medicines?page=1&limit=10",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "data": []},
    error={"success": False, "message": "Failed to get medicines"},
)

add_endpoint(
    name="Get medicine by ID",
    module="INVENTORY / MEDICINE",
    method="GET",
    path="/api/medicines/{{medicineId}}",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "data": {"id": 1}},
    error={"success": False, "message": "Medicine not found"},
)


add_endpoint(
    name="Check-in",
    module="ATTENDANCE / SHIFT",
    method="POST",
    path="/api/attendance/check-in",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "message": "CHECK_IN_SUCCESS", "data": {"id": 1}},
    error={"success": False, "message": "ALREADY_CHECKED_IN_TODAY"},
)

add_endpoint(
    name="Check-out",
    module="ATTENDANCE / SHIFT",
    method="POST",
    path="/api/attendance/check-out",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "message": "CHECK_OUT_SUCCESS", "data": {"id": 1}},
    error={"success": False, "message": "MUST_CHECK_IN_FIRST"},
)

add_endpoint(
    name="Get my attendance",
    module="ATTENDANCE / SHIFT",
    method="GET",
    path="/api/attendance/my?startDate=2026-02-01&endDate=2026-02-28&limit=30",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "data": []},
    error={"success": False, "message": "Failed to get attendance"},
)

add_endpoint(
    name="Request leave",
    module="ATTENDANCE / SHIFT",
    method="POST",
    path="/api/attendance/leave-request",
    roles=ALL,
    auth=True,
    body=json_body({"date": "2026-02-15", "leaveType": "sick", "reason": "Fever"}),
    success={"success": True, "message": "LEAVE_REQUEST_CREATED", "data": {"id": 1}},
    error={"success": False, "message": "CANNOT_REQUEST_LEAVE_FOR_PAST_DATE"},
)

add_endpoint(
    name="Get all attendance",
    module="ATTENDANCE / SHIFT",
    method="GET",
    path="/api/attendance?userId={{userId}}&status=PRESENT&limit=100",
    roles=ADMIN_RECEPTIONIST,
    auth=True,
    body=None,
    success={"success": True, "data": []},
    error={"success": False, "message": "Failed to get attendance"},
)

add_endpoint(
    name="Update attendance",
    module="ATTENDANCE / SHIFT",
    method="PUT",
    path="/api/attendance/{{attendanceId}}",
    roles=ADMIN_ONLY,
    auth=True,
    body=json_body({"status": "PRESENT", "note": "Adjusted", "checkInTime": "2026-02-01T08:00:00Z", "checkOutTime": "2026-02-01T17:00:00Z"}),
    success={"success": True, "message": "ATTENDANCE_UPDATED", "data": {"id": 1}},
    error={"success": False, "message": "ATTENDANCE_NOT_FOUND"},
)

add_endpoint(
    name="Get all shifts",
    module="ATTENDANCE / SHIFT",
    method="GET",
    path="/api/shifts",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "data": []},
    error={"success": False, "message": "Get shifts failed"},
)

add_endpoint(
    name="Get shift schedule",
    module="ATTENDANCE / SHIFT",
    method="GET",
    path="/api/shifts/schedule?startDate=2026-02-01&endDate=2026-02-28",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "message": "Shift schedule retrieved successfully", "data": {"totalEntries": 0}},
    error={"success": False, "message": "Invalid date format. Use YYYY-MM-DD"},
)

add_endpoint(
    name="Get shift by ID",
    module="ATTENDANCE / SHIFT",
    method="GET",
    path="/api/shifts/{{shiftId}}",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "data": {"id": 1}},
    error={"success": False, "message": "Shift not found"},
)

add_endpoint(
    name="Create shift",
    module="ATTENDANCE / SHIFT",
    method="POST",
    path="/api/shifts",
    roles=ADMIN_ONLY,
    auth=True,
    body=json_body({"name": "Morning", "startTime": "08:00", "endTime": "12:00"}),
    success={"success": True, "data": {"id": 1}},
    error={"success": False, "message": "Create shift failed"},
)

add_endpoint(
    name="Update shift",
    module="ATTENDANCE / SHIFT",
    method="PUT",
    path="/api/shifts/{{shiftId}}",
    roles=ADMIN_ONLY,
    auth=True,
    body=json_body({"name": "Morning", "startTime": "08:00", "endTime": "12:00"}),
    success={"success": True, "data": {"id": 1}},
    error={"success": False, "message": "Shift not found"},
)

add_endpoint(
    name="Delete shift",
    module="ATTENDANCE / SHIFT",
    method="DELETE",
    path="/api/shifts/{{shiftId}}",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "Shift deleted"},
    error={"success": False, "message": "Shift not found"},
)

add_endpoint(
    name="Get doctors on duty",
    module="ATTENDANCE / SHIFT",
    method="GET",
    path="/api/doctor-shifts/on-duty?shiftId={{shiftId}}&workDate=2026-02-01",
    roles=ALL,
    auth=False,
    body=None,
    success={"success": True, "data": []},
    error={"success": False, "message": "Missing shiftId or workDate"},
)

add_endpoint(
    name="Get available shifts",
    module="ATTENDANCE / SHIFT",
    method="GET",
    path="/api/doctor-shifts/available?workDate=2026-02-01&specialtyId={{specialtyId}}",
    roles=ALL,
    auth=False,
    body=None,
    success={"success": True, "data": []},
    error={"success": False, "message": "workDate is required (YYYY-MM-DD)"},
)

add_endpoint(
    name="Assign doctor to shift",
    module="ATTENDANCE / SHIFT",
    method="POST",
    path="/api/doctor-shifts",
    roles=ADMIN_ONLY,
    auth=True,
    body=json_body({"doctorId": "{{doctorId}}", "shiftId": "{{shiftId}}", "workDate": "2026-02-01"}),
    success={"success": True, "data": {"id": 1}},
    error={"success": False, "message": "Missing doctorId/shiftId/workDate"},
)

add_endpoint(
    name="Get doctor shifts",
    module="ATTENDANCE / SHIFT",
    method="GET",
    path="/api/doctor-shifts/doctor/{{doctorId}}",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "data": []},
    error={"success": False, "message": "Get shifts by doctor failed"},
)

add_endpoint(
    name="Unassign doctor from shift",
    module="ATTENDANCE / SHIFT",
    method="DELETE",
    path="/api/doctor-shifts/{{doctorShiftId}}",
    roles=ADMIN_ONLY,
    auth=True,
    body=json_body({"cancelReason": "Schedule change"}),
    success={"success": True, "message": "Doctor unassigned from shift successfully", "data": {"totalAppointments": 0}},
    error={"success": False, "message": "Assignment not found"},
)

add_endpoint(
    name="Preview shift reschedule",
    module="ATTENDANCE / SHIFT",
    method="GET",
    path="/api/doctor-shifts/{{doctorShiftId}}/reschedule-preview",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "data": {"doctorShiftId": 1, "affectedAppointments": 0}},
    error={"success": False, "message": "Shift not found"},
)

add_endpoint(
    name="Cancel and reschedule shift",
    module="ATTENDANCE / SHIFT",
    method="POST",
    path="/api/doctor-shifts/{{doctorShiftId}}/cancel-and-reschedule",
    roles=ADMIN_ONLY,
    auth=True,
    body=json_body({"replacementDoctorId": "{{doctorId}}", "reason": "Emergency", "cancelReason": "Emergency"}),
    success={"success": True, "message": "Reschedule completed", "data": {"totalAppointments": 0}},
    error={"success": False, "message": "Cancel reason is required"},
    notes=["Controller expects cancelReason; validator expects replacementDoctorId and reason"],
)

add_endpoint(
    name="Restore cancelled shift",
    module="ATTENDANCE / SHIFT",
    method="POST",
    path="/api/doctor-shifts/{{doctorShiftId}}/restore",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "Shift restored successfully"},
    error={"success": False, "message": "Failed to restore shift"},
)


add_endpoint(
    name="Get notifications",
    module="NOTIFICATION",
    method="GET",
    path="/api/notifications?page=1&limit=10&isRead=false",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "data": [], "pagination": {"page": 1, "limit": 10}},
    error={"success": False, "message": "Failed to get notifications"},
)

add_endpoint(
    name="Get unread count",
    module="NOTIFICATION",
    method="GET",
    path="/api/notifications/unread-count",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "count": 0},
    error={"success": False, "message": "Failed to get unread count"},
)

add_endpoint(
    name="Mark all as read",
    module="NOTIFICATION",
    method="PUT",
    path="/api/notifications/read-all",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "message": "Marked all as read", "count": 10},
    error={"success": False, "message": "Failed to mark all as read"},
)

add_endpoint(
    name="Mark notification as read",
    module="NOTIFICATION",
    method="PUT",
    path="/api/notifications/{{notificationId}}/read",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "message": "Marked as read"},
    error={"success": False, "message": "Notification not found"},
)

add_endpoint(
    name="Delete notification",
    module="NOTIFICATION",
    method="DELETE",
    path="/api/notifications/{{notificationId}}",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "message": "Notification deleted"},
    error={"success": False, "message": "Notification not found"},
)


add_endpoint(
    name="Search patients",
    module="SEARCH",
    method="POST",
    path="/api/search/patients",
    roles=ADMIN_DOCTOR_RECEPTIONIST,
    auth=True,
    body=json_body({"keyword": "patient", "gender": "MALE", "page": 1, "limit": 10}),
    success={"success": True, "message": "Patients search completed successfully", "data": [], "pagination": {"page": 1, "limit": 10}},
    error={"success": False, "message": "Invalid date format in filters"},
)

add_endpoint(
    name="Search appointments",
    module="SEARCH",
    method="POST",
    path="/api/search/appointments",
    roles=ADMIN_DOCTOR_RECEPTIONIST,
    auth=True,
    body=json_body({"keyword": "patient", "status": "WAITING", "doctorId": "{{doctorId}}", "page": 1, "limit": 10}),
    success={"success": True, "message": "Appointments search completed successfully", "data": [], "pagination": {"page": 1, "limit": 10}},
    error={"success": False, "message": "Invalid date format in filters"},
)

add_endpoint(
    name="Search invoices",
    module="SEARCH",
    method="POST",
    path="/api/search/invoices",
    roles=ADMIN_RECEPTIONIST,
    auth=True,
    body=json_body({"keyword": "INV", "paymentStatus": "UNPAID", "page": 1, "limit": 10}),
    success={"success": True, "message": "Invoices search completed successfully", "data": [], "pagination": {"page": 1, "limit": 10}},
    error={"success": False, "message": "Invalid date format in filters"},
)


add_endpoint(
    name="Get specialties",
    module="SPECIALTY",
    method="GET",
    path="/api/specialties",
    roles=ALL,
    auth=False,
    body=None,
    success={"success": True, "data": []},
    error={"success": False, "message": "Get specialties failed"},
)

add_endpoint(
    name="Get doctors by specialty",
    module="SPECIALTY",
    method="GET",
    path="/api/specialties/{{specialtyId}}/doctors",
    roles=ALL,
    auth=False,
    body=None,
    success={"success": True, "message": "Doctors retrieved successfully", "data": {"doctors": []}},
    error={"success": False, "message": "Specialty not found"},
)


add_endpoint(
    name="Calculate payroll",
    module="PAYROLL",
    method="POST",
    path="/api/payrolls/calculate",
    roles=ADMIN_ONLY,
    auth=True,
    body=json_body({"userId": "{{userId}}", "month": 1, "year": 2026, "calculateAll": False}),
    success={"success": True, "message": "Payroll calculated successfully", "data": {"id": 1}},
    error={"success": False, "message": "month and year are required"},
)

add_endpoint(
    name="Get payroll statistics",
    module="PAYROLL",
    method="GET",
    path="/api/payrolls/statistics?month=1&year=2026",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "Payroll statistics retrieved successfully", "data": {}},
    error={"success": False, "message": "Failed to retrieve statistics"},
)

add_endpoint(
    name="Get my payrolls",
    module="PAYROLL",
    method="GET",
    path="/api/payrolls/my",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "message": "Your payrolls retrieved successfully", "data": []},
    error={"success": False, "message": "Failed to retrieve payrolls"},
)

add_endpoint(
    name="Get payrolls by period",
    module="PAYROLL",
    method="GET",
    path="/api/payrolls/period?month=1&year=2026",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "Payrolls for period retrieved successfully", "data": [], "pagination": {}},
    error={"success": False, "message": "Both month and year are required"},
)

add_endpoint(
    name="Get doctor payrolls",
    module="PAYROLL",
    method="GET",
    path="/api/payrolls/doctor/{{doctorId}}",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "Doctor payrolls retrieved successfully", "data": []},
    error={"success": False, "message": "Doctor not found"},
)

add_endpoint(
    name="Get user payroll history",
    module="PAYROLL",
    method="GET",
    path="/api/payrolls/user/{{userId}}",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "message": "Payroll history retrieved successfully", "data": []},
    error={"success": False, "message": "You can only view your own payroll history"},
    notes=["Authorization check inside controller"],
)

add_endpoint(
    name="Get payrolls",
    module="PAYROLL",
    method="GET",
    path="/api/payrolls?page=1&limit=10",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "Payrolls retrieved successfully", "data": [], "pagination": {"page": 1, "limit": 10}},
    error={"success": False, "message": "Failed to retrieve payrolls"},
)

add_endpoint(
    name="Get payroll by ID",
    module="PAYROLL",
    method="GET",
    path="/api/payrolls/{{payrollId}}",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "message": "Payroll retrieved successfully", "data": {"id": 1}},
    error={"success": False, "message": "Payroll not found"},
    notes=["Authorization check inside controller"],
)

add_endpoint(
    name="Approve payroll",
    module="PAYROLL",
    method="PUT",
    path="/api/payrolls/{{payrollId}}/approve",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "Payroll approved successfully", "data": {"id": 1}},
    error={"success": False, "message": "Failed to approve payroll"},
)

add_endpoint(
    name="Pay payroll",
    module="PAYROLL",
    method="PUT",
    path="/api/payrolls/{{payrollId}}/pay",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "Payroll marked as paid successfully", "data": {"id": 1}},
    error={"success": False, "message": "Failed to mark payroll as paid"},
)

add_endpoint(
    name="Export payroll PDF",
    module="PAYROLL",
    method="GET",
    path="/api/payrolls/{{payrollId}}/pdf",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "message": "PDF generated"},
    error={"success": False, "message": "Failed to export PDF"},
    notes=["Returns application/pdf on success", "Authorization check inside controller"],
)


add_endpoint(
    name="Get all permissions",
    module="PERMISSION",
    method="GET",
    path="/api/permissions",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "Permissions retrieved successfully", "data": {"all": []}},
    error={"success": False, "message": "Failed to get permissions"},
)

add_endpoint(
    name="Get modules with permissions",
    module="PERMISSION",
    method="GET",
    path="/api/permissions/modules",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "Modules with permissions retrieved successfully", "data": []},
    error={"success": False, "message": "Failed to get modules"},
)

add_endpoint(
    name="Get role permissions",
    module="PERMISSION",
    method="GET",
    path="/api/permissions/role/{{roleId}}",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "Role permissions retrieved successfully", "data": {"role": {"id": 1}, "permissions": []}},
    error={"success": False, "message": "Role not found"},
)

add_endpoint(
    name="Assign permissions to role",
    module="PERMISSION",
    method="POST",
    path="/api/permissions/role/{{roleId}}/assign",
    roles=ADMIN_ONLY,
    auth=True,
    body=json_body({"permissionIds": [1, 2, 3]}),
    success={"success": True, "message": "Permissions assigned successfully", "data": {"role": {"id": 1}, "permissions": []}},
    error={"success": False, "message": "permissionIds must be an array"},
)

add_endpoint(
    name="Add permission to role",
    module="PERMISSION",
    method="POST",
    path="/api/permissions/role/{{roleId}}/add",
    roles=ADMIN_ONLY,
    auth=True,
    body=json_body({"permissionId": 1}),
    success={"success": True, "message": "Permission added successfully", "data": {"roleId": 1}},
    error={"success": False, "message": "permissionId is required"},
)

add_endpoint(
    name="Remove permission from role",
    module="PERMISSION",
    method="DELETE",
    path="/api/permissions/role/{{roleId}}/remove/{{permissionId}}",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "Permission removed successfully"},
    error={"success": False, "message": "Permission not found for this role"},
)

add_endpoint(
    name="Create permission",
    module="PERMISSION",
    method="POST",
    path="/api/permissions",
    roles=ADMIN_ONLY,
    auth=True,
    body=json_body({"name": "medicines.view", "description": "View medicines", "module": "medicines"}),
    success={"success": True, "message": "Permission created successfully", "data": {"id": 1}},
    error={"success": False, "message": "name and module are required"},
)

add_endpoint(
    name="Delete permission",
    module="PERMISSION",
    method="DELETE",
    path="/api/permissions/{{permissionId}}",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "Permission deleted successfully"},
    error={"success": False, "message": "Permission not found"},
)


add_endpoint(
    name="Dashboard stats",
    module="ADMIN",
    method="GET",
    path="/api/dashboard/stats",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "data": {}},
    error={"success": False, "message": "Failed to get dashboard stats"},
)

add_endpoint(
    name="Dashboard appointments by date",
    module="ADMIN",
    method="GET",
    path="/api/dashboard/appointments/2026-02-01",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "data": []},
    error={"success": False, "message": "Failed to get dashboard appointments"},
)

add_endpoint(
    name="Dashboard overview",
    module="ADMIN",
    method="GET",
    path="/api/dashboard/overview",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "data": {}},
    error={"success": False, "message": "Failed to get dashboard overview"},
)

add_endpoint(
    name="Dashboard recent activities",
    module="ADMIN",
    method="GET",
    path="/api/dashboard/recent-activities",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "data": []},
    error={"success": False, "message": "Failed to get recent activities"},
)

add_endpoint(
    name="Dashboard quick stats",
    module="ADMIN",
    method="GET",
    path="/api/dashboard/quick-stats",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "data": {}},
    error={"success": False, "message": "Failed to get quick stats"},
)

add_endpoint(
    name="Dashboard alerts",
    module="ADMIN",
    method="GET",
    path="/api/dashboard/alerts",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "data": []},
    error={"success": False, "message": "Failed to get alerts"},
)

add_endpoint(
    name="Dashboard summary",
    module="ADMIN",
    method="GET",
    path="/api/dashboard",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "data": {}},
    error={"success": False, "message": "Failed to get dashboard data"},
)

add_endpoint(
    name="Get audit logs",
    module="ADMIN",
    method="GET",
    path="/api/audit-logs?page=1&limit=20",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "Audit logs retrieved successfully", "data": [], "pagination": {"page": 1, "limit": 20}},
    error={"success": False, "message": "Failed to retrieve audit logs"},
)

add_endpoint(
    name="Get audit trail by record",
    module="ADMIN",
    method="GET",
    path="/api/audit-logs/{{tableName}}/{{recordId}}",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "Audit trail retrieved successfully", "data": []},
    error={"success": False, "message": "Failed to retrieve audit trail"},
)

add_endpoint(
    name="Get user activity logs",
    module="ADMIN",
    method="GET",
    path="/api/audit-logs/user/{{userId}}?limit=50",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "User activity retrieved successfully", "data": []},
    error={"success": False, "message": "Failed to retrieve user activity"},
)

add_endpoint(
    name="Get my audit logs",
    module="ADMIN",
    method="GET",
    path="/api/audit-logs/me?limit=50",
    roles=ALL,
    auth=True,
    body=None,
    success={"success": True, "message": "Your activity retrieved successfully", "data": []},
    error={"success": False, "message": "Failed to retrieve your activity"},
)

add_endpoint(
    name="Revenue report",
    module="ADMIN",
    method="GET",
    path="/api/reports/revenue?year=2026&month=1",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "Revenue report retrieved successfully", "data": {}},
    error={"success": False, "message": "Failed to get revenue report"},
)

add_endpoint(
    name="Appointment report",
    module="ADMIN",
    method="GET",
    path="/api/reports/appointments?year=2026&month=1",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "Appointment report retrieved successfully", "data": {}},
    error={"success": False, "message": "Failed to get appointment report"},
)

add_endpoint(
    name="Patient statistics report",
    module="ADMIN",
    method="GET",
    path="/api/reports/patient-statistics",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "Patient statistics retrieved successfully", "data": {}},
    error={"success": False, "message": "Failed to get patient statistics"},
)

add_endpoint(
    name="Expense report",
    module="ADMIN",
    method="GET",
    path="/api/reports/expense?year=2026&month=1",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "Expense report retrieved successfully", "data": {}},
    error={"success": False, "message": "Failed to get expense report"},
)

add_endpoint(
    name="Top medicines report",
    module="ADMIN",
    method="GET",
    path="/api/reports/top-medicines?year=2026&month=1&limit=10",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "Top medicines report retrieved successfully", "data": {}},
    error={"success": False, "message": "Failed to get top medicines report"},
)

add_endpoint(
    name="Medicine alerts report",
    module="ADMIN",
    method="GET",
    path="/api/reports/medicine-alerts?daysUntilExpiry=30&minStock=10",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "Medicine alerts report retrieved successfully", "data": {}},
    error={"success": False, "message": "Failed to get medicine alerts report"},
)

add_endpoint(
    name="Patients by gender report",
    module="ADMIN",
    method="GET",
    path="/api/reports/patients-by-gender",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "Patients by gender report retrieved successfully", "data": {}},
    error={"success": False, "message": "Failed to get patients by gender report"},
)

add_endpoint(
    name="Profit report",
    module="ADMIN",
    method="GET",
    path="/api/reports/profit?year=2026&month=1",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "Profit report retrieved successfully", "data": {}},
    error={"success": False, "message": "Failed to get profit report"},
)

add_endpoint(
    name="Revenue report PDF",
    module="ADMIN",
    method="GET",
    path="/api/reports/revenue/pdf?year=2026&month=1",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "PDF generated"},
    error={"success": False, "message": "Failed to get revenue report"},
    notes=["Returns application/pdf on success"],
)

add_endpoint(
    name="Expense report PDF",
    module="ADMIN",
    method="GET",
    path="/api/reports/expense/pdf?year=2026&month=1",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "PDF generated"},
    error={"success": False, "message": "Failed to get expense report"},
    notes=["Returns application/pdf on success"],
)

add_endpoint(
    name="Profit report PDF",
    module="ADMIN",
    method="GET",
    path="/api/reports/profit/pdf?year=2026&month=1",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "PDF generated"},
    error={"success": False, "message": "Failed to get profit report"},
    notes=["Returns application/pdf on success"],
)

add_endpoint(
    name="Top medicines report PDF",
    module="ADMIN",
    method="GET",
    path="/api/reports/top-medicines/pdf?year=2026&month=1&limit=10",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "PDF generated"},
    error={"success": False, "message": "Failed to get top medicines report"},
    notes=["Returns application/pdf on success"],
)

add_endpoint(
    name="Patients by gender report PDF",
    module="ADMIN",
    method="GET",
    path="/api/reports/patients-by-gender/pdf",
    roles=ADMIN_ONLY,
    auth=True,
    body=None,
    success={"success": True, "message": "PDF generated"},
    error={"success": False, "message": "Failed to get patients by gender report"},
    notes=["Returns application/pdf on success"],
)


def build_collection():
    collection = {
        "info": {
            "name": "DemoApp Backend API (Role-based)",
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
            "description": "Role-based Postman collection grouped by module. Use environment variables for baseUrl and tokens.",
        },
        "item": [],
    }

    roles_in_order = [ROLE_ADMIN, ROLE_DOCTOR, ROLE_RECEPTIONIST, ROLE_PATIENT]

    for role in roles_in_order:
        role_folder = {
            "name": role,
            "description": f"Requests available for role: {role}",
            "item": [],
        }

        for module in MODULE_ORDER:
            module_items = []
            for endpoint in endpoints:
                if endpoint["module"] != module:
                    continue
                if role not in endpoint["roles"]:
                    continue

                raw_url = "{{baseUrl}}" + endpoint["path"]
                headers = build_headers(endpoint["auth"], endpoint["body"])
                description = make_description(
                    endpoint["method"],
                    raw_url,
                    headers,
                    endpoint["body"],
                    endpoint["success"],
                    endpoint["error"],
                    endpoint["notes"],
                )

                request = {
                    "method": endpoint["method"],
                    "url": raw_url,
                    "description": description,
                }
                if headers:
                    request["header"] = headers
                if endpoint["body"]:
                    request["body"] = endpoint["body"]

                item = {"name": endpoint["name"], "request": request}
                event = build_event(extra_tests=endpoint["tests"], skip=endpoint["skip_tests"])
                if event:
                    item["event"] = event

                module_items.append(item)

            if module_items or module == "SYSTEM":
                module_folder = {"name": module, "item": module_items}
                if module == "SYSTEM":
                    module_folder["description"] = "Chua trien khai"
                role_folder["item"].append(module_folder)

        collection["item"].append(role_folder)

    return collection


def build_environment():
    return {
        "name": "DemoApp Backend (local)",
        "values": [
            {"key": "baseUrl", "value": "http://localhost:3000", "type": "default", "enabled": True},
            {"key": "accessToken", "value": "", "type": "secret", "enabled": True},
            {"key": "refreshToken", "value": "", "type": "secret", "enabled": True},
            {"key": "userId", "value": "", "type": "default", "enabled": True},
            {"key": "doctorId", "value": "", "type": "default", "enabled": True},
            {"key": "patientId", "value": "", "type": "default", "enabled": True},
            {"key": "appointmentId", "value": "1", "type": "default", "enabled": True},
            {"key": "visitId", "value": "1", "type": "default", "enabled": True},
            {"key": "invoiceId", "value": "1", "type": "default", "enabled": True},
            {"key": "prescriptionId", "value": "1", "type": "default", "enabled": True},
            {"key": "medicineId", "value": "1", "type": "default", "enabled": True},
            {"key": "shiftId", "value": "1", "type": "default", "enabled": True},
            {"key": "doctorShiftId", "value": "1", "type": "default", "enabled": True},
            {"key": "payrollId", "value": "1", "type": "default", "enabled": True},
            {"key": "roleId", "value": "1", "type": "default", "enabled": True},
            {"key": "permissionId", "value": "1", "type": "default", "enabled": True},
            {"key": "specialtyId", "value": "1", "type": "default", "enabled": True},
            {"key": "attendanceId", "value": "1", "type": "default", "enabled": True},
            {"key": "notificationId", "value": "1", "type": "default", "enabled": True},
            {"key": "tableName", "value": "appointments", "type": "default", "enabled": True},
            {"key": "recordId", "value": "1", "type": "default", "enabled": True},
        ],
        "_postman_variable_scope": "environment",
        "_postman_exported_at": datetime.utcnow().isoformat() + "Z",
        "_postman_exported_using": "Postman/10.x",
    }


def main():
    output_dir = "postman"
    os.makedirs(output_dir, exist_ok=True)

    collection = build_collection()
    collection_path = os.path.join(output_dir, "DemoApp.postman_collection.json")
    with open(collection_path, "w", encoding="ascii") as f:
        json.dump(collection, f, ensure_ascii=True, indent=2)

    env = build_environment()
    env_path = os.path.join(output_dir, "DemoApp.postman_environment.json")
    with open(env_path, "w", encoding="ascii") as f:
        json.dump(env, f, ensure_ascii=True, indent=2)

    print("Wrote:", collection_path)
    print("Wrote:", env_path)


if __name__ == "__main__":
    main()
