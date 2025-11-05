"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockIMAPService = void 0;
const Email_1 = require("../models/Email");
const logger_1 = require("../utils/logger");
class MockIMAPService {
    static async generateMockEmails(accountId, count = 10) {
        logger_1.logger.info(`🧪 Generating ${count} mock emails for account: ${accountId}`);
        const mockEmails = [];
        for (let i = 0; i < count; i++) {
            const email = new Email_1.Email({
                messageId: `mock-${accountId}-${Date.now()}-${i}`,
                accountId: accountId,
                threadId: `thread-${Math.floor(i / 3)}`,
                from: this.getRandomSender(),
                to: [`user@${accountId.replace('test-', '')}.com`],
                cc: i % 3 === 0 ? ['cc@example.com'] : [],
                subject: this.getRandomSubject(),
                body: {
                    text: this.getRandomBody(),
                    html: `<p>${this.getRandomBody()}</p>`
                },
                attachments: i % 4 === 0 ? [{
                        filename: 'document.pdf',
                        contentType: 'application/pdf',
                        size: 1024 * 50,
                        checksum: 'mock-checksum'
                    }] : [],
                receivedAt: new Date(Date.now() - (i * 3600000)),
                size: 1024 + (i * 100),
                folder: i % 5 === 0 ? 'Sent' : 'INBOX',
                status: Email_1.DeliveryStatus.RECEIVED,
                category: this.getRandomCategory(),
                categoryConfidence: Math.random() * 0.3 + 0.7,
                headers: new Map([
                    ['X-Mailer', 'MockMailer 1.0'],
                    ['Message-ID', `<mock-${i}@example.com>`]
                ])
            });
            mockEmails.push(email);
        }
        try {
            await Email_1.Email.insertMany(mockEmails, { ordered: false });
            logger_1.logger.info(`✅ Generated ${count} mock emails for ${accountId}`);
        }
        catch (error) {
            logger_1.logger.error('Error generating mock emails:', error);
            throw error;
        }
    }
    static getRandomSender() {
        const senders = [
            'john.doe@company.com',
            'sarah.smith@startup.io',
            'mike.johnson@enterprise.org',
            'lisa.brown@agency.net',
            'david.wilson@consulting.biz',
            'recruiter@techcorp.com',
            'noreply@newsletter.com',
            'support@service.com'
        ];
        return senders[Math.floor(Math.random() * senders.length)];
    }
    static getRandomSubject() {
        const subjects = [
            'Job Opportunity - Senior Developer Position',
            'Meeting Request - Project Discussion',
            'Your application has been reviewed',
            'Interview Invitation - Technical Round',
            'Follow up on our conversation',
            'Proposal for collaboration',
            'Newsletter - Latest Updates',
            'Account verification required',
            'Meeting scheduled for tomorrow',
            'Thank you for your interest'
        ];
        return subjects[Math.floor(Math.random() * subjects.length)];
    }
    static getRandomBody() {
        const bodies = [
            'Hi there! I hope this email finds you well. I wanted to reach out regarding an exciting opportunity.',
            'Thank you for your application. We have reviewed your profile and would like to schedule an interview.',
            'I am writing to follow up on our previous conversation about the project requirements.',
            'We are impressed with your background and would love to discuss this position further.',
            'This is a friendly reminder about our meeting scheduled for tomorrow at 2 PM.',
            'I wanted to share some updates about our latest product features and improvements.',
            'Your account requires verification. Please click the link below to verify your email.',
            'Thank you for your interest in our services. We will get back to you within 24 hours.',
            'I hope you are doing well. I wanted to discuss the proposal we sent last week.',
            'Congratulations! Your application has been shortlisted for the next round of interviews.'
        ];
        return bodies[Math.floor(Math.random() * bodies.length)];
    }
    static getRandomCategory() {
        const categories = [
            Email_1.EmailCategory.INTERESTED,
            Email_1.EmailCategory.MEETING_BOOKED,
            Email_1.EmailCategory.NOT_INTERESTED,
            Email_1.EmailCategory.SPAM,
            Email_1.EmailCategory.OUT_OF_OFFICE
        ];
        const weights = [0.3, 0.2, 0.25, 0.15, 0.1];
        const random = Math.random();
        let sum = 0;
        for (let i = 0; i < weights.length; i++) {
            sum += weights[i];
            if (random <= sum) {
                return categories[i];
            }
        }
        return Email_1.EmailCategory.INTERESTED;
    }
}
exports.MockIMAPService = MockIMAPService;
//# sourceMappingURL=mockImapService.js.map