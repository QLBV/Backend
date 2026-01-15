
const { Invoice, Visit, Appointment, Patient, Doctor, Shift, User, sequelize } = require('../dist/models');
const { Op } = require('sequelize');

async function seedRealtimeData() {
  const transaction = await sequelize.transaction();
  try {
    const patients = await Patient.findAll();
    const doctors = await Doctor.findAll();
    const shift = await Shift.findOne();
    
    if (patients.length === 0 || doctors.length === 0 || !shift) {
      console.log('Missing data to seed (patients, doctors or shifts).');
      return;
    }

    console.log('Seed: Generating data for the last 7 days...');

    for (let dayOffset = 0; dayOffset <= 6; dayOffset++) {
      const date = new Date();
      date.setDate(date.getDate() - dayOffset);
      date.setHours(0, 0, 0, 0);

      
      const count = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const apt = await Appointment.create({
          appointmentCode: `APT-${date.getTime()}-${dayOffset}-${i}`,
          patientId: patients[i % patients.length].id,
          doctorId: doctors[i % doctors.length].id,
          shiftId: shift.id,
          date: date,
          slotNumber: i + 1,
          status: 'COMPLETED',
          bookingType: 'ONLINE',
          bookedBy: 'PATIENT'
        }, { transaction });

        const visit = await Visit.create({
          visitCode: `VIS-${date.getTime()}-${dayOffset}-${i}`,
          appointmentId: apt.id,
          patientId: apt.patientId,
          doctorId: apt.doctorId,
          checkInTime: date,
          status: 'COMPLETED'
        }, { transaction });

        await Invoice.create({
          invoiceCode: `INV-${date.getTime()}-${dayOffset}-${i}`,
          patientId: visit.patientId,
          doctorId: visit.doctorId,
          visitId: visit.id,
          totalAmount: 200000 + Math.floor(Math.random() * 500000),
          paymentStatus: 'PAID',
          paymentMethod: 'CASH',
          createdBy: 1,
          createdAt: date 
        }, { transaction });
      }
    }

    await transaction.commit();
    console.log(' Realtime dashboard data (7 days) seeded successfully!');
  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error(' Failed to seed realtime data:', err);
  } finally {
    process.exit();
  }
}

seedRealtimeData();
