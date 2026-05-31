import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req:Request , { params }: { params: Promise<{ id: string }> }) {
    const {id} = await params;

    const data = await prisma.ad.findUnique({
        where : {
            id : id
        },
        select:{
            id : true,
            wallet_address:true,
            cost_per_click:true,
            user_email:true,
            Clicks:true,
            Cost:true
        }
    })
   
    return NextResponse.json({data})
}