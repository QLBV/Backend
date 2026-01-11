'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const hashedPassword = await bcrypt.hash('123456', 10);

    console.log('🧹 Cleaning up old data...');
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Delete in order to satisfy FK constraints
    const tables = [
      'payments',
      'invoice_items',
      'invoices',
      'prescriptions',
      'prescription_details',
      'diagnoses',
      'visits',
      'appointments',
      'patient_profiles',
      'patients',
      'doctor_shifts',
      'shifts',
      'doctors',
      'employees',
      'specialties',
      'users',
      'roles'
    ];

    for (const table of tables) {
      await queryInterface.bulkDelete(table, null, { truncate: false, cascade: true });
    }

    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('🌱 Seed [1/7]: Roles');
    await queryInterface.bulkInsert('roles', [
      { id: 1, name: 'ADMIN', description: 'Quản trị viên hệ thống', createdAt: now, updatedAt: now },
      { id: 2, name: 'RECEPTIONIST', description: 'Lễ tân', createdAt: now, updatedAt: now },
      { id: 3, name: 'PATIENT', description: 'Bệnh nhân', createdAt: now, updatedAt: now },
      { id: 4, name: 'DOCTOR', description: 'Bác sĩ', createdAt: now, updatedAt: now },
    ]);

    console.log('🌱 Seed [2/7]: Specialties');
    await queryInterface.bulkInsert('specialties', [
      { id: 1, name: 'Nội khoa', description: 'Chuyên khoa Nội tổng quát', createdAt: now, updatedAt: now },
      { id: 2, name: 'Ngoại khoa', description: 'Chuyên khoa Ngoại tổng quát', createdAt: now, updatedAt: now },
      { id: 3, name: 'Nhi khoa', description: 'Chuyên khoa Nhi', createdAt: now, updatedAt: now },
      { id: 4, name: 'Sản phụ khoa', description: 'Chuyên khoa Sản - Phụ khoa', createdAt: now, updatedAt: now },
      { id: 5, name: 'Tim mạch', description: 'Chuyên khoa Tim mạch', createdAt: now, updatedAt: now },
      { id: 6, name: 'Tai Mũi Họng', description: 'Chuyên khoa Tai Mũi Họng', createdAt: now, updatedAt: now },
    ]);

    console.log('🌱 Seed [3/7]: Users');
    const users = [
      // Admin
      { id: 1, email: 'admin@healthcare.com', password: hashedPassword, fullName: 'Quản Trị Viên', roleId: 1, isActive: 1, createdAt: now, updatedAt: now },
      // Receptionist
      { id: 2, email: 'reception@healthcare.com', password: hashedPassword, fullName: 'Lễ Tân 01', roleId: 2, isActive: 1, createdAt: now, updatedAt: now },
      // Doctors
      { id: 3, email: 'bs.minh@healthcare.com', password: hashedPassword, fullName: 'BS. Lê Quang Minh', roleId: 4, isActive: 1, createdAt: now, updatedAt: now },
      { id: 4, email: 'bs.han@healthcare.com', password: hashedPassword, fullName: 'BS. Dương Hải Hân', roleId: 4, isActive: 1, createdAt: now, updatedAt: now },
      { id: 5, email: 'bs.trang@healthcare.com', password: hashedPassword, fullName: 'BS. Phạm Huyền Trang', roleId: 4, isActive: 1, createdAt: now, updatedAt: now },
      // Patients
      { id: 6, email: 'patient1@gmail.com', password: hashedPassword, fullName: 'Nguyễn Văn An', roleId: 3, isActive: 1, createdAt: now, updatedAt: now },
      { id: 7, email: 'patient2@gmail.com', password: hashedPassword, fullName: 'Trần Thị Bình', roleId: 3, isActive: 1, createdAt: now, updatedAt: now },
    ];
    await queryInterface.bulkInsert('users', users);

    console.log('🌱 Seed [4/9]: Employees (Staff)');
    const employees = [
      {
        id: 1,
        employeeCode: 'ADM0001',
        userId: 1,
        position: 'Quản trị viên',
        joiningDate: '2024-01-01',
        phone: '0901112222',
        gender: 'MALE',
        dateOfBirth: '1980-01-01',
        address: 'Hà Nội',
        cccd: '001080000001',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 2,
        employeeCode: 'REC0002',
        userId: 2,
        position: 'Lễ tân trưởng',
        joiningDate: '2024-01-05',
        phone: '0903334444',
        gender: 'FEMALE',
        dateOfBirth: '1995-05-05',
        address: 'Hồ Chí Minh',
        cccd: '001095000001',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 3,
        employeeCode: 'DOC0003',
        userId: 3,
        specialtyId: 1,
        position: 'Bác sĩ',
        degree: 'Thạc sĩ',
        description: 'Chuyên gia nội khoa với 10 năm kinh nghiệm',
        expertise: 'Điều trị các bệnh lý tim mạch và cao huyết áp bằng phương pháp mới.',
        joiningDate: '2024-01-10',
        phone: '0905556666',
        gender: 'MALE',
        dateOfBirth: '1985-10-10',
        address: 'Đà Nẵng',
        cccd: '048085000001',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 4,
        employeeCode: 'DOC0004',
        userId: 4,
        specialtyId: 5,
        position: 'Trưởng khoa',
        degree: 'Tiến sĩ',
        description: 'Chuyên gia tim mạch hàng đầu',
        expertise: 'Phẫu thuật can thiệp tim mạch, đặt stent.',
        joiningDate: '2024-01-10',
        phone: '0907778888',
        gender: 'FEMALE',
        dateOfBirth: '1975-03-03',
        address: 'Cần Thơ',
        cccd: '092075000001',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 5,
        employeeCode: 'DOC0005',
        userId: 5,
        specialtyId: 6,
        position: 'Bác sĩ',
        degree: 'Bác sĩ',
        description: 'Chuyên khoa Tai Mũi Họng',
        expertise: 'Khám và điều trị viêm xoang, viêm họng hạt.',
        joiningDate: '2024-01-12',
        phone: '0909990000',
        gender: 'FEMALE',
        dateOfBirth: '1990-12-12',
        address: 'Hải Phòng',
        cccd: '031090000001',
        createdAt: now,
        updatedAt: now
      }
    ];
    await queryInterface.bulkInsert('employees', employees);

    console.log('🌱 Seed [5/7]: Doctors (Compatibility Table)');
    const doctors = [
      { id: 1, doctorCode: 'DOC0003', userId: 3, specialtyId: 1, position: 'Bác sĩ', degree: 'Thạc sĩ', description: 'Chuyên gia nội khoa', createdAt: now, updatedAt: now },
      { id: 2, doctorCode: 'DOC0004', userId: 4, specialtyId: 5, position: 'Trưởng khoa', degree: 'Tiến sĩ', description: 'Chuyên gia tim mạch', createdAt: now, updatedAt: now },
      { id: 3, doctorCode: 'DOC0005', userId: 5, specialtyId: 6, position: 'Bác sĩ', degree: 'Bác sĩ', description: 'Chuyên khoa Tai Mũi Họng', createdAt: now, updatedAt: now },
    ];
    await queryInterface.bulkInsert('doctors', doctors);

    console.log('🌱 Seed [7/9]: Patients');
    const patientRecords = [
      { id: 1, patientCode: 'PAT0006', fullName: 'Nguyễn Văn An', gender: 'MALE', dateOfBirth: '1990-05-15', cccd: '001090001234', userId: 6, createdAt: now, updatedAt: now },
      { id: 2, patientCode: 'PAT0007', fullName: 'Trần Thị Bình', gender: 'FEMALE', dateOfBirth: '1985-08-20', cccd: '001085005678', userId: 7, createdAt: now, updatedAt: now },
    ];
    await queryInterface.bulkInsert('patients', patientRecords);

    console.log('🌱 Seed [8/9]: Shifts');
    await queryInterface.bulkInsert('shifts', [
      { id: 1, name: 'Sáng', startTime: '07:00', endTime: '12:00', createdAt: now, updatedAt: now },
      { id: 2, name: 'Chiều', startTime: '13:00', endTime: '17:00', createdAt: now, updatedAt: now },
      { id: 3, name: 'Tối', startTime: '18:00', endTime: '21:00', createdAt: now, updatedAt: now },
    ]);

    console.log('🌱 Seed [9/9]: Doctor Shifts (Next 30 days)');
    const doctorShifts = [];
    const today = new Date();
    today.setHours(0,0,0,0);

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Assign shifts to doctors
      // Doctor 1 (id:3) - Morning, Afternoon
      doctorShifts.push({ doctorId: 1, shiftId: 1, workDate: dateStr, status: 'ACTIVE', createdAt: now, updatedAt: now });
      doctorShifts.push({ doctorId: 1, shiftId: 2, workDate: dateStr, status: 'ACTIVE', createdAt: now, updatedAt: now });
      
      // Doctor 2 (id:4) - Morning, Evening
      doctorShifts.push({ doctorId: 2, shiftId: 1, workDate: dateStr, status: 'ACTIVE', createdAt: now, updatedAt: now });
      doctorShifts.push({ doctorId: 2, shiftId: 3, workDate: dateStr, status: 'ACTIVE', createdAt: now, updatedAt: now });
      
      // Doctor 3 (id:5) - Afternoon, Evening
      doctorShifts.push({ doctorId: 3, shiftId: 2, workDate: dateStr, status: 'ACTIVE', createdAt: now, updatedAt: now });
      doctorShifts.push({ doctorId: 3, shiftId: 3, workDate: dateStr, status: 'ACTIVE', createdAt: now, updatedAt: now });
    }
    await queryInterface.bulkInsert('doctor_shifts', doctorShifts);

    console.log('🌱 Extra: Patient Profiles');
    await queryInterface.bulkInsert('patient_profiles', [
      { patient_id: 1, type: 'phone', value: '0901234567', is_primary: 1, created_at: now, updated_at: now },
      { patient_id: 1, type: 'address', value: '123 Đường ABC', city: 'Hồ Chí Minh', ward: 'Phường 1', is_primary: 1, created_at: now, updated_at: now },
      { patient_id: 2, type: 'phone', value: '0987654321', is_primary: 1, created_at: now, updated_at: now },
    ]);

    console.log('✅ Unified seeding completed!');
  },

  async down(queryInterface, Sequelize) {
    // Just cleanup if needed, but normally handled by up cleaning first
  }
};
