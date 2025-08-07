import { IAdminRepository } from "../../repositories/IAdminRepository";

export class GenerateShareCertificationUseCase {
    private adminRepository: IAdminRepository;

    constructor(adminRepository: IAdminRepository) {
        this.adminRepository = adminRepository;
    }

    async execute(issuanceId: number): Promise<string> {
        try {
            if (!issuanceId || issuanceId <= 0) {
                throw new Error('Invalid issuance ID provided');
            }

            console.log(`[GenerateShareCertificationUseCase] Generating certificate for issuance ID: ${issuanceId}`);

            const certificateUrl = await this.adminRepository.generateShareCertificate(issuanceId);

            if (!certificateUrl) {
                throw new Error('Certificate generation failed - no URL returned');
            }

            console.log(`[GenerateShareCertificationUseCase] Certificate generated successfully: ${certificateUrl}`);

            return certificateUrl;

        } catch (error) {
            console.error('[GenerateShareCertificationUseCase] Generation failed:', error);

            if (error instanceof Error) {
                throw new Error(`Failed to generate certificate: ${error.message}`);
            }

            throw new Error('Failed to generate certificate: Unknown error');
        }
    }
}
