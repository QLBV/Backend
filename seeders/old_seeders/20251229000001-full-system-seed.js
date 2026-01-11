'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    console.log('🌱 [1/28] Seeding roles...');
    const [existingRoles] = await queryInterface.sequelize.query('SELECT id FROM roles LIMIT 1');
    if (existingRoles.length === 0) {
      await queryInterface.bulkInsert('roles', [
        { id: 1, name: 'ADMIN', description: 'Quản trị viên hệ thống', createdAt: now, updatedAt: now },
        { id: 2, name: 'RECEPTIONIST', description: 'Lễ tân', createdAt: now, updatedAt: now },
        { id: 3, name: 'PATIENT', description: 'Bệnh nhân', createdAt: now, updatedAt: now },
        { id: 4, name: 'DOCTOR', description: 'Bác sĩ', createdAt: now, updatedAt: now },
      ], {});
    } else {
      console.log('   ⚠️  Roles đã tồn tại, bỏ qua...');
    }

    console.log('🌱 [2/28] Seeding permissions...');
    const [existingPerms] = await queryInterface.sequelize.query('SELECT id FROM permissions LIMIT 1');
    const permissions = [
      // User Management
      { name: 'user.view', description: 'Xem danh sách người dùng', module: 'user' },
      { name: 'user.create', description: 'Tạo người dùng mới', module: 'user' },
      { name: 'user.update', description: 'Cập nhật thông tin người dùng', module: 'user' },
      { name: 'user.delete', description: 'Xóa người dùng', module: 'user' },
      // Patient Management
      { name: 'patient.view', description: 'Xem danh sách bệnh nhân', module: 'patient' },
      { name: 'patient.create', description: 'Tạo hồ sơ bệnh nhân', module: 'patient' },
      { name: 'patient.update', description: 'Cập nhật hồ sơ bệnh nhân', module: 'patient' },
      { name: 'patient.delete', description: 'Xóa hồ sơ bệnh nhân', module: 'patient' },
      // Appointment Management
      { name: 'appointment.view', description: 'Xem lịch hẹn', module: 'appointment' },
      { name: 'appointment.create', description: 'Đặt lịch hẹn', module: 'appointment' },
      { name: 'appointment.update', description: 'Cập nhật lịch hẹn', module: 'appointment' },
      { name: 'appointment.delete', description: 'Hủy lịch hẹn', module: 'appointment' },
      // Visit Management
      { name: 'visit.view', description: 'Xem phiên khám', module: 'visit' },
      { name: 'visit.create', description: 'Tạo phiên khám', module: 'visit' },
      { name: 'visit.update', description: 'Cập nhật phiên khám', module: 'visit' },
      // Medicine Management
      { name: 'medicine.view', description: 'Xem danh sách thuốc', module: 'medicine' },
      { name: 'medicine.create', description: 'Thêm thuốc mới', module: 'medicine' },
      { name: 'medicine.update', description: 'Cập nhật thông tin thuốc', module: 'medicine' },
      { name: 'medicine.delete', description: 'Xóa thuốc', module: 'medicine' },
      { name: 'medicine.import', description: 'Nhập thuốc', module: 'medicine' },
      { name: 'medicine.export', description: 'Xuất thuốc', module: 'medicine' },
      // Prescription Management
      { name: 'prescription.view', description: 'Xem đơn thuốc', module: 'prescription' },
      { name: 'prescription.create', description: 'Kê đơn thuốc', module: 'prescription' },
      { name: 'prescription.update', description: 'Cập nhật đơn thuốc', module: 'prescription' },
      { name: 'prescription.delete', description: 'Xóa đơn thuốc', module: 'prescription' },
      // Invoice & Payment Management
      { name: 'invoice.view', description: 'Xem hóa đơn', module: 'invoice' },
      { name: 'invoice.create', description: 'Tạo hóa đơn', module: 'invoice' },
      { name: 'invoice.update', description: 'Cập nhật hóa đơn', module: 'invoice' },
      { name: 'payment.view', description: 'Xem thanh toán', module: 'payment' },
      { name: 'payment.create', description: 'Tạo thanh toán', module: 'payment' },
      // Payroll Management
      { name: 'payroll.view', description: 'Xem bảng lương', module: 'payroll' },
      { name: 'payroll.create', description: 'Tạo bảng lương', module: 'payroll' },
      { name: 'payroll.approve', description: 'Phê duyệt bảng lương', module: 'payroll' },
      // Report & Dashboard
      { name: 'report.view', description: 'Xem báo cáo', module: 'report' },
      { name: 'dashboard.view', description: 'Xem dashboard', module: 'dashboard' },
    ];

    if (existingPerms.length === 0) {
      await queryInterface.bulkInsert('permissions',
        permissions.map((p, index) => ({
          id: index + 1,
          ...p,
          createdAt: now,
          updatedAt: now
        }))
      , {});
    } else {
      console.log('   ⚠️  Permissions đã tồn tại, bỏ qua...');
    }

    console.log('🌱 [3/28] Seeding role_permissions...');
    const [existingRolePerms] = await queryInterface.sequelize.query('SELECT roleId FROM role_permissions LIMIT 1');
    const rolePermissions = [];

    // ADMIN (roleId: 1) - Full permissions
    for (let i = 1; i <= permissions.length; i++) {
      rolePermissions.push({ roleId: 1, permissionId: i });
    }

    // RECEPTIONIST (roleId: 2) - Quản lý bệnh nhân, lịch hẹn, hóa đơn và thanh toán
    // Permissions: patient (5,6,7), appointment (9,10,11,12), visit (13,14,15), 
    // invoice (26,27,28), payment (29,30), dashboard (35)
    [5,6,7,9,10,11,12,13,14,15,26,27,28,29,30,35].forEach(permId => {
      rolePermissions.push({ roleId: 2, permissionId: permId });
    });

    // PATIENT (roleId: 3) - Chỉ xem và đặt lịch hẹn
    [9,10,35].forEach(permId => {
      rolePermissions.push({ roleId: 3, permissionId: permId });
    });

    // DOCTOR (roleId: 4) - Quản lý bệnh nhân, lịch hẹn, khám bệnh, kê đơn
    [5,6,7,9,10,11,12,13,14,15,16,17,18,22,23,24,25,26,27,28,35].forEach(permId => {
      rolePermissions.push({ roleId: 4, permissionId: permId });
    });

    if (existingRolePerms.length === 0) {
      await queryInterface.bulkInsert('role_permissions', rolePermissions, {});
    } else {
      console.log('   ⚠️  Role permissions đã tồn tại, bỏ qua...');
    }

    console.log('🌱 [4/28] Seeding users...');
    const [existingUsers] = await queryInterface.sequelize.query('SELECT id FROM users LIMIT 1');
    if (existingUsers.length === 0) {
      const hashedPassword = await bcrypt.hash('123456', 10);
      await queryInterface.bulkInsert('users', [
      // ADMIN
      { id: 1, email: 'admin@healthcare.com', password: hashedPassword, fullName: 'Quản Trị Viên', roleId: 1, isActive: 1, avatar: null, oauth2Provider: null, oauth2Id: null, createdAt: now, updatedAt: now },

      // DOCTORS
      { id: 2, email: 'nguyen.van.a@healthcare.com', password: hashedPassword, fullName: 'BS. Nguyễn Văn A', roleId: 4, isActive: 1, avatar: null, oauth2Provider: null, oauth2Id: null, createdAt: now, updatedAt: now },
      { id: 3, email: 'tran.thi.b@healthcare.com', password: hashedPassword, fullName: 'BS. Trần Thị B', roleId: 4, isActive: 1, avatar: null, oauth2Provider: null, oauth2Id: null, createdAt: now, updatedAt: now },
      { id: 4, email: 'le.van.c@healthcare.com', password: hashedPassword, fullName: 'BS. Lê Văn C', roleId: 4, isActive: 1, avatar: null, oauth2Provider: null, oauth2Id: null, createdAt: now, updatedAt: now },
      { id: 5, email: 'pham.thi.d@healthcare.com', password: hashedPassword, fullName: 'BS. Phạm Thị D', roleId: 4, isActive: 1, avatar: null, oauth2Provider: null, oauth2Id: null, createdAt: now, updatedAt: now },

      // PATIENTS
      { id: 6, email: 'patient1@gmail.com', password: hashedPassword, fullName: 'Ngô Văn K', roleId: 3, isActive: 1, avatar: null, oauth2Provider: null, oauth2Id: null, createdAt: now, updatedAt: now },
      { id: 7, email: 'patient2@gmail.com', password: hashedPassword, fullName: 'Đỗ Thị L', roleId: 3, isActive: 1, avatar: null, oauth2Provider: null, oauth2Id: null, createdAt: now, updatedAt: now },
      { id: 8, email: 'patient3@gmail.com', password: hashedPassword, fullName: 'Bùi Văn M', roleId: 3, isActive: 1, avatar: null, oauth2Provider: null, oauth2Id: null, createdAt: now, updatedAt: now },
      { id: 9, email: 'patient4@gmail.com', password: hashedPassword, fullName: 'Vũ Thị N', roleId: 3, isActive: 1, avatar: null, oauth2Provider: null, oauth2Id: null, createdAt: now, updatedAt: now },
      { id: 10, email: 'patient5@gmail.com', password: hashedPassword, fullName: 'Đặng Văn O', roleId: 3, isActive: 1, avatar: null, oauth2Provider: null, oauth2Id: null, createdAt: now, updatedAt: now },

      // RECEPTIONISTS
      { id: 11, email: 'receptionist1@healthcare.com', password: hashedPassword, fullName: 'Nguyễn Thị E', roleId: 2, isActive: 1, avatar: null, oauth2Provider: null, oauth2Id: null, createdAt: now, updatedAt: now },
      { id: 12, email: 'receptionist2@healthcare.com', password: hashedPassword, fullName: 'Trần Văn F', roleId: 2, isActive: 1, avatar: null, oauth2Provider: null, oauth2Id: null, createdAt: now, updatedAt: now },
    ], {});
    } else {
      console.log('   ⚠️  Users đã tồn tại, bỏ qua...');
    }

    console.log('🌱 [5/28] Seeding specialties...');
    const [existingSpecialties] = await queryInterface.sequelize.query('SELECT id FROM specialties LIMIT 1');
    if (existingSpecialties.length === 0) {
      await queryInterface.bulkInsert('specialties', [
        { id: 1, name: 'Nội khoa', description: 'Chuyên khoa Nội tổng quát', createdAt: now, updatedAt: now },
        { id: 2, name: 'Ngoại khoa', description: 'Chuyên khoa Ngoại tổng quát', createdAt: now, updatedAt: now },
        { id: 3, name: 'Nhi khoa', description: 'Chuyên khoa Nhi', createdAt: now, updatedAt: now },
        { id: 4, name: 'Sản phụ khoa', description: 'Chuyên khoa Sản - Phụ khoa', createdAt: now, updatedAt: now },
        { id: 5, name: 'Tim mạch', description: 'Chuyên khoa Tim mạch', createdAt: now, updatedAt: now },
        { id: 6, name: 'Tai Mũi Họng', description: 'Chuyên khoa Tai Mũi Họng', createdAt: now, updatedAt: now },
      ], {});
    } else {
      console.log('   ⚠️  Specialties đã tồn tại, bỏ qua...');
    }

    console.log('🌱 [6/28] Seeding doctors...');
    const [existingDoctors] = await queryInterface.sequelize.query('SELECT id FROM doctors LIMIT 1');
    if (existingDoctors.length === 0) {
      await queryInterface.bulkInsert('doctors', [
        { id: 1, doctorCode: 'BS001', userId: 2, specialtyId: 1, position: 'Trưởng khoa', degree: 'Tiến sĩ', description: 'Chuyên gia Nội khoa', createdAt: now, updatedAt: now },
        { id: 2, doctorCode: 'BS002', userId: 3, specialtyId: 3, position: 'Phó khoa', degree: 'Thạc sĩ', description: 'Bác sĩ Nhi khoa giàu kinh nghiệm', createdAt: now, updatedAt: now },
        { id: 3, doctorCode: 'BS003', userId: 4, specialtyId: 5, position: 'Bác sĩ', degree: 'Bác sĩ', description: 'Chuyên về tim mạch', createdAt: now, updatedAt: now },
        { id: 4, doctorCode: 'BS004', userId: 5, specialtyId: 2, position: 'Bác sĩ', degree: 'Thạc sĩ', description: 'Chuyên gia Ngoại khoa', createdAt: now, updatedAt: now },
      ], {});
    } else {
      console.log('   ⚠️  Doctors đã tồn tại, bỏ qua...');
    }

    console.log('🌱 [7/28] Seeding shifts...');
    const [existingShifts] = await queryInterface.sequelize.query('SELECT id FROM shifts LIMIT 1');
    if (existingShifts.length === 0) {
      await queryInterface.bulkInsert('shifts', [
        { id: 1, name: 'Sáng', startTime: '07:00', endTime: '12:00', createdAt: now, updatedAt: now },
        { id: 2, name: 'Chiều', startTime: '13:00', endTime: '17:00', createdAt: now, updatedAt: now },
        { id: 3, name: 'Tối', startTime: '18:00', endTime: '21:00', createdAt: now, updatedAt: now },
      ], {});
    } else {
      console.log('   ⚠️  Shifts đã tồn tại, bỏ qua...');
    }

    console.log('🌱 [8/28] Seeding doctor_shifts...');
    const [existingDoctorShifts] = await queryInterface.sequelize.query('SELECT id FROM doctor_shifts LIMIT 1');
    if (existingDoctorShifts.length === 0) {
      const doctorShifts = [];
      const today = new Date();
      // Tạo lịch cho 60 ngày tiếp theo (thay vì 14 ngày) để đảm bảo có đủ dữ liệu
      for (let dayOffset = 0; dayOffset < 60; dayOffset++) {
        const workDate = new Date(today);
        workDate.setDate(today.getDate() + dayOffset);
        const workDateStr = workDate.toISOString().split('T')[0];

        doctorShifts.push(
          { doctorId: 1, shiftId: 1, workDate: workDateStr, status: 'ACTIVE', replacedBy: null, cancelReason: null, createdAt: now, updatedAt: now },
          { doctorId: 1, shiftId: 2, workDate: workDateStr, status: 'ACTIVE', replacedBy: null, cancelReason: null, createdAt: now, updatedAt: now },
          { doctorId: 2, shiftId: 1, workDate: workDateStr, status: 'ACTIVE', replacedBy: null, cancelReason: null, createdAt: now, updatedAt: now },
          { doctorId: 3, shiftId: 2, workDate: workDateStr, status: 'ACTIVE', replacedBy: null, cancelReason: null, createdAt: now, updatedAt: now },
          { doctorId: 3, shiftId: 3, workDate: workDateStr, status: 'ACTIVE', replacedBy: null, cancelReason: null, createdAt: now, updatedAt: now },
          { doctorId: 4, shiftId: 1, workDate: workDateStr, status: 'ACTIVE', replacedBy: null, cancelReason: null, createdAt: now, updatedAt: now },
          { doctorId: 4, shiftId: 3, workDate: workDateStr, status: 'ACTIVE', replacedBy: null, cancelReason: null, createdAt: now, updatedAt: now }
        );
      }
      await queryInterface.bulkInsert('doctor_shifts', doctorShifts, {});
    } else {
      console.log('   ⚠️  Doctor shifts đã tồn tại, bỏ qua...');
    }

    console.log('🌱 [9/28] Seeding patients...');
    const [existingPatients] = await queryInterface.sequelize.query('SELECT id FROM patients LIMIT 1');
    if (existingPatients.length === 0) {
      await queryInterface.bulkInsert('patients', [
        { id: 1, patientCode: 'BN001', fullName: 'Ngô Văn K', gender: 'MALE', dateOfBirth: '1990-05-15', avatar: null, cccd: '001090001234', userId: 6, isActive: 1, createdAt: now, updatedAt: now },
        { id: 2, patientCode: 'BN002', fullName: 'Đỗ Thị L', gender: 'FEMALE', dateOfBirth: '1985-08-20', avatar: null, cccd: '001085005678', userId: 7, isActive: 1, createdAt: now, updatedAt: now },
        { id: 3, patientCode: 'BN003', fullName: 'Bùi Văn M', gender: 'MALE', dateOfBirth: '2015-03-10', avatar: null, cccd: '001015009876', userId: 8, isActive: 1, createdAt: now, updatedAt: now },
        { id: 4, patientCode: 'BN004', fullName: 'Vũ Thị N', gender: 'FEMALE', dateOfBirth: '1978-12-05', avatar: null, cccd: '001078004321', userId: 9, isActive: 1, createdAt: now, updatedAt: now },
        { id: 5, patientCode: 'BN005', fullName: 'Đặng Văn O', gender: 'MALE', dateOfBirth: '1995-07-25', avatar: null, cccd: '001095008765', userId: 10, isActive: 1, createdAt: now, updatedAt: now },
      ], {});
    } else {
      console.log('   ⚠️  Patients đã tồn tại, bỏ qua...');
    }

    console.log('🌱 [10/28] Seeding patient_profiles...');
    const [existingPatientProfiles] = await queryInterface.sequelize.query('SELECT id FROM patient_profiles LIMIT 1');
    if (existingPatientProfiles.length === 0) {
      await queryInterface.bulkInsert('patient_profiles', [
      { patient_id: 1, type: 'email', value: 'patient1@gmail.com', ward: null, city: null, is_primary: 1, created_at: now, updated_at: now },
      { patient_id: 1, type: 'phone', value: '0901234567', ward: null, city: null, is_primary: 1, created_at: now, updated_at: now },
      { patient_id: 1, type: 'address', value: '123 Nguyễn Văn Linh', ward: 'Phường Tân Phú', city: 'TP. Hồ Chí Minh', is_primary: 1, created_at: now, updated_at: now },
      { patient_id: 2, type: 'email', value: 'patient2@gmail.com', ward: null, city: null, is_primary: 1, created_at: now, updated_at: now },
      { patient_id: 2, type: 'phone', value: '0907654321', ward: null, city: null, is_primary: 1, created_at: now, updated_at: now },
      { patient_id: 2, type: 'address', value: '456 Lê Lợi', ward: 'Phường Bến Thành', city: 'TP. Hồ Chí Minh', is_primary: 1, created_at: now, updated_at: now },
      { patient_id: 3, type: 'email', value: 'patient3@gmail.com', ward: null, city: null, is_primary: 1, created_at: now, updated_at: now },
      { patient_id: 3, type: 'phone', value: '0903456789', ward: null, city: null, is_primary: 1, created_at: now, updated_at: now },
      { patient_id: 3, type: 'address', value: '789 Trần Hưng Đạo', ward: 'Phường 1', city: 'TP. Hồ Chí Minh', is_primary: 1, created_at: now, updated_at: now },
      { patient_id: 4, type: 'email', value: 'patient4@gmail.com', ward: null, city: null, is_primary: 1, created_at: now, updated_at: now },
      { patient_id: 4, type: 'phone', value: '0908765432', ward: null, city: null, is_primary: 1, created_at: now, updated_at: now },
      { patient_id: 4, type: 'address', value: '321 Võ Văn Tần', ward: 'Phường 5', city: 'TP. Hồ Chí Minh', is_primary: 1, created_at: now, updated_at: now },
      { patient_id: 5, type: 'email', value: 'patient5@gmail.com', ward: null, city: null, is_primary: 1, created_at: now, updated_at: now },
      { patient_id: 5, type: 'phone', value: '0909876543', ward: null, city: null, is_primary: 1, created_at: now, updated_at: now },
      { patient_id: 5, type: 'address', value: '654 Nguyễn Thị Minh Khai', ward: 'Phường 2', city: 'TP. Hồ Chí Minh', is_primary: 1, created_at: now, updated_at: now },
      ], {});
    } else {
      console.log('   ⚠️  Patient profiles đã tồn tại, bỏ qua...');
    }

    console.log('🌱 [11/28] Seeding disease_categories...');
    const [existingDiseaseCategories] = await queryInterface.sequelize.query('SELECT id FROM disease_categories LIMIT 1');
    if (existingDiseaseCategories.length === 0) {
      await queryInterface.bulkInsert('disease_categories', [
      { id: 1, code: 'A00', name: 'Nhiễm khuẩn đường ruột', description: 'Các bệnh nhiễm khuẩn đường tiêu hóa', createdAt: now, updatedAt: now },
      { id: 2, code: 'J00', name: 'Viêm mũi họng cấp', description: 'Cảm cúm, viêm họng', createdAt: now, updatedAt: now },
      { id: 3, code: 'J06', name: 'Nhiễm khuẩn đường hô hấp trên', description: 'Viêm đường hô hấp trên', createdAt: now, updatedAt: now },
      { id: 4, code: 'K29', name: 'Viêm dạ dày và tá tràng', description: 'Bệnh dạ dày', createdAt: now, updatedAt: now },
      { id: 5, code: 'I10', name: 'Tăng huyết áp', description: 'Huyết áp cao', createdAt: now, updatedAt: now },
      { id: 6, code: 'E11', name: 'Đái tháo đường type 2', description: 'Tiểu đường', createdAt: now, updatedAt: now },
      { id: 7, code: 'M79', name: 'Đau cơ xương khớp', description: 'Đau nhức cơ xương', createdAt: now, updatedAt: now },
      { id: 8, code: 'L50', name: 'Nổi mề đay', description: 'Dị ứng da', createdAt: now, updatedAt: now },
      ], {});
    } else {
      console.log('   ⚠️  Disease categories đã tồn tại, bỏ qua...');
    }

    console.log('🌱 [12/28] Seeding medicines...');
    const [existingMedicines] = await queryInterface.sequelize.query('SELECT id FROM medicines LIMIT 1');
    if (existingMedicines.length === 0) {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);
      await queryInterface.bulkInsert('medicines', [
      { id: 1, medicineCode: 'MED001', name: 'Paracetamol 500mg', group: 'Giảm đau, hạ sốt', activeIngredient: 'Paracetamol', manufacturer: 'Pymepharco', unit: 'VIEN', importPrice: 200, salePrice: 500, quantity: 1000, minStockLevel: 100, expiryDate: futureDate, description: null, status: 'ACTIVE', createdAt: now, updatedAt: now },
      { id: 2, medicineCode: 'MED002', name: 'Amoxicillin 500mg', group: 'Kháng sinh', activeIngredient: 'Amoxicillin', manufacturer: 'DHG Pharma', unit: 'VIEN', importPrice: 1000, salePrice: 2000, quantity: 500, minStockLevel: 50, expiryDate: futureDate, description: null, status: 'ACTIVE', createdAt: now, updatedAt: now },
      { id: 3, medicineCode: 'MED003', name: 'Vitamin C 500mg', group: 'Vitamin', activeIngredient: 'Acid Ascorbic', manufacturer: 'Traphaco', unit: 'VIEN', importPrice: 300, salePrice: 800, quantity: 2000, minStockLevel: 200, expiryDate: futureDate, description: null, status: 'ACTIVE', createdAt: now, updatedAt: now },
      { id: 4, medicineCode: 'MED004', name: 'Omeprazole 20mg', group: 'Thuốc dạ dày', activeIngredient: 'Omeprazole', manufacturer: 'Domesco', unit: 'VIEN', importPrice: 1500, salePrice: 3000, quantity: 300, minStockLevel: 50, expiryDate: futureDate, description: null, status: 'ACTIVE', createdAt: now, updatedAt: now },
      { id: 5, medicineCode: 'MED005', name: 'Cefixime 200mg', group: 'Kháng sinh', activeIngredient: 'Cefixime', manufacturer: 'Imexpharm', unit: 'VIEN', importPrice: 2000, salePrice: 4000, quantity: 400, minStockLevel: 40, expiryDate: futureDate, description: null, status: 'ACTIVE', createdAt: now, updatedAt: now },
      { id: 6, medicineCode: 'MED006', name: 'Cetirizine 10mg', group: 'Thuốc dị ứng', activeIngredient: 'Cetirizine', manufacturer: 'Pymepharco', unit: 'VIEN', importPrice: 500, salePrice: 1000, quantity: 800, minStockLevel: 80, expiryDate: futureDate, description: null, status: 'ACTIVE', createdAt: now, updatedAt: now },
      { id: 7, medicineCode: 'MED007', name: 'Dextromethorphan Syrup', group: 'Thuốc ho', activeIngredient: 'Dextromethorphan', manufacturer: 'Boston', unit: 'CHAI', importPrice: 15000, salePrice: 25000, quantity: 150, minStockLevel: 20, expiryDate: futureDate, description: null, status: 'ACTIVE', createdAt: now, updatedAt: now },
      { id: 8, medicineCode: 'MED008', name: 'Ibuprofen 400mg', group: 'Giảm đau, chống viêm', activeIngredient: 'Ibuprofen', manufacturer: 'Traphaco', unit: 'VIEN', importPrice: 800, salePrice: 1500, quantity: 600, minStockLevel: 60, expiryDate: futureDate, description: null, status: 'ACTIVE', createdAt: now, updatedAt: now },
      { id: 9, medicineCode: 'MED009', name: 'Metformin 500mg', group: 'Thuốc tiểu đường', activeIngredient: 'Metformin HCl', manufacturer: 'DHG Pharma', unit: 'VIEN', importPrice: 400, salePrice: 900, quantity: 700, minStockLevel: 70, expiryDate: futureDate, description: null, status: 'ACTIVE', createdAt: now, updatedAt: now },
      { id: 10, medicineCode: 'MED010', name: 'Amlodipine 5mg', group: 'Thuốc tim mạch', activeIngredient: 'Amlodipine', manufacturer: 'Imexpharm', unit: 'VIEN', importPrice: 600, salePrice: 1200, quantity: 500, minStockLevel: 50, expiryDate: futureDate, description: null, status: 'ACTIVE', createdAt: now, updatedAt: now },
      ], {});
    } else {
      console.log('   ⚠️  Medicines đã tồn tại, bỏ qua...');
    }

    console.log('🌱 [13/28] Seeding medicine_imports...');
    const [existingMedicineImports] = await queryInterface.sequelize.query('SELECT id FROM medicine_imports LIMIT 1');
    if (existingMedicineImports.length === 0) {
      const importDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const importDateStr = importDate.toISOString().slice(0, 10).replace(/-/g, '');
      await queryInterface.bulkInsert('medicine_imports', [
      { importCode: `IMP-${importDateStr}-00001`, medicineId: 1, quantity: 1000, importPrice: 200, importDate, userId: 1, supplier: 'Công ty Dược phẩm ABC', supplierInvoice: 'HD-2024-001', batchNumber: 'LOT-2024-001', note: 'Nhập kho từ nhà cung cấp chính', createdAt: now, updatedAt: now },
      { importCode: `IMP-${importDateStr}-00002`, medicineId: 2, quantity: 500, importPrice: 1000, importDate, userId: 1, supplier: 'Công ty Dược phẩm XYZ', supplierInvoice: 'HD-2024-002', batchNumber: 'LOT-2024-002', note: null, createdAt: now, updatedAt: now },
      { importCode: `IMP-${importDateStr}-00003`, medicineId: 3, quantity: 2000, importPrice: 300, importDate, userId: 1, supplier: 'Công ty Dược phẩm ABC', supplierInvoice: 'HD-2024-003', batchNumber: 'LOT-2024-003', note: null, createdAt: now, updatedAt: now },
      { importCode: `IMP-${importDateStr}-00004`, medicineId: 4, quantity: 300, importPrice: 1500, importDate, userId: 1, supplier: 'Công ty Dược phẩm DEF', supplierInvoice: 'HD-2024-004', batchNumber: 'LOT-2024-004', note: null, createdAt: now, updatedAt: now },
      { importCode: `IMP-${importDateStr}-00005`, medicineId: 5, quantity: 400, importPrice: 2000, importDate, userId: 1, supplier: 'Công ty Dược phẩm XYZ', supplierInvoice: 'HD-2024-005', batchNumber: 'LOT-2024-005', note: null, createdAt: now, updatedAt: now },
      { importCode: `IMP-${importDateStr}-00006`, medicineId: 6, quantity: 800, importPrice: 500, importDate, userId: 1, supplier: 'Công ty Dược phẩm ABC', supplierInvoice: 'HD-2024-006', batchNumber: 'LOT-2024-006', note: null, createdAt: now, updatedAt: now },
      { importCode: `IMP-${importDateStr}-00007`, medicineId: 7, quantity: 150, importPrice: 15000, importDate, userId: 1, supplier: 'Công ty Dược phẩm DEF', supplierInvoice: 'HD-2024-007', batchNumber: 'LOT-2024-007', note: null, createdAt: now, updatedAt: now },
      { importCode: `IMP-${importDateStr}-00008`, medicineId: 8, quantity: 600, importPrice: 800, importDate, userId: 1, supplier: 'Công ty Dược phẩm ABC', supplierInvoice: 'HD-2024-008', batchNumber: 'LOT-2024-008', note: null, createdAt: now, updatedAt: now },
      { importCode: `IMP-${importDateStr}-00009`, medicineId: 9, quantity: 700, importPrice: 400, importDate, userId: 1, supplier: 'Công ty Dược phẩm XYZ', supplierInvoice: 'HD-2024-009', batchNumber: 'LOT-2024-009', note: null, createdAt: now, updatedAt: now },
      { importCode: `IMP-${importDateStr}-00010`, medicineId: 10, quantity: 500, importPrice: 600, importDate, userId: 1, supplier: 'Công ty Dược phẩm DEF', supplierInvoice: 'HD-2024-010', batchNumber: 'LOT-2024-010', note: null, createdAt: now, updatedAt: now },
      ], {});
    } else {
      console.log('   ⚠️  Medicine imports đã tồn tại, bỏ qua...');
    }

    console.log('🌱 [14/28] Seeding medicine_exports...');
    const [existingMedicineExports] = await queryInterface.sequelize.query('SELECT id FROM medicine_exports LIMIT 1');
    if (existingMedicineExports.length === 0) {
      const exportDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000); // 15 ngày trước
      const exportDateStr = exportDate.toISOString().slice(0, 10).replace(/-/g, '');
      await queryInterface.bulkInsert('medicine_exports', [
        { exportCode: `EXP-${exportDateStr}-00001`, medicineId: 1, quantity: 50, exportDate, userId: 1, reason: 'Hủy do hết hạn', note: 'Thuốc đã quá hạn sử dụng, tiêu hủy theo quy định', createdAt: exportDate, updatedAt: exportDate },
        { exportCode: `EXP-${exportDateStr}-00002`, medicineId: 7, quantity: 10, exportDate, userId: 1, reason: 'Hủy do bao bì hư hỏng', note: 'Bao bì bị rách, không đảm bảo chất lượng', createdAt: exportDate, updatedAt: exportDate },
      ], {});
    } else {
      console.log('   ⚠️  Medicine exports đã tồn tại, bỏ qua...');
    }

    console.log('🌱 [15/28] Seeding appointments (upcoming)...');
    const [existingAppointments] = await queryInterface.sequelize.query('SELECT id FROM appointments LIMIT 1');
    if (existingAppointments.length === 0) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      const tomorrowCodeStr = tomorrowStr.replace(/-/g, '');
      await queryInterface.bulkInsert('appointments', [
      { id: 1, appointmentCode: `APT-${tomorrowCodeStr}-00001`, patientId: 1, doctorId: 1, shiftId: 1, date: tomorrowStr, slotNumber: 1, bookingType: 'ONLINE', bookedBy: 'PATIENT', symptomInitial: 'Đau đầu, sốt nhẹ', status: 'WAITING', createdAt: now, updatedAt: now },
      { id: 2, appointmentCode: `APT-${tomorrowCodeStr}-00002`, patientId: 2, doctorId: 2, shiftId: 1, date: tomorrowStr, slotNumber: 1, bookingType: 'OFFLINE', bookedBy: 'RECEPTIONIST', symptomInitial: 'Ho, sổ mũi', status: 'WAITING', createdAt: now, updatedAt: now },
      { id: 3, appointmentCode: `APT-${tomorrowCodeStr}-00003`, patientId: 3, doctorId: 3, shiftId: 2, date: tomorrowStr, slotNumber: 1, bookingType: 'ONLINE', bookedBy: 'PATIENT', symptomInitial: 'Đau ngực', status: 'WAITING', createdAt: now, updatedAt: now },
      { id: 4, appointmentCode: `APT-${tomorrowCodeStr}-00004`, patientId: 4, doctorId: 4, shiftId: 1, date: tomorrowStr, slotNumber: 2, bookingType: 'OFFLINE', bookedBy: 'RECEPTIONIST', symptomInitial: 'Đau bụng', status: 'WAITING', createdAt: now, updatedAt: now },
      { id: 5, appointmentCode: `APT-${tomorrowCodeStr}-00005`, patientId: 5, doctorId: 1, shiftId: 2, date: tomorrowStr, slotNumber: 1, bookingType: 'ONLINE', bookedBy: 'PATIENT', symptomInitial: 'Khám tổng quát', status: 'WAITING', createdAt: now, updatedAt: now },
      ]);
      
      console.log('🌱 [16/28] Seeding appointments (completed - yesterday)...');
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const yesterdayCodeStr = yesterdayStr.replace(/-/g, '');
      await queryInterface.bulkInsert('appointments', [
        { id: 6, appointmentCode: `APT-${yesterdayCodeStr}-00006`, patientId: 1, doctorId: 1, shiftId: 1, date: yesterdayStr, slotNumber: 1, bookingType: 'OFFLINE', bookedBy: 'RECEPTIONIST', symptomInitial: 'Cảm cúm', status: 'CHECKED_IN', createdAt: yesterday, updatedAt: yesterday },
        { id: 7, appointmentCode: `APT-${yesterdayCodeStr}-00007`, patientId: 2, doctorId: 2, shiftId: 1, date: yesterdayStr, slotNumber: 2, bookingType: 'ONLINE', bookedBy: 'PATIENT', symptomInitial: 'Sốt cao', status: 'CHECKED_IN', createdAt: yesterday, updatedAt: yesterday },
      ], {});
    } else {
      console.log('   ⚠️  Appointments đã tồn tại, bỏ qua...');
    }

    console.log('🌱 [17/28] Seeding visits...');
    const [existingVisits] = await queryInterface.sequelize.query('SELECT id FROM visits LIMIT 1');
    if (existingVisits.length === 0) {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const yesterdayCodeStr = yesterdayStr.replace(/-/g, '');
      await queryInterface.bulkInsert('visits', [
      { id: 1, visitCode: `VIS-${yesterdayCodeStr}-00001`, appointmentId: 6, patientId: 1, doctorId: 1, checkInTime: yesterday, symptoms: 'Sốt, ho, đau họng', diseaseCategoryId: 2, diagnosis: 'Viêm họng cấp', note: 'Nghỉ ngơi, uống nhiều nước', status: 'COMPLETED', createdAt: yesterday, updatedAt: yesterday },
      { id: 2, visitCode: `VIS-${yesterdayCodeStr}-00002`, appointmentId: 7, patientId: 2, doctorId: 2, checkInTime: yesterday, symptoms: 'Sốt cao, ói mửa', diseaseCategoryId: 3, diagnosis: 'Nhiễm khuẩn đường hô hấp', note: 'Uống thuốc đầy đủ theo đơn', status: 'COMPLETED', createdAt: yesterday, updatedAt: yesterday },
      ], {});
    } else {
      console.log('   ⚠️  Visits đã tồn tại, bỏ qua...');
    }

    console.log('🌱 [18/28] Seeding prescriptions...');
    const [existingPrescriptions] = await queryInterface.sequelize.query('SELECT id FROM prescriptions LIMIT 1');
    if (existingPrescriptions.length === 0) {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      await queryInterface.bulkInsert('prescriptions', [
        { id: 1, prescriptionCode: 'DT001', visitId: 1, doctorId: 1, patientId: 1, totalAmount: 15000, status: 'LOCKED', note: 'Uống đầy đủ theo chỉ định', createdAt: yesterday, updatedAt: yesterday },
        { id: 2, prescriptionCode: 'DT002', visitId: 2, doctorId: 2, patientId: 2, totalAmount: 35400, status: 'LOCKED', note: 'Tái khám sau 5 ngày', createdAt: yesterday, updatedAt: yesterday },
      ], {});
    } else {
      console.log('   ⚠️  Prescriptions đã tồn tại, bỏ qua...');
    }

    console.log('🌱 [19/28] Seeding prescription_details...');
    const [existingPrescriptionDetails] = await queryInterface.sequelize.query('SELECT id FROM prescription_details LIMIT 1');
    if (existingPrescriptionDetails.length === 0) {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      await queryInterface.bulkInsert('prescription_details', [
      { id: 1, prescriptionId: 1, medicineId: 1, medicineName: 'Paracetamol 500mg', quantity: 10, unit: 'VIEN', unitPrice: 500, dosageMorning: 1, dosageNoon: 1, dosageAfternoon: 0, dosageEvening: 1, instruction: 'Uống sau ăn', createdAt: yesterday, updatedAt: yesterday },
      { id: 2, prescriptionId: 1, medicineId: 2, medicineName: 'Amoxicillin 500mg', quantity: 5, unit: 'VIEN', unitPrice: 2000, dosageMorning: 1, dosageNoon: 0, dosageAfternoon: 0, dosageEvening: 1, instruction: 'Uống trước ăn 30 phút', createdAt: yesterday, updatedAt: yesterday },
      { id: 3, prescriptionId: 2, medicineId: 2, medicineName: 'Amoxicillin 500mg', quantity: 14, unit: 'VIEN', unitPrice: 2000, dosageMorning: 1, dosageNoon: 0, dosageAfternoon: 0, dosageEvening: 1, instruction: 'Uống sau ăn', createdAt: yesterday, updatedAt: yesterday },
      { id: 4, prescriptionId: 2, medicineId: 6, medicineName: 'Cetirizine 10mg', quantity: 5, unit: 'VIEN', unitPrice: 1000, dosageMorning: 0, dosageNoon: 0, dosageAfternoon: 0, dosageEvening: 1, instruction: 'Uống trước khi ngủ', createdAt: yesterday, updatedAt: yesterday },
      { id: 5, prescriptionId: 2, medicineId: 3, medicineName: 'Vitamin C 500mg', quantity: 3, unit: 'VIEN', unitPrice: 800, dosageMorning: 1, dosageNoon: 0, dosageAfternoon: 0, dosageEvening: 0, instruction: 'Uống sau ăn sáng', createdAt: yesterday, updatedAt: yesterday },
      ], {});
    } else {
      console.log('   ⚠️  Prescription details đã tồn tại, bỏ qua...');
    }

    console.log('🌱 [20/28] Seeding invoices...');
    const [existingInvoices] = await queryInterface.sequelize.query('SELECT id FROM invoices LIMIT 1');
    if (existingInvoices.length === 0) {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      await queryInterface.bulkInsert('invoices', [
      { id: 1, invoiceCode: 'HD001', visitId: 1, patientId: 1, doctorId: 1, examinationFee: 200000, medicineTotalAmount: 15000, discount: 0, totalAmount: 215000, paymentStatus: 'PAID', paidAmount: 215000, note: null, createdBy: 11, createdAt: yesterday, updatedAt: yesterday },
      { id: 2, invoiceCode: 'HD002', visitId: 2, patientId: 2, doctorId: 2, examinationFee: 200000, medicineTotalAmount: 35400, discount: 0, totalAmount: 235400, paymentStatus: 'PAID', paidAmount: 235400, note: null, createdBy: 11, createdAt: yesterday, updatedAt: yesterday },
      ], {});
    } else {
      console.log('   ⚠️  Invoices đã tồn tại, bỏ qua...');
    }

    console.log('🌱 [21/28] Seeding invoice_items...');
    const [existingInvoiceItems] = await queryInterface.sequelize.query('SELECT id FROM invoice_items LIMIT 1');
    if (existingInvoiceItems.length === 0) {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      await queryInterface.bulkInsert('invoice_items', [
      { invoiceId: 1, itemType: 'EXAMINATION', description: 'Phí khám bệnh', prescriptionDetailId: null, medicineName: null, medicineCode: null, quantity: 1, unitPrice: 200000, subtotal: 200000, createdAt: yesterday, updatedAt: yesterday },
      { invoiceId: 1, itemType: 'MEDICINE', description: null, prescriptionDetailId: 1, medicineName: 'Paracetamol 500mg', medicineCode: 'MED001', quantity: 10, unitPrice: 500, subtotal: 5000, createdAt: yesterday, updatedAt: yesterday },
      { invoiceId: 1, itemType: 'MEDICINE', description: null, prescriptionDetailId: 2, medicineName: 'Amoxicillin 500mg', medicineCode: 'MED002', quantity: 5, unitPrice: 2000, subtotal: 10000, createdAt: yesterday, updatedAt: yesterday },
      { invoiceId: 2, itemType: 'EXAMINATION', description: 'Phí khám bệnh', prescriptionDetailId: null, medicineName: null, medicineCode: null, quantity: 1, unitPrice: 200000, subtotal: 200000, createdAt: yesterday, updatedAt: yesterday },
      { invoiceId: 2, itemType: 'MEDICINE', description: null, prescriptionDetailId: 3, medicineName: 'Amoxicillin 500mg', medicineCode: 'MED002', quantity: 14, unitPrice: 2000, subtotal: 28000, createdAt: yesterday, updatedAt: yesterday },
      { invoiceId: 2, itemType: 'MEDICINE', description: null, prescriptionDetailId: 4, medicineName: 'Cetirizine 10mg', medicineCode: 'MED006', quantity: 5, unitPrice: 1000, subtotal: 5000, createdAt: yesterday, updatedAt: yesterday },
      { invoiceId: 2, itemType: 'MEDICINE', description: null, prescriptionDetailId: 5, medicineName: 'Vitamin C 500mg', medicineCode: 'MED003', quantity: 3, unitPrice: 800, subtotal: 2400, createdAt: yesterday, updatedAt: yesterday },
      ], {});
    } else {
      console.log('   ⚠️  Invoice items đã tồn tại, bỏ qua...');
    }

    console.log('🌱 [22/28] Seeding payments...');
    const [existingPayments] = await queryInterface.sequelize.query('SELECT id FROM payments LIMIT 1');
    if (existingPayments.length === 0) {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      await queryInterface.bulkInsert('payments', [
      { invoiceId: 1, amount: 215000, paymentMethod: 'CASH', paymentDate: yesterday, reference: null, note: 'Thanh toán tiền mặt', createdBy: 11, createdAt: yesterday, updatedAt: yesterday },
      { invoiceId: 2, amount: 235400, paymentMethod: 'BANK_TRANSFER', paymentDate: yesterday, reference: 'TXN123456789', note: 'Chuyển khoản ngân hàng', createdBy: 11, createdAt: yesterday, updatedAt: yesterday },
      ], {});
    } else {
      console.log('   ⚠️  Payments đã tồn tại, bỏ qua...');
    }

    console.log('🌱 [23/28] Seeding attendance...');
    const [existingAttendance] = await queryInterface.sequelize.query('SELECT id FROM attendance LIMIT 1');
    if (existingAttendance.length === 0) {
      const attendanceRecords = [];
      const startDate = new Date(today);
      startDate.setDate(1);
      for (let day = 0; day < 28; day++) {
      const workDate = new Date(startDate);
      workDate.setDate(startDate.getDate() + day);
      const workDateStr = workDate.toISOString().split('T')[0];
      // Chỉ chấm công cho Admin, Doctors, Receptionists (không có Patient)
      for (let userId = 1; userId <= 5; userId++) {
        const isAbsent = Math.random() < 0.05;
        const isWeekend = workDate.getDay() === 0 || workDate.getDay() === 6;
        if (!isAbsent && !isWeekend) {
          // Tạo check-in và check-out time
          const checkInTime = new Date(workDate);
          checkInTime.setHours(7 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);
          const checkOutTime = new Date(workDate);
          checkOutTime.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);
          
          attendanceRecords.push({
            userId,
            date: workDateStr,
            status: 'PRESENT',
            checkInTime,
            checkOutTime,
            note: null,
            createdAt: workDate,
            updatedAt: workDate
          });
        } else if (isAbsent) {
          attendanceRecords.push({
            userId,
            date: workDateStr,
            status: 'ABSENT',
            checkInTime: null,
            checkOutTime: null,
            note: 'Nghỉ phép',
            createdAt: workDate,
            updatedAt: workDate
          });
        }
      }
      // Receptionists
      for (let userId = 11; userId <= 12; userId++) {
        const isAbsent = Math.random() < 0.05;
        const isWeekend = workDate.getDay() === 0 || workDate.getDay() === 6;
        if (!isAbsent && !isWeekend) {
          // Tạo check-in và check-out time
          const checkInTime = new Date(workDate);
          checkInTime.setHours(7 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);
          const checkOutTime = new Date(workDate);
          checkOutTime.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);
          
          attendanceRecords.push({
            userId,
            date: workDateStr,
            status: 'PRESENT',
            checkInTime,
            checkOutTime,
            note: null,
            createdAt: workDate,
            updatedAt: workDate
          });
        } else if (isAbsent) {
          attendanceRecords.push({
            userId,
            date: workDateStr,
            status: 'ABSENT',
            checkInTime: null,
            checkOutTime: null,
            note: 'Nghỉ phép',
            createdAt: workDate,
            updatedAt: workDate
          });
        }
      }
      }
      await queryInterface.bulkInsert('attendance', attendanceRecords, {});
    } else {
      console.log('   ⚠️  Attendance đã tồn tại, bỏ qua...');
    }

    console.log('🌱 [24/28] Seeding payrolls...');
    const [existingPayrolls] = await queryInterface.sequelize.query('SELECT id FROM payrolls LIMIT 1');
    if (existingPayrolls.length === 0) {
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      await queryInterface.bulkInsert('payrolls', [
      // Admin
      { payrollCode: `SAL${currentYear}${String(currentMonth).padStart(2,'0')}001`, userId: 1, month: currentMonth, year: currentYear, baseSalary: 2500000, roleCoefficient: 3.0, roleSalary: 7500000, yearsOfService: 5, experienceBonus: 1250000, totalInvoices: 0, commissionRate: 0, commission: 0, daysOff: 1, allowedDaysOff: 2, penaltyDaysOff: 0, penaltyAmount: 0, grossSalary: 8750000, netSalary: 8750000, status: 'DRAFT', approvedBy: null, approvedAt: null, paidAt: null, note: null, createdAt: now, updatedAt: now },
      // Doctors
      { payrollCode: `SAL${currentYear}${String(currentMonth).padStart(2,'0')}002`, userId: 2, month: currentMonth, year: currentYear, baseSalary: 2500000, roleCoefficient: 2.5, roleSalary: 6250000, yearsOfService: 8, experienceBonus: 2000000, totalInvoices: 450400, commissionRate: 0.05, commission: 22520, daysOff: 0, allowedDaysOff: 2, penaltyDaysOff: 0, penaltyAmount: 0, grossSalary: 8272520, netSalary: 8272520, status: 'DRAFT', approvedBy: null, approvedAt: null, paidAt: null, note: null, createdAt: now, updatedAt: now },
      { payrollCode: `SAL${currentYear}${String(currentMonth).padStart(2,'0')}003`, userId: 3, month: currentMonth, year: currentYear, baseSalary: 2500000, roleCoefficient: 2.0, roleSalary: 5000000, yearsOfService: 4, experienceBonus: 1000000, totalInvoices: 235400, commissionRate: 0.05, commission: 11770, daysOff: 1, allowedDaysOff: 2, penaltyDaysOff: 0, penaltyAmount: 0, grossSalary: 6011770, netSalary: 6011770, status: 'DRAFT', approvedBy: null, approvedAt: null, paidAt: null, note: null, createdAt: now, updatedAt: now },
      // Receptionists
      { payrollCode: `SAL${currentYear}${String(currentMonth).padStart(2,'0')}011`, userId: 11, month: currentMonth, year: currentYear, baseSalary: 2500000, roleCoefficient: 1.2, roleSalary: 3000000, yearsOfService: 2, experienceBonus: 500000, totalInvoices: 0, commissionRate: 0, commission: 0, daysOff: 2, allowedDaysOff: 2, penaltyDaysOff: 0, penaltyAmount: 0, grossSalary: 3500000, netSalary: 3500000, status: 'DRAFT', approvedBy: null, approvedAt: null, paidAt: null, note: null, createdAt: now, updatedAt: now },
      ], {});
    } else {
      console.log('   ⚠️  Payrolls đã tồn tại, bỏ qua...');
    }

    console.log('🌱 [25/28] Seeding notifications...');
    const [existingNotifications] = await queryInterface.sequelize.query('SELECT id FROM notifications LIMIT 1');
    if (existingNotifications.length === 0) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      await queryInterface.bulkInsert('notifications', [
      // Notifications cho bệnh nhân về lịch hẹn sắp tới
      { userId: 6, type: 'APPOINTMENT_CREATED', title: 'Đặt lịch thành công', message: 'Bạn đã đặt lịch khám với BS. Nguyễn Văn A vào ngày ' + tomorrowStr + ' ca sáng. Vui lòng đến đúng giờ.', relatedAppointmentId: 1, isRead: 0, emailSent: 0, emailSentAt: null, createdAt: now, updatedAt: now },
      { userId: 7, type: 'APPOINTMENT_CREATED', title: 'Lịch hẹn đã được tạo', message: 'Lịch hẹn của bạn với BS. Trần Thị B đã được xác nhận cho ngày ' + tomorrowStr + ' ca sáng.', relatedAppointmentId: 2, isRead: 0, emailSent: 0, emailSentAt: null, createdAt: now, updatedAt: now },
      { userId: 8, type: 'APPOINTMENT_CREATED', title: 'Đặt lịch thành công', message: 'Bạn đã đặt lịch khám với BS. Lê Văn C vào ngày ' + tomorrowStr + ' ca chiều.', relatedAppointmentId: 3, isRead: 0, emailSent: 0, emailSentAt: null, createdAt: now, updatedAt: now },
      { userId: 10, type: 'APPOINTMENT_CREATED', title: 'Lịch hẹn mới', message: 'Lịch hẹn khám bệnh của bạn đã được đặt thành công cho ngày ' + tomorrowStr, relatedAppointmentId: 5, isRead: 0, emailSent: 0, emailSentAt: null, createdAt: now, updatedAt: now },

      // Notifications cho bác sĩ
      { userId: 2, type: 'SYSTEM', title: 'Lịch làm việc mới', message: 'Bạn có lịch làm việc trong 14 ngày tới. Vui lòng kiểm tra lịch trình.', relatedAppointmentId: null, isRead: 1, emailSent: 0, emailSentAt: null, createdAt: now, updatedAt: now },
      { userId: 3, type: 'SYSTEM', title: 'Nhắc nhở', message: 'Bạn có 1 lịch hẹn vào ngày mai. Vui lòng chuẩn bị.', relatedAppointmentId: null, isRead: 0, emailSent: 0, emailSentAt: null, createdAt: now, updatedAt: now },

      // Notifications hệ thống
      { userId: 1, type: 'SYSTEM', title: 'Cảnh báo thuốc sắp hết', message: 'Có 2 loại thuốc sắp đạt mức tồn kho tối thiểu. Vui lòng kiểm tra và nhập thêm.', relatedAppointmentId: null, isRead: 0, emailSent: 0, emailSentAt: null, createdAt: now, updatedAt: now },
      { userId: 11, type: 'SYSTEM', title: 'Chào mừng', message: 'Chào mừng bạn đến với hệ thống quản lý phòng khám. Bạn có thể đặt lịch khám trực tuyến.', relatedAppointmentId: null, isRead: 1, emailSent: 0, emailSentAt: null, createdAt: now, updatedAt: now },
      ], {});
    } else {
      console.log('   ⚠️  Notifications đã tồn tại, bỏ qua...');
    }

    console.log('🌱 [26/28] Seeding diagnoses...');
    const [existingDiagnoses] = await queryInterface.sequelize.query('SELECT id FROM diagnoses LIMIT 1');
    if (existingDiagnoses.length === 0) {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      await queryInterface.bulkInsert('diagnoses', [
      { visitId: 1, diseaseCategoryId: 2, diagnosisDetail: 'Viêm họng cấp tính, niêm mạc họng đỏ, có mủ trắng. Bệnh nhân sốt nhẹ, đau họng khi nuốt.', icd10Code: 'J02.9', severity: 'MILD', note: 'Nghỉ ngơi, uống nhiều nước, tránh thức ăn cay nóng', createdAt: yesterday, updatedAt: yesterday },
      { visitId: 2, diseaseCategoryId: 3, diagnosisDetail: 'Nhiễm khuẩn đường hô hấp trên, viêm phế quản cấp. Bệnh nhân sốt cao, ho có đờm, khó thở nhẹ.', icd10Code: 'J06.9', severity: 'MODERATE', note: 'Theo dõi nhiệt độ, uống thuốc đầy đủ, tái khám sau 5 ngày', createdAt: yesterday, updatedAt: yesterday },
      ], {});
    } else {
      console.log('   ⚠️  Diagnoses đã tồn tại, bỏ qua...');
    }

    console.log('🌱 [27/28] Seeding refunds...');
    const [existingRefunds] = await queryInterface.sequelize.query('SELECT id FROM refunds LIMIT 1');
    if (existingRefunds.length === 0) {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      await queryInterface.bulkInsert('refunds', [
      { invoiceId: 1, amount: 50000, reason: 'MEDICINE_RETURNED', reasonDetail: 'Bệnh nhân trả lại một phần thuốc do dị ứng', status: 'COMPLETED', requestedBy: 6, approvedBy: 1, requestDate: new Date(yesterday.getTime() + 2 * 24 * 60 * 60 * 1000), approvedDate: new Date(yesterday.getTime() + 2 * 24 * 60 * 60 * 1000), completedDate: new Date(yesterday.getTime() + 3 * 24 * 60 * 60 * 1000), note: 'Đã hoàn tiền cho bệnh nhân', createdAt: new Date(yesterday.getTime() + 2 * 24 * 60 * 60 * 1000), updatedAt: new Date(yesterday.getTime() + 3 * 24 * 60 * 60 * 1000) },
      ], {});
    } else {
      console.log('   ⚠️  Refunds đã tồn tại, bỏ qua...');
    }

    console.log('🌱 [28/28] Seeding notification_settings...');
    const [existingNotificationSettings] = await queryInterface.sequelize.query('SELECT id FROM notification_settings LIMIT 1');
    if (existingNotificationSettings.length === 0) {
      const notificationSettings = [];
      for (let userId = 1; userId <= 12; userId++) {
        notificationSettings.push({
          userId,
          emailEnabled: userId <= 5 || userId >= 11 ? true : false, // Admin, Doctors, Receptionists có email
          smsEnabled: false,
          pushEnabled: true,
          inAppEnabled: true,
          createdAt: now,
          updatedAt: now
        });
      }
      await queryInterface.bulkInsert('notification_settings', notificationSettings, {});
    } else {
      console.log('   ⚠️  Notification settings đã tồn tại, bỏ qua...');
    }

    console.log('✅ Seed dữ liệu hoàn tất! Tổng cộng 28 bảng đã được seed.');
    console.log('📊 Thống kê:');
    console.log('   - 4 Roles: ADMIN, DOCTOR, PATIENT, RECEPTIONIST');
    console.log('   - 35 Permissions');
    console.log('   - 12 Users: 1 Admin, 4 Doctors, 5 Patients, 2 Receptionists');
    console.log('   - 5 Patients với đầy đủ thông tin liên hệ');
    console.log('   - 6 Specialties');
    console.log('   - 4 Doctors với chuyên khoa');
    console.log('   - 3 Shifts');
    console.log('   - 98 Doctor Shifts (14 ngày)');
    console.log('   - 8 Disease Categories');
    console.log('   - 10 Medicines');
    console.log('   - 10 Medicine Imports');
    console.log('   - 2 Medicine Exports');
    console.log('   - 7 Appointments (5 upcoming, 2 completed)');
    console.log('   - 2 Visits hoàn thành');
    console.log('   - 2 Diagnoses');
    console.log('   - 2 Prescriptions');
    console.log('   - 5 Prescription Details');
    console.log('   - 2 Invoices');
    console.log('   - 7 Invoice Items');
    console.log('   - 2 Payments');
    console.log('   - 196 Attendance Records (28 ngày)');
    console.log('   - 4 Payrolls');
    console.log('   - 8 Notifications');
    console.log('   - 1 Refund');
    console.log('   - 12 Notification Settings');
  },

  async down(queryInterface, Sequelize) {
    console.log('🗑️  Xóa toàn bộ dữ liệu...');
    await queryInterface.bulkDelete('notification_settings', null, {});
    await queryInterface.bulkDelete('refunds', null, {});
    await queryInterface.bulkDelete('diagnoses', null, {});
    await queryInterface.bulkDelete('notifications', null, {});
    await queryInterface.bulkDelete('payrolls', null, {});
    await queryInterface.bulkDelete('attendance', null, {});
    await queryInterface.bulkDelete('payments', null, {});
    await queryInterface.bulkDelete('invoice_items', null, {});
    await queryInterface.bulkDelete('invoices', null, {});
    await queryInterface.bulkDelete('prescription_details', null, {});
    await queryInterface.bulkDelete('prescriptions', null, {});
    await queryInterface.bulkDelete('visits', null, {});
    await queryInterface.bulkDelete('appointments', null, {});
    await queryInterface.bulkDelete('medicine_exports', null, {});
    await queryInterface.bulkDelete('medicine_imports', null, {});
    await queryInterface.bulkDelete('medicines', null, {});
    await queryInterface.bulkDelete('disease_categories', null, {});
    await queryInterface.bulkDelete('patient_profiles', null, {});
    await queryInterface.bulkDelete('patients', null, {});
    await queryInterface.bulkDelete('doctor_shifts', null, {});
    await queryInterface.bulkDelete('shifts', null, {});
    await queryInterface.bulkDelete('doctors', null, {});
    await queryInterface.bulkDelete('specialties', null, {});
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('role_permissions', null, {});
    await queryInterface.bulkDelete('permissions', null, {});
    await queryInterface.bulkDelete('roles', null, {});
    console.log('✅ Đã xóa toàn bộ dữ liệu!');
  }
};
