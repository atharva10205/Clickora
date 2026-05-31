'use client'

import { adIdToBytes, getPDA, getProgram } from "@/lib/solana";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import BN from "bn.js";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";





const Add_funds = () => {
    const { id } = useParams()
    const [user_wallet, setuser_wallet] = useState();
    const [userId, setuserId] = useState();
    const [CPC, setCPC] = useState();
    const [UserEmail, setUserEmail] = useState();
    const [data1, setdata] = useState();

    const fetch_data = async () => {
        const res = await fetch(`/api/crud/Advertiser/Add_funds/${id}`, { method: "GET" });
        const data = await res.json();
        if (data) { setdata(data) }
        console.log("data", data)
    }



    useEffect(() => {


        fetch_data()

    }, [])



    const { connection: walletConnection } = useConnection();
    const wallet = useWallet();

    const Deposti = async () => {

        const program = getProgram(wallet, walletConnection);
        const AdId = adIdToBytes(data1.data.id);
        const advertiserKey = new PublicKey(data1.data.wallet_address);
        const SERVICE_FEE = new PublicKey("C3qzo7FpXSgQ7ytMdjhqjd3R5ZWReEYFeHdKD7oyXpLz");

        const { adPDA, vaultPDA } = getPDA(new PublicKey(data1.data.wallet_address), AdId);

        const totalSOL = data1.data.Cost;
        const lamports = Math.round(totalSOL * 1_000_000_000);


        const tx = await program.methods.deposit(new BN(lamports)).accounts({
            ad: adPDA,
            vault: vaultPDA,
            advertiser: advertiserKey,
            serviceFee: SERVICE_FEE,
            systemProgram: SystemProgram.programId
        }).rpc();

    }



    return (
        <>
            <div>
                <div>

                    {data1 && (
                        <>
                            <p> cpc : {data1.data.cost_per_click}</p>
                            <p> id : {data1.data.id}</p>
                            <p> email : {data1.data.user_email}</p>
                            <p> wallet : {data1.data.wallet_address}</p>
                            <p> clicks : {data1.data.Clicks}</p>

                        </>
                    )}
                </div>

                <div>
                    <button onClick={Deposti}>
                        Deposit
                    </button>
                </div>
            </div>
        </>
    )
}

export default Add_funds;