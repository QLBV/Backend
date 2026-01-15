import sequelize from "../../config/database";
import Patient from "../../models/Patient";
import PatientProfile from "../../models/PatientProfile";
import { Op } from "sequelize";

interface ProfileInput {
  type: "phone" | "email" | "address";
  value: string;
  city?: string;
  ward?: string;
  isPrimary?: boolean;
}

interface SetupPatientProfileInput {
  fullName: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth: string;
  cccd: string;
  profiles: ProfileInput[];
}



export const setupPatientProfileService = async (
  userId: number,
  data: SetupPatientProfileInput
) => {
  const transaction = await sequelize.transaction();
  try {
    
    let patient = await Patient.findOne({
      where: { userId },
      transaction,
    });

    
    if (patient && patient.isActive && patient.patientCode) {
      throw new Error("PATIENT_ALREADY_SETUP");
    }

    
    if (!/^\d{12}$/.test(data.cccd.trim())) {
      throw new Error("CCCD_INVALID_FORMAT");
    }

    
    const dob = new Date(data.dateOfBirth);
    if (isNaN(dob.getTime())) {
      throw new Error("DOB_INVALID_FORMAT");
    }
    if (dob > new Date()) {
      throw new Error("DOB_CANNOT_BE_FUTURE");
    }

    
    const existingCCCD = await Patient.findOne({
      where: {
        cccd: data.cccd.trim(),
        ...(patient ? { id: { [Op.ne]: patient.id } } : {}),
      },
      transaction,
    });

    if (existingCCCD) {
      throw new Error("CCCD_ALREADY_EXISTS");
    }

    
    if (!patient) {
      patient = await Patient.create(
        {
          userId,
          fullName: data.fullName.trim(),
          gender: data.gender,
          dateOfBirth: dob,
          cccd: data.cccd.trim(),
          avatar: null,
          isActive: true,
        },
        { transaction }
      );

      
      const patientCode = "BN" + String(patient.id).padStart(6, "0");
      await patient.update({ patientCode }, { transaction });
    } else {
      
      await patient.update(
        {
          fullName: data.fullName.trim(),
          gender: data.gender,
          dateOfBirth: dob,
          cccd: data.cccd.trim(),
        },
        { transaction }
      );
    }

    
    await PatientProfile.destroy({
      where: { patientId: patient.id },
      transaction,
    });

    
    const profiles = data.profiles.map((p) => ({
      patientId: patient.id,
      type: p.type,
      value: p.value.trim(),
      city: p.city?.trim() || undefined,
      ward: p.ward?.trim() || undefined,
      isPrimary: p.isPrimary ?? false,
    }));

    if (profiles.length > 0) {
      await PatientProfile.bulkCreate(profiles, { transaction });
    }

    
    await patient.reload({
      include: [{ model: PatientProfile, as: "profiles" }],
      transaction,
    });

    await transaction.commit();

    
    const updatedPatient = await Patient.findByPk(patient.id, {
      include: [{ model: PatientProfile, as: "profiles" }],
    });

    if (!updatedPatient) {
      throw new Error("Failed to reload patient after setup");
    }

    console.log(" Patient profile setup successfully:", {
      patientId: updatedPatient.id,
      patientCode: updatedPatient.patientCode,
      profilesCount: updatedPatient.profiles?.length || 0,
    });

    return updatedPatient;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};



export const createPatientService = async (
  data: SetupPatientProfileInput
) => {
  const transaction = await sequelize.transaction();
  try {
    
    if (data.cccd && data.cccd.trim()) {
      if (!/^\d{12}$/.test(data.cccd.trim())) {
        throw new Error("CCCD_INVALID_FORMAT");
      }

      
      const existingCCCD = await Patient.findOne({
        where: {
          cccd: data.cccd.trim()
        },
        transaction,
      });

      if (existingCCCD) {
        throw new Error("CCCD_ALREADY_EXISTS");
      }
    }

    
    const dob = new Date(data.dateOfBirth);
    if (isNaN(dob.getTime())) {
      throw new Error("DOB_INVALID_FORMAT");
    }
    if (dob > new Date()) {
      throw new Error("DOB_CANNOT_BE_FUTURE");
    }

    
    const patient = await Patient.create(
      {
        userId: undefined, 
        fullName: data.fullName.trim(),
        gender: data.gender,
        dateOfBirth: dob,
        cccd: data.cccd && data.cccd.trim() ? data.cccd.trim() : undefined,
        avatar: null,
        isActive: true,
      },
      { transaction }
    );

    
    const patientCode = "BN" + String(patient.id).padStart(6, "0");
    await patient.update({ patientCode }, { transaction });

    
    const profiles = data.profiles.map((p) => ({
      patientId: patient.id,
      type: p.type,
      value: p.value.trim(),
      city: p.city?.trim() || undefined,
      ward: p.ward?.trim() || undefined,
      isPrimary: p.isPrimary ?? false,
    }));

    if (profiles.length > 0) {
      await PatientProfile.bulkCreate(profiles, { transaction });
    }

    
    await patient.reload({
      include: [{ model: PatientProfile, as: "profiles" }],
      transaction,
    });

    await transaction.commit();

    return patient;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};



export const getPatientsService = async (
  page = 1,
  limit = 10,
  filters: {
    search?: string;
    gender?: string;
    isActive?: boolean | "all"; 
    dateOfBirthFrom?: string;
    dateOfBirthTo?: string;
    profileKeyword?: string;
  } = {}
) => {
  const offset = (page - 1) * limit;
  const where: any = {};

  // Default to active only unless "all" is specified or specific status is requested
  if (filters.isActive === "all") {
    // No filter on isActive
  } else if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  } else {
    where.isActive = true;
  }

  if (filters.gender && filters.gender !== "all") {
    where.gender = filters.gender;
  }

  if (filters.dateOfBirthFrom || filters.dateOfBirthTo) {
    where.dateOfBirth = {};
    if (filters.dateOfBirthFrom) {
      where.dateOfBirth[Op.gte] = new Date(filters.dateOfBirthFrom);
    }
    if (filters.dateOfBirthTo) {
      where.dateOfBirth[Op.lte] = new Date(filters.dateOfBirthTo);
    }
  }

  const search = filters.search;
  if (search) {
    where[Op.or] = [
      { cccd: { [Op.like]: `%${search}%` } },
      { fullName: { [Op.like]: `%${search}%` } },
      { patientCode: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
    ];
  }

  // Handle profileKeyword - search in User email or Profiles
  // This is complex because profiles are in a separate table/association.
  // Ideally we would add to the where clause, but it requires including models with where.
  // For simplicity, if profileKeyword is provided, we might interpret it as just part of general search 
  // or add specific logic.
  // Given the current structure, we can try to search in profiles if needed, 
  // but let's stick to the requested simple mapping if possible or just ignore profileKeyword for now 
  // unless we want to do a join search. 
  // Since `search` already checks `phone` (which is a profile value effectively or cached on patient), 
  // maybe we just rely on `search` for now and map `profileKeyword` to `search` in controller if needed, 
  // or merge them.
  // Let's refine the search block to include profile values if possible or just keep "search" doing the heavy lifting.
  
  return Patient.findAndCountAll({
    where,
    include: [
      { 
        model: PatientProfile, 
        as: "profiles",
        // If we wanted to filter by profileKeyword:
        // where: filters.profileKeyword ? { value: { [Op.like]: `%${filters.profileKeyword}%` } } : undefined
      },
      { model: require( "../../models/User").default, as: "user", attributes: ["email"] },
    ],
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    distinct: true,
  });
};

export const getPatientByIdService = async (id: number) => {
  const patient = await Patient.findOne({
    where: { id, isActive: true },
    include: [{ model: PatientProfile, as: "profiles" }],
  });
  if (!patient) {
    throw new Error("PATIENT_NOT_FOUND");
  }
  return patient;
};

export const getPatientByCccdService = async (cccd: string) => {
  const patient = await Patient.findOne({
    where: { cccd, isActive: true },
    include: [{ model: PatientProfile, as: "profiles" }],
  });
  if (!patient) {
    throw new Error("PATIENT_NOT_FOUND");
  }
  return patient;
};



export const updatePatientService = async (id: number, data: any) => {
  return sequelize.transaction(async (t) => {
    try {
      const patient = await Patient.findByPk(id, { transaction: t });
      if (!patient || !patient.isActive) {
        throw new Error("PATIENT_NOT_FOUND");
      }

    
    const updateData: any = {
      fullName: data.fullName ? data.fullName.trim() : patient.fullName,
      gender: data.gender ?? patient.gender,
      dateOfBirth: data.dateOfBirth
        ? new Date(data.dateOfBirth)
        : patient.dateOfBirth,
    };

    
    if (data.bloodType !== undefined) {
      updateData.bloodType = data.bloodType || null;
    }
    if (data.height !== undefined) {
      updateData.height = data.height ? parseFloat(data.height) : null;
    }
    if (data.weight !== undefined) {
      updateData.weight = data.weight ? parseFloat(data.weight) : null;
    }
    if (data.chronicDiseases !== undefined) {
      updateData.chronicDiseases = Array.isArray(data.chronicDiseases) 
        ? data.chronicDiseases.filter((d: string) => d && d.trim()) 
        : [];
      
      console.log(" Updating chronicDiseases:", updateData.chronicDiseases);
    }
    if (data.allergies !== undefined) {
      updateData.allergies = Array.isArray(data.allergies) 
        ? data.allergies.filter((a: string) => a && a.trim()) 
        : [];
      
      console.log(" Updating allergies:", updateData.allergies);
    }

    console.log(" Updating patient with data:", {
      id,
      updateData,
      chronicDiseases: updateData.chronicDiseases,
      allergies: updateData.allergies,
      updateDataKeys: Object.keys(updateData),
    });

    try {
      await patient.update(updateData, { transaction: t });
      console.log(" Patient.update() completed successfully");
    } catch (updateError: any) {
      console.error(" Patient.update() failed:", updateError.message);
      console.error("Update error details:", {
        code: updateError.code,
        sqlState: updateError.sqlState,
        sqlMessage: updateError.sqlMessage,
      });
      throw updateError;
    }

    
    if (Array.isArray(data.profiles)) {
      
      await PatientProfile.destroy({
        where: { patientId: id },
        transaction: t,
      });

      
      const profiles = data.profiles.map((p: any) => ({
        patientId: id,
        type: p.type,
        value: p.value.trim(),
        city: p.city?.trim() || undefined,
        ward: p.ward?.trim() || undefined,
        isPrimary: p.isPrimary ?? false,
      }));

      if (profiles.length > 0) {
        await PatientProfile.bulkCreate(profiles, { transaction: t });
      }
    }

    
    const updatedPatient = await Patient.findByPk(id, {
      include: [{ model: PatientProfile, as: "profiles" }],
      transaction: t,
    });

    
    if (updatedPatient) {
      
      if (updatedPatient.chronicDiseases) {
        if (typeof updatedPatient.chronicDiseases === 'string') {
          try {
            (updatedPatient as any).chronicDiseases = JSON.parse(updatedPatient.chronicDiseases);
          } catch (e) {
            console.error("Error parsing chronicDiseases:", e);
            (updatedPatient as any).chronicDiseases = [];
          }
        } else if (!Array.isArray(updatedPatient.chronicDiseases)) {
          (updatedPatient as any).chronicDiseases = [];
        }
      } else {
        (updatedPatient as any).chronicDiseases = [];
      }

      if (updatedPatient.allergies) {
        if (typeof updatedPatient.allergies === 'string') {
          try {
            (updatedPatient as any).allergies = JSON.parse(updatedPatient.allergies);
          } catch (e) {
            console.error("Error parsing allergies:", e);
            (updatedPatient as any).allergies = [];
          }
        } else if (!Array.isArray(updatedPatient.allergies)) {
          (updatedPatient as any).allergies = [];
        }
      } else {
        (updatedPatient as any).allergies = [];
      }

      console.log(" Updated patient with chronicDiseases:", (updatedPatient as any).chronicDiseases);
      console.log(" Updated patient with allergies:", (updatedPatient as any).allergies);
    }

    return updatedPatient;
    } catch (error: any) {
      console.error(" Error in updatePatientService:", {
        message: error.message,
        code: error.code,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        stack: error.stack,
      });
      throw error;
    }
  });
};



export const deletePatientService = async (id: number) => {
  const transaction = await sequelize.transaction();
  try {
    const patient = await Patient.findByPk(id, { transaction });
    if (!patient || !patient.isActive) {
      throw new Error("PATIENT_NOT_FOUND");
    }

    await patient.update({ isActive: false }, { transaction });

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
