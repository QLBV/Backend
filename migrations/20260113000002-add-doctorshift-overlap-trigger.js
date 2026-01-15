

module.exports = {
  async up(queryInterface, Sequelize) {
    
    await queryInterface.sequelize.query(`
      CREATE TRIGGER check_doctor_shift_overlap_before_insert
      BEFORE INSERT ON doctor_shifts
      FOR EACH ROW
      BEGIN
        DECLARE overlap_count INT;

        -- Check if doctor already has an overlapping shift on this date
        SELECT COUNT(*) INTO overlap_count
        FROM doctor_shifts ds
        JOIN shifts s1 ON ds.shiftId = s1.id
        JOIN shifts s2 ON NEW.shiftId = s2.id
        WHERE ds.doctorId = NEW.doctorId
          AND ds.workDate = NEW.workDate
          AND ds.status = 'ACTIVE'
          AND s1.startTime < s2.endTime
          AND s2.startTime < s1.endTime;

        IF overlap_count > 0 THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Doctor already assigned to overlapping shift on this date';
        END IF;
      END
    `);

    console.log(' Created trigger: check_doctor_shift_overlap_before_insert');

    
    await queryInterface.sequelize.query(`
      CREATE TRIGGER check_doctor_shift_overlap_before_update
      BEFORE UPDATE ON doctor_shifts
      FOR EACH ROW
      BEGIN
        DECLARE overlap_count INT;

        -- Only check if shift, date, or status is being changed
        IF NEW.shiftId != OLD.shiftId OR NEW.workDate != OLD.workDate OR NEW.status != OLD.status THEN
          SELECT COUNT(*) INTO overlap_count
          FROM doctor_shifts ds
          JOIN shifts s1 ON ds.shiftId = s1.id
          JOIN shifts s2 ON NEW.shiftId = s2.id
          WHERE ds.doctorId = NEW.doctorId
            AND ds.workDate = NEW.workDate
            AND ds.status = 'ACTIVE'
            AND ds.id != NEW.id
            AND s1.startTime < s2.endTime
            AND s2.startTime < s1.endTime;

          IF overlap_count > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Update would create overlapping shifts';
          END IF;
        END IF;
      END
    `);

    console.log(' Created trigger: check_doctor_shift_overlap_before_update');
  },

  async down(queryInterface, Sequelize) {
    
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS check_doctor_shift_overlap_before_insert
    `);

    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS check_doctor_shift_overlap_before_update
    `);

    console.log(' Removed doctor shift overlap triggers');
  }
};
