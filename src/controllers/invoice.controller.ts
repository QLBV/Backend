import { Request, Response } from "express";
import Invoice, { InvoiceStatus, PaymentMethod } from "../models/Invoice";

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const { appointmentId, patientId, doctorId, total, paymentMethod, note } =
      req.body;
    const invoice = await Invoice.create({
      appointmentId,
      patientId,
      doctorId,
      total,
      paymentMethod,
      status: InvoiceStatus.UNPAID,
      note,
    });
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: "Error creating invoice", error });
  }
};

export const getAllInvoices = async (req: Request, res: Response) => {
  try {
    const invoices = await Invoice.findAll();
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: "Error fetching invoices", error });
  }
};

export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findByPk(id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: "Error fetching invoice", error });
  }
};

export const updateInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { total, paymentMethod, status, note } = req.body;
    const invoice = await Invoice.findByPk(id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    invoice.total = total ?? invoice.total;
    invoice.paymentMethod = paymentMethod ?? invoice.paymentMethod;
    invoice.status = status ?? invoice.status;
    invoice.note = note ?? invoice.note;
    await invoice.save();
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: "Error updating invoice", error });
  }
};

export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findByPk(id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    await invoice.destroy();
    res.json({ message: "Invoice deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting invoice", error });
  }
};
