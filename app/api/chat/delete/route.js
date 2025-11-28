import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { userId } = getAuth(req);
        const {chatId} = await req.json();

        if(!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
       await Chat.deleteOne({ _id: chatId, userId });
        return NextResponse.json({ success: true, message: 'Chat deleted' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({success: false, error: error.message }, { status: 500 });
    }
}