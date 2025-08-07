import { IShareRepository } from "../../repositories/IShareRepository";

export class DownloadCertificateUseCase {
    private shareRepository: IShareRepository;

    constructor(shareRepository: IShareRepository) {
        this.shareRepository = shareRepository;
    }

    async execute(issuanceId: string): Promise<string> {
        try {
            this.validateIssuanceId(issuanceId);

            const certificateUrl = await this.shareRepository.downloadCertificate(Number(issuanceId));

            console.log(`Certificate downloaded for issuance ${issuanceId}`);
            return certificateUrl;
        } catch (error) {
            console.error('Failed to download certificate:', error);
            throw new Error('Unable to download certificate. Please try again later.');
        }
    }

    async executeDownload(issuanceId: string): Promise<void> {
        try {
            const certificateUrl = await this.execute(issuanceId);

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

    private validateIssuanceId(issuanceId: string): void {
        if (!issuanceId || issuanceId.trim().length === 0) {
            throw new Error('Issuance ID is required');
        }

        if (!/^\d+$/.test(issuanceId)) {
            throw new Error('Invalid issuance ID format');
        }
    }
}