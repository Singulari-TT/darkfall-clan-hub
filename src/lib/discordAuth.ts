import nacl from 'tweetnacl';

/**
 * Validates that an incoming HTTP request originated from Discord
 * by verifying the ED25519 signature.
 */
export async function verifyDiscordRequest(
    rawBody: string,
    signature: string,
    timestamp: string,
    clientPublicKey: string
): Promise<boolean> {
    try {
        const isVerified = nacl.sign.detached.verify(
            Buffer.from(timestamp + rawBody),
            Buffer.from(signature, 'hex'),
            Buffer.from(clientPublicKey, 'hex')
        );
        return isVerified;
    } catch (e) {
        console.error("Signature verification failed:", e);
        return false;
    }
}
