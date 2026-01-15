'use strict';


module.exports = {
  async up(queryInterface, Sequelize) {
    const workDate = '2026-01-11';
    const now = new Date();

    
    const [existing] = await queryInterface.sequelize.query(
      `SELECT id FROM doctor_shifts WHERE workDate = '${workDate}' LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existing && existing.length > 0) {
      console.log(`️  Doctor shifts cho ngày ${workDate} đã tồn tại, bỏ qua...`);
      return;
    }

    
    const [doctors] = await queryInterface.sequelize.query(
      `SELECT id FROM doctors WHERE id IN (1, 2, 3, 4)`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const [shifts] = await queryInterface.sequelize.query(
      `SELECT id FROM shifts WHERE id IN (1, 2, 3)`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!doctors || doctors.length === 0) {
      console.log('️  Không tìm thấy doctors. Vui lòng chạy seeder chính trước.');
      return;
    }

    if (!shifts || shifts.length === 0) {
      console.log('️  Không tìm thấy shifts. Vui lòng chạy seeder chính trước.');
      return;
    }

    
    const doctorShifts = [
      
      { doctorId: 1, shiftId: 1, workDate, status: 'ACTIVE', replacedBy: null, cancelReason: null, createdAt: now, updatedAt: now },
      { doctorId: 1, shiftId: 2, workDate, status: 'ACTIVE', replacedBy: null, cancelReason: null, createdAt: now, updatedAt: now },
      
      
      { doctorId: 2, shiftId: 1, workDate, status: 'ACTIVE', replacedBy: null, cancelReason: null, createdAt: now, updatedAt: now },
      
      
      { doctorId: 3, shiftId: 2, workDate, status: 'ACTIVE', replacedBy: null, cancelReason: null, createdAt: now, updatedAt: now },
      { doctorId: 3, shiftId: 3, workDate, status: 'ACTIVE', replacedBy: null, cancelReason: null, createdAt: now, updatedAt: now },
      
      
      { doctorId: 4, shiftId: 1, workDate, status: 'ACTIVE', replacedBy: null, cancelReason: null, createdAt: now, updatedAt: now },
      { doctorId: 4, shiftId: 3, workDate, status: 'ACTIVE', replacedBy: null, cancelReason: null, createdAt: now, updatedAt: now }
    ];

    try {
      await queryInterface.bulkInsert('doctor_shifts', doctorShifts, {
        ignoreDuplicates: true
      });
      console.log(` Đã tạo ${doctorShifts.length} doctor shifts cho ngày ${workDate}`);
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError' || error.name === 'SequelizeValidationError') {
        console.log(`️  Một số doctor shifts cho ngày ${workDate} đã tồn tại, bỏ qua...`);
      } else {
        throw error;
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('doctor_shifts', {
      workDate: '2026-01-11'
    }, {});
    console.log(' Đã xóa doctor shifts cho ngày 2026-01-11');
  }
};
