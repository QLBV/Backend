import Invoice, { InvoiceStatus, PaymentMethod } from "../models/Invoice";

export const createInvoiceService = async (data: {
  appointmentId: number;
  patientId: number;
  doctorId: number;
  total: number;
  paymentMethod?: PaymentMethod;
  note?: string;
}) => {
  return await Invoice.create({
    ...data,
    status: InvoiceStatus.UNPAID,
  });
};

export const getAllInvoicesService = async () => {
  return await Invoice.findAll();
};

export const getInvoiceByIdService = async (id: number) => {
  return await Invoice.findByPk(id);
};

export const updateInvoiceService = async (
  id: number,
  data: Partial<{
    total: number;
    paymentMethod: PaymentMethod;
    status: InvoiceStatus;
    note: string;
  }>
) => {
  const invoice = await Invoice.findByPk(id);
  if (!invoice) return null;
  await invoice.update(data);
  return invoice;
};

export const deleteInvoiceService = async (id: number) => {
  const invoice = await Invoice.findByPk(id);
  if (!invoice) return null;
  await invoice.destroy();
  return true;
};
