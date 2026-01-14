
import { sequelize, User, Medicine, Appointment, Patient, Invoice } from '../src/models';

async function check() {
  await sequelize.authenticate();
  console.log('User count:', await User.count());
  console.log('Medicine count:', await Medicine.count());
  console.log('Patient count:', await Patient.count());
  console.log('Appointment count:', await Appointment.count());
  console.log('Invoice count:', await Invoice.count());
  await sequelize.close();
}
check();
