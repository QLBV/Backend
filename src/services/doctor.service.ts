import Doctor from "../models/Doctor";

export async function generateDoctorCode(): Promise<string> {
  // Lấy doctorCode lớn nhất hiện tại
  const lastDoctor = await Doctor.findOne({
    order: [["doctorCode", "DESC"]],
  });

  let nextNumber = 1;
  if (lastDoctor && lastDoctor.doctorCode) {
    // Lấy số cuối cùng từ mã BS000xxx
    const match = lastDoctor.doctorCode.match(/BS(\d{6})/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  // Format lại mã: BS + 6 số 0
  return `BS${nextNumber.toString().padStart(6, "0")}`;
}

export async function createDoctor(data: {
  userId: number;
  specialtyId: number;
  position?: string;
  degree?: string;
  description?: string;
}) {
  const doctorCode = await generateDoctorCode();
  return Doctor.create({
    doctorCode,
    ...data,
  });
}
