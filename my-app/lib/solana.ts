import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { IDL, PROGRAM_ID } from './idl';


export function getProgram(Wallet: any, connection: Connection) {
    const provider = new AnchorProvider(
        connection,
        Wallet,
        { commitment: 'confirmed' }
    )
    return new Program(IDL as any, provider);
}

export function getPDA(AdvertiserKey: PublicKey, adID: number[]) { 

    const programID = new PublicKey(PROGRAM_ID);

    const [adPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("ad"),
        AdvertiserKey.toBuffer(),
        Buffer.from(adID)
        ],
        programID
    );

    const [vaultPDA] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("vault"),
            AdvertiserKey.toBuffer(),
            Buffer.from(adID)
        ],
        programID
    );


    return { adPDA, vaultPDA };
}

export function adIdToBytes(adId: string): number[] {
    const bytes = new TextEncoder().encode(adId);
    const result = new Uint8Array(32); 
    result.set(bytes.slice(0, 32));
    return Array.from(result);
}