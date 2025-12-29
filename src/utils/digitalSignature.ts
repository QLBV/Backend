import forge from "node-forge";
import crypto from "crypto";

/**
 * Generate RSA-2048 key pair for digital signatures
 * In production, these should be stored securely (e.g., environment variables, key management service)
 */
export const generateKeyPair = () => {
  const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
  return {
    privateKey: forge.pki.privateKeyToPem(keypair.privateKey),
    publicKey: forge.pki.publicKeyToPem(keypair.publicKey),
  };
};

/**
 * Sign prescription data with doctor's private key
 * @param data - Prescription data to sign
 * @param privateKeyPem - Doctor's private key in PEM format
 * @returns Base64-encoded signature
 */
export const signPrescription = (
  data: string,
  privateKeyPem: string
): string => {
  try {
    // Create SHA-256 hash of the data
    const hash = crypto.createHash("sha256").update(data).digest();

    // Convert PEM to forge private key
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);

    // Sign the hash
    const signature = privateKey.sign(
      forge.md.sha256.create().update(hash.toString("binary"))
    );

    // Return base64-encoded signature
    return forge.util.encode64(signature);
  } catch (error) {
    console.error("Error signing prescription:", error);
    throw new Error("Failed to sign prescription");
  }
};

/**
 * Verify prescription signature
 * @param data - Original prescription data
 * @param signatureBase64 - Base64-encoded signature
 * @param publicKeyPem - Doctor's public key in PEM format
 * @returns true if signature is valid
 */
export const verifyPrescriptionSignature = (
  data: string,
  signatureBase64: string,
  publicKeyPem: string
): boolean => {
  try {
    // Create SHA-256 hash of the data
    const hash = crypto.createHash("sha256").update(data).digest();

    // Convert PEM to forge public key
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);

    // Decode signature from base64
    const signature = forge.util.decode64(signatureBase64);

    // Verify the signature
    return publicKey.verify(
      forge.md.sha256.create().update(hash.toString("binary")).digest().bytes(),
      signature
    );
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
};

/**
 * Generate signature data string from prescription
 * This is what will be signed
 */
export const generatePrescriptionSignatureData = (prescription: {
  prescriptionCode: string;
  patientId: number;
  doctorId: number;
  totalAmount: number;
  createdAt: Date;
}): string => {
  return `RX:${prescription.prescriptionCode}|P:${prescription.patientId}|D:${prescription.doctorId}|AMT:${prescription.totalAmount}|DATE:${prescription.createdAt.toISOString()}`;
};
