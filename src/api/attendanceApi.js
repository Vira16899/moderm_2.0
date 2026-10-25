import { apiRequest } from "./client";
import { API_ENDPOINTS } from "./endpoints";

const qrDisplayKey = import.meta.env.VITE_QR_DISPLAY_KEY;

export async function generateAttendanceSessions(attendanceDate) {
  const result = await apiRequest(
    API_ENDPOINTS.attendance.generateQr,
    {
      body: {
        attendance_date: attendanceDate,
      },
    }
  );

  return result.data;
}

export async function getAttendanceQrDisplay() {
  const result = await apiRequest(
    API_ENDPOINTS.attendance.displayQr,
    {
      query: { show_all: true },
      headers: qrDisplayKey
        ? { "X-QR-Display-Key": qrDisplayKey }
        : undefined,
      auth: false,
    }
  );

  return result.data || [];
}
