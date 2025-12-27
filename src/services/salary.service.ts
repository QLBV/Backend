import Salary, { SalaryStatus } from "../models/Salary";
import Doctor from "../models/Doctor";
import Invoice from "../models/Invoice";
import { Op } from "sequelize";

export const calculateDoctorSalary = async (
  doctorId: number,
  month: number,
  year: number,
  bonus: number = 0,
  penalty: number = 0,
  note?: string
) => {
  const doctor = await Doctor.findByPk(doctorId);
  if (!doctor) throw new Error("DOCTOR_NOT_FOUND");
  const baseSalary = doctor.baseSalary || 0;

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  const paidInvoices = await Invoice.findAll({
    where: {
      doctorId,
      status: "PAID",
      createdAt: { [Op.between]: [startDate, endDate] },
    },
  });
  const invoiceTotal = paidInvoices.reduce(
    (sum, inv) => sum + (inv.total || 0),
    0
  );

  const total = baseSalary + invoiceTotal + bonus - penalty;

  const [salary, created] = await Salary.findOrCreate({
    where: { doctorId, month, year },
    defaults: {
      doctorId,
      month,
      year,
      baseSalary,
      bonus,
      penalty,
      total,
      status: SalaryStatus.PENDING,
      note,
    },
  });
  if (!created) {
    salary.baseSalary = baseSalary;
    salary.bonus = bonus;
    salary.penalty = penalty;
    salary.total = total;
    salary.note = note;
    salary.status = SalaryStatus.PENDING;
    await salary.save();
  }
  return salary;
};

export const getDoctorSalaries = async (doctorId: number) => {
  return Salary.findAll({
    where: { doctorId },
    order: [
      ["year", "DESC"],
      ["month", "DESC"],
    ],
  });
};

export const getSalaryById = async (id: number) => {
  return Salary.findByPk(id);
};

export const updateSalaryStatus = async (id: number, status: SalaryStatus) => {
  const salary = await Salary.findByPk(id);
  if (!salary) throw new Error("SALARY_NOT_FOUND");
  salary.status = status;
  await salary.save();
  return salary;
};
