import { IAdminRepository } from "../../repositories/IAdminRepository";

export class DownloadShareCertificationUseCase {
    private adminRepository: IAdminRepository;

    constructor(adminRepository: IAdminRepository) {
        this.adminRepository = adminRepository;
    }

    async execute(issuanceId: number): Promise<string> {
        try {
            if (!issuanceId || issuanceId <= 0) {
                throw new Error('Invalid issuance ID provided');
            }

            console.log(`[DownloadShareCertificationUseCase] Downloading certificate for issuance ID: ${issuanceId}`);

            const downloadUrl = await this.adminRepository.downloadShareCertificate(issuanceId);

            if (!downloadUrl) {
                throw new Error('Certificate download URL not available');
            }

            console.log(`[DownloadShareCertificationUseCase] Certificate download URL generated: ${downloadUrl}`);

            return downloadUrl;

        } catch (error) {
            console.error('[DownloadShareCertificationUseCase] Download failed:', error);

            if (error instanceof Error) {
                throw new Error(`Failed to download certificate: ${error.message}`);
            }

            throw new Error('Failed to download certificate: Unknown error');
        }
    }

    async adminExecuteDownload(issuanceId: string): Promise<void> {
        try {
            const certificateUrl = await this.execute(Number(issuanceId));

            const link = document.createElement('a');
            link.href = certificateUrl;
            link.download = `share_certificate_${issuanceId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log(`Certificate download triggered for issuance ${issuanceId}`);
        } catch (error) {
            console.error('Failed to trigger certificate download:', error);
            throw error;
        }
    }
}
