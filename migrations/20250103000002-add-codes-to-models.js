'use strict';


module.exports = {
  async up(queryInterface, Sequelize) {
    
    await queryInterface.addColumn('medicine_imports', 'importCode', {
      type: Sequelize.STRING(50),
      allowNull: true, 
      unique: true,
      after: 'id',
    });

    
    await queryInterface.addColumn('medicine_exports', 'exportCode', {
      type: Sequelize.STRING(50),
      allowNull: true, 
      unique: true,
      after: 'id',
    });

    
    await queryInterface.addColumn('visits', 'visitCode', {
      type: Sequelize.STRING(50),
      allowNull: true, 
      unique: true,
      after: 'id',
    });

    
    await queryInterface.addColumn('appointments', 'appointmentCode', {
      type: Sequelize.STRING(50),
      allowNull: true, 
      unique: true,
      after: 'id',
    });

    
    
    
    
    
    const [imports] = await queryInterface.sequelize.query(`
      SELECT id, createdAt FROM medicine_imports WHERE importCode IS NULL
    `);
    for (const imp of imports) {
      const dateStr = new Date(imp.createdAt).toISOString().slice(0, 10).replace(/-/g, '');
      const code = `IMP-${dateStr}-${String(imp.id).padStart(5, '0')}`;
      await queryInterface.sequelize.query(`
        UPDATE medicine_imports SET importCode = '${code}' WHERE id = ${imp.id}
      `);
    }

    
    const [exports] = await queryInterface.sequelize.query(`
      SELECT id, createdAt FROM medicine_exports WHERE exportCode IS NULL
    `);
    for (const exp of exports) {
      const dateStr = new Date(exp.createdAt).toISOString().slice(0, 10).replace(/-/g, '');
      const code = `EXP-${dateStr}-${String(exp.id).padStart(5, '0')}`;
      await queryInterface.sequelize.query(`
        UPDATE medicine_exports SET exportCode = '${code}' WHERE id = ${exp.id}
      `);
    }

    
    const [visits] = await queryInterface.sequelize.query(`
      SELECT id, createdAt FROM visits WHERE visitCode IS NULL
    `);
    for (const visit of visits) {
      const dateStr = new Date(visit.createdAt).toISOString().slice(0, 10).replace(/-/g, '');
      const code = `VIS-${dateStr}-${String(visit.id).padStart(5, '0')}`;
      await queryInterface.sequelize.query(`
        UPDATE visits SET visitCode = '${code}' WHERE id = ${visit.id}
      `);
    }

    
    const [appointments] = await queryInterface.sequelize.query(`
      SELECT id, createdAt FROM appointments WHERE appointmentCode IS NULL
    `);
    for (const apt of appointments) {
      const dateStr = new Date(apt.createdAt).toISOString().slice(0, 10).replace(/-/g, '');
      const code = `APT-${dateStr}-${String(apt.id).padStart(5, '0')}`;
      await queryInterface.sequelize.query(`
        UPDATE appointments SET appointmentCode = '${code}' WHERE id = ${apt.id}
      `);
    }

    
    await queryInterface.changeColumn('medicine_imports', 'importCode', {
      type: Sequelize.STRING(50),
      allowNull: false,
      unique: true,
    });

    await queryInterface.changeColumn('medicine_exports', 'exportCode', {
      type: Sequelize.STRING(50),
      allowNull: false,
      unique: true,
    });

    await queryInterface.changeColumn('visits', 'visitCode', {
      type: Sequelize.STRING(50),
      allowNull: false,
      unique: true,
    });

    await queryInterface.changeColumn('appointments', 'appointmentCode', {
      type: Sequelize.STRING(50),
      allowNull: false,
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('medicine_imports', 'importCode');
    await queryInterface.removeColumn('medicine_exports', 'exportCode');
    await queryInterface.removeColumn('visits', 'visitCode');
    await queryInterface.removeColumn('appointments', 'appointmentCode');
  },
};
