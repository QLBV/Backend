// @ts-nocheck
import { fakerVI as faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import {
  sequelize,
  User, Role,
  Patient, PatientProfile, Doctor, Specialty,
  Shift, DoctorShift, Appointment,
  Medicine, MedicineImport, MedicineExport,
  DiseaseCategory, Visit, Diagnosis,
  Prescription, PrescriptionDetail,
  Invoice, InvoiceItem, Payment,
  Employee, Notification, AuditLog
} from '../src/models';

const TABLES_TO_TRUNCATE = [
  'payments', 'invoice_items', 'invoices', 'refunds', 'prescriptions', 'prescription_details', 
  'diagnoses', 'visits', 'appointments', 'patient_profiles', 'patients', 'doctor_shifts', 
  'doctors', 'employees', 'medicine_imports', 'medicine_exports', 
  'attendances', 'payrolls', 'notifications', 'audit_logs',
  'users', 
  'medicines', 'disease_categories', 'specialties', 'roles', 'shifts'
];

async function seed() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🚀 Starting Data Seeding...');
    await sequelize.authenticate();
    console.log('✅ Database connected.');

    // 1. Clean Data
    console.log('🧹 Cleaning old data...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });
    for (const table of TABLES_TO_TRUNCATE) {
        try {
            await sequelize.query(`TRUNCATE TABLE ${table}`, { transaction });
        } catch (e) {
            console.log(`⚠️  Could not truncate ${table}, skipping...`);
        }
    }
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });

    // 2. Base Data
    console.log('🌱 Seeding Roles...');
    const rolesData = [
      { id: 1, name: 'ADMIN', description: 'Quản trị viên' },
      { id: 2, name: 'RECEPTIONIST', description: 'Lễ tân' },
      { id: 3, name: 'PATIENT', description: 'Bệnh nhân' },
      { id: 4, name: 'DOCTOR', description: 'Bác sĩ' },
      { id: 5, name: 'PHARMACIST', description: 'Dược sĩ' },
      { id: 6, name: 'NURSE', description: 'Y tá' },
      { id: 7, name: 'ACCOUNTANT', description: 'Kế toán' },
    ];
    for (const r of rolesData) {
        await Role.create(r, { transaction });
    }

    console.log('🌱 Seeding Shifts...');
    const shiftsData = [
      { id: 1, name: 'Sáng', startTime: '07:00', endTime: '11:30' },
      { id: 2, name: 'Chiều', startTime: '13:30', endTime: '17:00' },
      { id: 3, name: 'Tối', startTime: '17:30', endTime: '21:00' },
    ];
    for(const s of shiftsData) {
        await Shift.create(s, { transaction });
    }

    console.log('🌱 Seeding Specialties...');
    const createdSpecialties = [];
    for(let i=1; i<=10; i++) {
        const s = await Specialty.create({
            name: i <= 15 ? [
                'Tim mạch', 'Nội khoa', 'Ngoại khoa', 'Nhi khoa', 'Sản phụ khoa', 
                'Da liễu', 'Mắt', 'Tai Mũi Họng', 'Răng Hàm Mặt', 'Thần kinh'
            ][i-1] : `Chuyên khoa ${i}`,
            description: faker.lorem.sentence()
        }, { transaction });
        createdSpecialties.push(s);
    }

    console.log('🌱 Seeding Disease Categories...');
    const createdDiseaseCats = [];
    for(let i=1; i<=50; i++) {
        const d = await DiseaseCategory.create({
            code: 'DC' + faker.string.alphanumeric(5).toUpperCase(),
            name: faker.science.chemicalElement().name + ' Disease', 
            description: faker.lorem.sentence()
        }, { transaction });
        createdDiseaseCats.push(d);
    }

    console.log('🌱 Seeding Medicines...');
    const createdMedicines = [];
    for(let i=1; i<=60; i++) {
        const importPrice = parseFloat(faker.commerce.price({ min: 10000, max: 500000 }));
        const m = await Medicine.create({
            medicineCode: 'MED' + faker.string.alphanumeric(6).toUpperCase(),
            name: faker.commerce.productName(),
            group: faker.helpers.arrayElement(['Kháng sinh', 'Giảm đau', 'Vitamin', 'Thực phẩm chức năng', 'Tim mạch']),
            activeIngredient: faker.lorem.word(),
            usage: faker.lorem.sentence(),
            description: faker.commerce.productDescription(),
            unit: faker.helpers.arrayElement(['VIEN', 'HOP', 'CHAI', 'TUYP', 'GOI']),
            importPrice: importPrice,
            salePrice: importPrice * 1.2,
            quantity: faker.number.int({ min: 100, max: 1000 }),
            minStockLevel: 20,
            status: 'ACTIVE',
            manufacturer: faker.company.name(),
            expiryDate: faker.date.future()
        }, { transaction });
        createdMedicines.push(m);
    }

    // 3. Users & Profiles
    console.log('🌱 Seeding Users...');
    const passwordHash = await bcrypt.hash('123456', 10);
    const createdUsers = [];
    
    // Helper to create user
    const createUser = async (roleId, prefix) => {
        return User.create({
            email: `${prefix}${faker.string.alphanumeric(8)}@demo.com`,
            password: passwordHash,
            fullName: faker.person.fullName(),
            roleId: roleId,
            isActive: true
        }, { transaction });
    };

    // Admin
    const admin = await User.create({ email: 'admin@demo.com', password: passwordHash, fullName: 'Admin User', roleId: 1, isActive: true }, { transaction });
    createdUsers.push(admin);

    // Doctors (15)
    const createdDoctors = [];
    for(let i=0; i<15; i++) {
        const u = await createUser(4, 'doctor');
        createdUsers.push(u);
        const doc = await Doctor.create({
            userId: u.id,
            doctorCode: 'DOC' + faker.string.numeric(5),
            specialtyId: faker.helpers.arrayElement(createdSpecialties).id,
            position: 'Bác sĩ chuyên khoa',
            degree: faker.helpers.arrayElement(['Thạc sĩ', 'Tiến sĩ', 'CKI', 'CKII']),
            description: faker.lorem.sentence(),
            price: 500000
        }, { transaction });
        createdDoctors.push(doc);
        
        // Also add employee record
        await Employee.create({
            userId: u.id,
            employeeCode: 'EMP' + faker.string.numeric(5),
            position: 'Bác sĩ',
            joiningDate: faker.date.past(),
            phone: faker.phone.number(),
            gender: faker.person.sex(),
            dateOfBirth: faker.date.birthdate(),
            address: faker.location.streetAddress(),
            cccd: faker.string.numeric(12)
        }, { transaction });
    }

    // Staff (Receptionist -> 2)
    for(let i=0; i<10; i++) {
        const u = await createUser(2, 'staff');
        createdUsers.push(u);
        await Employee.create({
            userId: u.id,
            employeeCode: 'EMP' + faker.string.numeric(5),
            position: 'Lễ tân',
            joiningDate: faker.date.past(),
            phone: faker.phone.number(),
            gender: faker.person.sex(),
            dateOfBirth: faker.date.birthdate(),
            address: faker.location.streetAddress(),
            cccd: faker.string.numeric(12)
        }, { transaction });
    }

    // Patients (50)
    const createdPatients = [];
    for(let i=0; i<50; i++) {
        const u = await createUser(3, 'patient');
        createdUsers.push(u);
        const p = await Patient.create({
            userId: u.id,
            patientCode: 'PAT' + faker.string.numeric(6),
            fullName: u.fullName,
            gender: faker.person.sex(), 
            dateOfBirth: faker.date.birthdate(),
            cccd: faker.string.numeric(12),
            phone: faker.phone.number(), 
            address: faker.location.streetAddress()
        }, { transaction });
        createdPatients.push(p);

        await PatientProfile.create({
            patientId: p.id,
            type: 'phone',
            value: faker.phone.number(),
            isPrimary: true
        }, { transaction });
    }

    // 4. Operational Data
    console.log('🌱 Seeding Doctor Shifts...');
    const createdDocShifts = [];
    const today = new Date();
    // For each doctor, generate shifts for next 15 days
    for(const doc of createdDoctors) {
        for(let d=0; d<15; d++) {
            const date = new Date(today);
            date.setDate(date.getDate() + d);
            const dateStr = date.toISOString().split('T')[0];
            const ds = await DoctorShift.create({
                doctorId: doc.id,
                shiftId: faker.number.int({ min: 1, max: 3 }),
                workDate: dateStr,
                status: 'ACTIVE',
                // maxSlots: 20 // Removed as it is not in the model
            }, { transaction });
            createdDocShifts.push(ds);
        }
    }

    console.log('🌱 Seeding Appointments...');
    const createdAppointments = [];
    for(let i=0; i<200; i++) {
        const docShift = faker.helpers.arrayElement(createdDocShifts);
        try {
            const apt = await Appointment.create({
                 appointmentCode: 'APT' + faker.string.alphanumeric(8).toUpperCase(),
                 patientId: faker.helpers.arrayElement(createdPatients).id,
                 doctorId: docShift.doctorId,
                 shiftId: docShift.shiftId,
                 date: docShift.workDate, 
                 slotNumber: faker.number.int({ min: 1, max: 20 }),
                 bookingType: faker.helpers.arrayElement(['ONLINE', 'OFFLINE']),
                 bookedBy: faker.helpers.arrayElement(['PATIENT', 'RECEPTIONIST']),
                 status: faker.helpers.arrayElement(['COMPLETED', 'WAITING', 'CANCELLED']),
                 symptomInitial: faker.lorem.sentence()
            }, { transaction });
            createdAppointments.push(apt);
        } catch (e) {
            console.log('Skipping duplicate appointment or error: ' + e.message);
        }
    }
    
    const completedAppointments = createdAppointments.filter(a => a.status === 'COMPLETED');

    console.log('🌱 Seeding Visits & Invoices...');
    
    for(const apt of completedAppointments) {
      try {
        // Visit
        const visit = await Visit.create({
            visitCode: 'VIS' + faker.string.alphanumeric(8).toUpperCase(),
            patientId: apt.patientId,
            doctorId: apt.doctorId,
            appointmentId: apt.id,
            checkInTime: new Date(apt.date),
            status: 'COMPLETED',
            symptoms: apt.symptomInitial || faker.lorem.sentence(),
            diagnosis: faker.lorem.sentence(),
            notes: faker.lorem.paragraph(),
            diseaseCategoryId: faker.helpers.arrayElement(createdDiseaseCats).id,
            vitalSigns: {
                weight: faker.number.int({ min: 40, max: 100 }),
                height: faker.number.int({ min: 150, max: 190 }),
                bloodPressure: '120/80',
                heartRate: faker.number.int({ min: 60, max: 100 })
            }
        }, { transaction });

        // Diagnosis
        await Diagnosis.create({
            visitId: visit.id,
            diseaseCategoryId: visit.diseaseCategoryId,
            icd10Code: 'ICD-' + faker.string.numeric(4),
            diagnosisDetail: faker.lorem.paragraph(),
            severity: faker.helpers.arrayElement(['MILD', 'MODERATE', 'SEVERE']),
            note: faker.lorem.sentence()
        }, { transaction });

        // Prescription
        const prescription = await Prescription.create({
            prescriptionCode: 'PRE' + faker.string.alphanumeric(8).toUpperCase(),
            visitId: visit.id,
            doctorId: apt.doctorId,
            patientId: apt.patientId,
            diagnosis: visit.diagnosis,
            notes: faker.lorem.sentence()
        }, { transaction });

        // Prescription Details
        const detailsCount = faker.number.int({ min: 1, max: 3 });
        let totalMedPrice = 0;
        for(let k=0; k<detailsCount; k++) {
            const med = faker.helpers.arrayElement(createdMedicines);
            if (!med) continue;
            
            const qty = faker.number.int({ min: 1, max: 20 });
            const price = Number(med.salePrice) || 10000;
            const name = (med.name || 'Medicine name').substring(0, 190);
            const unit = (med.unit || 'Viên').substring(0, 40);
            
            await PrescriptionDetail.create({
                prescriptionId: prescription.id,
                medicineId: med.id,
                medicineName: name,
                unit: unit,
                unitPrice: price, 
                quantity: qty,
                dosageMorning: 1,
                dosageNoon: 0,
                dosageAfternoon: 0,
                dosageEvening: 1,
                instruction: 'Uống sau ăn',
                days: 7
            }, { transaction });
            totalMedPrice += (price * qty);
        }

        // Invoice
        const finalAmt = totalMedPrice + 200000;
        const invoice = await Invoice.create({
            invoiceCode: 'INV' + faker.string.alphanumeric(8).toUpperCase(),
            visitId: visit.id,
            patientId: apt.patientId,
            doctorId: apt.doctorId,
            createdBy: 1, // Admin
            totalAmount: finalAmt,
            discount: 0,
            finalAmount: finalAmt,
            status: faker.helpers.arrayElement(['PAID', 'UNPAID']),
            paymentStatus: faker.helpers.arrayElement(['PAID', 'UNPAID']),
            issuedDate: new Date()
        }, { transaction });
        
        // Invoice Items
        await InvoiceItem.create({
            invoiceId: invoice.id,
            itemType: 'EXAMINATION',
            description: 'Khám bệnh',
            quantity: 1,
            unitPrice: 200000,
            subtotal: 200000
        }, { transaction });

        if (invoice.status === 'PAID') {
            await Payment.create({
                invoiceId: invoice.id,
                amount: invoice.finalAmount,
                paymentMethod: faker.helpers.arrayElement(['CASH', 'BANK_TRANSFER', 'QR_CODE']),
                reference: faker.string.alphanumeric(10), // Was transactionId
                paymentDate: new Date(),
                createdBy: 1
            }, { transaction });
        }
      } catch (err) {
        console.warn(`⚠️ Skipped processing appointment ${apt.id} due to error: ${err.message}`);
      }
    }

    console.log('🌱 Seeding Imports, Logs...');
    // Medicine Imports
    for(let i=0; i<50; i++) {
        await MedicineImport.create({
            importCode: 'IMP' + faker.string.alphanumeric(6).toUpperCase(),
            userId: 1,
            supplier: faker.company.name(), // Was supplierName
            importDate: faker.date.past(),
            note: faker.lorem.sentence(), // Was notes
            medicineId: faker.helpers.arrayElement(createdMedicines).id,
            quantity: 100,
            importPrice: 5000, // Was unitPrice
            batchNumber: faker.string.alphanumeric(6),
            supplierInvoice: faker.string.alphanumeric(10)
        }, { transaction });
    }
    
    // Audit Logs
    for(let i=0; i<50; i++) {
        await AuditLog.create({
            userId: faker.helpers.arrayElement(createdUsers).id,
            action: faker.helpers.arrayElement(['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE']),
            tableName: faker.helpers.arrayElement(['patients', 'appointments', 'prescriptions']), // Was entityType
            recordId: faker.number.int({ min: 1, max: 100 }), // Was entityId
            // details, ipAddress, userAgent might be OK or ignored if loose, but AuditLog has ipAddress/userAgent
            ipAddress: faker.internet.ipv4(),
            userAgent: faker.internet.userAgent()
        }, { transaction });
    }

    // Notifications
    for(let i=0; i<50; i++) {
        await Notification.create({
            userId: faker.helpers.arrayElement(createdUsers).id,
            title: faker.lorem.words(3),
            message: faker.lorem.sentence(),
            type: 'SYSTEM', // Was INFO/WARNING
            isRead: faker.datatype.boolean()
        }, { transaction });
    }

    await transaction.commit();
    console.log('✅ Seeding Completed Successfully!');

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seed();
