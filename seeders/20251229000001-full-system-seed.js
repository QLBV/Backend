'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    console.log('🌱 [1/23] Seeding roles...');
    await queryInterface.bulkInsert('roles', [
      { id: 1, name: 'ADMIN', description: 'Quản trị viên hệ thống', createdAt: now, updatedAt: now },
      { id: 2, name: 'DOCTOR', description: 'Bác sĩ', createdAt: now, updatedAt: now },
      { id: 3, name: 'PATIENT', description: 'Bệnh nhân', createdAt: now, updatedAt: now },
      { id: 4, name: 'RECEPTIONIST', description: 'Lễ tân', createdAt: now, updatedAt: now },
    ], {});

    console.log('🌱 [2/23] Seeding permissions...');
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
      { name: 'payment.create', description: 'Tạo thanh toán', module: 'payment' },
      // Payroll Management
      { name: 'payroll.view', description: 'Xem bảng lương', module: 'payroll' },
      { name: 'payroll.create', description: 'Tạo bảng lương', module: 'payroll' },
      { name: 'payroll.approve', description: 'Phê duyệt bảng lương', module: 'payroll' },
      // Report & Dashboard
      { name: 'report.view', description: 'Xem báo cáo', module: 'report' },
      { name: 'dashboard.view', description: 'Xem dashboard', module: 'dashboard' },
    ];

    await queryInterface.bulkInsert('permissions',
      permissions.map((p, index) => ({
        id: index + 1,
        ...p,
        createdAt: now,
        updatedAt: now
      }))
    , {});

    console.log('🌱 [3/23] Seeding role_permissions...');
    const rolePermissions = [];

    // ADMIN (roleId: 1) - Full permissions
    for (let i = 1; i <= permissions.length; i++) {
      rolePermissions.push({ roleId: 1, permissionId: i });
    }

    // DOCTOR (roleId: 2) - Quản lý bệnh nhân, lịch hẹn, khám bệnh, kê đơn
    [5,6,7,9,10,11,12,13,14,15,16,17,18,22,23,24,25,26,27,28,34].forEach(permId => {
      rolePermissions.push({ roleId: 2, permissionId: permId });
    });

    // PATIENT (roleId: 3) - Chỉ xem và đặt lịch hẹn
    [9,10,34].forEach(permId => {
      rolePermissions.push({ roleId: 3, permissionId: permId });
    });

    // RECEPTIONIST (roleId: 4) - Quản lý bệnh nhân, lịch hẹn, hóa đơn
    [5,6,7,9,10,11,12,13,14,15,26,27,28,29,34].forEach(permId => {
      rolePermissions.push({ roleId: 4, permissionId: permId });
    });

    await queryInterface.bulkInsert('role_permissions', rolePermissions, {});

    console.log('🌱 [4/23] Seeding users...');
    const hashedPassword = await bcrypt.hash('123456', 10);
    await queryInterface.bulkInsert('users', [
      // ADMIN
      { id: 1, email: 'admin@healthcare.com', password: hashedPassword, fullName: 'Quản Trị Viên', roleId: 1, isActive: 1, userCode: 'ADM001', avatar: null, oauth2Provider: null, oauth2Id: null, createdAt: now, updatedAt: now },

      // DOCTORS
      { id: 2, email: 'nguyen.van.a@healthcare.com', password: hashedPassword, fullName: 'BS. Nguyễn Văn A', roleId: 2, isActive: 1, userCode: 'DOC001', avatar: null, oauth2Provider: null, oauth2Id: null, createdAt: now, updatedAt: now },
      { id: 3, email: 'tran.thi.b@healthcare.com', password: hashedPassword, fullName: 'BS. Trần Thị B', roleId: 2, isActive: 1, userCode: 'DOC002', avatar: null, oauth2Provider: null, oauth2Id: null, createdAt: now, updatedAt: now },
      { id: 4, email: 'le.van.c@healthcare.com', password: hashedPassword, fullName: 'BS. Lê Văn C', roleId: 2, isActive: 1, userCode: 'DOC003', avatar: null, oauth2Provider: null, oauth2Id: null, createdAt: now, updatedAt: now },
      { id: 5, email: 'pham.thi.d@healthcare.com', password: hashedPassword, fullName: 'BS. Phạm Thị D', roleId: 2, isActive: 1, userCode: 'DOC004', avatar: null, oauth2Provider: null, oauth2Id: null, createdAt: now, updatedAt: now },

      // PATIENTS
      { id: 6, email: 'patient1@gmail.com', password: hashedPassword, fullName: 'Ngô Văn K', roleId: 3, isActive: 1, userCode: 'PAT001', avatar: null, oauth2Provider: null, oauth2Id: null, createdAt: now, updatedAt: now },
      { id: 7, email: 'patient2@gmail.com', password: hashedPassword, fullName: 'Đỗ Thị L', roleId: 3, isActive: 1, userCode: 'PAT002', avatar: null, oauth2Provider: null, oauth2Id: null, createdAt: now, updatedAt: now },
      { id: 8, email: 'patient3@gmail.com', password: hashedPassword, fullName: 'Bùi Văn M', roleId: 3, isActive: 1, userCode: 'PAT003', avatar: null, oauth2Provider: null, oauth2Id: null, createdAt: now, updatedAt: now },
      { id: 9, email: 'patient4@gmail.com', password: hashedPassword, fullName: 'Vũ Thị N', roleId: 3, isActive: 1, userCode: 'PAT004', avatar: null, oauth2Provider: null, oauth2Id: null, createdAt: now, updatedAt: now },
      { id: 10, email: 'patient5@gmail.com', password: hashedPassword, fullName: 'Đặng Văn O', roleId: 3, isActive: 1, userCode: 'PAT005', avatar: null, oauth2Provider: null, oauth2Id: null, createdAt: now, updatedAt: now },

      // RECEPTIONISTS
      { id: 11, email: 'receptionist1@healthcare.com', password: hashedPassword, fullName: 'Nguyễn Thị E', roleId: 4, isActive: 1, userCode: 'REC001', avatar: null, oauth2Provider: null, oauth2Id: null, createdAt: now, updatedAt: now },
      { id: 12, email: 'receptionist2@healthcare.com', password: hashedPassword, fullName: 'Trần Văn F', roleId: 4, isActive: 1, userCode: 'REC002', avatar: null, oauth2Provider: null, oauth2Id: null, createdAt: now, updatedAt: now },
    ], {});

    console.log('🌱 [5/23] Seeding specialties...');
    await queryInterface.bulkInsert('specialties', [
      { id: 1, name: 'Nội khoa', description: 'Chuyên khoa Nội tổng quát', createdAt: now, updatedAt: now },
      { id: 2, name: 'Ngoại khoa', description: 'Chuyên khoa Ngoại tổng quát', createdAt: now, updatedAt: now },
      { id: 3, name: 'Nhi khoa', description: 'Chuyên khoa Nhi', createdAt: now, updatedAt: now },
      { id: 4, name: 'Sản phụ khoa', description: 'Chuyên khoa Sản - Phụ khoa', createdAt: now, updatedAt: now },
      { id: 5, name: 'Tim mạch', description: 'Chuyên khoa Tim mạch', createdAt: now, updatedAt: now },
      { id: 6, name: 'Tai Mũi Họng', description: 'Chuyên khoa Tai Mũi Họng', createdAt: now, updatedAt: now },
    ], {});

    console.log('🌱 [6/23] Seeding doctors...');
    await queryInterface.bulkInsert('doctors', [
      { id: 1, doctorCode: 'BS001', userId: 2, specialtyId: 1, position: 'Trưởng khoa', degree: 'Tiến sĩ', description: 'Chuyên gia Nội khoa', createdAt: now, updatedAt: now },
      { id: 2, doctorCode: 'BS002', userId: 3, specialtyId: 3, position: 'Phó khoa', degree: 'Thạc sĩ', description: 'Bác sĩ Nhi khoa giàu kinh nghiệm', createdAt: now, updatedAt: now },
      { id: 3, doctorCode: 'BS003', userId: 4, specialtyId: 5, position: 'Bác sĩ', degree: 'Bác sĩ', description: 'Chuyên về tim mạch', createdAt: now, updatedAt: now },
      { id: 4, doctorCode: 'BS004', userId: 5, specialtyId: 2, position: 'Bác sĩ', degree: 'Thạc sĩ', description: 'Chuyên gia Ngoại khoa', createdAt: now, updatedAt: now },
    ], {});

    console.log('🌱 [7/23] Seeding shifts...');
    await queryInterface.bulkInsert('shifts', [
      { id: 1, name: 'Sáng', startTime: '07:00', endTime: '12:00', createdAt: now, updatedAt: now },
      { id: 2, name: 'Chiều', startTime: '13:00', endTime: '17:00', createdAt: now, updatedAt: now },
      { id: 3, name: 'Tối', startTime: '18:00', endTime: '21:00', createdAt: now, updatedAt: now },
    ], {});

    console.log('🌱 [8/23] Seeding doctor_shifts...');
    const doctorShifts = [];
    const today = new Date();
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
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

    console.log('🌱 [9/23] Seeding patients...');
    await queryInterface.bulkInsert('patients', [
      { id: 1, patientCode: 'BN001', fullName: 'Ngô Văn K', gender: 'MALE', dateOfBirth: '1990-05-15', avatar: null, cccd: '001090001234', userId: 6, isActive: 1, createdAt: now, updatedAt: now },
      { id: 2, patientCode: 'BN002', fullName: 'Đỗ Thị L', gender: 'FEMALE', dateOfBirth: '1985-08-20', avatar: null, cccd: '001085005678', userId: 7, isActive: 1, createdAt: now, updatedAt: now },
      { id: 3, patientCode: 'BN003', fullName: 'Bùi Văn M', gender: 'MALE', dateOfBirth: '2015-03-10', avatar: null, cccd: '001015009876', userId: 8, isActive: 1, createdAt: now, updatedAt: now },
      { id: 4, patientCode: 'BN004', fullName: 'Vũ Thị N', gender: 'FEMALE', dateOfBirth: '1978-12-05', avatar: null, cccd: '001078004321', userId: 9, isActive: 1, createdAt: now, updatedAt: now },
      { id: 5, patientCode: 'BN005', fullName: 'Đặng Văn O', gender: 'MALE', dateOfBirth: '1995-07-25', avatar: null, cccd: '001095008765', userId: 10, isActive: 1, createdAt: now, updatedAt: now },
    ], {});

    console.log('🌱 [10/23] Seeding patient_profiles...');
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

    console.log('🌱 [11/23] Seeding disease_categories...');
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

    console.log('🌱 [12/23] Seeding medicines...');
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

    console.log('🌱 [13/23] Seeding medicine_imports...');
    const importDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    await queryInterface.bulkInsert('medicine_imports', [
      { medicineId: 1, quantity: 1000, importPrice: 200, importDate, userId: 1, createdAt: now, updatedAt: now },
      { medicineId: 2, quantity: 500, importPrice: 1000, importDate, userId: 1, createdAt: now, updatedAt: now },
      { medicineId: 3, quantity: 2000, importPrice: 300, importDate, userId: 1, createdAt: now, updatedAt: now },
      { medicineId: 4, quantity: 300, importPrice: 1500, importDate, userId: 1, createdAt: now, updatedAt: now },
      { medicineId: 5, quantity: 400, importPrice: 2000, importDate, userId: 1, createdAt: now, updatedAt: now },
    ], {});

    console.log('🌱 [14/25] Seeding medicine_exports...');
    const exportDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000); // 15 ngày trước
    await queryInterface.bulkInsert('medicine_exports', [
      { medicineId: 1, quantity: 50, exportDate, userId: 1, reason: 'Hủy do hết hạn', createdAt: exportDate, updatedAt: exportDate },
      { medicineId: 7, quantity: 10, exportDate, userId: 1, reason: 'Hủy do bao bì hư hỏng', createdAt: exportDate, updatedAt: exportDate },
    ], {});

    console.log('🌱 [15/25] Seeding appointments (upcoming)...');
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    await queryInterface.bulkInsert('appointments', [
      { id: 1, patientId: 1, doctorId: 1, shiftId: 1, date: tomorrowStr, slotNumber: 1, bookingType: 'ONLINE', bookedBy: 'PATIENT', symptomInitial: 'Đau đầu, sốt nhẹ', status: 'WAITING', createdAt: now, updatedAt: now },
      { id: 2, patientId: 2, doctorId: 2, shiftId: 1, date: tomorrowStr, slotNumber: 1, bookingType: 'OFFLINE', bookedBy: 'RECEPTIONIST', symptomInitial: 'Ho, sổ mũi', status: 'WAITING', createdAt: now, updatedAt: now },
      { id: 3, patientId: 3, doctorId: 3, shiftId: 2, date: tomorrowStr, slotNumber: 1, bookingType: 'ONLINE', bookedBy: 'PATIENT', symptomInitial: 'Đau ngực', status: 'WAITING', createdAt: now, updatedAt: now },
      { id: 4, patientId: 4, doctorId: 4, shiftId: 1, date: tomorrowStr, slotNumber: 2, bookingType: 'OFFLINE', bookedBy: 'RECEPTIONIST', symptomInitial: 'Đau bụng', status: 'WAITING', createdAt: now, updatedAt: now },
      { id: 5, patientId: 5, doctorId: 1, shiftId: 2, date: tomorrowStr, slotNumber: 1, bookingType: 'ONLINE', bookedBy: 'PATIENT', symptomInitial: 'Khám tổng quát', status: 'WAITING', createdAt: now, updatedAt: now },
    ], {});

    console.log('🌱 [16/25] Seeding appointments (completed - yesterday)...');
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    await queryInterface.bulkInsert('appointments', [
      { id: 6, patientId: 1, doctorId: 1, shiftId: 1, date: yesterdayStr, slotNumber: 1, bookingType: 'OFFLINE', bookedBy: 'RECEPTIONIST', symptomInitial: 'Cảm cúm', status: 'CHECKED_IN', createdAt: yesterday, updatedAt: yesterday },
      { id: 7, patientId: 2, doctorId: 2, shiftId: 1, date: yesterdayStr, slotNumber: 2, bookingType: 'ONLINE', bookedBy: 'PATIENT', symptomInitial: 'Sốt cao', status: 'CHECKED_IN', createdAt: yesterday, updatedAt: yesterday },
    ], {});

    console.log('🌱 [17/25] Seeding visits...');
    await queryInterface.bulkInsert('visits', [
      { id: 1, appointmentId: 6, patientId: 1, doctorId: 1, checkInTime: yesterday, symptoms: 'Sốt, ho, đau họng', diseaseCategoryId: 2, diagnosis: 'Viêm họng cấp', note: 'Nghỉ ngơi, uống nhiều nước', status: 'COMPLETED', createdAt: yesterday, updatedAt: yesterday },
      { id: 2, appointmentId: 7, patientId: 2, doctorId: 2, checkInTime: yesterday, symptoms: 'Sốt cao, ói mửa', diseaseCategoryId: 3, diagnosis: 'Nhiễm khuẩn đường hô hấp', note: 'Uống thuốc đầy đủ theo đơn', status: 'COMPLETED', createdAt: yesterday, updatedAt: yesterday },
    ], {});

    console.log('🌱 [18/25] Seeding prescriptions...');
    await queryInterface.bulkInsert('prescriptions', [
      { id: 1, prescriptionCode: 'DT001', visitId: 1, doctorId: 1, patientId: 1, totalAmount: 15000, status: 'LOCKED', note: 'Uống đầy đủ theo chỉ định', createdAt: yesterday, updatedAt: yesterday },
      { id: 2, prescriptionCode: 'DT002', visitId: 2, doctorId: 2, patientId: 2, totalAmount: 35400, status: 'LOCKED', note: 'Tái khám sau 5 ngày', createdAt: yesterday, updatedAt: yesterday },
    ], {});

    console.log('🌱 [19/25] Seeding prescription_details...');
    await queryInterface.bulkInsert('prescription_details', [
      { id: 1, prescriptionId: 1, medicineId: 1, medicineName: 'Paracetamol 500mg', quantity: 10, unit: 'VIEN', unitPrice: 500, dosageMorning: 1, dosageNoon: 1, dosageAfternoon: 0, dosageEvening: 1, instruction: 'Uống sau ăn', createdAt: yesterday, updatedAt: yesterday },
      { id: 2, prescriptionId: 1, medicineId: 2, medicineName: 'Amoxicillin 500mg', quantity: 5, unit: 'VIEN', unitPrice: 2000, dosageMorning: 1, dosageNoon: 0, dosageAfternoon: 0, dosageEvening: 1, instruction: 'Uống trước ăn 30 phút', createdAt: yesterday, updatedAt: yesterday },
      { id: 3, prescriptionId: 2, medicineId: 2, medicineName: 'Amoxicillin 500mg', quantity: 14, unit: 'VIEN', unitPrice: 2000, dosageMorning: 1, dosageNoon: 0, dosageAfternoon: 0, dosageEvening: 1, instruction: 'Uống sau ăn', createdAt: yesterday, updatedAt: yesterday },
      { id: 4, prescriptionId: 2, medicineId: 6, medicineName: 'Cetirizine 10mg', quantity: 5, unit: 'VIEN', unitPrice: 1000, dosageMorning: 0, dosageNoon: 0, dosageAfternoon: 0, dosageEvening: 1, instruction: 'Uống trước khi ngủ', createdAt: yesterday, updatedAt: yesterday },
      { id: 5, prescriptionId: 2, medicineId: 3, medicineName: 'Vitamin C 500mg', quantity: 3, unit: 'VIEN', unitPrice: 800, dosageMorning: 1, dosageNoon: 0, dosageAfternoon: 0, dosageEvening: 0, instruction: 'Uống sau ăn sáng', createdAt: yesterday, updatedAt: yesterday },
    ], {});

    console.log('🌱 [20/25] Seeding invoices...');
    await queryInterface.bulkInsert('invoices', [
      { id: 1, invoiceCode: 'HD001', visitId: 1, patientId: 1, doctorId: 1, examinationFee: 200000, medicineTotalAmount: 15000, discount: 0, totalAmount: 215000, paymentStatus: 'PAID', paidAmount: 215000, note: null, createdBy: 11, createdAt: yesterday, updatedAt: yesterday },
      { id: 2, invoiceCode: 'HD002', visitId: 2, patientId: 2, doctorId: 2, examinationFee: 200000, medicineTotalAmount: 35400, discount: 0, totalAmount: 235400, paymentStatus: 'PAID', paidAmount: 235400, note: null, createdBy: 11, createdAt: yesterday, updatedAt: yesterday },
    ], {});

    console.log('🌱 [21/25] Seeding invoice_items...');
    await queryInterface.bulkInsert('invoice_items', [
      { invoiceId: 1, itemType: 'EXAMINATION', description: 'Phí khám bệnh', prescriptionDetailId: null, medicineName: null, medicineCode: null, quantity: 1, unitPrice: 200000, subtotal: 200000, createdAt: yesterday, updatedAt: yesterday },
      { invoiceId: 1, itemType: 'MEDICINE', description: null, prescriptionDetailId: 1, medicineName: 'Paracetamol 500mg', medicineCode: 'MED001', quantity: 10, unitPrice: 500, subtotal: 5000, createdAt: yesterday, updatedAt: yesterday },
      { invoiceId: 1, itemType: 'MEDICINE', description: null, prescriptionDetailId: 2, medicineName: 'Amoxicillin 500mg', medicineCode: 'MED002', quantity: 5, unitPrice: 2000, subtotal: 10000, createdAt: yesterday, updatedAt: yesterday },
      { invoiceId: 2, itemType: 'EXAMINATION', description: 'Phí khám bệnh', prescriptionDetailId: null, medicineName: null, medicineCode: null, quantity: 1, unitPrice: 200000, subtotal: 200000, createdAt: yesterday, updatedAt: yesterday },
      { invoiceId: 2, itemType: 'MEDICINE', description: null, prescriptionDetailId: 3, medicineName: 'Amoxicillin 500mg', medicineCode: 'MED002', quantity: 14, unitPrice: 2000, subtotal: 28000, createdAt: yesterday, updatedAt: yesterday },
      { invoiceId: 2, itemType: 'MEDICINE', description: null, prescriptionDetailId: 4, medicineName: 'Cetirizine 10mg', medicineCode: 'MED006', quantity: 5, unitPrice: 1000, subtotal: 5000, createdAt: yesterday, updatedAt: yesterday },
      { invoiceId: 2, itemType: 'MEDICINE', description: null, prescriptionDetailId: 5, medicineName: 'Vitamin C 500mg', medicineCode: 'MED003', quantity: 3, unitPrice: 800, subtotal: 2400, createdAt: yesterday, updatedAt: yesterday },
    ], {});

    console.log('🌱 [22/25] Seeding payments...');
    await queryInterface.bulkInsert('payments', [
      { invoiceId: 1, amount: 215000, paymentMethod: 'CASH', paymentDate: yesterday, reference: null, note: 'Thanh toán tiền mặt', createdBy: 11, createdAt: yesterday, updatedAt: yesterday },
      { invoiceId: 2, amount: 235400, paymentMethod: 'BANK_TRANSFER', paymentDate: yesterday, reference: 'TXN123456789', note: 'Chuyển khoản ngân hàng', createdBy: 11, createdAt: yesterday, updatedAt: yesterday },
    ], {});

    console.log('🌱 [23/25] Seeding attendance...');
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
        attendanceRecords.push({
          userId,
          date: workDateStr,
          status: isAbsent ? 'ABSENT' : 'PRESENT',
          note: isAbsent ? 'Nghỉ phép' : null,
          createdAt: workDate,
          updatedAt: workDate
        });
      }
      // Receptionists
      for (let userId = 11; userId <= 12; userId++) {
        const isAbsent = Math.random() < 0.05;
        attendanceRecords.push({
          userId,
          date: workDateStr,
          status: isAbsent ? 'ABSENT' : 'PRESENT',
          note: isAbsent ? 'Nghỉ phép' : null,
          createdAt: workDate,
          updatedAt: workDate
        });
      }
    }
    await queryInterface.bulkInsert('attendance', attendanceRecords, {});

    console.log('🌱 [24/25] Seeding payrolls...');
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

    console.log('🌱 [25/25] Seeding notifications...');
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

    console.log('✅ Seed dữ liệu hoàn tất! Tổng cộng 25 bảng đã được seed.');
    console.log('📊 Thống kê:');
    console.log('   - 4 Roles: ADMIN, DOCTOR, PATIENT, RECEPTIONIST');
    console.log('   - 12 Users: 1 Admin, 4 Doctors, 5 Patients, 2 Receptionists');
    console.log('   - 5 Patients với đầy đủ thông tin liên hệ');
    console.log('   - 4 Doctors với 6 chuyên khoa');
    console.log('   - 10 Medicines');
    console.log('   - 2 Medicine Exports');
    console.log('   - 7 Appointments (5 upcoming, 2 completed)');
    console.log('   - 2 Visits hoàn thành với đơn thuốc và hóa đơn');
    console.log('   - 8 Notifications (cho bệnh nhân, bác sĩ và admin)');
  },

  async down(queryInterface, Sequelize) {
    console.log('🗑️  Xóa toàn bộ dữ liệu...');
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
