'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('employees', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED
      },
      employeeCode: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      specialtyId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'specialties',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      position: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      degree: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      joiningDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    
    
    const [doctors] = await queryInterface.sequelize.query('SELECT * FROM doctors');
    if (doctors && doctors.length > 0) {
      const employees = doctors.map(doc => ({
        employeeCode: doc.doctorCode.replace('BS', 'EMP'),
        userId: doc.userId,
        specialtyId: doc.specialtyId,
        position: doc.position,
        degree: doc.degree,
        description: doc.description,
        joiningDate: doc.createdAt,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      await queryInterface.bulkInsert('employees', employees);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('employees');
  }
};
