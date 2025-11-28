import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        const { userId } = getAuth(req);

        if(!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        await connectDB();
        const data = await Chat.find({ userId });
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error(error);
        return NextResponse.json({success: false, error: error.message }, { status: 500 });
    }
}