import forge from "node-forge";
import crypto from "crypto";


export const generateKeyPair = () => {
  const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
  return {
    privateKey: forge.pki.privateKeyToPem(keypair.privateKey),
    publicKey: forge.pki.publicKeyToPem(keypair.publicKey),
  };
};


export const signPrescription = (
  data: string,
  privateKeyPem: string
): string => {
  try {
    
    const hash = crypto.createHash("sha256").update(data).digest();

    
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);

    
    const signature = privateKey.sign(
      forge.md.sha256.create().update(hash.toString("binary"))
    );

    
    return forge.util.encode64(signature);
  } catch (error) {
    console.error("Error signing prescription:", error);
    throw new Error("Failed to sign prescription");
  }
};


export const verifyPrescriptionSignature = (
  data: string,
  signatureBase64: string,
  publicKeyPem: string
): boolean => {
  try {
    
    const hash = crypto.createHash("sha256").update(data).digest();

    
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);

    
    const signature = forge.util.decode64(signatureBase64);

    
    return publicKey.verify(
      forge.md.sha256.create().update(hash.toString("binary")).digest().bytes(),
      signature
    );
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
};


export const generatePrescriptionSignatureData = (prescription: {
  prescriptionCode: string;
  patientId: number;
  doctorId: number;
  totalAmount: number;
  createdAt: Date;
}): string => {
  return `RX:${prescription.prescriptionCode}|P:${prescription.patientId}|D:${prescription.doctorId}|AMT:${prescription.totalAmount}|DATE:${prescription.createdAt.toISOString()}`;
};
