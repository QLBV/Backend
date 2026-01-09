'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, get all doctors and shifts
    const doctors = await queryInterface.sequelize.query(
      `SELECT id FROM doctors LIMIT 5`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const shifts = await queryInterface.sequelize.query(
      `SELECT id, name FROM shifts`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (doctors.length === 0) {
      console.log('⚠️  No doctors found. Please seed doctors first.');
      return;
    }

    if (shifts.length === 0) {
      console.log('⚠️  No shifts found. Please seed shifts first.');
      return;
    }

    console.log(`📋 Found ${doctors.length} doctors and ${shifts.length} shifts`);

    // Create shift templates for each doctor
    const templates = [];
    const now = new Date();

    // Doctor 1: Works Monday, Wednesday, Friday - Morning shift
    if (doctors[0] && shifts[0]) {
      templates.push(
        {
          doctor_id: doctors[0].id,
          shift_id: shifts[0].id,
          day_of_week: 1, // Monday
          is_active: true,
          notes: 'Regular weekly schedule - Morning shift',
          created_at: now,
          updated_at: now,
        },
        {
          doctor_id: doctors[0].id,
          shift_id: shifts[0].id,
          day_of_week: 3, // Wednesday
          is_active: true,
          notes: 'Regular weekly schedule - Morning shift',
          created_at: now,
          updated_at: now,
        },
        {
          doctor_id: doctors[0].id,
          shift_id: shifts[0].id,
          day_of_week: 5, // Friday
          is_active: true,
          notes: 'Regular weekly schedule - Morning shift',
          created_at: now,
          updated_at: now,
        }
      );
    }

    // Doctor 1: Works Tuesday, Thursday - Afternoon shift
    if (doctors[0] && shifts[1]) {
      templates.push(
        {
          doctor_id: doctors[0].id,
          shift_id: shifts[1].id,
          day_of_week: 2, // Tuesday
          is_active: true,
          notes: 'Regular weekly schedule - Afternoon shift',
          created_at: now,
          updated_at: now,
        },
        {
          doctor_id: doctors[0].id,
          shift_id: shifts[1].id,
          day_of_week: 4, // Thursday
          is_active: true,
          notes: 'Regular weekly schedule - Afternoon shift',
          created_at: now,
          updated_at: now,
        }
      );
    }

    // Doctor 2: Works Monday to Friday - Morning shift
    if (doctors[1] && shifts[0]) {
      for (let day = 1; day <= 5; day++) {
        templates.push({
          doctor_id: doctors[1].id,
          shift_id: shifts[0].id,
          day_of_week: day,
          is_active: true,
          notes: 'Full week - Morning shift',
          created_at: now,
          updated_at: now,
        });
      }
    }

    // Doctor 3: Works Tuesday, Thursday, Saturday - Afternoon shift
    if (doctors[2] && shifts[1]) {
      templates.push(
        {
          doctor_id: doctors[2].id,
          shift_id: shifts[1].id,
          day_of_week: 2, // Tuesday
          is_active: true,
          notes: 'Part-time schedule - Afternoon shift',
          created_at: now,
          updated_at: now,
        },
        {
          doctor_id: doctors[2].id,
          shift_id: shifts[1].id,
          day_of_week: 4, // Thursday
          is_active: true,
          notes: 'Part-time schedule - Afternoon shift',
          created_at: now,
          updated_at: now,
        },
        {
          doctor_id: doctors[2].id,
          shift_id: shifts[1].id,
          day_of_week: 6, // Saturday
          is_active: true,
          notes: 'Part-time schedule - Afternoon shift',
          created_at: now,
          updated_at: now,
        }
      );
    }

    // Doctor 4: Works Monday, Wednesday - Evening shift (if exists)
    if (doctors[3] && shifts[2]) {
      templates.push(
        {
          doctor_id: doctors[3].id,
          shift_id: shifts[2].id,
          day_of_week: 1, // Monday
          is_active: true,
          notes: 'Evening schedule',
          created_at: now,
          updated_at: now,
        },
        {
          doctor_id: doctors[3].id,
          shift_id: shifts[2].id,
          day_of_week: 3, // Wednesday
          is_active: true,
          notes: 'Evening schedule',
          created_at: now,
          updated_at: now,
        }
      );
    }

    // Doctor 5: Works Saturday, Sunday - Morning and Afternoon shifts (Weekend doctor)
    if (doctors[4]) {
      if (shifts[0]) {
        templates.push(
          {
            doctor_id: doctors[4].id,
            shift_id: shifts[0].id,
            day_of_week: 6, // Saturday
            is_active: true,
            notes: 'Weekend doctor - Morning shift',
            created_at: now,
            updated_at: now,
          },
          {
            doctor_id: doctors[4].id,
            shift_id: shifts[0].id,
            day_of_week: 7, // Sunday
            is_active: true,
            notes: 'Weekend doctor - Morning shift',
            created_at: now,
            updated_at: now,
          }
        );
      }

      if (shifts[1]) {
        templates.push(
          {
            doctor_id: doctors[4].id,
            shift_id: shifts[1].id,
            day_of_week: 6, // Saturday
            is_active: true,
            notes: 'Weekend doctor - Afternoon shift',
            created_at: now,
            updated_at: now,
          },
          {
            doctor_id: doctors[4].id,
            shift_id: shifts[1].id,
            day_of_week: 7, // Sunday
            is_active: true,
            notes: 'Weekend doctor - Afternoon shift',
            created_at: now,
            updated_at: now,
          }
        );
      }
    }

    // Check if templates already exist
    const [existingTemplates] = await queryInterface.sequelize.query('SELECT id FROM shift_templates LIMIT 1');
    if (existingTemplates.length === 0) {
      if (templates.length > 0) {
        await queryInterface.bulkInsert('shift_templates', templates, {});
        console.log(`✅ Inserted ${templates.length} shift templates`);
      } else {
        console.log('⚠️  No templates to insert');
      }
    } else {
      console.log('   ⚠️  Shift templates đã tồn tại, bỏ qua...');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('shift_templates', null, {});
    console.log('✅ Deleted all shift templates');
  }
};
